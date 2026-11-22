import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, ArrowRight, X, Sparkles, Building2 } from 'lucide-react';
import { Workspace, Rate, Supplier, UILanguage } from '../../types';
import { auditWorkspaceReadiness } from '../../lib/readiness';
import { MissingFieldsModal } from './MissingFieldsModal';

export interface CompanyReadinessBannerProps {
  workspace: Workspace;
  rates?: Rate[];
  suppliers?: Supplier[];
  onSaveWorkspace: (updated: Partial<Workspace>) => void;
  onActivateStarterRates?: () => void;
  onNavigateToSettings?: () => void;
  uiLang?: UILanguage;
  className?: string;
}

export const CompanyReadinessBanner: React.FC<CompanyReadinessBannerProps> = ({
  workspace,
  rates = [],
  suppliers = [],
  onSaveWorkspace,
  onActivateStarterRates,
  onNavigateToSettings,
  uiLang = 'ar',
  className = '',
}) => {
  const isAr = uiLang === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [isDismissedSession, setIsDismissedSession] = useState(false);

  const report = auditWorkspaceReadiness(workspace, rates, suppliers);

  // If 100% complete, hide the banner
  if (report.isReady || report.missingFields.length === 0) {
    return null;
  }

  // Handler for Review Missing Fields
  const handleReviewFields = () => {
    // Open the missing fields modal which provides immediate editing AND direct navigation to full settings
    setModalOpen(true);
  };

  // If operator minimized or dismissed the reminder for the current session
  if (isDismissedSession) {
    return (
      <div 
        className="bg-[#FAF7F2] border-b border-[#EDE0CC] px-4 py-2 flex items-center justify-between text-xs text-[#44200F] print:hidden shadow-2xs"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-[#C4A177]" />
          <span className="font-bold">
            {isAr ? `الملف التعريفي للشركة: ${report.completionScore}% مكتمل` : `Company profile ${report.completionScore}% complete`}
          </span>
          <span className="text-[11px] text-[#795037]">
            ({isAr ? `${report.missingFields.length} حقول متبقية` : `${report.missingFields.length} fields remaining`})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReviewFields}
            className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] underline cursor-pointer"
          >
            {isAr ? 'مراجعة الحقول الناقصة ←' : 'Review Missing Fields →'}
          </button>
        </div>
        <MissingFieldsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          workspace={workspace}
          rates={rates}
          suppliers={suppliers}
          onSaveWorkspace={onSaveWorkspace}
          onActivateStarterRates={onActivateStarterRates}
          onNavigateToSettings={onNavigateToSettings}
          uiLang={uiLang}
        />
      </div>
    );
  }

  return (
    <>
      <div 
        role="alert" 
        dir={isAr ? 'rtl' : 'ltr'}
        className={`bg-[#44200F] text-[#FAF7F2] border-b border-[#C4A177]/40 px-4 sm:px-6 py-3 shadow-sm relative z-30 print:hidden ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Readiness Details & Progress */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#44200F] flex items-center justify-center shrink-0 shadow-xs border border-[#EDE0CC]">
              <Building2 className="w-4 h-4 text-[#C4A177]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#C4A177] tracking-wide uppercase">
                  {isAr ? 'جاهزية بيانات الشركة' : 'Company Profile Readiness'}
                </span>
                <span className="text-[11px] font-mono font-bold bg-[#FAF7F2]/10 text-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#C4A177]/40">
                  {report.completionScore}% {isAr ? 'مكتمل' : 'Complete'}
                </span>
              </div>
              <p className="text-xs text-[#EDE0CC] mt-0.5 leading-snug">
                {isAr
                  ? `يُرجى استكمال بيانات التواصل والملف التعريفي (${report.missingFields.map(f => f.labelAr).join('، ')}) لضمان ظهور بياناتك بدقة في عروض الأسعار والاتفاقيات.`
                  : `Please complete missing company coordinates (${report.missingFields.map(f => f.label).join(', ')}) for clean proposal headers and vouchers.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={handleReviewFields}
              className="px-4 py-2 bg-[#C4A177] hover:bg-[#b58f62] text-[#44200F] font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>{isAr ? `مراجعة الحقول الناقصة (${report.missingFields.length})` : `Review Missing Fields (${report.missingFields.length})`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsDismissedSession(true)}
              className="p-1.5 text-[#EDE0CC] hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title={isAr ? 'إخفاء التنبيه مؤقتاً' : 'Minimize banner'}
              aria-label={isAr ? 'إخفاء التنبيه مؤقتاً' : 'Minimize readiness reminder'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Modal */}
      <MissingFieldsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        workspace={workspace}
        rates={rates}
        suppliers={suppliers}
        onSaveWorkspace={onSaveWorkspace}
        onActivateStarterRates={onActivateStarterRates}
        onNavigateToSettings={onNavigateToSettings}
        uiLang={uiLang}
      />
    </>
  );
};
