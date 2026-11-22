import React, { useState } from 'react';
import { 
  Building2, Users, Layers, Globe, Check, 
  ArrowRight, X, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Workspace, Rate, UILanguage } from '../../types';

interface PostOnboardingChecklistProps {
  workspace: Workspace;
  rates?: Rate[];
  uiLang: UILanguage;
  onNavigateTab: (tab: string, subTab?: string) => void;
}

export const PostOnboardingChecklist: React.FC<PostOnboardingChecklistProps> = ({
  workspace,
  rates = [],
  uiLang,
  onNavigateTab,
}) => {
  const isAr = uiLang === 'ar';

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rihal_setup_checklist_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('rihal_setup_checklist_dismissed', 'true');
    } catch {}
  };

  if (isDismissed) return null;

  // Real state-driven checks (Arabic company name is optional):
  const isProfileDone = Boolean(workspace.name && (workspace.contactEmail || workspace.whatsappNumber || workspace.contactPhone));
  const isTeamDone = false; // can be checked against users or invitations if provided
  const isRatesDone = rates.length > 0;
  const isPublicProfileDone = Boolean(workspace.logoUrl || workspace.coverImageUrl || workspace.description);

  const items = [
    {
      id: 'profile',
      titleEn: 'Company Profile',
      titleAr: 'الملف التعريفي للشركة',
      descEn: 'Trading name, operations email, phone and bio',
      descAr: 'الاسم التجاري، بريد العمليات، الهاتف، والنبذة',
      isCompleted: isProfileDone,
      icon: Building2,
      action: () => onNavigateTab('settings', 'agency'),
    },
    {
      id: 'team',
      titleEn: 'Invite Team',
      titleAr: 'دعوة فريق العمل',
      descEn: 'Sales agents, operations staff, and accounts',
      descAr: 'مسؤولي المبيعات، منسقي الحركة، والحسابات',
      isCompleted: isTeamDone,
      icon: Users,
      action: () => onNavigateTab('settings', 'team'),
    },
    {
      id: 'rates',
      titleEn: 'Add Rates',
      titleAr: 'إضافة مكتبة الأسعار',
      descEn: 'Contracted rates for hotels, cruises, and transport',
      descAr: 'عقود وأسعار الفنادق، الكروزات، والنقل',
      isCompleted: isRatesDone,
      icon: Layers,
      action: () => onNavigateTab('library', 'rates'),
    },
    {
      id: 'public_profile',
      titleEn: 'Publish Public Profile',
      titleAr: 'نشر الصفحة التعريفية',
      descEn: 'Showcase your company on the RIHAL directory',
      descAr: 'عرض شركتكم في دليل وكالات رحال السياحية',
      isCompleted: isPublicProfileDone,
      icon: Globe,
      action: () => onNavigateTab('agency_showcase'),
    },
  ];

  const completedCount = items.filter(i => i.isCompleted).length;

  return (
    <div 
      className="bg-white rounded-2xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 mb-4 transition-all"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shadow-2xs border border-amber-200/80 shrink-0">
            <Sparkles className="w-4 h-4 text-[#C4A177]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-[#44200F]">
              {isAr ? 'قائمة إعداد مساحة العمل المبدئية' : 'Workspace Launch Checklist'}
            </h4>
            <p className="text-[11px] text-[#795037]">
              {isAr 
                ? `${completedCount} من 4 مكتملة · يمكنك إكمالها بالترتيب المناسب لك`
                : `${completedCount} of 4 complete · Set up your workspace at your own pace`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title={isAr ? 'إخفاء هذه القائمة' : 'Dismiss checklist'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`p-3 sm:p-3.5 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-3 group min-h-[72px] h-[72px] w-full ${
                item.isCompleted 
                  ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50' 
                  : 'bg-[#FAF7F2]/60 border-[#EDE0CC] hover:bg-white hover:border-[#C4A177]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                item.isCompleted ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-[#EDE0CC]'
              }`}>
                {item.isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4 text-[#795037]" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#44200F] truncate group-hover:text-[#795037]">
                    {isAr ? item.titleAr : item.titleEn}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#44200F] transition-transform shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-[11px] text-[#795037] truncate mt-0.5">
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
