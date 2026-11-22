// Run with: npm test   (tsx + node:assert, no extra dependencies)
import assert from 'node:assert/strict';
import { DEFAULT_EXCHANGE_RATES } from './constants';
import type { Rate } from '../types';
import { calculateLineCostAndPrice, recalculateQuoteTotals, convertToEgp, markupForTargetMargin, repriceLine } from './pricingEngine';
import { draftItineraryFromRates, sanitizeInquiryText } from './gemini';

const FX = { EGP: { toEgp: 1, bufferPct: 0 }, USD: { toEgp: 50, bufferPct: 0 }, EUR: { toEgp: 50, bufferPct: 0 }, GBP: { toEgp: 50, bufferPct: 0 }, RUB: { toEgp: 1, bufferPct: 0 } } as any;

const mk = (o: Partial<Rate>): Rate => ({
  id: 'r1', workspaceId: 'w', supplierId: 's', supplierName: 'Sup', serviceName: 'Svc', supplierType: 'Attraction',
  city: 'Cairo', seasonIds: [], occupancyBasis: 'per_person', nationalityTier: 'all', currency: 'USD', netCost: 100,
  validityStart: '2026-01-01', validityEnd: '2027-12-31', version: 1, updatedAt: '', ...o,
});

const queue: Array<[string, () => void | Promise<void>]> = [];
const test = (name: string, fn: () => void | Promise<void>) => { queue.push([name, fn]); };

const G2 = { adults: 2, children: [], infants: 0 };

test('per_person, quantity 1 (one day/visit): 2 adults x 100 USD = 200 USD', () => {
  const r = calculateLineCostAndPrice(mk({}), 1, 'per_person', G2, 'USD', 0, 0, FX, '2026-11-20');
  assert.equal(r.totalCostEgp, 200 * 50);
});

const REQ = (extra: any = {}) => ({ group: G2, cities: ['Cairo'], durationDays: 2, interests: [], urgency: 'Low', confidenceScores: {}, startDate: '2026-11-20', ...extra }) as any;

test('AI draft does not square the adult count (2 adults, 100 USD ticket)', () => {
  const days = draftItineraryFromRates(REQ(), [mk({ supplierType: 'Attraction' })], 'USD');
  const line = days[1].lines.find(l => l.supplierType === 'Attraction')!;
  assert.equal(line.status, 'OK');
  assert.equal(line.quantity, 1);
  assert.equal(line.totalCostEgp, 200 * DEFAULT_EXCHANGE_RATES.USD.toEgp); // 2 x 100 USD, not 4 x
});

test('AI draft: one hotel night per day except departure day', () => {
  const hotel = mk({ id: 'h', supplierType: 'Hotel', occupancyBasis: 'double' });
  const days = draftItineraryFromRates(REQ({ durationDays: 4 }), [hotel], 'USD');
  const nights = days.flatMap(d => d.lines).filter(l => l.supplierType === 'Hotel' && l.status === 'OK');
  assert.equal(nights.length, 3);
});

test('AI draft: no rate in that city => Rate missing line, never another city\'s price', () => {
  const luxorOnly = mk({ supplierType: 'Attraction', city: 'Luxor' });
  const days = draftItineraryFromRates(REQ(), [luxorOnly], 'USD');
  const line = days[1].lines.find(l => l.supplierType === 'Attraction')!;
  assert.equal(line.status, 'Rate missing');
  assert.equal(line.totalPriceEgp, 0);
});

test('AI draft: Giza uses Cairo-market rates', () => {
  const days = draftItineraryFromRates(REQ({ cities: ['Giza'] }), [mk({ supplierType: 'Attraction', city: 'Cairo' })], 'USD');
  assert.equal(days[1].lines.find(l => l.supplierType === 'Attraction')!.status, 'OK');
});

