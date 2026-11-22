import { 
  Currency, 
  GroupComposition, 
  OccupancyBasis, 
  Rate, 
  Quote,
  QuoteLine, 
  SupplierType,
  FXSnapshot,
  RoomingAllocation
} from '../types';
import { DEFAULT_EXCHANGE_RATES } from './constants';

export type { FXSnapshot, RoomingAllocation };

export interface PricingContext {
  rates: Rate[];
  travelDate: string;
  group: GroupComposition;
  targetCurrency: Currency;
  exchangeRates?: Record<Currency, { toEgp: number; bufferPct: number }>;
  defaultMarkupPercent: number;
  b2bCommissionPercent?: number;
  fxSnapshot?: FXSnapshot;
  rooming?: RoomingAllocation;
}

export interface LineCalculationResult {
  unitCostOriginal: number;
  costCurrency: Currency;
  totalCostEgp: number;
  markupPercent: number;
  markupFixed: number;
  totalPriceEgp: number;
  totalPriceQuoteCurrency: number;
  unitPriceQuoteCurrency: number;
  status: 'OK' | 'Rate missing' | 'Overridden' | 'Expired rate';
  breakdown: string;
  hasBlockingRate?: boolean;
  statusMessage?: string;
}

/**
 * Creates an immutable FXSnapshot bound to current spot rates and safety buffers.
 */
export function createDefaultFXSnapshot(
  exchangeRates: Record<Currency, { toEgp: number; bufferPct: number }> = DEFAULT_EXCHANGE_RATES,
  safetyBufferPercent: number = 0.03
): FXSnapshot {
  return {
    lockedAt: new Date().toISOString(),
    baseCurrency: 'EGP',
    safetyBufferPercent,
    ratesToEgp: {
      EGP: 1.0,
      USD: exchangeRates.USD?.toEgp ?? 49.50,
      EUR: exchangeRates.EUR?.toEgp ?? 54.20,
      GBP: exchangeRates.GBP?.toEgp ?? 63.80,
      RUB: exchangeRates.RUB?.toEgp ?? 0.52,
      SAR: exchangeRates.SAR?.toEgp ?? 13.20,
    },
  };
}

/**
 * Converts a monetary amount between sourceCurrency and targetCurrency using an immutable fxSnapshot.
 * FIX (AUD-01): Short-circuits when sourceCurrency === targetCurrency to prevent
 * applying the 3% FX safety buffer twice (e.g. USD -> EGP -> USD = +6.09% distortion).
 */
export function convertCurrencyDeterministic(
  amount: number,
  sourceCurrency: Currency,
  targetCurrency: Currency,
  fxSnapshot: FXSnapshot
): { amountEgp: number; amountTarget: number; effectiveFxRate: number } {
  const sourceRate = fxSnapshot.ratesToEgp[sourceCurrency];
  const targetRate = fxSnapshot.ratesToEgp[targetCurrency];
  const buffer = fxSnapshot.safetyBufferPercent ?? 0;
  if (![amount, sourceRate, targetRate, buffer].every(Number.isFinite) || amount < 0 || sourceRate <= 0 || targetRate <= 0 || buffer < 0 || buffer > 1) throw new Error('Invalid FX input');
  const amountEgp = Math.round(amount * sourceRate * 100) / 100;
  const amountTarget = sourceCurrency === targetCurrency ? amount : Math.round(amount * sourceRate / targetRate * (1 + buffer) * 100) / 100;
  return { amountEgp, amountTarget, effectiveFxRate: amount ? amountTarget / amount : 1 };
}

export function convertToEgp(amount: number, fromCurrency: Currency, exchangeRates = DEFAULT_EXCHANGE_RATES): number {
  if (fromCurrency === 'EGP') return amount;
  const config = exchangeRates[fromCurrency] || { toEgp: 1, bufferPct: 0 };
  const bufferedRate = config.toEgp * (1 + (config.bufferPct / 100));
  return Math.round(amount * bufferedRate * 100) / 100;
}

