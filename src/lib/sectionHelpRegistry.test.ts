import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SECTION_HELP_REGISTRY, getSectionHelpGuide } from './sectionHelpRegistry';

describe('sectionHelpRegistry completeness and validation', () => {
  const expectedKeys = [
    // Core Operational Sections
    'dashboard',
    'sales_inbox',
    'sales_quotes',
    'sales_pipeline',
    'trips_workspace',
    'suppliers',
    'rates',
    // Hajj & Umrah Hub & Sub-Tabs
    'hajj_hub',
    'hajj_overview',
    'hajj_packages',
    'hajj_calculator',
    'hajj_ziyarat_map',
    'hajj_rituals',
    'hajj_logistics'
  ];

  it('contains all required primary sections and Hajj/Umrah sub-tabs', () => {
    expectedKeys.forEach((key) => {
      assert.ok(
        SECTION_HELP_REGISTRY[key],
        `Expected section key "${key}" to exist in SECTION_HELP_REGISTRY`
      );
    });
  });

  it('every section strictly conforms to the 3-part layout (Purpose, Prerequisites, Next Steps) in Arabic and English', () => {
    Object.entries(SECTION_HELP_REGISTRY).forEach(([key, guide]) => {
      // Basic Info
      assert.ok(guide.id === key, `Key ${key} ID must match its dictionary key`);
      assert.ok(guide.title.en.trim().length > 0, `${key}: title.en must not be empty`);
      assert.ok(guide.title.ar.trim().length > 0, `${key}: title.ar must not be empty`);
      assert.ok(guide.subtitle.en.trim().length > 0, `${key}: subtitle.en must not be empty`);
      assert.ok(guide.subtitle.ar.trim().length > 0, `${key}: subtitle.ar must not be empty`);

      // PART 1: Purpose
      assert.ok(guide.purpose.en.trim().length > 10, `${key}: purpose.en must have descriptive text`);
      assert.ok(guide.purpose.ar.trim().length > 10, `${key}: purpose.ar must have descriptive text`);
      assert.ok(guide.purpose.keyDeliverables.en.length >= 2, `${key}: must have at least 2 key deliverables in EN`);
      assert.ok(guide.purpose.keyDeliverables.ar.length >= 2, `${key}: must have at least 2 key deliverables in AR`);

      // PART 2: Prerequisites
      assert.ok(guide.prerequisites.summaryEn.trim().length > 0, `${key}: prerequisites.summaryEn must not be empty`);
      assert.ok(guide.prerequisites.summaryAr.trim().length > 0, `${key}: prerequisites.summaryAr must not be empty`);
      assert.ok(guide.prerequisites.checklist.length >= 1, `${key}: must have at least 1 prerequisite item`);
      guide.prerequisites.checklist.forEach((item, idx) => {
        assert.ok(item.en.trim().length > 0, `${key}: checklist item ${idx} en must not be empty`);
        assert.ok(item.ar.trim().length > 0, `${key}: checklist item ${idx} ar must not be empty`);
      });

      // PART 3: Related Next Steps & Direct Shortcuts
      assert.ok(guide.nextSteps.summaryEn.trim().length > 0, `${key}: nextSteps.summaryEn must not be empty`);
      assert.ok(guide.nextSteps.summaryAr.trim().length > 0, `${key}: nextSteps.summaryAr must not be empty`);
      assert.ok(guide.nextSteps.links.length >= 1, `${key}: must have at least 1 next-step link`);
      guide.nextSteps.links.forEach((link, idx) => {
        assert.ok(link.targetTab.trim().length > 0, `${key}: link ${idx} targetTab must be specified`);
        assert.ok(link.labelEn.trim().length > 0, `${key}: link ${idx} labelEn must not be empty`);
        assert.ok(link.labelAr.trim().length > 0, `${key}: link ${idx} labelAr must not be empty`);
      });
    });
  });

  it('getSectionHelpGuide fallback handles unknown section keys gracefully', () => {
    const fallback = getSectionHelpGuide('unknown_nonexistent_section');
    assert.ok(fallback, 'Fallback guide must be returned');
    assert.strictEqual(fallback.id, 'dashboard');
  });
});
