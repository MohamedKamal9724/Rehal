import { Quote, ProposalUpsell, Currency } from '../types';

/**
 * Standard Curated Egyptian Luxury DMC Upsells Catalog
 * Calibrated specifically for high-net-worth foreign travelers (US, UK, EU, GCC).
 */
export const STANDARD_EGYPT_UPSELLS: Omit<ProposalUpsell, 'id'>[] = [];

export function getSuggestedUpsellsForQuote(quote: Partial<Quote>): ProposalUpsell[] {
  const citiesInQuote = new Set<string>();

  // Extract cities from days or requirements
  if (quote.days && quote.days.length > 0) {
    quote.days.forEach(d => {
      if (d.city) citiesInQuote.add(d.city.toLowerCase());
      if (d.title) {
        const t = d.title.toLowerCase();
        if (t.includes('cairo')) citiesInQuote.add('cairo');
        if (t.includes('giza')) citiesInQuote.add('giza');
        if (t.includes('luxor')) citiesInQuote.add('luxor');
        if (t.includes('aswan')) citiesInQuote.add('aswan');
        if (t.includes('hurghada') || t.includes('red sea')) citiesInQuote.add('hurghada');
      }
    });
  }

  // Fallback default cities if none explicitly found
  if (citiesInQuote.size === 0) {
    citiesInQuote.add('cairo');
    citiesInQuote.add('luxor');
    citiesInQuote.add('aswan');
  }

  // Filter catalog
  const filtered = STANDARD_EGYPT_UPSELLS.filter(upsell => {
    const uCity = upsell.city.toLowerCase();
    return citiesInQuote.has(uCity) || (uCity === 'cairo' && citiesInQuote.has('giza')) || (uCity === 'giza' && citiesInQuote.has('cairo'));
  });

  // If filtered is empty, return top 4
  const sourceList = filtered.length > 0 ? filtered : STANDARD_EGYPT_UPSELLS.slice(0, 4);

  return sourceList.map((item, idx) => ({
    ...item,
    id: `upsell-${item.city.toLowerCase()}-${idx + 1}`,
    isSelected: false,
  }));
}

/**
 * Calculates the exact additional revenue added by the selected upsells for a group.
 */
export function calculateUpsellTotal(
  upsells: ProposalUpsell[] = [],
  selectedIds: string[] = [],
  adultsCount: number = 2
): number {
  if (!upsells || upsells.length === 0 || !selectedIds || selectedIds.length === 0) {
    return 0;
  }

  const selectedSet = new Set(selectedIds);
  const adults = Math.max(1, adultsCount || 1);

  return upsells.reduce((acc, upsell) => {
    if (selectedSet.has(upsell.id)) {
      const itemAmount = upsell.priceBasis === 'per_person'
        ? (upsell.price * adults)
        : upsell.price;
      return acc + itemAmount;
    }
    return acc;
  }, 0);
}

/**
 * Returns complete calculation of base price, upsell total, and grand total.
 */
export function calculateQuoteGrandTotal(
  quote: Quote,
  selectedIds: string[] = []
): {
  basePrice: number;
  upsellTotal: number;
  grandTotal: number;
  selectedUpsells: ProposalUpsell[];
  adultsCount: number;
} {
  const basePrice = quote.totalPriceQuoteCurrency || 0;
  const upsells = quote.upsells && quote.upsells.length > 0
    ? quote.upsells
    : getSuggestedUpsellsForQuote(quote);

  const adultsCount = quote.group?.adults || 2;
  const effectiveSelectedIds = selectedIds.length > 0
    ? selectedIds
    : (quote.selectedUpsellIds || []);

  const upsellTotal = calculateUpsellTotal(upsells, effectiveSelectedIds, adultsCount);
  const selectedSet = new Set(effectiveSelectedIds);
  const selectedUpsells = upsells.filter(u => selectedSet.has(u.id));

  return {
    basePrice,
    upsellTotal,
    grandTotal: basePrice + upsellTotal,
    selectedUpsells,
    adultsCount,
  };
}