export function convertFromEgp(egpAmount: number, targetCurrency: Currency, exchangeRates = DEFAULT_EXCHANGE_RATES): number {
  if (targetCurrency === 'EGP') return egpAmount;
  const config = exchangeRates[targetCurrency] || { toEgp: 1, bufferPct: 0 };
  const bufferedRate = config.toEgp * (1 - (config.bufferPct / 100)); // buffer in favor of operator safety
  if (bufferedRate <= 0) return egpAmount;
  return Math.round((egpAmount / bufferedRate) * 100) / 100;
}

/**
 * Derives the exact markup multiplier required to achieve a target gross margin.
 * Sell Price = Net Cost / (1 - targetMargin)
 */
export function markupForTargetMargin(marginPercent: number): number {
  const m = Math.min(Math.max(marginPercent, 0), 95) / 100;
  return Math.round((m / (1 - m)) * 1000) / 10;
}

/**
 * Calculates net cost and sell price for a service line with:
 * - FIX (AUD-01): Same-currency bypass (no double FX buffer)
 * - FIX (AUD-05): Vehicle capacity guardrails on group transport
 * - FIX (AUD-07): Immutable fxSnapshot binding
 * - FIX (AUD-09): Rooming-aware single supplement calculations
 */
export function calculateLineCostAndPrice(
  rate: Rate | undefined,
  quantity: number,
  occupancyBasis: OccupancyBasis,
  group: GroupComposition,
  targetCurrency: Currency,
  markupPercent: number,
  markupFixed: number = 0,
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  travelDate?: string,
  fxSnapshot?: FXSnapshot,
  rooming?: RoomingAllocation
): LineCalculationResult {
  if (!rate) {
    return {
      unitCostOriginal: 0,
      costCurrency: targetCurrency,
      totalCostEgp: 0,
      markupPercent,
      markupFixed: 0,
      totalPriceEgp: 0,
      totalPriceQuoteCurrency: 0,
      unitPriceQuoteCurrency: 0,
      status: 'Rate missing',
      breakdown: 'No matching rate found in library. Action required.',
      hasBlockingRate: true,
      statusMessage: 'Rate missing in library.',
    };
  }

  if (![quantity,rate.netCost,markupPercent,markupFixed,group.adults,group.infants ?? 0].every(Number.isFinite) || quantity <= 0 || rate.netCost < 0 || markupPercent < 0 || markupFixed < 0 || !Number.isInteger(group.adults) || group.adults < 1 || !Number.isInteger(group.infants ?? 0) || (group.infants ?? 0) < 0 || group.children.some(c=>!Number.isFinite(c.age)||c.age<0||c.age>17)) throw new Error('Invalid pricing input');
  // A rate is only usable if it covers the date of service
  const serviceDate = (travelDate || new Date().toISOString().split('T')[0]).slice(0, 10);
  const isExpired = serviceDate > rate.validityEnd.slice(0, 10) || serviceDate < rate.validityStart.slice(0, 10);
  const adults = Math.max(1, group.adults || 1);
  const children = group.children || [];
  const totalHeadcount = adults + children.length + (group.infants || 0);

  let totalCostOriginal = 0;
  let breakdownNotes = '';
  let statusWarning: string | undefined = undefined;
  let hasBlockingRate = isExpired;

  // FIX (AUD-05): Vehicle capacity guardrail for group & vehicle transport
  const isGroupPricing = occupancyBasis === 'per_vehicle' || occupancyBasis === 'per_group';
  if (isGroupPricing) {
    const maxPax = rate.maxVehiclePax;
    if (maxPax && maxPax > 0 && quantity * maxPax < totalHeadcount) {
      const requiredVehicles = Math.ceil(totalHeadcount / maxPax);
      statusWarning = `Capacity exceeded: ${totalHeadcount} pax requires at least ${requiredVehicles}x vehicles (max ${maxPax} pax/unit)`;
      hasBlockingRate = true;
      breakdownNotes += `[ALERT: ${statusWarning}] `;
    }

    totalCostOriginal = rate.netCost * quantity;
    breakdownNotes += occupancyBasis === 'per_vehicle'
      ? `Per-vehicle fixed: ${quantity} vehicle(s) @ ${rate.netCost} ${rate.currency}. `
      : `Per-group flat rate: ${rate.netCost} ${rate.currency}. `;
  } else {
    // Per-person or room occupancy basis
    let adultCost = rate.netCost * adults * quantity;
    let childCost = 0;

    if (children.length > 0) {
      children.forEach((child) => {
        if (rate.childFreeMaxAge !== undefined && child.age <= rate.childFreeMaxAge) {
          breakdownNotes += `Child age ${child.age}: Free. `;
        } else if (rate.childDiscountPercent) {
          const discountedRate = rate.netCost * (1 - rate.childDiscountPercent / 100);
          childCost += discountedRate * quantity;
          breakdownNotes += `Child age ${child.age}: ${100 - rate.childDiscountPercent}% cost (${discountedRate} ${rate.currency}). `;
        } else {
          childCost += rate.netCost * quantity;
        }
      });
    }

    // FIX (AUD-09): Rooming-aware single supplement calculation
    const singleSupp = rate.singleSupplement || 0;
    if (rooming && rooming.singleRooms > 0 && singleSupp > 0) {
      adultCost += singleSupp * quantity * rooming.singleRooms;
      breakdownNotes += `Rooming single supplement (+${singleSupp} ${rate.currency} x ${rooming.singleRooms} SGL room(s)). `;
    } else if (occupancyBasis === 'single' && singleSupp > 0) {
      adultCost += singleSupp * adults * quantity;
      breakdownNotes += `Single supplement added: +${singleSupp} ${rate.currency}. `;
    }

    totalCostOriginal = adultCost + childCost;
    breakdownNotes += `${adults} adult(s) @ ${rate.netCost} ${rate.currency}. `;
  }

  // FIX (AUD-01 & AUD-07): Use deterministic conversion with same-currency bypass
  const snapshot = fxSnapshot || createDefaultFXSnapshot(exchangeRates, Math.max(exchangeRates[rate.currency]?.bufferPct || 0, exchangeRates[targetCurrency]?.bufferPct || 0) / 100);
  const { amountEgp: totalCostEgp, amountTarget: costInTargetCurrency } = convertCurrencyDeterministic(
    totalCostOriginal,
    rate.currency,
    targetCurrency,
    snapshot
  );

  let totalPriceQuoteCurrency: number;
  let totalPriceEgp: number;

  // Fixed markup is always denominated in the quote currency.
  totalPriceQuoteCurrency = Math.round((costInTargetCurrency + markupFixed) * (1 + markupPercent / 100) * 100) / 100;
  totalPriceEgp = Math.round(totalPriceQuoteCurrency * snapshot.ratesToEgp[targetCurrency] * 100) / 100;

  const totalPax = Math.max(1, adults + children.length);
  const unitPriceQuoteCurrency = Math.round((totalPriceQuoteCurrency / totalPax) * 100) / 100;

  return {
    unitCostOriginal: rate.netCost,
    costCurrency: rate.currency,
    totalCostEgp,
    markupPercent,
    markupFixed,
    totalPriceEgp,
    totalPriceQuoteCurrency,
    unitPriceQuoteCurrency,
    status: isExpired ? 'Expired rate' : (statusWarning ? 'Rate missing' : 'OK'),
    breakdown: breakdownNotes.trim(),
    hasBlockingRate,
    statusMessage: statusWarning,
  };
}

