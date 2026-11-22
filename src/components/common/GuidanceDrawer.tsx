import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  ArrowUpRight 
} from 'lucide-react';
import { getSectionHelpGuide, SectionHelpGuide } from '../../lib/sectionHelpRegistry';

export interface GuidancePurposeProp {
  en: string;
  ar: string;
  keyDeliverables?: {
    en: string[];
    ar: string[];
  };
}

export interface GuidancePrerequisitesProp {
  en?: string;
  ar?: string;
  summaryEn?: string;
  summaryAr?: string;
  checklist?: Array<{
    id: string;
    en: string;
    ar: string;
    required?: boolean;
  }>;
  recommendedPriorTab?: {
    tab: string;
    subTab?: string;
    labelEn: string;
    labelAr: string;
  };
}

export interface GuidanceNextStepsProp {
  en?: string;
  ar?: string;
  summaryEn?: string;
  summaryAr?: string;
  links?: Array<{
    targetTab: string;
    targetSubTab?: string;
    labelEn: string;
    labelAr: string;
    hintEn: string;
    hintAr: string;
    iconName?: string;
  }>;
}

export interface GuidanceDrawerProps {
  // Required 3-part layout props
  purpose: GuidancePurposeProp;
  prerequisites: GuidancePrerequisitesProp;
  nextSteps: GuidanceNextStepsProp;

  // Drawer control & display props
  isOpen: boolean;
  onClose: () => void;
  uiLang?: 'ar' | 'en';
  title?: { en: string; ar: string } | string;
  subtitle?: { en: string; ar: string } | string;
  badge?: { en: string; ar: string } | string;
  theme?: 'gold' | 'indigo' | 'emerald' | 'amber' | string;
  operatorTips?: { en: string[]; ar: string[] };
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

/**
 * Fixed-position overlay drawer (sliding from right)
 * Implements a clean 3-part layout:
 * 1. Operational Purpose & Key Deliverables
 * 2. Prerequisites & What to Do First Checklist
 * 3. Related Next Steps & Direct Module Shortcuts
 * Supports full bilingual content (Arabic & English) and keyboard/backdrop dismissal.
 */
export const GuidanceDrawer: React.FC<GuidanceDrawerProps> = ({
  purpose,
  prerequisites,
  nextSteps,
  isOpen,
  onClose,
  uiLang = 'ar',
  title,
  subtitle,
  badge,
  theme = 'indigo',
  operatorTips,
  onNavigateTab,
}) => {
  const isAr = uiLang === 'ar';
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isGoldTheme = theme === 'gold';

  const handleLinkClick = (tab: string, subTab?: string) => {
    onClose();
    if (onNavigateTab) {
      onNavigateTab(tab, subTab);
    }
  };

  // Resolve bilingual values
  const resolveBilingual = (val?: { en: string; ar: string } | string, fallback = ''): string => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    return isAr ? val.ar || val.en || fallback : val.en || val.ar || fallback;
  };

  const titleText = resolveBilingual(
    title, 
    isAr ? 'دليل الاستخدام التشغيلي' : 'Operational Guidance Manual'
  );

  const subtitleText = resolveBilingual(
    subtitle,
    isAr 
      ? 'إرشادات تفصيلية للهدف من هذا القسم، متطلبات البدء، والخطوات التالية'
      : 'Step-by-step guidance on purpose, prerequisites, and related next actions'
  );

  const badgeText = resolveBilingual(
    badge,
    isAr ? 'إرشادات تفاعلية' : 'Contextual Guide'
  );

  const purposeSummary = isAr ? purpose.ar : purpose.en;
  const deliverables = purpose.keyDeliverables 
    ? (isAr ? purpose.keyDeliverables.ar : purpose.keyDeliverables.en) 
    : [];

  const prereqSummary = isAr 
    ? (prerequisites.summaryAr || prerequisites.ar || '') 
    : (prerequisites.summaryEn || prerequisites.en || '');

  const nextStepSummary = isAr 
    ? (nextSteps.summaryAr || nextSteps.ar || '') 
    : (nextSteps.summaryEn || nextSteps.en || '');

  const checklistItems = prerequisites.checklist || [];
  const nextLinks = nextSteps.links || [];

