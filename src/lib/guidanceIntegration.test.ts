import { describe, it } from 'node:test';
import assert from 'node:assert';
import guidanceJson from '../data/guidanceContent.json';
import { getSectionHelpGuide, SECTION_HELP_REGISTRY } from '../lib/sectionHelpRegistry';

describe('Data-Driven Guidance Content JSON validation', () => {
  const primaryModules = ['hajj_umrah', 'sales', 'trips', 'dashboard', 'suppliers', 'rates'];

  it('contains all requested primary modules: hajj_umrah, sales, trips, dashboard, suppliers, rates', () => {
    primaryModules.forEach((mod) => {
      assert.ok(
        (guidanceJson as any)[mod],
        `Expected primary module "${mod}" to exist in guidanceContent.json`
      );
    });
  });

  it('every module entry in guidanceContent.json has Purpose, Prerequisites, and Next Steps in both Arabic and English', () => {
    primaryModules.forEach((mod) => {
      const entry = (guidanceJson as any)[mod];

      // PART 1: Purpose
      assert.ok(entry.purpose, `${mod}: must have purpose object`);
      assert.ok(typeof entry.purpose.en === 'string' && entry.purpose.en.length > 10, `${mod}: purpose.en must have descriptive text`);
      assert.ok(typeof entry.purpose.ar === 'string' && entry.purpose.ar.length > 10, `${mod}: purpose.ar must have descriptive text`);

      // PART 2: Prerequisites
      assert.ok(entry.prerequisites, `${mod}: must have prerequisites object`);
      const prereqEn = entry.prerequisites.summaryEn || entry.prerequisites.en;
      const prereqAr = entry.prerequisites.summaryAr || entry.prerequisites.ar;
      assert.ok(typeof prereqEn === 'string' && prereqEn.length > 10, `${mod}: prerequisites English text must be present`);
      assert.ok(typeof prereqAr === 'string' && prereqAr.length > 10, `${mod}: prerequisites Arabic text must be present`);
      assert.ok(Array.isArray(entry.prerequisites.checklist) && entry.prerequisites.checklist.length >= 1, `${mod}: must have checklist items`);

      // PART 3: Next Steps
      assert.ok(entry.nextSteps, `${mod}: must have nextSteps object`);
      const nextEn = entry.nextSteps.summaryEn || entry.nextSteps.en;
      const nextAr = entry.nextSteps.summaryAr || entry.nextSteps.ar;
      assert.ok(typeof nextEn === 'string' && nextEn.length > 5, `${mod}: nextSteps English text must be present`);
      assert.ok(typeof nextAr === 'string' && nextAr.length > 5, `${mod}: nextSteps Arabic text must be present`);
      assert.ok(Array.isArray(entry.nextSteps.links) && entry.nextSteps.links.length >= 1, `${mod}: must have action links`);

      entry.nextSteps.links.forEach((link: any, idx: number) => {
        assert.ok(link.targetTab, `${mod}: link ${idx} must specify targetTab`);
        assert.ok(link.labelEn, `${mod}: link ${idx} must have labelEn`);
        assert.ok(link.labelAr, `${mod}: link ${idx} must have labelAr`);
      });
    });
  });

  it('getSectionHelpGuide resolves both module keys and sub-tab keys gracefully', () => {
    const hajjGuide = getSectionHelpGuide('hajj_umrah');
    assert.strictEqual(hajjGuide.id, 'hajj_umrah');

    const salesGuide = getSectionHelpGuide('sales');
    assert.strictEqual(salesGuide.id, 'sales');

    const tripsGuide = getSectionHelpGuide('trips');
    assert.strictEqual(tripsGuide.id, 'trips');

    const overviewGuide = getSectionHelpGuide('hajj_overview');
    assert.strictEqual(overviewGuide.id, 'hajj_overview');

    const unknownGuide = getSectionHelpGuide('random_key_that_does_not_exist');
    assert.ok(unknownGuide && unknownGuide.id, 'Must return a safe fallback guide');
  });
});
