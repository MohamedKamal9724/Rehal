import { STANDARD_EGYPT_UPSELLS, getSuggestedUpsellsForQuote, calculateUpsellTotal, calculateQuoteGrandTotal } from './upsellService';
import { Quote } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`  ok   ${msg}`);
  }
}

console.log('Testing Upsell Service...');

// Test 1: Suggests Luxor upsells when Luxor is in itinerary
const luxorQuote: Partial<Quote> = {
  days: [
    { dayNumber: 1, title: 'Arrival in Luxor', description: 'Karnak and Luxor Temple', city: 'Luxor', lines: [] },
  ],
};
const luxorUpsells = getSuggestedUpsellsForQuote(luxorQuote);
assert(luxorUpsells.length === 0, 'No fictional upsells are suggested');
assert(STANDARD_EGYPT_UPSELLS.length === 0, 'Production catalog starts empty');

// Test 2: Calculate price with per_person and per_group
const testUpsells = [
  {
    id: 'u-1',
    title: 'Balloon',
    city: 'Luxor',
    description: 'Hot air balloon',
    price: 180,
    priceBasis: 'per_person' as const,
    category: 'Excursion' as const,
  },
  {
    id: 'u-2',
    title: 'Dahabiya Upgrade',
    city: 'Luxor',
    description: 'Suite upgrade',
    price: 650,
    priceBasis: 'per_group' as const,
    category: 'Upgrade' as const,
  },
];

// 2 adults: 180 * 2 = 360
const totalPerPersonOnly = calculateUpsellTotal(testUpsells, ['u-1'], 2);
assert(totalPerPersonOnly === 360, '2 adults x 180 = 360 USD');

// 2 adults: (180 * 2) + 650 = 1010
const totalBoth = calculateUpsellTotal(testUpsells, ['u-1', 'u-2'], 2);
assert(totalBoth === 1010, '(2 adults x 180) + 650 = 1010 USD');

// Test 3: Grand Total calculation
const sampleQuote = {
  id: 'q-1',
  workspaceId: 'ws-1',
  quoteNumber: 'DAL-2026-001',
  travelerName: 'Sarah Jenkins',
  version: 1,
  status: 'Sent' as const,
  targetCurrency: 'USD' as const,
  startDate: '2026-10-20',
  durationDays: 5,
  group: { adults: 2, children: [], infants: 0 },
  days: [],
  totalCostEgp: 100000,
  totalPriceEgp: 140000,
  totalPriceQuoteCurrency: 3500,
  marginPercent: 28,
  validUntil: '2026-11-20',
  language: 'en' as const,
  assignedAgentId: 'ag-1',
  assignedAgentName: 'Karim',
  publicToken: 'tok-1',
  viewCount: 0,
  upsells: testUpsells,
  createdAt: '2026-10-14',
  updatedAt: '2026-10-14',
};

const grand = calculateQuoteGrandTotal(sampleQuote, ['u-1']);
assert(grand.basePrice === 3500, 'Base price matches 3500');
assert(grand.upsellTotal === 360, 'Upsell total is 360');
assert(grand.grandTotal === 3860, 'Grand total is 3500 + 360 = 3860');
assert(grand.selectedUpsells.length === 1, '1 upsell returned in selected array');

console.log('All Upsell Service tests passed successfully!');