/**
 * Re-price an existing quote line against current rate, group, currency, and travel date.
 * FIX (AUD-05): Validates manual override against locked headcount.
 */
export function repriceLine(
  line: QuoteLine,
  rate: Rate | undefined,
  group: GroupComposition,
  targetCurrency: Currency,
  travelDate?: string,
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  fxSnapshot?: FXSnapshot,
  rooming?: RoomingAllocation
): QuoteLine {
  if (!line.serviceId) return line;

  const totalHeadcount = Math.max(1, (group.adults || 1) + (group.children?.length || 0));

  // FIX (AUD-05): Invalidate manual override if headcount has changed since override was locked
  if (line.status === 'Overridden' || line.isManualOverride) {
    if (line.overrideLockedPax && line.overrideLockedPax !== totalHeadcount) {
      // Stale override from previous group size -> re-calculate deterministically
    } else {
      return line; // Override is still valid for this group size
    }
  }

  const calc = calculateLineCostAndPrice(
    rate,
    line.quantity,
    line.occupancyBasis,
    group,
    targetCurrency,
    line.markupPercent,
    line.markupFixed,
    exchangeRates,
    travelDate,
    fxSnapshot,
    rooming
  );

  return {
    ...line,
    unitCost: calc.unitCostOriginal,
    costCurrency: calc.costCurrency,
    unitPrice: calc.unitPriceQuoteCurrency,
    totalCostEgp: calc.totalCostEgp,
    totalPriceEgp: calc.totalPriceEgp,
    totalPriceQuoteCurrency: calc.totalPriceQuoteCurrency,
    status: calc.status,
    costCalculationNotes: calc.breakdown,
    hasBlockingRate: calc.hasBlockingRate,
    statusMessage: calc.statusMessage,
  };
}

