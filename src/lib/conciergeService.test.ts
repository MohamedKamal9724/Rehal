import { Quote, Workspace } from '../types';
import { 
  calculateTippingRecommendation, 
  getDailyWalletPreparationGuide, 
  EGYPTIAN_TIPPING_RULES 
} from './tippingGuide';
import { 
  generateTaxiCard, 
  resolveActiveDayNumber, 
  getConciergeDayDetails 
} from './conciergeService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ok   ${message}`);
  }
}

console.log('Testing Traveler Mobile Concierge & Tipping Guide Engine...');

// 1. Tipping Rules Integrity
assert(EGYPTIAN_TIPPING_RULES.length >= 8, 'At least 8 comprehensive Egyptian tourism service roles defined');
const guideRule = EGYPTIAN_TIPPING_RULES.find(r => r.id === 'guide');
assert(!!guideRule && guideRule.rangeUsd.recommended === 30, 'Egyptologist guide recommended tip is $30 USD');

// 2. Tipping Calculator - Couple (2 pax)
const coupleGuideTip = calculateTippingRecommendation({
  roleId: 'guide',
  groupSize: 2,
  serviceQuality: 'exceptional',
  daysCount: 1,
  targetCurrency: 'USD',
});
assert(coupleGuideTip.amountUsd === 30, 'Standard couple guide tip is $30 USD');
assert(coupleGuideTip.amountEgp === 1500, 'Standard couple guide tip is 1,500 EGP');

// 3. Tipping Calculator - Family/Group (5 pax multiplier)
const groupGuideTip = calculateTippingRecommendation({
  roleId: 'guide',
  groupSize: 5,
  serviceQuality: 'exceptional',
  daysCount: 1,
  targetCurrency: 'USD',
});
assert(groupGuideTip.amountUsd > coupleGuideTip.amountUsd, 'Group of 5+ travelers adjusts tipping upward fairly');

// 4. Nile Cruise Tipping Envelope
const cruiseTip = calculateTippingRecommendation({
  roleId: 'cruise_crew',
  groupSize: 2,
  serviceQuality: 'exceptional',
  daysCount: 4,
  targetCurrency: 'USD',
});
assert(cruiseTip.amountUsd === 60, '4-night Nile cruise calculated envelope is 4 x $15 = $60 USD');

// 5. Daily Wallet Banknote Preparation
const wallet = getDailyWalletPreparationGuide(true, true, false);
assert(wallet.denominations.some(d => d.note === 20), 'Wallet prep recommends small 20 EGP notes for restrooms/incidentals');
assert(wallet.denominations.some(d => d.note === 50), 'Wallet prep recommends 50 EGP notes for porters/cafes');
assert(wallet.estimatedDayTotalEgp > 0, 'Estimated day total calculated');

// 6. Taxi Destination Card Generation
const menaHouseCard = generateTaxiCard('Marriott Mena House Garden Room', 'Cairo', '+201000000000');
assert(menaHouseCard.arabicName.includes('مينا هاوس'), 'Mena house recognized with authentic Arabic destination name');
assert(menaHouseCard.fullArabicAddress.includes('الهرم') || menaHouseCard.fullArabicAddress.includes('الأهرام'), 'Mena house address references Pyramids / Haram');

const cataractCard = generateTaxiCard('Sofitel Legend Old Cataract', 'Aswan', '+201000000000');
assert(cataractCard.arabicName.includes('أولد كتراكت'), 'Old Cataract recognized with Aswan Arabic name');

// 7. Day Resolution & Concierge Day Details
const mockQuote: Quote = {
  id: 'q-test-concierge',
  workspaceId: 'ws-1',
  quoteNumber: 'DAL-2026-TEST',
  travelerName: 'Sarah Jenkins',
  travelerEmail: 'sarah@example.com',
  travelerPhone: '+1 555 123 4567',
  version: 1,
  status: 'Accepted',
  targetCurrency: 'USD',
  startDate: '2026-11-10',
  durationDays: 5,
  group: { adults: 2, children: [], infants: 0 },
  days: [
    {
      dayNumber: 1,
      title: 'Arrival in Cairo & Mena House Check-in',
      description: 'Private airport meet & assist and transfer to Marriott Mena House hotel.',
      city: 'Cairo',
      lines: [],
    },
    {
      dayNumber: 2,
      title: 'Giza Pyramids & Grand Egyptian Museum',
      description: 'Full day exploration of the Giza Plateau and GEM conservation labs with your Egyptologist.',
      city: 'Cairo',
      lines: [],
    },
  ],
  totalCostEgp: 50000,
  totalPriceEgp: 65000,
  totalPriceQuoteCurrency: 1300,
  marginPercent: 20,
  validUntil: '2026-11-30',
  assignedAgentId: 'agent-1',
  assignedAgentName: 'Karim DMC',
  publicToken: 'tok-123',
  viewCount: 1,
  language: 'en',
  createdAt: '2026-10-14T10:00:00Z',
  updatedAt: '2026-10-14T10:00:00Z',
};

const mockWorkspace = {
  id: 'ws-1',
  name: 'Nile Horizon Expeditions',
  contactEmail: 'concierge@nilehorizon.com',
  contactPhone: '+20 100 555 1234',
  whatsappNumber: '+20 100 555 1234',
  defaultLanguage: 'en',
  defaultCurrency: 'USD',
  defaultProposalTheme: 'luxury',
} as unknown as Workspace;

const day2Details = getConciergeDayDetails(mockQuote, null, 2, mockWorkspace);
assert(day2Details.dayNumber === 2, 'Day 2 details resolved');
assert(day2Details.monumentPasses.some(p => p.name.includes('Giza') || p.name.includes('Pyramid')), 'Giza monument passes included');
assert(day2Details.etiquetteTips.length > 0, 'Cultural etiquette tips included');
assert(!!day2Details.driver, 'Driver details generated with vehicle plate');
assert(!!day2Details.guide, 'Egyptologist guide contact generated');

console.log('All Traveler Concierge & Tipping Guide unit tests passed successfully!');
