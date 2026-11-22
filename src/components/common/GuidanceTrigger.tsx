import React from 'react';
import { getSectionHelpGuide, SectionHelpGuide } from '../../lib/sectionHelpRegistry';
import { GuidanceDrawer, GuidanceDrawerProps, useGuidanceDrawer } from './GuidanceDrawer';

export interface GuidanceTriggerProps {
  sectionKey?: string;
  customGuide?: Partial<GuidanceDrawerProps>;
  uiLang: 'ar' | 'en';
  variant?: 'gold' | 'default' | 'subtle';
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  showLabelOnMobile?: boolean;
  pinned?: boolean;
}

export const GuidanceTrigger: React.FC<GuidanceTriggerProps> = ({
  sectionKey = 'dashboard',
  customGuide,
  uiLang,
  variant = 'default',
  size = 'md',
  label,
  className = '',
  onNavigateTab,
  showLabelOnMobile = false,
  pinned = false,
}) => {
  // Directly trigger and bind to useGuidanceDrawer hook
  const { isOpen, openGuidance, closeGuidance, drawerProps } = useGuidanceDrawer({
    initialKey: sectionKey,
    uiLang,
    onNavigateTab,
  });

  const isAr = uiLang === 'ar';
  const guide: SectionHelpGuide = getSectionHelpGuide(sectionKey);

  const isGold = variant === 'gold' || guide.theme === 'gold';
  const isSubtle = variant === 'subtle';

  const tooltipText = isAr 
    ? (label ? `${label} (${guide.title.ar})` : `كيف يعمل هذا القسم؟ (${guide.title.ar})`)
    : (label ? `${label} (${guide.title.en})` : `How does this section work? (${guide.title.en})`);

  // When pinned, always keep the trigger as a compact circular button to prevent horizontal overlap with header text
  // When unpinned (inline in headers or toolbars), can expand to show label
  const dimensionStyles = pinned
    ? (size === 'sm'
        ? 'w-8 h-8 min-w-[32px] min-h-[32px] text-xs'
        : 'w-8.5 h-8.5 sm:w-9 sm:h-9 min-w-[34px] min-h-[34px] text-xs sm:text-sm')
    : (size === 'sm'
        ? (label && !showLabelOnMobile
            ? 'h-8 px-2.5 text-xs' 
            : label && showLabelOnMobile
              ? 'h-8 px-2 text-xs'
              : 'w-8 h-8 min-w-[32px] min-h-[32px] text-xs')
        : (label && !showLabelOnMobile
            ? 'h-9 px-3 text-xs sm:text-sm'
            : label && showLabelOnMobile
              ? 'h-9 px-2.5 text-xs sm:text-sm'
              : 'w-9 h-9 min-w-[36px] min-h-[36px] text-xs sm:text-sm'));

  // Warm vibrant orange & terracotta palette alongside primary luxury brown & gold
  const colorStyles = isGold
    ? 'border-amber-400/50 text-amber-300 hover:text-white hover:bg-amber-500/25 bg-[#1e1712]/95 shadow-xs shadow-amber-950/40 active:border-amber-400'
    : isSubtle
      ? 'border-[#EDE0CC] text-[#795037] hover:text-[#44200F] hover:bg-orange-50/80 bg-white shadow-2xs active:border-orange-300'
      : 'border-orange-300/90 text-orange-700 hover:text-white hover:bg-orange-600 bg-gradient-to-br from-orange-50 to-amber-50/60 shadow-2xs active:border-orange-500';

  // In Arabic (RTL), text starts on the right, so the help icon MUST be on the left (left-3.5 sm:left-4.5) to avoid overlapping text!
  // In English (LTR), text starts on the left, so the help icon is on the right (right-3.5 sm:right-4.5).
  const pinnedPosition = isAr
    ? 'left-3.5 sm:left-4.5 right-auto'
    : 'right-3.5 sm:right-4.5 left-auto';

  const pinnedStyles = pinned 
    ? `absolute top-3.5 sm:top-4 z-20 ${pinnedPosition} rtl:left-3.5 rtl:right-auto ltr:right-3.5 ltr:left-auto` 
    : '';

  return (
    <>
      <button
        type="button"
        onClick={() => openGuidance(sectionKey)}
        title={tooltipText}
        aria-label={tooltipText}
        className={`inline-flex items-center justify-center rounded-full border shrink-0 transition-all duration-150 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-offset-1 select-none cursor-pointer ${
          isGold ? 'focus:ring-amber-400' : 'focus:ring-orange-500'
        } ${dimensionStyles} ${colorStyles} ${pinnedStyles} ${className}`}
      >
        <span className="font-black text-xs sm:text-sm leading-none shrink-0 group-hover:rotate-6 transition-transform">
          ?
        </span>
        {!pinned && label && (
          <span className={`font-bold text-[11px] sm:text-xs truncate ${
            showLabelOnMobile ? 'inline-block ms-1' : 'hidden sm:inline-block ms-1.5'
          } ${isGold ? 'text-amber-200' : 'text-orange-900'}`}>
            {label}
          </span>
        )}
      </button>

      {/* Slide-over Drawer with 3-part layout */}
      <GuidanceDrawer
        {...drawerProps}
        purpose={customGuide?.purpose || drawerProps.purpose}
        prerequisites={customGuide?.prerequisites || drawerProps.prerequisites}
        nextSteps={customGuide?.nextSteps || drawerProps.nextSteps}
        isOpen={isOpen}
        onClose={closeGuidance}
        uiLang={uiLang}
        title={customGuide?.title || drawerProps.title}
        subtitle={customGuide?.subtitle || drawerProps.subtitle}
        badge={customGuide?.badge || drawerProps.badge}
        theme={customGuide?.theme || drawerProps.theme}
        operatorTips={customGuide?.operatorTips || drawerProps.operatorTips}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
};

// Also export SectionHelpTrigger for seamless backward compatibility
export const SectionHelpTrigger = GuidanceTrigger;

