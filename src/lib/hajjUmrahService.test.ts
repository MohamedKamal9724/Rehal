import assert from 'node:assert/strict';
import {
  HAJJ_UMRAH_PACKAGES,
  HAJJ_UMRAH_RATES,
  HAJJ_UMRAH_SUPPLIERS,
  SAMPLE_HAJJ_UMRAH_PACKAGES,
  calculateUmrahPackageCost,
  convertPresetToQuote,
  SACRED_ZIYARAT_SITES,
  UMRAH_RITUAL_STEPS,
  MAKKAH_HOTEL_TIERS,
  MADINAH_HOTEL_TIERS
} from './hajjUmrahData';
import { createTripFromHajjPackage } from './tripStore';
import type { Workspace } from '../types';

// Original regression assertions
assert.deepEqual(HAJJ_UMRAH_PACKAGES, []);
assert.deepEqual(HAJJ_UMRAH_RATES, []);
assert.deepEqual(HAJJ_UMRAH_SUPPLIERS, []);
assert.throws(() => createTripFromHajjPackage({} as any, [], 0), /not configured/);

// Verify Sample Packages
assert(SAMPLE_HAJJ_UMRAH_PACKAGES.length >= 4, 'Should provide at least 4 sample packages');
const vipPackage = SAMPLE_HAJJ_UMRAH_PACKAGES[0];
assert(vipPackage.makkahHotel.length > 0, 'Should specify Makkah hotel');
assert(vipPackage.madinahHotel.length > 0, 'Should specify Madinah hotel');
assert(vipPackage.priceDoubleUsd > 0, 'Double occupancy price should be positive');
assert(vipPackage.priceTripleUsd < vipPackage.priceDoubleUsd, 'Triple occupancy should be cheaper per person');

// Verify Umrah Package Cost Calculator
const costResult = calculateUmrahPackageCost({
  makkahTierId: MAKKAH_HOTEL_TIERS[0].id,
  madinahTierId: MADINAH_HOTEL_TIERS[0].id,
  makkahNights: 5,
  madinahNights: 4,
  roomType: 'double',
  transportType: 'haramain_first',
  includeZamzam: true,
  includeZiyarat: true,
  groupPaxCount: 4,
});

assert(costResult.pricePerPersonUsd > 0, 'Calculated price per person should be positive');
assert(costResult.totalGroupPriceUsd === costResult.pricePerPersonUsd * 4, 'Total price should equal price per person * pax count');
assert(costResult.pricePerPersonSar > costResult.pricePerPersonUsd * 3, 'SAR conversion should reflect ~3.75 peg');
assert(costResult.pricePerPersonEgp > costResult.pricePerPersonUsd * 40, 'EGP conversion should reflect current market rate');

// Verify Convert Preset to Quote
import { DEFAULT_WORKSPACE } from './demoData';

const dummyWorkspace: Workspace = {
  ...DEFAULT_WORKSPACE,
  id: 'ws-test-1',
  name: 'Test Agency',
  slug: 'test-agency',
  contactEmail: 'info@test.com',
  enableHajjUmrah: true,
};

const quote = convertPresetToQuote(vipPackage, dummyWorkspace, 'double', 2, 'Pilgrim Family');
assert(quote.quoteNumber.startsWith('HAJJ-'), 'Quote number should have HAJJ prefix');
assert.equal(quote.workspaceId, dummyWorkspace.id);
assert.equal(quote.group.adults, 2);
assert(quote.days.length >= 2, 'Quote should have at least 2 itinerary days');
assert(quote.days[0].lines.length > 0, 'Day 1 should have quote lines');
assert.equal(quote.days[0].city, 'Makkah');

// Verify Sacred Sites Directory
assert(SACRED_ZIYARAT_SITES.length >= 6, 'Should have at least 6 sacred sites');
const makkahSites = SACRED_ZIYARAT_SITES.filter(s => s.city === 'Makkah');
const madinahSites = SACRED_ZIYARAT_SITES.filter(s => s.city === 'Madinah');
assert(makkahSites.length >= 2, 'Should have Makkah sacred sites');
assert(madinahSites.length >= 3, 'Should have Madinah sacred sites');
assert(makkahSites.some(s => s.id === 'site-ghar-hira'), 'Should include Cave of Hira');
assert(madinahSites.some(s => s.id === 'site-quba-mosque'), 'Should include Quba Mosque');

// Verify 4 Pillars of Umrah
assert.equal(UMRAH_RITUAL_STEPS.length, 4, 'Umrah rituals must have exactly 4 authentic pillars');
assert.equal(UMRAH_RITUAL_STEPS[0].step, 1);
assert.equal(UMRAH_RITUAL_STEPS[3].step, 4);
assert(UMRAH_RITUAL_STEPS[0].duaa.includes('لَبَّيْكَ'), 'Pillar 1 should contain Talbiyah');

console.log('All Hajj & Umrah unit tests and regressions passed successfully!');

