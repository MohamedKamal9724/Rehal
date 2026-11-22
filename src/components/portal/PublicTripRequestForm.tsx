import React, { useState } from 'react';
import { 
  Compass, MapPin, Calendar, Users, Star, Sparkles, Send, 
  ArrowRight, ArrowLeft, Check, CheckCircle2, ShieldCheck, 
  Phone, Mail, MessageSquare, Hotel, Car, Globe, HeartHandshake,
  Clock, X, CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Inquiry, UILanguage, Workspace, ProposalLanguage, Season } from '../../types';
import { EGYPT_CITIES } from '../../lib/constants';

interface PublicTripRequestFormProps {
  workspace: Workspace;
  uiLang: UILanguage;
  seasons?: Season[];
  onSubmitInquiry: (inquiry: Inquiry) => void;
  onOpenPortalToken?: (token: string) => void;
  onClose?: () => void;
}

export const PublicTripRequestForm: React.FC<PublicTripRequestFormProps> = ({
  workspace,
  uiLang,
  onSubmitInquiry,
  onClose,
}) => {
  const isAr = uiLang === 'ar';
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Cairo', 'Luxor', 'Aswan']);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [travelDates, setTravelDates] = useState<string>('');
  const [hotelTier, setHotelTier] = useState<'5_star_luxury' | '5_star_classic' | '4_star_boutique'>('5_star_luxury');
  const [specialInterests, setSpecialInterests] = useState<string[]>(['Nile Cruise', 'Archaeology']);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [proposalLang, setProposalLang] = useState<ProposalLanguage>('en');

  // Submission State
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);

  const toggleDestination = (dest: string) => {
    setSelectedDestinations(prev => 
      prev.includes(dest) ? (prev.length > 1 ? prev.filter(d => d !== dest) : prev) : [...prev, dest]
    );
  };

  const toggleInterest = (interest: string) => {
    setSpecialInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const referenceId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const rawSummary = `[استفسار زائر مباشر - ${referenceId}] 
الوجهات: ${selectedDestinations.join(' + ')}
عدد المسافرين: ${adults} بالغين ${children > 0 ? `+ ${children} أطفال` : ''}
المستوى الفندقي: ${hotelTier}
الاهتمامات: ${specialInterests.join(', ')}
الموعد المقترح: ${travelDates || 'الموسم القادم'}
ملاحظات إضافية: ${clientNotes || 'لا توجد'}`;

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      workspaceId: workspace.id,
      travelerName: clientName.trim() || (isAr ? 'زائر البوابة' : 'Portal Visitor'),
      travelerEmail: clientEmail.trim() || undefined,
      travelerPhone: clientPhone.trim() || undefined,
      rawText: rawSummary,
      source: 'Web Form',
      status: 'New',
      assignedAgentId: 'agent-ops',
      assignedAgentName: 'Operations Desk',
      receivedAt: new Date().toISOString(),
      language: proposalLang,
      slaMinutes: 120,
      requirements: {
        destinationSummary: selectedDestinations.join(' + '),
        cities: selectedDestinations,
        group: {
          adults: adults,
          children: Array(children).fill({ age: 8 }),
          infants: 0,
        },
        durationDays: selectedDestinations.length > 2 ? 8 : 5,
        hotelTier: hotelTier,
        hotelStarRating: hotelTier === '5_star_luxury' ? 5 : 4,
        interests: specialInterests,
        mealPlan: 'full_board',
        urgency: 'Medium',
        confidenceScores: { destinations: 1, group: 1 },
      },
    };

    onSubmitInquiry(newInquiry);
    setSubmittedInquiry(newInquiry);
  };

  const cleanWhatsApp = (workspace.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');
  const waMessage = encodeURIComponent(
    isAr 
      ? `مرحباً ${workspace.arabicName || workspace.name}، قمت بتفصيل برنامج رحلة عبر المنصة برقم مرجعي (${submittedInquiry?.id || 'INQ'}).\nالاسم: ${clientName}\nالوجهات: ${selectedDestinations.join(' + ')}\nالعدد: ${adults} مسافرين.\nأود تأكيد تفاصيل عرض الأسعار.`
      : `Hello ${workspace.name}, I designed an itinerary inquiry on your portal (Ref: ${submittedInquiry?.id || 'INQ'}).\nName: ${clientName}\nDestinations: ${selectedDestinations.join(' + ')}\nGroup: ${adults} travelers.\nPlease provide a tailored proposal.`
  );
  const waUrl = `https://wa.me/${cleanWhatsApp}?text=${waMessage}`;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/60 text-slate-900 border-b border-amber-200/80 p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 shadow-xs">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {isAr ? 'نموذج تصميم وحساب الرحلة السياحية' : 'Tailored Egypt Tour Request Wizard'}
            </h2>
            <p className="text-xs font-semibold text-amber-800 mt-0.5">
              {isAr ? `مباشرة مع استشاريي ${workspace.arabicName || workspace.name}` : `Directly with travel specialists at ${workspace.name}`}
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {submittedInquiry ? (
        /* Confirmation Screen */
        <div className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
            <CheckCheck className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              {isAr ? 'الرقم المرجعي للاستفسار:' : 'Inquiry Reference:'} {submittedInquiry.id}
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {isAr ? 'تم استلام وتوجيه طلبك بنجاح' : 'Tour Request Successfully Received'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {isAr 
                ? 'تم تسجيل طلبك رسمياً في غرفة عمليات الشركة. يمكنك الآن التواصل مباشرة مع استشاري الحجوزات عبر واتساب بتفاصيل طلبك دون الحاجة لإعادة كتابتها.'
                : 'Your request has been routed to our operations desk. You can now connect directly with our travel consultants via WhatsApp with all details pre-formatted.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'تأكيد مباشر عبر واتساب الشركة' : 'Confirm via Agency WhatsApp'}</span>
            </a>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
              >
                {isAr ? 'إغلاق والعودة' : 'Close and Return'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Wizard Steps */
        <div className="p-6 sm:p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-4 text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#44200F]' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-400'}`}>1</span>
              <span>{isAr ? 'الوجهات' : 'Destinations'}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#44200F]' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-400'}`}>2</span>
              <span>{isAr ? 'المسافرين' : 'Travelers'}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#44200F]' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-400'}`}>3</span>
              <span>{isAr ? 'الإقامة' : 'Hotel Tier'}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-[#44200F]' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 4 ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-400'}`}>4</span>
              <span>{isAr ? 'التواصل' : 'Contact'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: DESTINATIONS */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#44200F]">{isAr ? 'اختر الوجهات التي ترغب في زيارتها' : 'Select Destinations to Include'}</h3>
                  <p className="text-xs text-[#795037]">{isAr ? 'يمكنك اختيار أكثر من وجهة لدمجها في برنامج واحد' : 'Select multiple regions for a combined expedition'}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Alexandria', 'Siwa'].map(dest => {
                    const isSelected = selectedDestinations.includes(dest);
                    return (
                      <button
                        type="button"
                        key={dest}
                        onClick={() => toggleDestination(dest)}
                        className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                          isSelected 
                            ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-md' 
                            : 'bg-slate-50 hover:bg-[#FAF7F2] border-[#EDE0CC] text-slate-700'
                        }`}
                      >
                        <MapPin className={`w-5 h-5 ${isSelected ? 'text-[#C4A177]' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">{dest}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: GROUP & DATES */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{isAr ? 'عدد المسافرين وتاريخ السفر المقترح' : 'Group Size & Target Dates'}</h3>
                  <p className="text-xs text-slate-500">{isAr ? 'تساعدنا هذه البيانات في تجهيز سعة المركبات والغرف المناسبة' : 'Helps us allocate appropriate vehicles and room capacity'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-2">{isAr ? 'البالغين (١٢ سنة فأكثر)' : 'Adults (12+ years)'}</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-base hover:bg-slate-100">-</button>
                      <span className="text-lg font-bold text-slate-900 font-mono w-8 text-center">{adults}</span>
                      <button type="button" onClick={() => setAdults(adults + 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-base hover:bg-slate-100">+</button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-2">{isAr ? 'الأطفال (أقل من ١٢ سنة)' : 'Children (< 12 years)'}</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-base hover:bg-slate-100">-</button>
                      <span className="text-lg font-bold text-slate-900 font-mono w-8 text-center">{children}</span>
                      <button type="button" onClick={() => setChildren(children + 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-base hover:bg-slate-100">+</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{isAr ? 'الموعد أو الشهر المقترح للسفر' : 'Target Travel Month or Dates'}</label>
                  <input
                    type="text"
                    value={travelDates}
                    onChange={e => setTravelDates(e.target.value)}
                    placeholder={isAr ? 'مثال: ديسمبر ٢٠٢٥، أو عطلة نصف العام' : 'e.g. November 2025, or Winter Break'}
                    className="w-full px-4 py-3 bg-slate-50 border border-[#EDE0CC] rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: HOTEL & PREFERENCES */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#44200F]">{isAr ? 'مستوى الإقامة والاهتمامات' : 'Accommodation Tier & Interests'}</h3>
                  <p className="text-xs text-[#795037]">{isAr ? 'اختر فئة الفنادق المفضلة لتسعير أدق' : 'Choose your desired luxury tier for accurate pricing'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: '5_star_luxury', titleAr: '٥ نجوم ديلوكس فاخر', titleEn: '5-Star Luxury VIP', descAr: 'فنادق عالمية وكروزات سوبر ديلوكس', descEn: 'Historic & International Luxury Brands' },
                    { id: '5_star_classic', titleAr: '٥ نجوم كلاسيك', titleEn: '5-Star Classic Standard', descAr: 'فنادق ممتازة وخدمة متكاملة', descEn: 'Full-service Egyptian Hospitality' },
                    { id: '4_star_boutique', titleAr: '٤ نجوم بوتيك مميز', titleEn: '4-Star Premium Boutique', descAr: 'إقامة أنيقة وتكلفة اقتصادية', descEn: 'Charming Boutique Properties' },
                  ].map(tier => {
                    const isSelected = hotelTier === tier.id;
                    return (
                      <button
                        type="button"
                        key={tier.id}
                        onClick={() => setHotelTier(tier.id as any)}
                        className={`p-4 rounded-2xl border text-start transition cursor-pointer ${
                          isSelected 
                            ? 'bg-[#FAF7F2] border-[#C4A177] ring-2 ring-[#C4A177]/40 shadow-xs' 
                            : 'bg-white border-[#EDE0CC] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <Hotel className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                        <h4 className="font-bold text-xs text-slate-900 mb-1">{isAr ? tier.titleAr : tier.titleEn}</h4>
                        <p className="text-[11px] text-slate-500">{isAr ? tier.descAr : tier.descEn}</p>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">{isAr ? 'اهتمامات خاصة بالرحلة:' : 'Special Expedition Focus:'}</label>
                  <div className="flex flex-wrap gap-2">
                    {['Nile Cruise', 'Archaeology', 'Hot Air Balloon', 'Red Sea Diving', 'Nubian Culture', 'Desert Safari'].map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleInterest(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          specialInterests.includes(tag)
                            ? 'bg-[#44200F] text-[#C4A177] font-bold'
                            : 'bg-[#FAF7F2] text-[#795037] hover:bg-[#EDE0CC]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CONTACT & NOTES */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#44200F]">{isAr ? 'بيانات التواصل لتلقي العرض' : 'Contact Information for Proposal'}</h3>
                  <p className="text-xs text-[#795037]">{isAr ? 'سنرسل لك ملف العرض المخصص وجدول الرحلة التفصيلي' : 'We will prepare and send your personalized itinerary'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'الاسم بالكامل' : 'Full Name'} *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder={isAr ? 'محمد علي' : 'Mohamed Ali'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'} *</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'لغة تقديم العرض' : 'Proposal Language'}</label>
                    <select
                      value={proposalLang}
                      onChange={e => setProposalLang(e.target.value as ProposalLanguage)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                    >
                      <option value="ar">العربية (Arabic)</option>
                      <option value="en">English (الإنجليزية)</option>
                      <option value="es">Español (الإسبانية)</option>
                      <option value="fr">Français (الفرنسية)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'ملاحظات أو رغبات خاصة' : 'Special Notes & Requests'}</label>
                  <textarea
                    rows={3}
                    value={clientNotes}
                    onChange={e => setClientNotes(e.target.value)}
                    placeholder={isAr ? 'تفضيل مرشد لغة معينة، غرف متصلة، إلخ...' : 'Language guide preference, connected rooms, etc...'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-[#EDE0CC] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="px-5 py-2.5 rounded-xl border border-[#EDE0CC] text-xs font-bold text-[#795037] hover:bg-[#FAF7F2] transition"
                >
                  {isAr ? 'السابق' : 'Previous'}
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-6 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{isAr ? 'التالي' : 'Next Step'}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-2xl text-xs font-extrabold transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'إرسال طلب تفصيل الرحلة' : 'Submit Tour Request'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
