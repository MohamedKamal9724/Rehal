import { Currency } from '../types';
import { DEFAULT_EXCHANGE_RATES } from './constants';

export interface LiveRateInfo {
  rateToEgp: number;
  bufferPct: number;
  effectiveRateToEgp: number; // rate * (1 + bufferPct/100)
  lastUpdated: string;
  source: 'live_api' | 'fallback_cbe';
}

export type ExchangeRatesMap = Record<Currency, LiveRateInfo>;

const STORAGE_KEY = 'daleel_live_exchange_rates';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours cache

export const DEFAULT_LIVE_RATES: ExchangeRatesMap = {
  EGP: {
    rateToEgp: 1.0,
    bufferPct: 0,
    effectiveRateToEgp: 1.0,
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
  USD: {
    rateToEgp: DEFAULT_EXCHANGE_RATES.USD.toEgp,
    bufferPct: DEFAULT_EXCHANGE_RATES.USD.bufferPct,
    effectiveRateToEgp: DEFAULT_EXCHANGE_RATES.USD.toEgp * (1 + DEFAULT_EXCHANGE_RATES.USD.bufferPct / 100),
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
  EUR: {
    rateToEgp: DEFAULT_EXCHANGE_RATES.EUR.toEgp,
    bufferPct: DEFAULT_EXCHANGE_RATES.EUR.bufferPct,
    effectiveRateToEgp: DEFAULT_EXCHANGE_RATES.EUR.toEgp * (1 + DEFAULT_EXCHANGE_RATES.EUR.bufferPct / 100),
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
  GBP: {
    rateToEgp: DEFAULT_EXCHANGE_RATES.GBP.toEgp,
    bufferPct: DEFAULT_EXCHANGE_RATES.GBP.bufferPct,
    effectiveRateToEgp: DEFAULT_EXCHANGE_RATES.GBP.toEgp * (1 + DEFAULT_EXCHANGE_RATES.GBP.bufferPct / 100),
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
  RUB: {
    rateToEgp: DEFAULT_EXCHANGE_RATES.RUB.toEgp,
    bufferPct: DEFAULT_EXCHANGE_RATES.RUB.bufferPct,
    effectiveRateToEgp: DEFAULT_EXCHANGE_RATES.RUB.toEgp * (1 + DEFAULT_EXCHANGE_RATES.RUB.bufferPct / 100),
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
  SAR: {
    rateToEgp: DEFAULT_EXCHANGE_RATES.SAR.toEgp,
    bufferPct: DEFAULT_EXCHANGE_RATES.SAR.bufferPct,
    effectiveRateToEgp: DEFAULT_EXCHANGE_RATES.SAR.toEgp * (1 + DEFAULT_EXCHANGE_RATES.SAR.bufferPct / 100),
    lastUpdated: new Date().toISOString(),
    source: 'fallback_cbe',
  },
};

/**
 * Retrieve cached rates from localStorage or fall back to default
 */
export function getStoredExchangeRates(): ExchangeRatesMap {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rates) {
          return parsed.rates as ExchangeRatesMap;
        }
      }
    }
  } catch {
    // fallback silently
  }
  return DEFAULT_LIVE_RATES;
}

/**
 * Fetch latest live exchange rates from public-apis open endpoint (open.er-api.com)
 */
export async function fetchLiveExchangeRates(forceRefresh = false): Promise<{
  rates: ExchangeRatesMap;
  isLive: boolean;
  timestamp: string;
}> {
  // Check if we have valid non-expired cache
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const age = Date.now() - (parsed.savedAt || 0);
        if (age < CACHE_DURATION_MS && parsed.rates) {
          return {
            rates: parsed.rates,
            isLive: true,
            timestamp: parsed.rates.USD?.lastUpdated || new Date().toISOString(),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    // Open Exchange Rates public endpoint (USD base) - listed in public-apis
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && data.rates.EGP) {
      const usdToEgp = Number(data.rates.EGP) || 49.5;
      const eurRate = Number(data.rates.EUR) || 0.92;
      const gbpRate = Number(data.rates.GBP) || 0.78;
      const rubRate = Number(data.rates.RUB) || 96.0;
      const sarRate = Number(data.rates.SAR) || 3.75;

      // Calculate cross rates to EGP
      const eurToEgp = usdToEgp / eurRate;
      const gbpToEgp = usdToEgp / gbpRate;
      const rubToEgp = usdToEgp / rubRate;
      const sarToEgp = usdToEgp / sarRate;

      const nowIso = new Date().toISOString();

      const newRates: ExchangeRatesMap = {
        EGP: {
          rateToEgp: 1.0,
          bufferPct: 0,
          effectiveRateToEgp: 1.0,
          lastUpdated: nowIso,
          source: 'live_api',
        },
        USD: {
          rateToEgp: Math.round(usdToEgp * 100) / 100,
          bufferPct: 3.0,
          effectiveRateToEgp: Math.round(usdToEgp * 1.03 * 100) / 100,
          lastUpdated: nowIso,
          source: 'live_api',
        },
        EUR: {
          rateToEgp: Math.round(eurToEgp * 100) / 100,
          bufferPct: 3.0,
          effectiveRateToEgp: Math.round(eurToEgp * 1.03 * 100) / 100,
          lastUpdated: nowIso,
          source: 'live_api',
        },
        GBP: {
          rateToEgp: Math.round(gbpToEgp * 100) / 100,
          bufferPct: 3.5,
          effectiveRateToEgp: Math.round(gbpToEgp * 1.035 * 100) / 100,
          lastUpdated: nowIso,
          source: 'live_api',
        },
        RUB: {
          rateToEgp: Math.round(rubToEgp * 100) / 100,
          bufferPct: 4.0,
          effectiveRateToEgp: Math.round(rubToEgp * 1.04 * 100) / 100,
          lastUpdated: nowIso,
          source: 'live_api',
        },
        SAR: {
          rateToEgp: Math.round(sarToEgp * 100) / 100,
          bufferPct: 2.0,
          effectiveRateToEgp: Math.round(sarToEgp * 1.02 * 100) / 100,
          lastUpdated: nowIso,
          source: 'live_api',
        },
      };

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              savedAt: Date.now(),
              rates: newRates,
            })
          );
        }
      } catch {
        // LocalStorage quota or restricted
      }

      return {
        rates: newRates,
        isLive: true,
        timestamp: nowIso,
      };
    }
  } catch {
    // Live rate sync failed, using calibrated fallback rates silently
  }

  // Fallback
  return {
    rates: getStoredExchangeRates(),
    isLive: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert any amount between two supported currencies using live rates
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRatesMap = getStoredExchangeRates(),
  withBuffer = false
): number {
  if (from === to) return amount;
  
  const fromInfo = rates[from] || DEFAULT_LIVE_RATES[from];
  const toInfo = rates[to] || DEFAULT_LIVE_RATES[to];

  const fromRate = withBuffer ? fromInfo.effectiveRateToEgp : fromInfo.rateToEgp;
  const toRate = withBuffer ? toInfo.effectiveRateToEgp : toInfo.rateToEgp;

  // Amount in EGP
  const egpAmount = amount * fromRate;
  // Convert to target
  const targetAmount = egpAmount / toRate;

  return Math.round(targetAmount * 100) / 100;
}
