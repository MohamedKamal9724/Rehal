import React, { useState } from 'react';
import { 
  X, MapPin, Calendar, Users, ArrowRight, ArrowLeft, 
  Check, Plane, Sparkles, Plus, FileText 
} from 'lucide-react';
import { Quote, Workspace, UILanguage } from '../../types';
import { TripFile, TripService, TripPassenger, CHECKLIST_TEMPLATE, newId } from '../../lib/tripStore';

interface ProgressiveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableQuotes: Quote[];
  uiLang: UILanguage;
  workspace: Workspace;
  onCreateTrip: (newTrip: TripFile) => void;
}

const DESTINATIONS = [
  { id: 'cairo', nameEn: 'Cairo & Giza', nameAr: 'القاهرة والجيزة', defaultDuration: 3 },
  { id: 'luxor_aswan', nameEn: 'Luxor & Aswan Nile Cruise', nameAr: 'الأقصر وأسوان (كروز نيلية)', defaultDuration: 4 },
  { id: 'hurghada', nameEn: 'Hurghada Red Sea', nameAr: 'الغردقة والبحر الأحمر', defaultDuration: 4 },
  { id: 'sharm', nameEn: 'Sharm El Sheikh', nameAr: 'شرم الشيخ', defaultDuration: 4 },
  { id: 'alexandria', nameEn: 'Alexandria Mediterranean', nameAr: 'الإسكندرية والساحل', defaultDuration: 2 },
  { id: 'makkah_madinah', nameEn: 'Makkah & Madinah Umrah', nameAr: 'مكة المكرمة والمدينة المنورة', defaultDuration: 7 },
];

