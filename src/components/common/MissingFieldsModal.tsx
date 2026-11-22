import React, { useState, useEffect } from 'react';
import { 
  Building2, Phone, Mail, MapPin, FileText, 
  Check, ArrowRight, X, Sparkles, Settings, ExternalLink,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { Workspace, Rate, Supplier, UILanguage } from '../../types';
import { auditWorkspaceReadiness } from '../../lib/readiness';

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  rates?: Rate[];
  suppliers?: Supplier[];
  onSaveWorkspace: (updated: Partial<Workspace>) => void;
  onActivateStarterRates?: () => void;
  onNavigateToSettings?: () => void;
  uiLang?: UILanguage;
}

export const MissingFieldsModal: React.FC<MissingFieldsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  rates = [],
  suppliers = [],
  onSaveWorkspace,
  onNavigateToSettings,
  uiLang = 'ar',
}) => {
  const isAr = uiLang === 'ar';

  const [name, setName] = useState(workspace.name || '');
  const [arabicName, setArabicName] = useState(workspace.arabicName || '');
  const [email, setEmail] = useState(workspace.contactEmail || '');
  const [whatsapp, setWhatsapp] = useState(workspace.whatsappNumber || '');
  const [phone, setPhone] = useState(workspace.contactPhone || '');
  const [address, setAddress] = useState(workspace.address || '');
  const [description, setDescription] = useState(workspace.description || '');

  // Keep state synced with incoming workspace
  useEffect(() => {
    setName(workspace.name || '');
    setArabicName(workspace.arabicName || '');
    setEmail(workspace.contactEmail || '');
    setWhatsapp(workspace.whatsappNumber || '');
    setPhone(workspace.contactPhone || '');
    setAddress(workspace.address || '');
    setDescription(workspace.description || '');
  }, [workspace]);

  if (!isOpen) return null;

  const report = auditWorkspaceReadiness(workspace, rates, suppliers);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWorkspace({
      name: name.trim(),
      arabicName: arabicName.trim(),
      contactEmail: email.trim(),
      whatsappNumber: whatsapp.trim(),
      contactPhone: phone.trim(),
      address: address.trim(),
      description: description.trim(),
    });
    onClose();
  };

  const handleOpenFullSettings = () => {
    onClose();
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#44200F]/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-[#EDE0CC] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-6 bg-[#FAF7F2] border-b border-[#EDE0CC] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#44200F] text-[#C4A177] flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-base text-[#44200F]">
                  {isAr ? 'استكمال بيانات الملف التعريفي للشركة' : 'Complete Company Profile Information'}
                </h3>
                <p className="text-xs text-[#795037]">
                  {isAr 
                    ? `نسبة اكتمال الملف: ${report.completionScore}% (${report.missingFields.length} حقول متبقية)` 
                    : `Profile completion: ${report.completionScore}% (${report.missingFields.length} fields remaining)`}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#44200F] hover:bg-white rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Progress bar */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] space-y-2">
            <div className="flex items-center justify-between font-bold text-[#44200F]">
              <span>{isAr ? 'مؤشر جاهزية بيانات الشركة' : 'Company Data Readiness'}</span>
              <span className="font-mono text-sm">{report.completionScore}%</span>
            </div>
            <div className="w-full bg-[#EDE0CC] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#44200F] h-full transition-all duration-300"
                style={{ width: `${report.completionScore}%` }}
              />
            </div>
            <p className="text-[11px] text-[#795037] leading-relaxed">
              {isAr 
                ? 'الحقول المطلوبة هي البيانات التشغيلية الأساسية (اسم الشركة، البريد، الواتساب، الهاتف، والعنوان) للتواصل المباشر مع المسافرين والشركاء.'
                : 'Required fields are standard operational coordinates (company name, email, WhatsApp, phone, and office address) for client communications.'}
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'اسم الشركة (English)' : 'Company Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Nile Horizon Travel"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>

            {/* Arabic Name */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'اسم الشركة بالعربية (اختياري)' : 'Company Name (Arabic · Optional)'}
              </label>
              <input
                type="text"
                value={arabicName}
                onChange={e => setArabicName(e.target.value)}
                placeholder="مثال: أفق النيل للسياحة"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>

            {/* Operations Email */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'البريد الإلكتروني للعمليات' : 'Operations & Booking Email'} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ops@yourcompany.eg"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>

            {/* Operations WhatsApp */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'رقم واتساب التشغيل المباشر' : 'Operations WhatsApp Number'} *
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+20 100 123 4567"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs font-mono text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'هاتف المقر المباشر' : 'Headquarters Contact Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 2 2735 1234"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs font-mono text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>

            {/* Headquarters Address */}
            <div>
              <label className="block font-bold text-[#44200F] mb-1">
                {isAr ? 'عنوان المقر الرئيسي' : 'Headquarters City & Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isAr ? 'مثال: الزمالك، القاهرة، مصر' : 'e.g. Zamalek, Cairo, Egypt'}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
            </div>
          </div>

          {/* Company Description */}
          <div>
            <label className="block font-bold text-[#44200F] mb-1">
              {isAr ? 'نبذة عن الشركة والخدمات' : 'Company Overview & Bio'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isAr 
                ? 'شركة متخصصة في تنظيم الرحلات السياحية الفاخرة، كروزات النيل، وجولات الآثار في مصر.' 
                : 'DMC specializing in luxury Egypt tours, Nile cruises, and cultural expeditions.'}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOpenFullSettings}
              className="font-bold text-xs text-[#795037] hover:text-[#44200F] flex items-center gap-1.5 cursor-pointer underline"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isAr ? 'الانتقال إلى صفحة إعدادات الشركة بالكامل ←' : 'Open Full Company Settings Page →'}</span>
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ البيانات وتحديث النسبة' : 'Save & Update'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
