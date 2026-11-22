import assert from 'node:assert/strict';
import { Quote, Workspace, ProposalUpsell } from '../types';
import {
  generateVouchersFromQuote,
  formatWhatsAppDispatchMessage,
  generatePrintableVoucherHtml,
  generateBatchVouchersHtml,
  calculateDateOffset,
} from './voucherService';

const mockWorkspace: Workspace = {
  id: 'ws-1',
  name: 'RIHAL Egypt Expeditions',
  slug: 'rihal',
  brandColors: { primary: '#003580', accent: '#006ce4', gold: '#ffb700' },
  defaultLanguage: 'en',
  defaultCurrency: 'USD',
  hideNetCostsFromAgents: false,
  minMarginPercent: 20,
  requireApprovalBelowMinMargin: true,
  defaultProposalTheme: 'luxury',
  quoteValidityDays: 14,
  contactEmail: 'operations@daleel.eg',
  contactPhone: '+20 2 2736 1000',
  whatsappNumber: '+201012345678',
  taxRegistrationNumber: '492-180-339',
  tourismLicenseNumber: '2491/Category A',
  paymentInstructionsText: 'Direct wire transfer to official Egyptian bank account.',
  subscriptionPlan: 'Agency',
  monthlyQuoteLimit: 100,
  aiCreditsLimit: 500,
  aiCreditsUsed: 12,
  createdAt: '2026-01-01',
};

const mockUpsells: ProposalUpsell[] = [
  {
    id: 'upsell-balloon-1',
    title: 'Sunrise Hot Air Balloon Flight over Luxor',
    arabicTitle: 'رحلة المنطاد الطائر',
    city: 'Luxor',
    description: 'Drift at dawn over the Valley of the Kings.',
    price: 180,
    priceBasis: 'per_person',
    netCost: 95,
    category: 'Excursion',
    badge: 'Most Popular',
  },
  {
    id: 'upsell-vip-meet-1',
    title: 'Cairo Airport VIP Fast-Track & Tarmac Chauffeur',
    city: 'Cairo',
    description: 'Tarmac greeting and private immigration fast-track.',
    price: 120,
    priceBasis: 'per_person',
    netCost: 65,
    category: 'VIP Service',
  },
];

const mockQuote: Quote = {
  id: 'quote-test-ops-1',
  workspaceId: 'ws-1',
  quoteNumber: 'DAL-2026-0491',
  travelerName: 'David Jenkins',
  travelerEmail: 'david@jenkins-travel.com',
  travelerPhone: '+44 7700 900342',
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
      description: 'Private chauffeur transfer to Marriott Mena House hotel.',
      city: 'Cairo',
      lines: [
        {
          id: 'line-1',
          dayNumber: 1,
          serviceId: 'rate-mena-1',
          serviceName: 'Marriott Mena House Garden Room',
          supplierName: 'Marriott Mena House Hotel',
          supplierType: 'Hotel',
          city: 'Cairo',
          quantity: 1,
          occupancyBasis: 'double',
          unitCost: 280,
          costCurrency: 'USD',
          markupPercent: 25,
          markupFixed: 0,
          unitPrice: 350,
          totalCostEgp: 27720,
          totalPriceEgp: 34650,
          totalPriceQuoteCurrency: 700,
          status: 'OK',
          costCalculationNotes: 'Direct contract',
        },
      ],
    },
    {
      dayNumber: 2,
      title: 'Giza Pyramids & Grand Egyptian Museum',
      description: 'Private Egyptologist guiding through the Giza Plateau and GEM conservation labs.',
      city: 'Cairo',
      lines: [
        {
          id: 'line-2',
          dayNumber: 2,
          serviceId: 'rate-mena-2',
          serviceName: 'Marriott Mena House Garden Room',
          supplierName: 'Marriott Mena House Hotel',
          supplierType: 'Hotel',
          city: 'Cairo',
          quantity: 1,
          occupancyBasis: 'double',
          unitCost: 280,
          costCurrency: 'USD',
          markupPercent: 25,
          markupFixed: 0,
          unitPrice: 350,
          totalCostEgp: 27720,
          totalPriceEgp: 34650,
          totalPriceQuoteCurrency: 700,
          status: 'OK',
          costCalculationNotes: 'Direct contract',
        },
      ],
    },
    {
      dayNumber: 3,
      title: 'Fly to Luxor & Nile Cruise Embarkation',
      description: 'Domestic flight to Luxor and check-in to 5-star deluxe cruiser.',
      city: 'Luxor',
      lines: [
        {
          id: 'line-3',
          dayNumber: 3,
          serviceId: 'rate-cruise-1',
          serviceName: 'M/S Mayfair Deluxe Stateroom',
          supplierName: 'Mayfair Nile Cruises',
          supplierType: 'Nile Cruise',
          city: 'Luxor',
          quantity: 1,
          occupancyBasis: 'double',
          unitCost: 400,
          costCurrency: 'USD',
          markupPercent: 25,
          markupFixed: 0,
          unitPrice: 500,
          totalCostEgp: 39600,
          totalPriceEgp: 49500,
          totalPriceQuoteCurrency: 1000,
          status: 'OK',
          costCalculationNotes: 'Direct contract',
        },
      ],
    },
  ],
  totalCostEgp: 95040,
  totalPriceEgp: 118800,
  totalPriceQuoteCurrency: 2400,
  marginPercent: 20,
  b2bCommissionPercent: 0,
  validUntil: '2026-11-01',
  language: 'en',
  assignedAgentId: 'agent-1',
  assignedAgentName: 'Karim DMC',
  publicToken: 'prop-demo-ops',
  viewCount: 4,
  upsells: mockUpsells,
  selectedUpsellIds: ['upsell-balloon-1'], // Client booked the Hot Air Balloon!
  createdAt: '2026-10-14T00:00:00Z',
  updatedAt: '2026-10-14T10:00:00Z',
};