export function recalculateQuoteTotals(
  lines: QuoteLine[],
  targetCurrency: Currency,
  b2bCommissionPercent: number = 0,
  exchangeRates = DEFAULT_EXCHANGE_RATES
) {
  let totalCostEgp = 0;
  let totalPriceEgp = 0;
  let totalPriceQuoteCurrency = 0;
  let hasMissingRate = false;
  let hasExpiredRate = false;

  for (const line of lines) {
    totalCostEgp += line.totalCostEgp || 0;
    totalPriceEgp += line.totalPriceEgp || 0;
    totalPriceQuoteCurrency += line.totalPriceQuoteCurrency || 0;
    if (line.status === 'Rate missing' || line.hasBlockingRate) hasMissingRate = true;
    if (line.status === 'Expired rate') hasExpiredRate = true;
  }

  // Margin % = (Price - Cost) / Price
  const marginPercent = totalPriceEgp > 0 
    ? Math.round(((totalPriceEgp - totalCostEgp) / totalPriceEgp) * 1000) / 10
    : 0;

  // B2B agent commission calculation if applicable
  const b2bCommissionAmount = b2bCommissionPercent > 0
    ? Math.round((totalPriceQuoteCurrency * (b2bCommissionPercent / 100)) * 100) / 100
    : 0;

  const netPayableToOperator = totalPriceQuoteCurrency - b2bCommissionAmount;

  return {
    totalCostEgp: Math.round(totalCostEgp * 100) / 100,
    totalPriceEgp: Math.round(totalPriceEgp * 100) / 100,
    totalPriceQuoteCurrency: Math.round(totalPriceQuoteCurrency * 100) / 100,
    marginPercent,
    b2bCommissionAmount,
    netPayableToOperator,
    hasMissingRate,
    hasExpiredRate,
    /** True when any line has no usable rate or capacity is exceeded. A quote in this state must not be dispatched. */
    hasBlockingRate: hasMissingRate || hasExpiredRate,
  };
}

export const EGYPTIAN_VAT_PERCENT = 14.0;

export function calculateEgyptianVat(amount: number, vatPercent: number = EGYPTIAN_VAT_PERCENT): {
  subtotal: number;
  vatAmount: number;
  totalWithVat: number;
} {
  const subtotal = Math.round(amount * 100) / 100;
  const vatAmount = Math.round((subtotal * (vatPercent / 100)) * 100) / 100;
  const totalWithVat = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, totalWithVat };
}

export interface RateMatchCriteria {
  destinationCity: string;
  checkInDate?: string;
  seasonId?: string;
  starRating?: number; // 3, 4, 5
  nationalityTier?: 'Foreign' | 'Arab' | 'Egyptian' | 'All';
  supplierType?: SupplierType;
  serviceName?: string;
  occupancyBasis?: OccupancyBasis;
  paxCount?: number;
}

/**
 * Deterministically resolves the optimal contracted supplier rate matching:
 * - Season ID (high winter, peak holiday, summer value)
 * - Hotel star rating (3*, 4*, 5* luxury, Nile cruise)
 * - Nationality tier (Foreign, Arab/GCC, Egyptian resident)
 * - Travel date validity window & pax tier capacity
 */
