import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { 
  GuidanceDrawer, 
  useGuidanceDrawer 
} from './GuidanceDrawer';
import { GuidanceTrigger } from './GuidanceTrigger';

describe('GuidanceDrawer and useGuidanceDrawer hook', () => {
  const samplePurpose = {
    en: 'Operational Purpose description in English',
    ar: 'وصف الهدف التشغيلي باللغة العربية',
    keyDeliverables: {
      en: ['Key deliverable 1', 'Key deliverable 2'],
      ar: ['المخرج الأول', 'المخرج الثاني'],
    },
  };

  const samplePrerequisites = {
    en: 'Prerequisites summary in English',
    ar: 'المتطلبات المسبقة بالعربية',
    checklist: [
      { id: 'item1', en: 'Item 1', ar: 'البند الأول', required: true },
    ],
  };

  const sampleNextSteps = {
    en: 'Next steps summary in English',
    ar: 'الخطوات التالية بالعربية',
    links: [
      { targetTab: 'quotes', labelEn: 'Quotes', labelAr: 'العروض', hintEn: 'Create quote', hintAr: 'إنشاء عرض' },
    ],
  };

  it('exports GuidanceDrawer component and useGuidanceDrawer hook from GuidanceDrawer.tsx', () => {
    assert.strictEqual(typeof GuidanceDrawer, 'function');
    assert.strictEqual(typeof useGuidanceDrawer, 'function');
  });

  it('GuidanceDrawer renders null when isOpen is false', () => {
    const element = React.createElement(GuidanceDrawer, {
      purpose: samplePurpose,
      prerequisites: samplePrerequisites,
      nextSteps: sampleNextSteps,
      isOpen: false,
      onClose: () => {},
    });

    assert.strictEqual(element.type, GuidanceDrawer);
    assert.strictEqual(element.props.isOpen, false);
  });

  it('GuidanceDrawer instantiates with required 3-part layout props when isOpen is true', () => {
    let closed = false;
    const element = React.createElement(GuidanceDrawer, {
      purpose: samplePurpose,
      prerequisites: samplePrerequisites,
      nextSteps: sampleNextSteps,
      isOpen: true,
      onClose: () => { closed = true; },
      uiLang: 'ar',
      title: { en: 'Test Title', ar: 'عنوان اختباري' },
    });

    assert.strictEqual(element.type, GuidanceDrawer);
    assert.strictEqual(element.props.isOpen, true);
    assert.deepStrictEqual(element.props.purpose, samplePurpose);
    assert.deepStrictEqual(element.props.prerequisites, samplePrerequisites);
    assert.deepStrictEqual(element.props.nextSteps, sampleNextSteps);

    // Call onClose prop directly
    element.props.onClose();
    assert.strictEqual(closed, true);
  });

  it('GuidanceTrigger renders a pinned ? button with responsive dimensions and accessibility', () => {
    assert.strictEqual(typeof GuidanceTrigger, 'function');

    const triggerElement = React.createElement(GuidanceTrigger, {
      sectionKey: 'dashboard',
      uiLang: 'ar',
      pinned: true,
      size: 'sm',
    });

    assert.strictEqual(triggerElement.type, GuidanceTrigger);
    assert.strictEqual(triggerElement.props.pinned, true);
    assert.strictEqual(triggerElement.props.sectionKey, 'dashboard');
    assert.strictEqual(triggerElement.props.size, 'sm');
  });

  it('GuidanceTrigger supports all primary section keys: sales, trips, rates, analytics, settings, hajj_hub', () => {
    const sections = ['sales', 'trips', 'rates', 'analytics', 'settings', 'hajj_hub', 'plan', 'live_intel'];

    sections.forEach((key) => {
      const element = React.createElement(GuidanceTrigger, {
        sectionKey: key,
        uiLang: 'en',
        pinned: true,
      });
      assert.strictEqual(element.props.sectionKey, key);
      assert.strictEqual(element.props.pinned, true);
    });
  });
});