test('AI draft: line ids are unique', () => {
  const days = draftItineraryFromRates(REQ({ durationDays: 5 }), [], 'USD');
  const ids = days.flatMap(d => d.lines.map(l => l.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('AI draft: rate expiring before day 2 flags only that day', () => {
  const r = mk({ supplierType: 'Attraction', validityEnd: '2026-11-20' });
  const days = draftItineraryFromRates(REQ(), [r], 'USD');
  assert.equal(days[1].lines.find(l => l.supplierType === 'Attraction')!.status, 'Expired rate');
});

test('children: under free age free, discounted otherwise', () => {
  const rate = mk({ childFreeMaxAge: 5, childDiscountPercent: 50 });
  const g = { adults: 2, children: [{ age: 4 }, { age: 8 }], infants: 0 };
  const r = calculateLineCostAndPrice(rate, 1, 'per_person', g, 'USD', 0, 0, FX, '2026-11-20');
  assert.equal(r.totalCostEgp, (200 + 50) * 50);
});

test('rate not valid on travel date => Expired rate', () => {
  const r = calculateLineCostAndPrice(mk({ validityEnd: '2026-06-30' }), 1, 'per_person', G2, 'USD', 0, 0, FX, '2026-11-20');
  assert.equal(r.status, 'Expired rate');
});

test('rate valid on travel date => OK (even if "today" is later)', () => {
  const r = calculateLineCostAndPrice(mk({ validityStart: '2020-01-01', validityEnd: '2020-12-31' }), 1, 'per_person', G2, 'USD', 0, 0, FX, '2020-06-01');
  assert.equal(r.status, 'OK');
});

test('missing rate => Rate missing', () => {
  assert.equal(calculateLineCostAndPrice(undefined, 1, 'per_person', G2, 'USD', 20).status, 'Rate missing');
});

test('totals: expired or missing lines block dispatch', () => {
  const base: any = { totalCostEgp: 1, totalPriceEgp: 2, totalPriceQuoteCurrency: 2 };
  const t = recalculateQuoteTotals([{ ...base, status: 'Expired rate' }], 'USD') as any;
  assert.equal(t.hasBlockingRate, true);
  assert.equal(recalculateQuoteTotals([{ ...base, status: 'OK' }], 'USD').hasMissingRate, false);
});

test('margin vs markup: 25% markup = 20% margin', () => {
  const r = calculateLineCostAndPrice(mk({ currency: 'EGP', netCost: 100 }), 1, 'per_group', G2, 'EGP', 25, 0, FX);
  const t = recalculateQuoteTotals([{ totalCostEgp: r.totalCostEgp, totalPriceEgp: r.totalPriceEgp, totalPriceQuoteCurrency: r.totalPriceQuoteCurrency, status: 'OK' } as any], 'EGP');
  assert.equal(t.marginPercent, 20);
});

test('markupForTargetMargin: 20% margin needs 25% markup', () => {
  assert.equal(markupForTargetMargin(20), 25);
  assert.equal(markupForTargetMargin(18), 22);
});

test('repriceLine follows a group change and keeps the line markup', () => {
  const rate = mk({ currency: 'EGP', netCost: 100 });
  const g2 = { adults: 2, children: [], infants: 0 }, g4 = { adults: 4, children: [], infants: 0 };
  const line: any = { id: 'l', serviceId: 'r1', quantity: 1, occupancyBasis: 'per_person', markupPercent: 25, markupFixed: 0, status: 'OK' };
  assert.equal(repriceLine(line, rate, g2, 'EGP', '2026-11-20', FX).totalCostEgp, 200);
  assert.equal(repriceLine(line, rate, g4, 'EGP', '2026-11-20', FX).totalCostEgp, 400);
  assert.equal(repriceLine({ ...line, status: 'Overridden' }, rate, g4, 'EGP', '2026-11-20', FX).totalCostEgp, undefined);
  assert.equal(repriceLine(line, undefined, g4, 'EGP', '2026-11-20', FX).status, 'Rate missing');
});

test('fallback parser never invents name, dates, nationality or budget', async () => {
  const { parseInquiryWithAi } = await import('./gemini');
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await parseInquiryWithAi('Hi, we want a trip to Cairo and Luxor, 6 days, 2 adults');
  assert.equal(r.travelerName, undefined);
  assert.equal(r.startDate, undefined);
  assert.equal(r.nationality, undefined);
  assert.equal(r.budgetAmount, undefined);
  assert.ok(r.clarifyingQuestions!.some(q => /dates/i.test(q)));
  assert.equal(r.confidenceScores.dates, 0);
});

test('sanitizer masks passports and card numbers', () => {
  const s = sanitizeInquiryText('passport AB1234567 card 4111 1111 1111 1111');
  assert.ok(!s.includes('AB1234567') && !s.includes('4111'));
});

(async () => {
  let passed = 0;
  for (const [name, fn] of queue) {
    try { await fn(); passed++; console.log('  ok  ', name); }
    catch (e: any) { console.error('  FAIL', name, '\n       ', String(e.message).split('\n')[0]); process.exitCode = 1; }
  }
  console.log(`\n${passed}/${queue.length} passed`);
})();
