import { describe, it } from 'node:test';
import assert from 'node:assert';
import { aiTrainingService, CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE } from '../aiTrainingService';

describe('aiTrainingService - Structured Operational Ingestion & Faris Indexing', () => {
  it('defines CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE enforcing strictly internal B2B scope', () => {
    assert.ok(CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE.includes('Faris') || CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE.includes('فارس'));
    assert.ok(CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE.includes('RIHAL'));
    assert.ok(CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE.includes('INTERNAL B2B OPERATIONS ONLY'));
    assert.ok(CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE.includes('STRICTLY FORBIDDEN'));
  });

  it('ingests and indexes structured operational records from tripStore and storage repository', () => {
    const index = aiTrainingService.ingestOperationalData();
    assert.ok(index.trips.length > 0, 'Must index active trips');
    assert.ok(index.workspace.id, 'Must index workspace details');
    const firstTrip = index.trips[0];
    assert.ok(firstTrip.fileNumber, 'Trip must have fileNumber');
    assert.ok(firstTrip.currentCity, 'Trip must compute current city location');
    assert.ok(firstTrip.currentDay >= 1, 'Trip must compute current day number');
    assert.ok(firstTrip.assignedGuide.name, 'Trip must have assigned guide');
    assert.ok(firstTrip.assignedDriver.name, 'Trip must have assigned chauffeur');
  });

  it('resolves live trip location and status for Alexander Wright', () => {
    const statusEn = aiTrainingService.queryLiveTripStatus("Where is Mr. Alexander Wright's tour group today?", false);
    assert.ok(statusEn, 'Must return status');
    assert.ok(statusEn.includes('Alexander Wright'));
    assert.ok(statusEn.includes('EG-CAI-7491'));
    assert.ok(statusEn.includes('Tarek Mansour'));

    const statusAr = aiTrainingService.queryLiveTripStatus('أين يتواجد فوج ألكسندر اليوم؟', true);
    assert.ok(statusAr, 'Must return Arabic status');
    assert.ok(statusAr.includes('ألكسندر'));
    assert.ok(statusAr.includes('EG-CAI-7491'));
  });

  it('extracts rooming lists and passenger dietary allocations accurately', () => {
    const roomingEn = aiTrainingService.queryRoomingList("rooming list for Alexander's group", false);
    assert.ok(roomingEn, 'Must return rooming manifest');
    assert.ok(roomingEn.includes('Alexander Wright'));
    assert.ok(roomingEn.includes('101'));
    assert.ok(roomingEn.includes('Sophia Wright'));

    const roomingAr = aiTrainingService.queryRoomingList('كشف تسكين وفد سارة جينكينز', true);
    assert.ok(roomingAr, 'Must return Arabic rooming manifest');
    assert.ok(roomingAr.includes('Sarah Jenkins') || roomingAr.includes('سارة'));
    assert.ok(roomingAr.includes('204'));
  });

  it('queries live hotel booking confirmations across active files', () => {
    const hotelEn = aiTrainingService.queryHotelBookingStatus('What is booking status for Steigenberger Luxor?', false);
    assert.ok(hotelEn, 'Must return hotel status');
    assert.ok(hotelEn.includes('Steigenberger'));
    assert.ok(hotelEn.includes('STG-LXR-9821') || hotelEn.includes('Confirmed'));

    const hotelAr = aiTrainingService.queryHotelBookingStatus('حالة حجز فندق ماريوت مينا هاوس', true);
    assert.ok(hotelAr, 'Must return hotel status in Arabic');
    assert.ok(hotelAr.includes('ماريوت') || hotelAr.includes('مينا هاوس'));
  });

  it('validates internal business queries and rejects external non-business topics', () => {
    // Internal business queries: true
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('Where is Alexander today?'), true);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('موقف حجز شتايجنبرجر الأقصر'), true);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('قائمة تسكين الغرف لرحلة EG-CAI-7491'), true);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('عروض أسعار المبيعات'), true);

    // External queries: false
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('كيف أطبخ ملوخية بالفراخ؟'), false);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('Write me python code for a binary tree'), false);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('What is the weather in Tokyo?'), false);
    assert.strictEqual(aiTrainingService.isInternalBusinessQuery('Who won the football championship?'), false);
  });
});