console.log('Testing Supplier Voucher Service...');

// 1. Test date offset calculation
assert.equal(calculateDateOffset('2026-11-10', 1), '2026-11-10');
assert.equal(calculateDateOffset('2026-11-10', 3), '2026-11-12');
console.log('  ok   calculateDateOffset accurately calculates service dates');

// 2. Test voucher generation from quote
const vouchers = generateVouchersFromQuote(mockQuote, undefined, mockWorkspace);
assert.ok(vouchers.length >= 4, `Expected at least 4 vouchers, got ${vouchers.length}`);
console.log(`  ok   Generated ${vouchers.length} operations vouchers from quote`);

// 3. Test Hotel grouping (Day 1 & Day 2 at Mena House should combine into 1 2-night voucher)
const hotelVouchers = vouchers.filter(v => v.category === 'hotel');
assert.equal(hotelVouchers.length, 1, 'Day 1 & Day 2 at Mena House should be merged into 1 voucher');
assert.equal(hotelVouchers[0].nightsCount, 2, 'Should have 2 nights count');
assert.equal(hotelVouchers[0].supplierName, 'Marriott Mena House Hotel');
assert.equal(hotelVouchers[0].serviceDate, '2026-11-10');
assert.equal(hotelVouchers[0].endDate, '2026-11-12');
console.log('  ok   Hotel consecutive nights merged into single 2-night voucher');

// 4. Test Nile Cruise voucher
const cruiseVouchers = vouchers.filter(v => v.category === 'cruise');
assert.equal(cruiseVouchers.length, 1);
assert.equal(cruiseVouchers[0].supplierName, 'Mayfair Nile Cruises');
assert.equal(cruiseVouchers[0].mealPlan, 'Full Board (Breakfast, Lunch & Dinner Included)');
console.log('  ok   Nile cruise voucher generated with full board dining');

// 5. Test Private Chauffeur transfers (Arrival & Departure)
const transportVouchers = vouchers.filter(v => v.category === 'transport');
assert.ok(transportVouchers.length >= 2, 'Expected arrival and departure transport vouchers');
const arrivalTransfer = transportVouchers.find(v => v.dayNumbers.includes(1));
assert.ok(arrivalTransfer, 'Arrival transfer voucher exists');
assert.ok(arrivalTransfer.flightDetails?.includes('BA 155'), 'Contains arrival flight coordinates');
console.log('  ok   Chauffeur run sheet vouchers generated with flight coordinates');

// 6. Test Egyptologist Guide assignment
const guideVouchers = vouchers.filter(v => v.category === 'guide');
assert.equal(guideVouchers.length, 1);
assert.equal(guideVouchers[0].guideLanguage, 'EN');
assert.ok(guideVouchers[0].serviceDescription?.includes('Giza Pyramids'));
console.log('  ok   Licensed Egyptologist tour assignment voucher generated');

// 7. Test Confirmed Client Upsell (Hot Air Balloon in Luxor)
const excursionVouchers = vouchers.filter(v => v.category === 'excursion');
assert.equal(excursionVouchers.length, 1, 'Selected Hot Air Balloon upsell must generate a voucher');
assert.ok(excursionVouchers[0].serviceTitle.includes('Hot Air Balloon'));
assert.equal(excursionVouchers[0].city, 'Luxor');
assert.equal(excursionVouchers[0].pickupTime, '04:45');
console.log('  ok   Client-confirmed Luxor Hot Air Balloon upsell converted into operations voucher');

// 8. Test WhatsApp Operations Dispatch Message Formatting
const hotelMsg = formatWhatsAppDispatchMessage(hotelVouchers[0], mockWorkspace);
assert.ok(hotelMsg.includes('OFFICIAL OPERATIONS DISPATCH'));
assert.ok(hotelMsg.includes(hotelVouchers[0].voucherNumber));
assert.ok(hotelMsg.includes('David Jenkins'));
assert.ok(hotelMsg.includes('Marriott Mena House Hotel'));
assert.ok(hotelMsg.includes('2 Night(s)'));
assert.ok(!hotelMsg.includes('undefined'), 'WhatsApp message should never contain literal undefined');
console.log('  ok   WhatsApp dispatch message formatted with bilingual operational details');

// 9. Test Driver WhatsApp Dispatch
const driverMsg = formatWhatsAppDispatchMessage(arrivalTransfer!, mockWorkspace);
assert.ok(driverMsg.includes('Captain Ahmed Abdelrahman'));
assert.ok(driverMsg.includes('BA 155'));
assert.ok(driverMsg.includes('WELCOME: DAVID JENKINS'));
console.log('  ok   Driver WhatsApp dispatch contains flight, vehicle, and signboard text');

// 10. Test Printable Voucher HTML Generation
const voucherHtml = generatePrintableVoucherHtml(hotelVouchers[0], mockWorkspace);
assert.ok(!voucherHtml.includes('492-180-339'));
assert.ok(!voucherHtml.includes('2491/Category A'));
assert.ok(voucherHtml.includes(hotelVouchers[0].voucherNumber));
assert.ok(voucherHtml.includes('window.print()'));
console.log('  ok   Printable voucher excludes official identifiers');

// 11. Test Batch Multi-Voucher Print Pack
const batchHtml = generateBatchVouchersHtml(vouchers, mockWorkspace);
assert.ok(batchHtml.includes('page-break-after: always'));
assert.ok(batchHtml.includes(`${vouchers.length} Vouchers`));
console.log('  ok   1-Click Batch Vouchers Pack compiled with multi-page printing rules');

console.log('All Supplier Voucher Service tests passed successfully!');