export function matchContractedRate(
  criteria: RateMatchCriteria,
  availableRates: Rate[]
): Rate | undefined {
  if (!availableRates || availableRates.length === 0) return undefined;

  const targetCity = (criteria.destinationCity || '').toLowerCase().trim();
  const targetDate = (criteria.checkInDate || new Date().toISOString().split('T')[0]).slice(0, 10);
  const targetNat = (criteria.nationalityTier || 'foreign').toLowerCase();
  const targetPax = criteria.paxCount || 1;

  let bestMatch: Rate | undefined = undefined;
  let highestScore = -1;

  for (const rate of availableRates) {
    let score = 0;

    // 1. City match
    if (rate.city && targetCity) {
      const rCity = rate.city.toLowerCase().trim();
      if (rCity === targetCity) {
        score += 35;
      } else if (targetCity.includes(rCity) || rCity.includes(targetCity)) {
        score += 20;
      } else {
        continue; // Non-matching city
      }
    }

    // 2. Service name / keyword match
    if (criteria.serviceName && rate.serviceName) {
      const critName = criteria.serviceName.toLowerCase();
      const rName = rate.serviceName.toLowerCase();
      if (critName === rName) {
        score += 50;
      } else if (critName.includes(rName) || rName.includes(critName)) {
        score += 25;
      }
    }

    // 3. Supplier type match
    if (criteria.supplierType && rate.supplierType) {
      if (rate.supplierType === criteria.supplierType) {
        score += 25;
      }
    }

    // 4. Date validity check
    if (rate.validityStart && rate.validityEnd) {
      const start = rate.validityStart.slice(0, 10);
      const end = rate.validityEnd.slice(0, 10);
      if (targetDate >= start && targetDate <= end) {
        score += 40;
      } else {
        score -= 25; // Out of contract season
      }
    }

    // 5. Season ID match
    if (criteria.seasonId && rate.seasonIds && rate.seasonIds.length > 0) {
      if (rate.seasonIds.includes(criteria.seasonId)) {
        score += 40;
      }
    }

    // 6. Nationality tier match: 'foreign' vs 'arab' vs 'egyptian' vs 'all'
    if (rate.nationalityTier) {
      const rateNat = (rate.nationalityTier || 'all').toLowerCase();
      if (rateNat === targetNat) {
        score += 50; // Exact nationality tier contract match!
      } else if (rateNat === 'all' || targetNat === 'all') {
        score += 25; // Universal tier fallback
      } else if (
        (rateNat === 'egyptian_arab' && (targetNat === 'egyptian' || targetNat === 'arab')) ||
        (targetNat === 'egyptian_arab' && (rateNat === 'egyptian' || rateNat === 'arab'))
      ) {
        score += 40; // Cultural GCC/MENA domestic parity
      } else {
        score -= 30; // Incompatible nationality tier
      }
    }

    // 7. Star rating match (e.g. 5-star luxury vs 4-star vs 3-star)
    if (criteria.starRating) {
      const name = (rate.serviceName || '').toLowerCase();
      if (criteria.starRating === 5 && (name.includes('5*') || name.includes('5-star') || name.includes('luxury') || name.includes('five star') || name.includes('oberoi') || name.includes('four seasons'))) {
        score += 35;
      } else if (criteria.starRating === 4 && (name.includes('4*') || name.includes('4-star') || name.includes('classic') || name.includes('four star') || name.includes('steigenberger'))) {
        score += 35;
      } else if (criteria.starRating === 3 && (name.includes('3*') || name.includes('3-star') || name.includes('standard') || name.includes('three star') || name.includes('comfort'))) {
        score += 35;
      }
    }

    // 8. Occupancy basis match
    if (criteria.occupancyBasis && rate.occupancyBasis) {
      if (rate.occupancyBasis === criteria.occupancyBasis) {
        score += 20;
      }
    }

    // 9. Pax tier range match
    if (rate.paxTierMin !== undefined && rate.paxTierMax !== undefined) {
      if (targetPax >= rate.paxTierMin && targetPax <= rate.paxTierMax) {
        score += 25;
      } else {
        score -= 15;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rate;
    }
  }

  return bestMatch;
}

