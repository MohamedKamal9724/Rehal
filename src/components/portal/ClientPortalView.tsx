import React, { useState } from 'react';
import { 
  Compass, MapPin, Calendar, Users, Clock, CheckCircle2, 
  AlertCircle, FileText, Download, Share2, 
  Phone, Mail, MessageSquare, ArrowLeft, ArrowRight, ShieldCheck, 
  CreditCard, ExternalLink, QrCode, Sparkles, Building2, 
  Sun, Wind, Globe, ChevronDown, ChevronUp, Star, Eye, Shield
} from 'lucide-react';
import { Quote, Workspace, UILanguage } from '../../types';
import { exportQuoteToLuxuryPDF } from '../../lib/exportUtils';

interface ClientPortalViewProps {
  quote?: Quote;
  quotes?: Quote[];
  initialToken?: string;
  workspace: Workspace;
  uiLang: UILanguage;
  bookingRef?: string;
  onBackToApp?: () => void;
  onBack?: () => void;
  onUpdateQuoteStatus?: (status: Quote['status']) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  quote,
  quotes = [],
  initialToken,
  workspace,
  uiLang,
  bookingRef,
  onBack,
  onBackToApp,
}) => {
  const isAr = uiLang === 'ar';

  // Secure Quote Resolution: Never fall back to another customer's quote!
  const activeQuote: Quote | null = (() => {
    if (quote) return quote;
    if (initialToken) {
      const match = quotes.find(q => q.id === initialToken || q.id.replace('quote-', '') === initialToken);
      if (match) return match;
    }
    if (bookingRef) {
      const match = quotes.find(q => q.id === bookingRef);
      if (match) return match;
    }
    return null;
  })();

  const handleReturn = onBack || onBackToApp || (() => {});

  // If no matching quote exists, show safe unavailable screen (Finding A05)
  if (!activeQuote) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAr ? 'رابط الرحلة غير متاح أو منتهي الصلاحية' : 'Proposal Link Expired or Not Found'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr 
              ? 'لم يتم العثور على رحلة مطابقة لهذا الرمز. حفاظاً على خصوصية المسافرين، يرجى طلب رابط صالح ومباشر من شركة السياحة المنظمة.'
              : 'No itinerary was found matching this access key. To protect traveler privacy, please contact your tour provider for a valid direct link.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleReturn}
              className="px-5 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold rounded-xl transition shadow-xs"
            >
              {isAr ? 'العودة' : 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Quote Presentation
  const cleanWhatsApp = (workspace.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    isAr 
      ? `مرحباً ${workspace.arabicName || workspace.name}، بخصوص عرض أسعار الرحلة رقم (${activeQuote.id}) لـ ${activeQuote.travelerName}. أود الاستفسار عن تأكيد الحجز.`
      : `Hello ${workspace.name}, regarding tour proposal (${activeQuote.id}) for ${activeQuote.travelerName}. Inquiring to confirm booking.`
  )}`;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 py-8 px-4 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-[#EDE0CC] shadow-xs">
          <div className="flex items-center gap-3">
            <img 
              src={workspace.logoUrl || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80'} 
              alt={workspace.name} 
              className="w-10 h-10 rounded-xl object-cover border border-[#EDE0CC] bg-white" 
            />
            <div>
              <h3 className="font-extrabold text-sm text-[#44200F]">
                {isAr ? (workspace.arabicName || workspace.name) : workspace.name}
              </h3>
              <p className="text-[11px] text-[#795037] font-mono">
                {isAr ? 'مرجع العرض:' : 'Proposal ID:'} {activeQuote.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportQuoteToLuxuryPDF(activeQuote, workspace)}
              className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleReturn}
              className="px-4 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold rounded-xl transition"
            >
              {isAr ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>

        {/* Hero Cover Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#EDE0CC] shadow-md">
          <div className="relative h-44 sm:h-56 bg-[#44200F]">
            <img
              src="https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80"
              alt="Egypt Tour"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Hero Identity Block - Clear text on clean white surface, generous spacing */}
          <div className="p-6 sm:p-8 bg-white border-b border-[#EDE0CC] space-y-3">
            <span className="px-3.5 py-1 bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] rounded-full text-xs font-bold uppercase tracking-wider inline-block">
              {activeQuote.days?.length || 8} {isAr ? 'أيام في مصر' : 'Days in Egypt'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#44200F] leading-snug">
              {activeQuote.days?.[0]?.city ? (isAr ? `رحلة استكشاف ${activeQuote.days.map(d => d.city).filter((v,i,a)=>a.indexOf(v)===i).join(' و ')}` : `${activeQuote.days.map(d => d.city).filter((v,i,a)=>a.indexOf(v)===i).join(' & ')} Expedition`) : (isAr ? 'رحلة الأهرامات وكروز النيل الفاخر' : 'Pharaohs & Nile Cruise Deluxe Expedition')}
            </h1>
            <p className="text-xs sm:text-sm text-[#795037]">
              {isAr ? 'معد خصيصاً لـ:' : 'Specially Crafted for:'} <span className="font-bold text-[#44200F]">{activeQuote.travelerName}</span>
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="p-6 bg-[#FAF7F2] border-t border-[#EDE0CC] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#795037] block text-[10px]">{isAr ? 'عدد المسافرين:' : 'Travelers:'}</span>
              <span className="font-bold text-[#44200F] text-sm">
                {(activeQuote.group?.adults || 2) + (activeQuote.group?.children?.length || 0)} {isAr ? 'مسافر' : 'Guests'}
              </span>
            </div>
            <div>
              <span className="text-[#795037] block text-[10px]">{isAr ? 'تاريخ السفر المقترح:' : 'Travel Date:'}</span>
              <span className="font-bold text-[#44200F] text-sm">{activeQuote.startDate || 'Upcoming Season'}</span>
            </div>
            <div>
              <span className="text-[#795037] block text-[10px]">{isAr ? 'لغة الإرشاد:' : 'Guide Language:'}</span>
              <span className="font-bold text-[#44200F] text-sm">{activeQuote.language?.toUpperCase() || 'ENGLISH'}</span>
            </div>
            <div>
              <span className="text-[#795037] block text-[10px]">{isAr ? 'السعر الإجمالي المعتمد:' : 'Total Proposal Price:'}</span>
              <span className="font-extrabold text-[#44200F] text-base font-mono">
                ${activeQuote.totalPriceQuoteCurrency?.toLocaleString() || '1,850'} {activeQuote.targetCurrency || 'USD'}
              </span>
            </div>
          </div>
        </div>

        {/* Day-by-Day Program */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#44200F]">
            {isAr ? 'جدول الرحلة يوماً بيوم' : 'Day-by-Day Detailed Itinerary'}
          </h2>

          <div className="space-y-4">
            {activeQuote.days && activeQuote.days.length > 0 ? (
              activeQuote.days.map((day, idx) => (
                <div key={day.dayNumber || idx} className="bg-white rounded-2xl p-5 border border-[#EDE0CC] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#44200F] text-[#C4A177] text-xs font-bold font-mono">
                      {isAr ? `اليوم ${day.dayNumber}` : `Day ${day.dayNumber}`}
                    </span>
                    <span className="text-xs font-medium text-[#795037]">{day.city}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#44200F]">{day.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{day.description}</p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                {isAr 
                  ? 'يتضمن البرنامج استقبال خاص بالمطار، استكشاف أهرامات الجيزة والمتحف المصري الكبير، كروز نايل ٥ نجوم بين الأقصر وأسوان، وخدمة سيارات خاصة مع مرشد أثري مرخص.' 
                  : 'Includes VIP airport meet & assist, Giza Pyramids & Grand Egyptian Museum, 5-Star Deluxe Nile Cruise between Luxor and Aswan, and private Mercedes fleet transfers with licensed Egyptologist guide.'}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation & Agency Direct Contact Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-start">
            <h3 className="font-bold text-base text-slate-900">
              {isAr ? 'جاهز لتأكيد الرحلة أو ترغب في تعديل؟' : 'Ready to confirm or request adjustments?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'تواصل مباشرة مع استشاري الحجوزات لتأكيد المقاعد والغرف' : 'Connect directly with our reservation team for instant confirmation'}
            </p>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAr ? 'تأكيد الحجز عبر واتساب' : 'Confirm via WhatsApp'}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
