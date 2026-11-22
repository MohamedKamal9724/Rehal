import React, { useState } from 'react';
import { 
  Train, Droplet, Clock, ShieldCheck, CheckCircle2, 
  MapPin, AlertCircle, Luggage, Coffee, Sparkles,
  ArrowRight, ArrowLeft, Check, Compass, FileText
} from 'lucide-react';
import { UILanguage } from '../../../types';
import { SectionHelpTrigger } from '../../common/SectionHelpTrigger';

interface PilgrimageLogisticsViewProps {
  uiLang: UILanguage;
}

export const PilgrimageLogisticsView: React.FC<PilgrimageLogisticsViewProps> = ({ uiLang }) => {
  const isAr = uiLang === 'ar';
  const [activeTrainClass, setActiveTrainClass] = useState<'first' | 'economy'>('first');

  const HARAMAIN_STATIONS = [
    {
      code: 'MAK',
      nameAr: 'محطة مكة المكرمة (الرصيفة)',
      nameEn: 'Makkah Station (Al-Rusaifah)',
      descAr: 'تبعد ٤ كم عن الحرم المكي مع حافلات ترددية وسيارات نقل فاخرة',
      descEn: '4 km from Haram with direct shuttle & VIP limousine transfers',
      isTerminus: true,
    },
    {
      code: 'JED-CENTRAL',
      nameAr: 'محطة جدة (السليمانية)',
      nameEn: 'Jeddah Central (Al-Sulaymaniyah)',
      descAr: 'وسط مدينة جدة، صالة انتظار ملكية وخدمات متكاملة',
      descEn: 'Central Jeddah hub with executive lounge and retail amenities',
      isTerminus: false,
    },
    {
      code: 'JED-AIRPORT',
      nameAr: 'محطة مطار الملك عبد العزيز (JED)',
      nameEn: 'King Abdulaziz Airport Station (JED)',
      descAr: 'مدمجة بالصالة رقم ١ لربط المسافرين مباشرة بالحرمين الشريفين',
      descEn: 'Integrated in Terminal 1 for direct airport-to-Haram transit',
      isTerminus: false,
    },
    {
      code: 'KAEC',
      nameAr: 'محطة مدينة الملك عبد الله الاقتصادية',
      nameEn: 'King Abdullah Economic City (KAEC)',
      descAr: 'محطة ربط سريعة مع مناطق الإقامة الساحلية والفنادق',
      descEn: 'High-speed transit node connecting coastal luxury resorts',
      isTerminus: false,
    },
    {
      code: 'MED',
      nameAr: 'محطة المدينة المنورة (المعرفة)',
      nameEn: 'Madinah Station (Al-Maa\'refah)',
      descAr: 'تبعد ٩ كم عن المسجد النبوي الشريف مع أسطول حافلات وسيارات مرخصة',
      descEn: '9 km from Prophet’s Mosque with authorized private coaches',
      isTerminus: true,
    },
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Header - Light Hijazi Ivory & Gold */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3ECE1] border border-[#E5D5B5] rounded-3xl p-6 sm:p-8 relative overflow-hidden text-[#44200F] shadow-2xs">
        {/* Subtle decorative SVG */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.08] pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" stroke="#8C6218" strokeWidth="3">
            <path d="M100 10 C 60 40 40 80 40 130 L 40 200 L 160 200 L 160 130 C 160 80 140 40 100 10 Z" />
          </svg>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-bold text-[#8C6218]">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-[#B8860B]" />
              <span>{isAr ? 'منظومة النقل الذكي وسقيا الحرمين' : 'Pilgrimage Transit & Zamzam Protocols'}</span>
            </div>
            <SectionHelpTrigger
              sectionKey="hajj_logistics"
              uiLang={uiLang}
              variant="gold"
              size="sm"
              pinned={true}
              label={isAr ? 'دليل اللوجستيات' : 'Logistics Guide'}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#44200F] tracking-tight">
            {isAr ? 'لوجستيات قطار الحرمين السريع ومياه زمزم الرسمية' : 'Haramain High-Speed Rail & Zamzam Distribution'}
          </h2>
          <p className="text-xs sm:text-sm text-[#795037] max-w-2xl leading-relaxed">
            {isAr 
              ? 'دليل العمليات اللوجستية لربط المعتمرين بين مكة المكرمة والمدينة المنورة عبر أسرع قطار كهربائي بالشرق الأوسط، وإدارة حصص مياه زمزم المشرفة المعتمدة.'
              : 'Operational guidelines for coordinating high-speed rail passenger manifests between Makkah and Madinah and verified airport Zamzam water distribution.'}
          </p>
        </div>
      </div>

      {/* Grid: Haramain Rail (Left/Top) & Zamzam Distribution (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HARAMAIN HIGH-SPEED RAIL */}
        <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xs p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FDF4E0] border border-[#DFC798] text-[#8C6218] flex items-center justify-center font-bold shadow-2xs">
                <Train className="w-5 h-5 text-[#B8860B]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#44200F]">
                  {isAr ? 'قطار الحرمين السريع (HHR)' : 'Haramain High-Speed Rail'}
                </h3>
                <p className="text-xs text-[#795037]">
                  {isAr ? 'سرعة تشغيلية ٣٠٠ كم/ساعة — كهربائي بالكامل' : '300 km/h Operational Speed — 100% Electric'}
                </p>
              </div>
            </div>

            {/* Travel Time Badge */}
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#44200F] block">140 {isAr ? 'دقيقة' : 'Mins'}</span>
              <span className="text-[10px] text-[#795037]">{isAr ? 'مكة ⇄ المدينة' : 'Direct Transit'}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE0CC]">
              <span className="text-[10px] text-[#795037] block font-medium">{isAr ? 'المسافة الإجمالية' : 'Total Route'}</span>
              <span className="text-sm font-black text-[#44200F] font-mono">450 km</span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE0CC]">
              <span className="text-[10px] text-[#795037] block font-medium">{isAr ? 'السرعة القصوى' : 'Top Speed'}</span>
              <span className="text-sm font-black text-emerald-800 font-mono">300 km/h</span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE0CC]">
              <span className="text-[10px] text-[#795037] block font-medium">{isAr ? 'بديل الحافلات' : 'Time Saved'}</span>
              <span className="text-sm font-black text-[#AA822A] font-mono">3.5 hrs</span>
            </div>
          </div>

          {/* Station Route Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#44200F] uppercase tracking-wider">
              {isAr ? 'مسار المحطات الخمس الرئيسية:' : 'The 5 Major Route Stations:'}
            </h4>

            <div className="space-y-2 border-r-2 rtl:border-r-2 rtl:border-l-0 ltr:border-l-2 ltr:border-r-0 border-[#C4A177]/40 rtl:pr-4 ltr:pl-4">
              {HARAMAIN_STATIONS.map((station) => (
                <div key={station.code} className="relative group">
                  <div className={`absolute top-1.5 w-2.5 h-2.5 rounded-full ${
                    station.isTerminus 
                      ? 'bg-[#B8860B] ring-4 ring-[#FAF3E0]' 
                      : 'bg-[#C4A177]'
                  } ${isAr ? '-right-[21px]' : '-left-[21px]'}`}></div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#44200F] block">
                      {isAr ? station.nameAr : station.nameEn}
                    </span>
                    <p className="text-[11px] text-[#795037] leading-relaxed">
                      {isAr ? station.descAr : station.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* First Class vs Economy Selector */}
          <div className="space-y-3 pt-2 border-t border-[#EDE0CC]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#44200F]">
                {isAr ? 'مواصفات المقاعد والضيافة:' : 'Seating & Service Classes:'}
              </span>

              <div className="flex items-center gap-1 bg-[#FAF6EE] border border-[#EDE0CC] p-1 rounded-xl">
                <button
                  onClick={() => setActiveTrainClass('first')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTrainClass === 'first' 
                      ? 'bg-[#8C6218] text-white shadow-2xs' 
                      : 'text-[#44200F]'
                  }`}
                >
                  {isAr ? 'درجة الأعمال الأولى' : 'Business First'}
                </button>
                <button
                  onClick={() => setActiveTrainClass('economy')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTrainClass === 'economy' 
                      ? 'bg-[#8C6218] text-white shadow-2xs' 
                      : 'text-[#44200F]'
                  }`}
                >
                  {isAr ? 'الدرجة الاقتصادية' : 'Economy'}
                </button>
              </div>
            </div>

            {activeTrainClass === 'first' ? (
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#44200F] font-bold">
                  <Coffee className="w-4 h-4 text-[#AA822A]" />
                  <span>{isAr ? 'الدرجة الأولى الفاخرة (VIP Business):' : 'First Class Experience:'}</span>
                </div>
                <p className="text-[11px] text-[#795037] leading-relaxed">
                  {isAr
                    ? 'مقاعد جلدية رحبة قابلة للإمالة بتوزيع (١+٢)، شاشات ترفيهية فردية، مقابس كهربائية، ضيافة سعودية أصيلة تشمل القهوة والتمور الفاخرة ووجبات خفيفة، مع صالات انتظار خاصة بالمحطات.'
                    : 'Spacious ergonomic leather recliners in 1+2 configuration, individual media screens, personal power outlets, authentic Saudi coffee with dates service, and executive lounge access.'}
                </p>
                <div className="text-[11px] text-[#AA822A] font-bold">
                  {isAr ? 'الوزن المسموح: حقيبة كبيرة ٢٥ كجم + حقيبة يد ٧ كجم' : 'Baggage Allowance: 1 Large Suitcase (25kg) + 1 Handbag (7kg)'}
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#44200F] font-bold">
                  <Luggage className="w-4 h-4 text-[#795037]" />
                  <span>{isAr ? 'الدرجة الاقتصادية المريحة:' : 'Economy Class Features:'}</span>
                </div>
                <p className="text-[11px] text-[#795037] leading-relaxed">
                  {isAr
                    ? 'مقاعد مريحة وعملية بتوزيع (٢+٢)، عربة كافتيريا تقدم وجبات ساخنة ومشروبات طوال الرحلة، مساحات واسعة للأمتعة بين العربات، وتكييف هواء فائق التطور مصمم لمناخ الحجاز.'
                    : 'Comfortable seating in 2+2 layout, onboard cafeteria carriage with hot snacks and refreshments, spacious luggage racks, and climate control built for desert heat.'}
                </p>
                <div className="text-[11px] text-[#795037] font-bold">
                  {isAr ? 'الوزن المسموح: حقيبة قياسية ٢٠ كجم + حقيبة يد' : 'Baggage Allowance: 1 Standard Suitcase (20kg) + Handbag'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OFFICIAL ZAMZAM WATER LOGISTICS */}
        <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-900 text-cyan-200 flex items-center justify-center font-bold shadow-xs">
                  <Droplet className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#44200F]">
                    {isAr ? 'مشروع الملك عبد الله لسقيا زمزم' : 'King Abdullah Zamzam Project'}
                  </h3>
                  <p className="text-xs text-[#795037]">
                    {isAr ? 'توزيع عبوات زمزم الرسمية المعتمدة سعة ٥ لترات' : 'Official 5-Liter Sealed Airport Distribution'}
                  </p>
                </div>
              </div>

              {/* Tag */}
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-cyan-900 block">5 Liters</span>
                <span className="text-[10px] text-[#795037]">{isAr ? 'لكل معتمر' : 'Per Pilgrim'}</span>
              </div>
            </div>

            {/* Official Requirements Protocol */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#44200F] uppercase tracking-wider">
                {isAr ? 'ضوابط صرف وشحن مياه زمزم بالمطارات:' : 'Airport Zamzam Collection & Transit Rules:'}
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#44200F] block">
                      {isAr ? 'نقاط التوزيع الرسمية المعتمدة' : 'Authorized Airport Terminals'}
                    </span>
                    <p className="text-[11px] text-[#795037] leading-relaxed mt-0.5">
                      {isAr
                        ? 'مطار الملك عبد العزيز الدولي بجدة (صالة ١ والصالة الشمالية) ومطار الأمير محمد بن عبد العزيز بالمدينة المنورة.'
                        : 'Available exclusively at Jeddah (JED Terminal 1 & North) and Madinah (MED) departure zones.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#44200F] block">
                      {isAr ? 'التغليف الآلي والشريط الأمني المشفر' : 'Automated Box Wrapping & Barcode Seal'}
                    </span>
                    <p className="text-[11px] text-[#795037] leading-relaxed mt-0.5">
                      {isAr
                        ? 'تُسلم العبوة داخل كرتون سميك مقاوم للصدمات مغلف آلياً بالبلاستيك ومزود برمز استجابة سريع يربط العبوة بتأشيرة المعتمر الرسمية.'
                        : 'Heavy-duty impact-proof carton hermetically sealed in plastic with a verified barcode tied to the pilgrim’s Umrah visa.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#44200F] block">
                      {isAr ? 'سياسة شركات الطيران لرحلات العودة' : 'Airline Baggage Regulations'}
                    </span>
                    <p className="text-[11px] text-[#795037] leading-relaxed mt-0.5">
                      {isAr
                        ? 'تسمح مصر للطيران والخطوط السعودية وكافة الشركات النظامية بقطعة زمزم مجانية إضافية (٥ كجم) خارج الوزن المصرح به للأمتعة الشخصية.'
                        : 'EgyptAir, Saudia, and scheduled carriers permit one complimentary 5L Zamzam container in addition to standard luggage allowances.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Notice Card */}
          <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200/80 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-cyan-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-950 block">
                {isAr ? 'ملاحظة تشغيلية لفرق الاستقبال والتفويج:' : 'Operational Dispatch Checklist:'}
              </span>
              <p className="text-[11px] text-cyan-900 leading-relaxed">
                {isAr
                  ? 'يقوم منسق ريحال الميداني بالمطار بتجهيز القسائم الإلكترونية الجماعية لحملات المعتمرين قبل موعد الرحلة بـ ٤ ساعات لتفادي الازدحام بصالات المغادرة.'
                  : 'On-ground airport coordinators batch-process digital Zamzam vouchers 4 hours before departure to ensure seamless group boarding without terminal delays.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