export const ProgressiveTripModal: React.FC<ProgressiveTripModalProps> = ({
  isOpen,
  onClose,
  availableQuotes,
  uiLang,
  workspace,
  onCreateTrip,
}) => {
  const isAr = uiLang === 'ar';
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Creation mode: 'manual' (Where? When? Who?) vs 'from_quote'
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');

  // Step 1: Where?
  const [destination, setDestination] = useState<string>('Cairo & Giza');
  const [customDestination, setCustomDestination] = useState<string>('');

  // Step 2: When?
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [durationDays, setDurationDays] = useState<number>(4);

  // Step 3: How many travellers?
  const [leadTravelerName, setLeadTravelerName] = useState<string>('');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [guideLanguage, setGuideLanguage] = useState<string>('English');

  if (!isOpen) return null;

  const handleFinish = () => {
    const finalDest = customDestination.trim() || destination;
    const finalLeadName = leadTravelerName.trim() || 'VIP Lead Guest';
    const fileNum = `TRIP-${Math.floor(100 + Math.random() * 900)}`;
    const tourPasscode = `EG-${Math.floor(1000 + Math.random() * 9000)}`;

    const passengers: TripPassenger[] = [];
    // Lead passenger
    passengers.push({
      id: newId(),
      name: finalLeadName,
      nationality: 'International',
      type: 'Adult',
      room: '101',
      dietary: 'Standard',
      personalCode: `${finalLeadName.split(' ')[0]?.toUpperCase() || 'GUEST'}-01`,
    });

    // Additional adults
    for (let i = 2; i <= adultsCount; i++) {
      passengers.push({
        id: newId(),
        name: `Guest ${i} (${finalLeadName} Group)`,
        nationality: 'International',
        type: 'Adult',
        room: Math.ceil(i / 2) + 100 + '',
        dietary: 'Standard',
        personalCode: `${finalLeadName.split(' ')[0]?.toUpperCase() || 'GUEST'}-0${i}`,
      });
    }

    // Children
    for (let j = 1; j <= childrenCount; j++) {
      passengers.push({
        id: newId(),
        name: `Child ${j} (${finalLeadName} Group)`,
        nationality: 'International',
        type: 'Child',
        room: '101',
        dietary: 'Child Meal',
        personalCode: `${finalLeadName.split(' ')[0]?.toUpperCase() || 'GUEST'}-C0${j}`,
      });
    }

    // Initial basic services skeleton
    const services: TripService[] = [];
    const isUmrah = finalDest.toLowerCase().includes('makkah') || finalDest.toLowerCase().includes('umrah');

    services.push({
      id: newId(),
      dayNumber: 1,
      serviceName: isUmrah ? 'Jeddah Airport Meet & Assist to Makkah' : `Arrival Airport Meet & Assist & Transfer to ${finalDest.split(' ')[0]} Hotel`,
      supplierName: `${finalDest.split(' ')[0]} Transport Services`,
      supplierType: 'Transport',
      city: isUmrah ? 'Makkah' : finalDest.split(' ')[0],
      status: 'To request',
      confirmationNo: '',
      note: 'Driver will meet guests at terminal with RIHAL placard',
    });

    services.push({
      id: newId(),
      dayNumber: 1,
      serviceName: isUmrah ? 'Makkah 5-Star Haram View Hotel Check-in' : `${finalDest.split(' ')[0]} Luxury Hotel Accommodation`,
      supplierName: `${finalDest.split(' ')[0]} Partner Hotel`,
      supplierType: 'Hotel',
      city: isUmrah ? 'Makkah' : finalDest.split(' ')[0],
      status: 'To request',
      confirmationNo: '',
      note: `${passengers.length} Guests, Breakfast Included`,
    });

    if (durationDays > 1) {
      services.push({
        id: newId(),
        dayNumber: 2,
        serviceName: isUmrah ? 'Guided Umrah Rituals & Ziyarat' : `Guided Tour of ${finalDest} Highlights & Historical Sites`,
        supplierName: 'RIHAL Certified Egyptologist Guides',
        supplierType: 'Sightseeing',
        city: isUmrah ? 'Makkah' : finalDest.split(' ')[0],
        status: 'To request',
        confirmationNo: '',
        note: `Guided in ${guideLanguage}`,
      });
    }

    const newTrip: TripFile = {
      id: newId(),
      quoteId: selectedQuoteId || newId(),
      fileNumber: fileNum,
      tourPasscode: tourPasscode,
      travelerName: finalLeadName,
      startDate: startDate,
      durationDays: durationDays,
      status: 'Confirmed',
      isUmrah: isUmrah,
      arrival: {
        flight: 'MS 780',
        date: startDate,
        time: '11:00 AM',
        airport: isUmrah ? 'King Abdulaziz Airport (JED)' : 'Cairo International Airport (CAI)',
        meetAndAssist: true,
      },
      departure: {
        flight: 'MS 781',
        date: startDate,
        time: '04:00 PM',
        airport: isUmrah ? 'King Abdulaziz Airport (JED)' : 'Cairo International Airport (CAI)',
      },
      guideName: '',
      guidePhone: '',
      guideLanguage: guideLanguage,
      driverName: '',
      driverPhone: '',
      vehiclePlate: '',
      vehicleType: adultsCount + childrenCount > 8 ? 'VIP Luxury Coach' : 'Executive Mercedes Van',
      emergencyContact: '+20 100 000 0000',
      services: services,
      passengers: passengers,
      checklist: CHECKLIST_TEMPLATE.map((label, idx) => ({ id: `chk-${idx}`, label, done: false })),
      log: [
        {
          id: newId(),
          at: new Date().toISOString(),
          text: `Trip file ${fileNum} initialized for ${finalLeadName} (${passengers.length} pax to ${finalDest}).`,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    onCreateTrip(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#44200F]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl border border-[#EDE0CC] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EDE0CC]/60 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#44200F]">
                {isAr ? 'إنشاء ملف رحلة جديد' : 'Create New Trip File'}
              </h3>
              <p className="text-[11px] text-[#795037]">
                {isAr ? 'بناء تدريجي مبسط: أين؟ متى؟ كم عدد المسافرين؟' : 'Progressive setup: Where? When? How many travellers?'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-5 py-3 border-b border-[#EDE0CC]/40 bg-white flex items-center justify-between text-xs font-bold">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#44200F]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#44200F] text-white' : step > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>{isAr ? '١. الوجهة' : '1. Where?'}</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-[#EDE0CC]">
            <div className={`h-full bg-[#44200F] transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`} />
          </div>

          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#44200F]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#44200F] text-white' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>{isAr ? '٢. المواعيد' : '2. When?'}</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-[#EDE0CC]">
            <div className={`h-full bg-[#44200F] transition-all duration-300 ${step < 3 ? 'w-0' : 'w-full'}`} />
          </div>

          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#44200F]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#44200F] text-white' : 'bg-slate-100 text-slate-500'}`}>
              3
            </span>
            <span>{isAr ? '٣. المسافرون' : '3. Travellers'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: WHERE? */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#44200F]">
                {isAr ? 'أين ستقام الرحلة السياحية؟ (اختر الوجهة أو اكتب وجهة مخصصة)' : 'Where is the trip taking place?'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DESTINATIONS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDestination(d.nameEn);
                      setCustomDestination('');
                      setDurationDays(d.defaultDuration);
                    }}
                    className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                      destination === d.nameEn && !customDestination
                        ? 'border-[#44200F] bg-[#FAF7F2] text-[#44200F] font-bold ring-1 ring-[#44200F]'
                        : 'border-[#EDE0CC] hover:bg-[#FAF7F2]/50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isAr ? d.nameAr : d.nameEn}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {d.defaultDuration} {isAr ? 'أيام مقترحة' : 'days default'}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isAr ? 'أو اكتب مساراً ووجهة مخصصة:' : 'Or custom destination / route:'}
                </label>
                <input
                  type="text"
                  value={customDestination}
                  onChange={e => setCustomDestination(e.target.value)}
                  placeholder={isAr ? 'مثال: أسوان - الأقصر - مرسى علم' : 'e.g. Cairo - Bahariya Oasis - White Desert'}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#44200F] focus:outline-hidden"
                />
              </div>

              {availableQuotes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-[#795037] mb-1">
                    {isAr ? '💡 أو اختر استيراد مباشر من عرض سعر معتمد:' : '💡 Or link directly to an existing quote:'}
                  </label>
                  <select
                    value={selectedQuoteId}
                    onChange={e => {
                      setSelectedQuoteId(e.target.value);
                      const q = availableQuotes.find(item => item.id === e.target.value);
                      if (q) {
                        setLeadTravelerName(q.travelerName);
                        setDurationDays(q.durationDays);
                        if (q.startDate) setStartDate(q.startDate);
                        if (q.group?.adults) setAdultsCount(q.group.adults);
                      }
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="">{isAr ? '-- اختر عرض سعر (اختياري) --' : '-- Select Quote (Optional) --'}</option>
                    {availableQuotes.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.quoteNumber} · {q.travelerName} ({q.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: WHEN? */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#44200F]">
                {isAr ? 'متى ستبدأ الرحلة وما مدتها؟' : 'When will the trip take place?'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isAr ? 'تاريخ بداية الرحلة:' : 'Trip Start Date:'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#44200F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isAr ? 'المدة الإجمالية (بالأيام):' : 'Duration (Days):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationDays}
                    onChange={e => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#44200F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] text-xs text-[#795037] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span>
                  {isAr 
                    ? `ستمتد الرحلة لمدة ${durationDays} أيام بدءاً من ${startDate}. يمكن تعديل الأيام لاحقاً.`
                    : `The trip will run for ${durationDays} days starting ${startDate}. You can adjust dates anytime.`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: WHO & HOW MANY? */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#44200F]">
                {isAr ? 'من هم المسافرون في هذا الفوج؟' : 'Who is travelling on this tour?'}
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isAr ? 'اسم قائد الفوج أو المسافر الرئيسي:' : 'Lead Guest / Group Name:'}
                </label>
                <input
                  type="text"
                  value={leadTravelerName}
                  onChange={e => setLeadTravelerName(e.target.value)}
                  placeholder={isAr ? 'مثال: د. أحمد فؤاد وعائلته' : 'e.g. Mr. Robert Taylor & Family'}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#44200F] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isAr ? 'عدد البالغين (Adults):' : 'Adults Count:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={adultsCount}
                    onChange={e => setAdultsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {isAr ? 'عدد الأطفال (Children):' : 'Children Count:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={childrenCount}
                    onChange={e => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isAr ? 'لغة الإرشاد السياحي المطلوبة:' : 'Guide Language:'}
                </label>
                <select
                  value={guideLanguage}
                  onChange={e => setGuideLanguage(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                >
                  <option value="English">English</option>
                  <option value="Arabic">العربية (Arabic)</option>
                  <option value="French">Français (French)</option>
                  <option value="German">Deutsch (German)</option>
                  <option value="Spanish">Español (Spanish)</option>
                  <option value="Italian">Italiano (Italian)</option>
                  <option value="Russian">Русский (Russian)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EDE0CC]/60 bg-[#FAF7F2] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAr ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#44200F] hover:opacity-95 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>{isAr ? 'التالي' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C4A177]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 text-xs font-bold text-white bg-[#44200F] hover:opacity-95 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'إنشاء ملف الرحلة فوراً' : 'Launch Trip Workspace'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
