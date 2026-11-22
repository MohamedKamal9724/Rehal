import rawGuidanceData from '../data/guidanceContent.json';

export interface PrerequisiteItem {
  id: string;
  en: string;
  ar: string;
  required: boolean;
}

export interface NextStepLink {
  targetTab: string;
  targetSubTab?: string;
  labelEn: string;
  labelAr: string;
  hintEn: string;
  hintAr: string;
  iconName?: string;
}

export interface SectionHelpGuide {
  id: string;
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  badge: { en: string; ar: string };
  theme: 'gold' | 'indigo' | 'emerald' | 'amber';
  
  // PART 1: Purpose
  purpose: {
    en: string;
    ar: string;
    keyDeliverables: { en: string[]; ar: string[] };
  };

  // PART 2: Prerequisites (What must be done first)
  prerequisites: {
    summaryEn: string;
    summaryAr: string;
    checklist: PrerequisiteItem[];
    recommendedPriorTab?: {
      tab: string;
      subTab?: string;
      labelEn: string;
      labelAr: string;
    };
  };

  // PART 3: Related Next Steps & Direct Shortcuts
  nextSteps: {
    summaryEn: string;
    summaryAr: string;
    links: NextStepLink[];
  };

  // Bonus Pro-Tips for agency staff
  operatorTips?: { en: string[]; ar: string[] };
}

// Convert JSON dictionary into typed SectionHelpGuide map
export const SECTION_HELP_REGISTRY: Record<string, SectionHelpGuide> = Object.entries(rawGuidanceData).reduce(
  (acc, [key, val]: [string, any]) => {
    acc[key] = {
      id: val.id || key,
      title: typeof val.title === 'string' ? { en: val.title, ar: val.title } : val.title,
      subtitle: typeof val.subtitle === 'string' ? { en: val.subtitle, ar: val.subtitle } : val.subtitle,
      badge: typeof val.badge === 'string' ? { en: val.badge, ar: val.badge } : val.badge,
      theme: (val.theme as 'gold' | 'indigo' | 'emerald' | 'amber') || 'indigo',
      purpose: {
        en: val.purpose?.en || '',
        ar: val.purpose?.ar || '',
        keyDeliverables: {
          en: val.purpose?.keyDeliverables?.en || [],
          ar: val.purpose?.keyDeliverables?.ar || []
        }
      },
      prerequisites: {
        summaryEn: val.prerequisites?.summaryEn || val.prerequisites?.en || '',
        summaryAr: val.prerequisites?.summaryAr || val.prerequisites?.ar || '',
        checklist: (val.prerequisites?.checklist || []).map((c: any) => ({
          id: c.id || '',
          en: c.en || '',
          ar: c.ar || '',
          required: c.required !== false
        })),
        recommendedPriorTab: val.prerequisites?.recommendedPriorTab
      },
      nextSteps: {
        summaryEn: val.nextSteps?.summaryEn || val.nextSteps?.en || '',
        summaryAr: val.nextSteps?.summaryAr || val.nextSteps?.ar || '',
        links: (val.nextSteps?.links || []).map((l: any) => ({
          targetTab: l.targetTab || '',
          targetSubTab: l.targetSubTab,
          labelEn: l.labelEn || '',
          labelAr: l.labelAr || '',
          hintEn: l.hintEn || '',
          hintAr: l.hintAr || '',
          iconName: l.iconName
        }))
      },
      operatorTips: val.operatorTips ? {
        en: val.operatorTips.en || [],
        ar: val.operatorTips.ar || []
      } : undefined
    };
    return acc;
  },
  {} as Record<string, SectionHelpGuide>
);

/**
 * Helper to retrieve guide for a given section or sub-tab.
 * Fallbacks to a safe default if unknown key.
 */
export function getSectionHelpGuide(sectionKey: string): SectionHelpGuide {
  return (
    SECTION_HELP_REGISTRY[sectionKey] ||
    (sectionKey.startsWith('hajj') ? SECTION_HELP_REGISTRY.hajj_umrah || SECTION_HELP_REGISTRY.hajj_hub : null) ||
    (sectionKey.startsWith('sales') ? SECTION_HELP_REGISTRY.sales : null) ||
    (sectionKey.startsWith('trip') ? SECTION_HELP_REGISTRY.trips : null) ||
    SECTION_HELP_REGISTRY.dashboard
  );
}
