import React, { useState } from 'react';
import {
  CreditCard, Check, Shield, Zap, Building2, Sparkles, 
  ArrowRight, CheckCircle2, Lock, Layers, HelpCircle, 
  Clock, PhoneCall, FileText, BadgeCheck, MessageSquare, 
  Download, Send, X, ExternalLink, Landmark
} from 'lucide-react';
import { Workspace, UILanguage } from '../types';
import { GuidanceTrigger } from './common/GuidanceTrigger';

interface SubscriptionPlanViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onUpdateWorkspace?: (updates: Partial<Workspace>) => void;
}

export const SubscriptionPlanView: React.FC<SubscriptionPlanViewProps> = ({
  workspace,
  uiLang,
}) => {
  const isAr = uiLang === 'ar';
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('Professional Inbound');
  const [billingContactName, setBillingContactName] = useState(workspace.name || '');
  const [billingEmail, setBillingEmail] = useState(workspace.contactEmail || '');
  const [invoiceRequested, setInvoiceRequested] = useState(false);

  const PLANS = [
    {
      id: 'starter',
      nameEn: 'Starter DMC',
      nameAr: 'باقة الشركات الناشئة',
      priceUsd: 79,
      priceEgp: 3850,
      periodEn: '/month',
      periodAr: '/شهرياً',
      descEn: 'Essential proposal generator and local rate calculation for emerging tour operators.',
      descAr: 'صانع العروض السريعة ومكتبة الأسعار المحلية للشركات والوكالات الصاعدة.',
      featuresEn: [
        'Up to 30 proposals / month',
        'Egypt Local Rate Library & Tariffs',
        'Interactive Proposal Viewer (AR / EN)',
        'Basic Operations Radar & Rooming',
        'Email Support & Standard Backups',
      ],
      featuresAr: [
        'حتى ٣٠ عرض أسعار شهرياً',
        'مكتبة الأسعار والتعريفات المحلية لمصر',
        'عروض أسعار تفاعلية فاخرة (عربي وإنجليزي)',
        'رادار متابعة الرحلات وقوائم الغرف الأساسية',
        'دعم فني عبر البريد الإلكتروني',
      ],
      popular: false,
    },
    {
      id: 'pro',
      nameEn: 'Professional Inbound',
      nameAr: 'باقة المشغل المتكامل (الأكثر طلباً)',
      priceUsd: 199,
      priceEgp: 9750,
      periodEn: '/month',
      periodAr: '/شهرياً',
      descEn: 'Full-suite operational cockpit for Egyptian incoming tour operators and DMCs.',
      descAr: 'منظومة التشغيل المتكاملة لشركات تنظيم الرحلات وإدارة المقاصد السياحية في مصر.',
      featuresEn: [
        'Unlimited quotes & proposals',
        'Full 16 Operational Modules & Vouchers',
        'Multi-currency FX with auto safety buffer',
        'Fleet Movement & Chauffeur Run Sheets',
        'Egyptologist Tour Guides Roster',
        'Hajj & Umrah Pilgrimage Module',
        'Priority 24/7 WhatsApp Operations Support',
      ],
      featuresAr: [
        'عروض أسعار واستفسارات غير محدودة',
        'جميع أقسام المنظومة الـ ١٦ وقسائم التشغيل',
        'محرك التسعير متعدد العملات مع هامش الأمان',
        'إدارة حركة الأسطول وتوجيه السائقين',
        'سجل المرشدين السياحيين المعتمدين',
        'وحدة تنظيم الحج والعمرة والزيارات',
        'دعم فني ذو أولوية عبر واتساب على مدار الساعة',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      nameEn: 'Enterprise Fleet & Multi-branch',
      nameAr: 'باقة كبرى المجموعات والأسطول',
      priceUsd: 399,
      priceEgp: 19500,
      periodEn: '/month',
      periodAr: '/شهرياً',
      descEn: 'Customized deployments with multi-branch management and direct API sync.',
      descAr: 'حلول مخصصة للشركات ذات الفروع المتعددة وأساطيل الحافلات الكبرى.',
      featuresEn: [
        'Multi-Branch & Multi-Tenant Workspaces',
        'Dedicated Cloud Database & Storage',
        'Custom Domain & Custom White-Label',
        'ERP & Accounting System Webhooks',
        'Dedicated Account Manager in Cairo/Luxor',
        'Custom Staff Training & Onboarding Workshop',
      ],
      featuresAr: [
        'إدارة فروع متعددة ومساحات عمل مستقلة',
        'قاعدة بيانات سحابية وتخزين مخصص',
        'نطاق مخصص وهوية بصرية كاملة (White-Label)',
        'ربط برمجي مع الأنظمة المحاسبية (ERP Webhooks)',
        'مدير حسابات مخصص بالقاهرة والأقصر',
        'ورش عمل وتدريب مباشر لفريق العمل',
      ],
      popular: false,
    },
  ];

  const handleInvoiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceRequested(true);
  };

  const cleanWhatsApp = (workspace.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');
  const salesWaUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    isAr 
      ? `مرحباً فريق مبيعات ريحال، أود تفعيل اشتراك (${selectedPlan}) لشركة ${workspace.arabicName || workspace.name}. يرجى إرسال الفاتورة الضريبية وتفاصيل السداد البنكي.`
      : `Hello RIHAL Enterprise Sales, we wish to activate the (${selectedPlan}) subscription for ${workspace.name}. Please provide the corporate tax e-invoice and bank wire instructions.`
  )}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-white to-orange-50/50 text-slate-900 border border-amber-200/80 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <GuidanceTrigger
          sectionKey="plan"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل الباقات' : 'Plans Guide'}
        />
        <div className="space-y-2 ltr:pr-14 rtl:pl-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200">
            <BadgeCheck className="w-4 h-4 text-amber-700" />
            <span>{isAr ? 'خطط وباقات منظومة ريحال للمشغلين' : 'RIHAL Workspace Plans & Subscription Tiers'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isAr ? 'خطط وباقات اشتراك منظومة ريحال (RIHAL)' : 'RIHAL Operating Plans & Tiers'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            {isAr 
              ? 'اختر الخطة المناسبة لحجم أعمال شركتك. تفعيل فوري مع فواتير ضريبية إلكترونية معتمدة وسداد عبر التحويلات البنكية الرسمية.'
              : 'Choose the plan tailored to your agency size. Instant activation with verified corporate tax e-invoices and official wire transfer options.'}
          </p>
        </div>


        <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-200/80 text-xs space-y-1.5 shrink-0">
          <span className="text-slate-500 block text-[11px]">{isAr ? 'مساحة العمل الحالية:' : 'Current Workspace:'}</span>
          <span className="font-bold text-slate-900 block text-sm">{workspace.name}</span>
          <span className="text-amber-800 font-bold text-[11px] block">
            {isAr ? 'حساب تشغيل نشط' : 'Active Operations Account'}
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div 
            key={plan.id}
            className={`bg-white rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all duration-300 ${
              plan.popular 
                ? 'border-[#C4A177] shadow-xl ring-2 ring-[#C4A177]/30' 
                : 'border-[#EDE0CC] shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              {plan.popular && (
                <div className="w-max px-3.5 py-1 bg-[#C4A177] text-[#44200F] rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
                  {isAr ? 'الأكثر طلباً للشركات' : 'Most Popular DMC Tier'}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-lg text-[#44200F]">{isAr ? plan.nameAr : plan.nameEn}</h3>
                <p className="text-xs text-[#795037] mt-1 min-h-[36px]">{isAr ? plan.descAr : plan.descEn}</p>
              </div>

              {/* Price */}
              <div className="pt-2 border-t border-[#EDE0CC]">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#44200F] font-mono">${plan.priceUsd}</span>
                  <span className="text-xs text-slate-400 font-medium">{isAr ? plan.periodAr : plan.periodEn}</span>
                </div>
                <div className="text-xs text-[#795037] font-mono mt-0.5">
                  ({plan.priceEgp.toLocaleString()} {isAr ? 'جنيه مصري / شهر' : 'EGP / month'})
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-3">
                <span className="text-[11px] font-bold text-[#795037] uppercase tracking-wider block">
                  {isAr ? 'الميزات المتضمنة:' : 'Included Capabilities:'}
                </span>
                {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-[#EDE0CC] space-y-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(isAr ? plan.nameAr : plan.nameEn);
                  setInvoiceModalOpen(true);
                  setInvoiceRequested(false);
                }}
                className={`w-full py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                  plan.popular
                    ? 'bg-[#44200F] hover:bg-[#321609] text-[#C4A177]'
                    : 'bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{isAr ? 'طلب فاتورة ضريبية وسداد' : 'Request E-Invoice'}</span>
              </button>

              <a
                href={salesWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isAr ? 'استفسار مبيعات الشركات' : 'Contact Sales on WhatsApp'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Official Corporate Bank Wire Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE0CC] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5 text-[#44200F]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isAr ? 'بيانات التحويل البنكي المؤسسي المباشر' : 'Official Corporate Wire Transfer Details'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'يمكن للشركات والجهات السياحية سداد الاشتراكات عبر الحسابات البنكية المعتمدة' : 'Corporate accounts can settle via official Egyptian bank wire transfers'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{isAr ? 'البنك التجاري الدولي (CIB مصر)' : 'Commercial International Bank (CIB Egypt)'}</span>
              <span className="text-[11px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">USD / EGP</span>
            </div>
            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
              <div><span className="text-slate-400 font-sans">{isAr ? 'اسم الحساب:' : 'Account:'}</span> RIHAL Tourism Platform SAE</div>
              <div><span className="text-slate-400 font-sans">{isAr ? 'رقم الحساب:' : 'Acc No:'}</span> 1000-4829-1920-01</div>
              <div><span className="text-slate-400 font-sans">IBAN:</span> EG380010000482919200100000000</div>
              <div><span className="text-slate-400 font-sans">SWIFT:</span> CIBEEGCX</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{isAr ? 'بنك مصر (Banque Misr)' : 'Banque Misr'}</span>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">EGP Official</span>
            </div>
            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
              <div><span className="text-slate-400 font-sans">{isAr ? 'اسم الحساب:' : 'Account:'}</span> شركة ريحال لتكنولوجيا السياحة ش.م.م</div>
              <div><span className="text-slate-400 font-sans">{isAr ? 'رقم الحساب:' : 'Acc No:'}</span> 248-001-9481029</div>
              <div><span className="text-slate-400 font-sans">IBAN:</span> EG590002024800194810290000000</div>
              <div><span className="text-slate-400 font-sans">SWIFT:</span> BMISEGCA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate E-Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isAr ? 'طلب إصدار فاتورة ضريبية رسمية' : 'Request Corporate Tax E-Invoice'}
                </h3>
                <span className="text-xs text-[#C4A177] font-semibold">{selectedPlan}</span>
              </div>
              <button onClick={() => setInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {invoiceRequested ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {isAr ? 'تم استلام طلب الفاتورة بنجاح' : 'Invoice Request Registered'}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {isAr 
                    ? `سيقوم القسم المالي بإرسال الفاتورة الإلكترونية المعتمدة إلى بريدكم (${billingEmail}) مع رابط تأكيد التفعيل الفوري.`
                    : `Our finance desk will issue the official e-invoice to (${billingEmail}) with instant activation confirmation.`}
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={salesWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isAr ? 'إرسال إشعار فوري عبر واتساب' : 'Notify Sales via WhatsApp'}</span>
                  </a>
                  <button
                    onClick={() => setInvoiceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvoiceRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'اسم الشركة' : 'Company Name'} *</label>
                  <input
                    type="text"
                    required
                    value={billingContactName}
                    onChange={e => setBillingContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني للفواتير' : 'Billing Email Address'} *</label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={e => setBillingEmail(e.target.value)}
                    placeholder="accounts@agency.eg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إصدار الفاتورة' : 'Generate Invoice'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
