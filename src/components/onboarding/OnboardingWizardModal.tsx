import React from 'react';
import { Workspace } from '../../types';

interface OnboardingWizardModalProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkspace: (updated: Partial<Workspace>) => void;
  onLaunchFirstQuote: () => void;
  onOpenCanonicalOnboarding?: () => void;
}

/**
 * @deprecated RETIRED: OnboardingWizardModal is retired in favor of the single canonical full-page CompanyOnboardingWizard.
 * If opened, it delegates to onOpenCanonicalOnboarding or triggers onLaunchFirstQuote.
 */
export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onOpenCanonicalOnboarding,
  onLaunchFirstQuote,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl border border-slate-200">
        <h3 className="text-lg font-black text-[#44200F]">
          إعداد مساحة عمل رحال
        </h3>
        <p className="text-xs text-slate-600">
          تم توحيد تجربة إعداد الشركة في رحلة كاملة واحدة ومبسطة ترشدك خطوة بخطوة لبدء عملك بدون تعقيدات.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenCanonicalOnboarding) {
                onOpenCanonicalOnboarding();
              } else {
                onLaunchFirstQuote();
              }
            }}
            className="px-4 py-2 bg-[#44200F] text-white rounded-xl text-xs font-bold hover:bg-[#32170a]"
          >
            فتح الإعداد الكامل
          </button>
        </div>
      </div>
    </div>
  );
};
