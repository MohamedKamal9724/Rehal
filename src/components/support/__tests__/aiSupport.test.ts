import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  RIHAL_SYSTEM_PROMPT, 
  getFallbackSupportResponse, 
  QUICK_SUGGESTION_CHIPS 
} from '../../../lib/supportKnowledge.js';

describe('Faris Concierge Engine and Knowledge Base', () => {
  it('contains Faris persona, strict domain confinement, and bans AI labels in RIHAL_SYSTEM_PROMPT', () => {
    assert.ok(RIHAL_SYSTEM_PROMPT.includes('Faris') || RIHAL_SYSTEM_PROMPT.includes('فارس'));
    assert.ok(RIHAL_SYSTEM_PROMPT.includes('RIHAL'));
    assert.ok(RIHAL_SYSTEM_PROMPT.includes('EG-CAI-7491'));
    assert.ok(RIHAL_SYSTEM_PROMPT.includes('NEVER mention or identify as an "AI"'));
    assert.ok(RIHAL_SYSTEM_PROMPT.includes('STRICT DOMAIN CONFINEMENT'));
  });

  it('declines off-topic queries in natural, friendly voice without robot jargon', () => {
    const arRes = getFallbackSupportResponse('كيف أطبخ ملوخية بالفراخ؟', 'traveler');
    assert.ok(arRes.content.includes('فارس'));
    assert.ok(!arRes.content.includes('AI') && !arRes.content.includes('ذكاء اصطناعي'));
    assert.ok(!arRes.content.includes('[STAGE-'));

    const enRes = getFallbackSupportResponse('Write me python code to invert a binary tree', 'operator');
    assert.ok(enRes.content.includes('Faris'));
    assert.ok(!enRes.content.includes('AI') && !enRes.content.includes('language model'));
    assert.ok(!enRes.content.includes('[STAGE-'));
  });

  it('answers booking passcode queries with conversational steps and sample code', () => {
    const res = getFallbackSupportResponse('أين أجد كود الحجز وكيف أستخدمه؟', 'traveler');
    assert.ok(res.content.includes('EG-CAI-7491'));
    assert.ok(!res.content.includes('[STAGE-'));
    assert.ok(res.suggestedActions && res.suggestedActions.length > 0);
  });

  it('answers operator B2B quote inquiries with natural business guidance', () => {
    const res = getFallbackSupportResponse('How do I build a B2B quote with profit margins and export as PDF?', 'operator');
    assert.ok(res.content.includes('Sales') || res.content.includes('Quote'));
    assert.ok(!res.content.includes('[STAGE-'));
  });

  it('generates a human escalation follow-up note and ticket reference', () => {
    const res = getFallbackSupportResponse('في مشكلة كبيرة جداً في الدفع والسيستم معلق ومحتاج شخص يحلها ضروري', 'operator');
    assert.ok(res.ticketId && res.ticketId.startsWith('RHL-'));
    assert.ok(res.content.includes('RHL-'));
    assert.ok(!res.content.includes('[STAGE-'));
  });

  it('includes pre-configured quick suggestion chips for both travelers and operators', () => {
    assert.ok(QUICK_SUGGESTION_CHIPS.length >= 4);
    const travelerChips = QUICK_SUGGESTION_CHIPS.filter(c => c.category === 'traveler');
    const operatorChips = QUICK_SUGGESTION_CHIPS.filter(c => c.category === 'operator');
    assert.ok(travelerChips.length > 0);
    assert.ok(operatorChips.length > 0);
  });

  it('answers real-time operational questions about guest tour location and itinerary schedule', () => {
    const res = getFallbackSupportResponse("Where is Mr. Alexander's tour group today?", 'operator');
    assert.ok(res.content.includes('Alexander') || res.content.includes('ألكسندر'));
    assert.ok(res.content.includes('EG-CAI-7491') || res.content.includes('Operating'));
    assert.ok(res.suggestedActions && res.suggestedActions.some(a => a.actionType === 'whatsapp'));
  });

  it('answers real-time operational questions about hotel booking status', () => {
    const res = getFallbackSupportResponse('What is the booking status for Steigenberger Luxor?', 'operator');
    assert.ok(res.content.includes('Steigenberger') || res.content.includes('شتايجنبرجر'));
    assert.ok(res.content.includes('Confirmed') || res.content.includes('مؤكد'));
  });

  it('answers active trips overview requests accurately from live records', () => {
    const res = getFallbackSupportResponse('ما هي الرحلات النشطة حالياً؟', 'operator');
    assert.ok(res.content.includes('الرحلات النشطة') || res.content.includes('active tour'));
    assert.ok(res.suggestedActions && res.suggestedActions.some(a => a.actionType === 'navigate'));
  });

  it('answers rooming list and passenger allocation queries accurately', () => {
    const res = getFallbackSupportResponse("What is the rooming list for Alexander's group?", 'operator');
    assert.ok(res.content.includes('Alexander Wright') || res.content.includes('ألكسندر'));
    assert.ok(res.content.includes('101') || res.content.includes('Rooming') || res.content.includes('تسكين'));
  });
});

