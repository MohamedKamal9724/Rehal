import React from 'react';
import { SectionHelpGuide } from '../../lib/sectionHelpRegistry';
import { GuidanceDrawer } from './GuidanceDrawer';

export interface SectionHelpDrawerProps {
  guide: SectionHelpGuide;
  isOpen: boolean;
  onClose: () => void;
  uiLang: 'ar' | 'en';
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export const SectionHelpDrawer: React.FC<SectionHelpDrawerProps> = ({
  guide,
  isOpen,
  onClose,
  uiLang,
  onNavigateTab
}) => {
  return (
    <GuidanceDrawer
      purpose={guide.purpose}
      prerequisites={guide.prerequisites}
      nextSteps={guide.nextSteps}
      isOpen={isOpen}
      onClose={onClose}
      uiLang={uiLang}
      title={guide.title}
      subtitle={guide.subtitle}
      badge={guide.badge}
      theme={guide.theme}
      operatorTips={guide.operatorTips}
      onNavigateTab={onNavigateTab}
    />
  );
};