  return (
    <div 
      className="fixed inset-0 z-[9999] flex justify-end" 
      role="dialog" 
      aria-modal="true"
      aria-label={titleText}
    >
      {/* Semi-transparent Backdrop with touch dismiss */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container (fixed-position sliding from right, max-w-xl on desktops, full-width on mobile) */}
      <div 
        ref={drawerRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`fixed inset-y-0 right-0 z-10 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out border-s ${
          isGoldTheme 
            ? 'border-amber-400/40 bg-gradient-to-b from-[#181411] via-[#1F1914] to-[#120F0D] text-amber-50' 
            : 'border-[#EDE0CC] bg-white text-slate-900'
        }`}
      >
        {/* Top Brand Accent Strip: Brown to Vibrant Orange */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#44200F] via-[#C2410C] to-[#F97316] shrink-0" />

        {/* Top Header with Title, Badge, and Close Button */}
        <div className={`p-4 sm:p-6 border-b flex items-start justify-between gap-3 shrink-0 ${
          isGoldTheme 
            ? 'border-amber-500/20 bg-[#14100D]/95' 
            : 'border-[#EDE0CC]/70 bg-gradient-to-b from-[#FAF7F2] to-white'
        }`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
              isGoldTheme 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-orange-50 border-orange-200 text-orange-600 shadow-2xs'
            }`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                  isGoldTheme 
                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' 
                    : 'bg-orange-50 text-orange-800 border-orange-200'
                }`}>
                  {badgeText}
                </span>
                <span className={`text-xs ${isGoldTheme ? 'text-amber-300/70' : 'text-slate-500'}`}>
                  {isAr ? 'دليل الاستخدام والارتباط' : 'Operational Guide & Flow'}
                </span>
              </div>
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight truncate ${
                isGoldTheme ? 'text-white font-serif' : 'text-slate-900'
              }`}>
                {titleText}
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${
                isGoldTheme ? 'text-amber-200/80' : 'text-slate-600'
              }`}>
                {subtitleText}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors border cursor-pointer ${
              isGoldTheme 
                ? 'border-amber-500/20 text-amber-300/70 hover:text-white hover:bg-amber-500/20 active:bg-amber-500/30' 
                : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200'
            }`}
            aria-label={isAr ? 'إغلاق الدليل' : 'Close Guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body: Clean 3-Part Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* PART 1: Purpose & Primary Operational Goal */}
          <section className={`p-4 sm:p-5 rounded-2xl border ${
            isGoldTheme 
              ? 'bg-[#221B15]/80 border-amber-500/20' 
              : 'bg-[#FAF7F2]/80 border-[#EDE0CC]'
          }`}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black shrink-0 ${
                isGoldTheme ? 'bg-amber-400 text-black' : 'bg-gradient-to-br from-[#44200F] to-[#EA580C] text-white shadow-xs'
              }`}>
                1
              </span>
              <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                isGoldTheme ? 'text-amber-300' : 'text-[#44200F]'
              }`}>
                {isAr ? 'الهدف التشغيلي ودور هذا القسم' : '1. Operational Purpose & Objective'}
              </h3>
            </div>
            
            <p className={`text-xs sm:text-sm leading-relaxed ${
              isGoldTheme ? 'text-amber-100/90' : 'text-[#44200F]/90'
            }`}>
              {purposeSummary}
            </p>

            {deliverables.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-dashed border-current/10">
                <h4 className={`text-xs font-semibold mb-2 ${
                  isGoldTheme ? 'text-amber-200' : 'text-[#795037]'
                }`}>
                  {isAr ? 'أهم المخرجات والنتائج المباشرة:' : 'Key Operational Deliverables:'}
                </h4>
                <ul className="space-y-2">
                  {deliverables.map((deliv, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isGoldTheme ? 'text-amber-400' : 'text-orange-600'
                      }`} />
                      <span className={isGoldTheme ? 'text-amber-100/80' : 'text-slate-700'}>
                        {deliv}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* PART 2: Prerequisites / Before You Start */}
          <section className={`p-4 sm:p-5 rounded-2xl border ${
            isGoldTheme 
              ? 'bg-[#251C14]/90 border-amber-500/30' 
              : 'bg-amber-50/50 border-amber-200/80'
          }`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                  isGoldTheme ? 'bg-amber-400 text-black' : 'bg-amber-600 text-white'
                }`}>
                  2
                </span>
                <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  isGoldTheme ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  {isAr ? 'المتطلبات المسبقة - ماذا تفعل أولاً؟' : '2. Prerequisites & What to Do First'}
                </h3>
              </div>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isGoldTheme ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>

            {prereqSummary && (
              <p className={`text-xs leading-relaxed mb-3.5 ${
                isGoldTheme ? 'text-amber-200/90' : 'text-amber-900/80'
              }`}>
                {prereqSummary}
              </p>
            )}

            {checklistItems.length > 0 && (
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs min-h-[48px] ${
                      isGoldTheme 
                        ? 'bg-[#18130F] border-amber-500/20 text-amber-100' 
                        : 'bg-white border-amber-200/60 text-slate-700'
                    }`}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      item.required !== false
                        ? isGoldTheme 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                        : isGoldTheme
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.required !== false 
                        ? (isAr ? 'مطلوب إلزامي' : 'Required') 
                        : (isAr ? 'اختياري' : 'Recommended')}
                    </span>
                    <span className="leading-snug">
                      {isAr ? item.ar : item.en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {prerequisites.recommendedPriorTab && (
              <div className="mt-3.5 pt-3 border-t border-dashed border-current/10 flex items-center justify-between flex-wrap gap-2">
                <span className={`text-xs ${isGoldTheme ? 'text-amber-300/80' : 'text-slate-600'}`}>
                  {isAr ? 'المرحلة السابقة الموصى بها:' : 'Recommended prior step:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleLinkClick(
                    prerequisites.recommendedPriorTab!.tab, 
                    prerequisites.recommendedPriorTab!.subTab
                  )}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isGoldTheme 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20' 
                      : 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  {isAr ? prerequisites.recommendedPriorTab.labelAr : prerequisites.recommendedPriorTab.labelEn}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* PART 3: Related Next Steps & Direct Shortcuts */}
          <section className={`p-4 sm:p-5 rounded-2xl border ${
            isGoldTheme 
              ? 'bg-[#1D1712]/90 border-amber-500/30' 
              : 'bg-emerald-50/50 border-emerald-200/80'
          }`}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                isGoldTheme ? 'bg-amber-400 text-black' : 'bg-emerald-600 text-white'
              }`}>
                3
              </span>
              <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                isGoldTheme ? 'text-amber-300' : 'text-emerald-950'
              }`}>
                {isAr ? 'الارتباطات والخطوات التالية مباشرة' : '3. Related Next Steps & Direct Shortcuts'}
              </h3>
            </div>

            {nextStepSummary && (
              <p className={`text-xs leading-relaxed mb-3.5 ${
                isGoldTheme ? 'text-amber-200/90' : 'text-emerald-900/80'
              }`}>
                {nextStepSummary}
              </p>
            )}

            {nextLinks.length > 0 && (
              <div className="space-y-2">
                {nextLinks.map((link, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLinkClick(link.targetTab, link.targetSubTab)}
                    className={`w-full text-start p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer min-h-[64px] h-[64px] ${
                      isGoldTheme 
                        ? 'bg-[#251D16] border-amber-500/30 hover:border-amber-400 hover:bg-[#2C2219] text-amber-50' 
                        : 'bg-white border-[#EDE0CC] hover:border-orange-400 hover:bg-orange-50/30 text-slate-900'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm flex-wrap">
                        <span>{isAr ? link.labelAr : link.labelEn}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal shrink-0 ${
                          isGoldTheme ? 'bg-amber-400/20 text-amber-300' : 'bg-orange-50 text-orange-700 border border-orange-200/60'
                        }`}>
                          {link.targetTab}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isGoldTheme ? 'text-amber-200/60' : 'text-slate-500'}`}>
                        {isAr ? link.hintAr : link.hintEn}
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                      isGoldTheme 
                        ? 'bg-amber-400/10 text-amber-300 group-hover:bg-amber-400 group-hover:text-black' 
                        : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
                    }`}>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* BONUS: Operator Best Practice Tips */}
          {operatorTips && (
            <section className={`p-4 rounded-xl border flex items-start gap-3 ${
              isGoldTheme 
                ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${
                isGoldTheme ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <div className="text-xs space-y-1.5 min-w-0">
                <span className="font-bold block uppercase tracking-wider text-[11px]">
                  {isAr ? 'نصيحة الخبراء للوكالة:' : 'Pro Operator Tip:'}
                </span>
                {(isAr ? operatorTips.ar : operatorTips.en).map((tip, i) => (
                  <p key={i} className="leading-relaxed opacity-90">
                    • {tip}
                  </p>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Bottom Drawer Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
          isGoldTheme 
            ? 'border-amber-500/20 bg-[#14100D] text-amber-300/70' 
            : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}>
          <span className="truncate pr-2">
            {isAr ? 'منظومة رحال · الدليل التشغيلي الميداني' : 'RIHAL Contextual Operational Manual'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-bold border transition-colors shrink-0 cursor-pointer ${
              isGoldTheme 
                ? 'bg-amber-400 text-black border-amber-400 hover:bg-amber-300 active:bg-amber-500' 
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 active:bg-black'
            }`}
          >
            {isAr ? 'فهمت، متابعة العمل' : 'Got it, Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// HOOK: useGuidanceDrawer
// Provides openGuidance(moduleKey) and closeGuidance() functions, plus
// resolved drawerProps for immediate rendering of <GuidanceDrawer {...drawerProps} />
// =========================================================================

export interface UseGuidanceDrawerOptions {
  initialKey?: string;
  uiLang?: 'ar' | 'en';
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export interface CustomGuidancePayload {
  purpose: GuidancePurposeProp;
  prerequisites: GuidancePrerequisitesProp;
  nextSteps: GuidanceNextStepsProp;
  title?: { en: string; ar: string } | string;
  subtitle?: { en: string; ar: string } | string;
  badge?: { en: string; ar: string } | string;
  theme?: 'gold' | 'indigo' | 'emerald' | 'amber' | string;
  operatorTips?: { en: string[]; ar: string[] };
}

export function useGuidanceDrawer(param?: string | UseGuidanceDrawerOptions) {
  const options: UseGuidanceDrawerOptions = useMemo(() => {
    if (typeof param === 'string') {
      return { initialKey: param };
    }
    return param || {};
  }, [param]);

  const defaultKey = options.initialKey || 'dashboard';
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>(defaultKey);
  const [customData, setCustomData] = useState<CustomGuidancePayload | null>(null);

  /**
   * Opens the guidance drawer. Accepts a module key (e.g. 'hajj_umrah', 'sales', 'trips')
   * or a custom guidance payload.
   */
  const openGuidance = useCallback((moduleKeyOrCustom?: string | CustomGuidancePayload) => {
    if (typeof moduleKeyOrCustom === 'string') {
      setActiveKey(moduleKeyOrCustom);
      setCustomData(null);
    } else if (moduleKeyOrCustom && typeof moduleKeyOrCustom === 'object') {
      setCustomData(moduleKeyOrCustom);
    }
    setIsOpen(true);
  }, []);

  /**
   * Closes the guidance drawer.
   */
  const closeGuidance = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggles the guidance drawer open or closed.
   */
  const toggleGuidance = useCallback((moduleKeyOrCustom?: string | CustomGuidancePayload) => {
    if (isOpen) {
      closeGuidance();
    } else {
      openGuidance(moduleKeyOrCustom);
    }
  }, [isOpen, closeGuidance, openGuidance]);

  // Resolve current active guide from registry/JSON or custom payload
  const activeGuide: SectionHelpGuide = useMemo(() => {
    return getSectionHelpGuide(activeKey);
  }, [activeKey]);

  // Resolved drawer props ready to be passed directly to <GuidanceDrawer {...drawerProps} />
  const drawerProps = useMemo<GuidanceDrawerProps>(() => {
    if (customData) {
      return {
        purpose: customData.purpose,
        prerequisites: customData.prerequisites,
        nextSteps: customData.nextSteps,
        title: customData.title || activeGuide.title,
        subtitle: customData.subtitle || activeGuide.subtitle,
        badge: customData.badge || activeGuide.badge,
        theme: customData.theme || activeGuide.theme,
        operatorTips: customData.operatorTips || activeGuide.operatorTips,
        isOpen,
        onClose: closeGuidance,
        uiLang: options.uiLang || 'ar',
        onNavigateTab: options.onNavigateTab
      };
    }

    return {
      purpose: activeGuide.purpose,
      prerequisites: activeGuide.prerequisites,
      nextSteps: activeGuide.nextSteps,
      title: activeGuide.title,
      subtitle: activeGuide.subtitle,
      badge: activeGuide.badge,
      theme: activeGuide.theme,
      operatorTips: activeGuide.operatorTips,
      isOpen,
      onClose: closeGuidance,
      uiLang: options.uiLang || 'ar',
      onNavigateTab: options.onNavigateTab
    };
  }, [customData, activeGuide, isOpen, closeGuidance, options.uiLang, options.onNavigateTab]);

  const isAr = (options.uiLang || 'ar') === 'ar';
  const tooltip = isAr 
    ? `دليل استخدام القسم (${activeGuide.title.ar})` 
    : `Section Guidance (${activeGuide.title.en})`;

  const triggerProps = useMemo(() => ({
    onClick: () => toggleGuidance(),
    'aria-label': tooltip,
    title: tooltip,
    type: 'button' as const,
  }), [toggleGuidance, tooltip]);

  return {
    isOpen,
    activeKey,
    activeModuleKey: activeKey,
    activeGuide,
    drawerProps,
    openGuidance,
    closeGuidance,
    toggleGuidance,
    triggerProps
  };
}
