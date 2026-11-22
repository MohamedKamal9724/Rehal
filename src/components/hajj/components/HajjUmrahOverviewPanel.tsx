import React, { useState } from 'react';
import { 
  Building2, Users, MapPin, AlertCircle, Plane, CheckCircle2, 
  Clock, ShieldCheck, ArrowRight, ArrowLeft, ExternalLink, Sparkles, 
  Train, FileCheck2, HeartHandshake, RefreshCw, Check, Compass, 
  ChevronRight, Calendar, AlertTriangle
} from 'lucide-react';
import { UILanguage } from '../../../types';
import { 
  PilgrimageGroup, 
  PilgrimageVisaApplication, 
  PilgrimageFlight 
} from '../HajjUmrahView';
import { SectionHelpTrigger } from '../../common/SectionHelpTrigger';

interface HajjUmrahOverviewPanelProps {
  uiLang: UILanguage;
  groups: PilgrimageGroup[];
  visas: PilgrimageVisaApplication[];
  flights: PilgrimageFlight[];
  onApproveVisa: (visaId: string) => void;
  onCreateVisaQuote?: (visa: PilgrimageVisaApplication) => void;
  onOpenStatModal: (modal: 'groups' | 'visas' | 'flights') => void;
  onSwitchTab: (tab: 'packages' | 'calculator' | 'ziyarat' | 'rituals' | 'logistics') => void;
}

export const HajjUmrahOverviewPanel: React.FC<HajjUmrahOverviewPanelProps> = ({
  uiLang,
  groups,
  visas,
  flights,
  onApproveVisa,
  onCreateVisaQuote,
  onOpenStatModal,
  onSwitchTab,
}) => {
  const isAr = uiLang === 'ar';
  const [selectedCityFilter, setSelectedCityFilter] = useState<'all' | 'makkah' | 'madinah' | 'transit'>('all');

  // Compute distribution
  const makkahGroups = groups.filter(g => g.currentLocation === 'makkah');
  const madinahGroups = groups.filter(g => g.currentLocation === 'madinah');
  const transitGroups = groups.filter(g => g.currentLocation === 'haramain_transit');

  const pilgrimsMakkah = makkahGroups.reduce((acc, g) => acc + g.pilgrimCount, 0);
  const pilgrimsMadinah = madinahGroups.reduce((acc, g) => acc + g.pilgrimCount, 0);
  const pilgrimsTransit = transitGroups.reduce((acc, g) => acc + g.pilgrimCount, 0);
  const totalPilgrims = pilgrimsMakkah + pilgrimsMadinah + pilgrimsTransit;

  const makkahPct = totalPilgrims > 0 ? Math.round((pilgrimsMakkah / totalPilgrims) * 100) : 0;
  const madinahPct = totalPilgrims > 0 ? Math.round((pilgrimsMadinah / totalPilgrims) * 100) : 0;
  const transitPct = totalPilgrims > 0 ? Math.round((pilgrimsTransit / totalPilgrims) * 100) : 0;

  // Identify Urgent Visa Alerts:
  // Visas associated with groups scheduled on flights departing within 48 hours
  const imminentFlightGroupCodes = flights
    .filter(f => f.hoursUntilDeparture <= 48)
    .flatMap(f => f.groupCodes);

  const urgentVisas = visas.filter(v => 
    v.status !== 'issued' && imminentFlightGroupCodes.includes(v.groupCode)
  );

  const pendingVisasCount = visas.filter(v => v.status !== 'issued').length;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =========================================================================
          SECTION 1: COMPARATIVE PILGRIM DISTRIBUTION (MAKKAH vs MADINAH) - LIGHT THEME
         ========================================================================= */}
      <div className="bg-white border border-[#EDE0CC] rounded-3xl p-5 sm:p-7 text-[#44200F] shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE0CC] pb-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#8C6218] uppercase tracking-wider font-mono">
                    {isAr ? 'مؤشر التوزيع الجغرافي الميداني للحجاج والمعتمرين' : 'Pilgrim Geographical Distribution Tracker'}
                  </span>
                </div>
                <SectionHelpTrigger
                  sectionKey="hajj_overview"
                  uiLang={uiLang}
                  variant="gold"
                  size="sm"
                  pinned={true}
                  label={isAr ? 'دليل الإحصائيات' : 'Overview Guide'}
                  onNavigateTab={(_, subTab) => {
                    if (subTab) onSwitchTab(subTab as any);
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#44200F] tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B8860B]" />
                <span>
                  {isAr
                    ? `معتمرو مكة المكرمة (${pilgrimsMakkah}) مقابل معتمري المدينة المنورة (${pilgrimsMadinah})`
                    : `Pilgrims in Makkah (${pilgrimsMakkah}) vs Madinah (${pilgrimsMadinah})`}
                </span>
              </h3>
            </div>

            <button
              onClick={() => onOpenStatModal('groups')}
              className="px-3.5 py-2 rounded-xl bg-[#FAF6EE] border border-[#DFC798] text-[#7C5310] text-xs font-bold hover:bg-[#F3E9D2] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>{isAr ? 'فتح كشف وتسكين الأفواج' : 'Inspect All Groups'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5 text-[#B8860B]" /> : <ArrowRight className="w-3.5 h-3.5 text-[#B8860B]" />}
            </button>
          </div>

          {/* Comparative Progress Bar */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold">
              <div className="flex items-center gap-2 text-[#8C6218]">
                <span className="w-3 h-3 rounded-xs bg-[#C89B27] inline-block" />
                <span>{isAr ? 'مكة المكرمة:' : 'Holy Makkah:'} {pilgrimsMakkah} {isAr ? 'معتمر' : 'pax'} ({makkahPct}%)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>{isAr ? 'طيبة المدينة:' : 'Madinah:'} {pilgrimsMadinah} {isAr ? 'معتمر' : 'pax'} ({madinahPct}%)</span>
              </div>
              <div className="flex items-center gap-2 text-sky-800">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                <span>{isAr ? 'قطار الحرمين:' : 'Transit:'} {pilgrimsTransit} ({transitPct}%)</span>
              </div>
            </div>

            {/* Visual Multi-segment Bar */}
            <div className="w-full h-3.5 bg-[#FAF3E3] rounded-full overflow-hidden flex border border-[#E5D5B5]">
              <div
                style={{ width: `${makkahPct}%` }}
                className="bg-gradient-to-r from-[#B8860B] via-[#C89B27] to-[#DFB74C] transition-all duration-500"
                title={`Makkah: ${pilgrimsMakkah} pax`}
              />
              <div
                style={{ width: `${madinahPct}%` }}
                className="bg-gradient-to-r from-[#065F46] via-[#059669] to-[#10B981] transition-all duration-500"
                title={`Madinah: ${pilgrimsMadinah} pax`}
              />
              <div
                style={{ width: `${transitPct}%` }}
                className="bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] transition-all duration-500"
                title={`Transit: ${pilgrimsTransit} pax`}
              />
            </div>
          </div>

          {/* Interactive Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* CARD A: MAKKAH SANCTUARY */}
            <div
              onClick={() => setSelectedCityFilter(selectedCityFilter === 'makkah' ? 'all' : 'makkah')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden space-y-2.5 ${
                selectedCityFilter === 'makkah'
                  ? 'bg-[#FDF6E7] border-[#B8860B] ring-1 ring-[#B8860B] shadow-sm'
                  : 'bg-[#FAF8F5] border-[#E5D5B5] hover:border-[#B8860B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8C6218] flex items-center gap-1">
                  <span>🕋</span>
                  <span>{isAr ? 'الكعبة المشرفة وفنادق الحرم' : 'Makkah Sanctuaries'}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white text-[#7C5310] border border-[#DFC798] font-mono font-bold">
                  {makkahGroups.length} {isAr ? 'أفواج' : 'Groups'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#44200F]">
                  {pilgrimsMakkah}
                </span>
                <span className="text-xs text-[#795037] font-bold">
                  {isAr ? 'معتمر مقيم بمكة' : 'Pilgrims in Makkah'}
                </span>
              </div>

              <div className="text-[11px] text-[#795037] space-y-1 pt-2 border-t border-[#E5D5B5]/70">
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'أبراج الساعة وفيرمونت:' : 'Clock Tower & Fairmont:'}</span>
                  <span className="text-[#44200F] font-mono font-bold">28 pax</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'جبل عمر والعنوان:' : 'Jabal Omar Address:'}</span>
                  <span className="text-[#44200F] font-mono font-bold">36 pax</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'قصر رافلز مكة:' : 'Raffles Makkah Palace:'}</span>
                  <span className="text-[#44200F] font-mono font-bold">10 pax</span>
                </p>
              </div>
            </div>

            {/* CARD B: MADINAH MUNAWWARAH */}
            <div
              onClick={() => setSelectedCityFilter(selectedCityFilter === 'madinah' ? 'all' : 'madinah')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden space-y-2.5 ${
                selectedCityFilter === 'madinah'
                  ? 'bg-emerald-50/90 border-emerald-600 ring-1 ring-emerald-500 shadow-sm'
                  : 'bg-[#F5FBF8] border-emerald-200 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <span>🕌</span>
                  <span>{isAr ? 'المسجد النبوي والروضة' : 'Madinah Al-Rawdah'}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white text-emerald-800 border border-emerald-200 font-mono font-bold">
                  {madinahGroups.length} {isAr ? 'أفواج' : 'Groups'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-900">
                  {pilgrimsMadinah}
                </span>
                <span className="text-xs text-emerald-800 font-bold">
                  {isAr ? 'معتمر مقيم بالمدينة' : 'Pilgrims in Madinah'}
                </span>
              </div>

              <div className="text-[11px] text-emerald-900/80 space-y-1 pt-2 border-t border-emerald-200/70">
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'فندق أوبروي المدينة (٢٠م):' : 'The Oberoi Madinah (20m):'}</span>
                  <span className="text-emerald-950 font-mono font-bold">32 pax</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'هيلتون المدينة المنورة:' : 'Madinah Hilton:'}</span>
                  <span className="text-emerald-950 font-mono font-bold">24 pax</span>
                </p>
                <p className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>{isAr ? 'تصاريح الروضة في نسك:' : 'Nusuk Rawdah Permits:'}</span>
                  <span className="font-mono">100% OK</span>
                </p>
              </div>
            </div>

            {/* CARD C: HARAMAIN HIGH-SPEED RAIL TRANSIT */}
            <div
              onClick={() => setSelectedCityFilter(selectedCityFilter === 'transit' ? 'all' : 'transit')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden space-y-2.5 ${
                selectedCityFilter === 'transit'
                  ? 'bg-sky-50/90 border-sky-600 ring-1 ring-sky-500 shadow-sm'
                  : 'bg-[#F6FAFD] border-sky-200 hover:border-sky-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                  <Train className="w-3.5 h-3.5 text-sky-700" />
                  <span>{isAr ? 'قطار الحرمين السريع' : 'Haramain Bullet Rail'}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white text-sky-800 border border-sky-200 font-mono font-bold">
                  300 km/h
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-sky-950">
                  {pilgrimsTransit}
                </span>
                <span className="text-xs text-sky-800 font-bold">
                  {isAr ? 'معتمر في مرحلة الانتقال' : 'In Inter-City Transit'}
                </span>
              </div>

              <div className="text-[11px] text-sky-900/80 space-y-1 pt-2 border-t border-sky-200/70">
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'رحلة القطار النشطة:' : 'Active Train No:'}</span>
                  <span className="text-sky-950 font-mono font-bold">HHR 07</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>{isAr ? 'زمن الرحلة بين الحرمين:' : 'Journey Duration:'}</span>
                  <span className="text-sky-950 font-mono font-bold">120 mins</span>
                </p>
                <p className="flex items-center justify-between text-sky-700 font-bold">
                  <span>{isAr ? 'المطوف المسؤول:' : 'Transit Guide:'}</span>
                  <span>{isAr ? 'عمر الغامدي' : 'O. Al-Ghamdi'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: URGENT VISA ALERTS WIDGET & IMMEDIATE DEPARTURES (LIGHT THEME)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* URGENT VISA ALERTS WIDGET (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-[#EDE0CC] rounded-3xl p-5 sm:p-6 text-[#44200F] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-[#44200F] flex items-center gap-2">
                    <span>{isAr ? 'تنبيهات التأشيرات العاجلة لمنصة نُسك' : 'Urgent Visa Alerts Widget'}</span>
                    {urgentVisas.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                        {urgentVisas.length} {isAr ? 'حالات عاجلة' : 'Urgent'}
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-[#795037]">
                    {isAr
                      ? 'تأشيرات قيد الإجراء لمعتمرين مرتبطين برحلات طيران خلال ٤٨ ساعة'
                      : 'Unissued visas for pilgrims departing on flights within 48 hours'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenStatModal('visas')}
                className="text-xs text-[#8C6218] hover:text-[#44200F] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'كافة التأشيرات' : 'All Visas'} ({pendingVisasCount})</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Urgent List */}
            {urgentVisas.length > 0 ? (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {urgentVisas.map(visa => (
                  <div
                    key={visa.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5D5B5] hover:border-[#B8860B] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <h5 className="font-bold text-[#44200F] text-sm">
                          {isAr ? visa.pilgrimNameAr : visa.pilgrimNameEn}
                        </h5>
                        <span className="font-mono text-[10px] text-[#795037] bg-white px-2 py-0.5 rounded border border-[#EDE0CC]">
                          {visa.passportNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#795037] text-[11px]">
                        <span className="text-[#8C6218] font-mono font-bold">{visa.groupCode}</span>
                        <span>·</span>
                        <span className="text-amber-800 font-bold">
                          {isAr ? 'رحلة MS 671 خلال ١٤ ساعة' : 'Flight MS 671 in 14h'}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">{visa.nusukRef}</span>
                      </div>
                    </div>

                      <div className="flex flex-wrap items-center gap-2 sm:self-center">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {visa.status === 'awaiting_ministry'
                            ? (isAr ? 'بانتظار الوزارة' : 'In Ministry')
                            : (isAr ? 'فحص البصمة' : 'Biometrics')}
                        </span>

                        {onCreateVisaQuote && (
                          <button
                            type="button"
                            onClick={() => onCreateVisaQuote(visa)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#44200F] border border-[#C4A177] font-bold text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span>{isAr ? 'إنشاء عرض سعر' : 'Create Quote'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => onApproveVisa(visa.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8C6218] to-[#B8860B] text-white font-bold text-xs hover:from-[#734F10] hover:to-[#9A6F1A] transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'اعتماد تجريبي' : 'Simulate Issue'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold text-sm">
                    {isAr ? 'لا توجد تأشيرات حرجة متأخرة' : 'No Critical Pending Visas'}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {isAr ? 'كافة تأشيرات رحلات الطيران القادمة تم اعتمادها في المحاكي التجريبي.' : 'All imminent departure visas are marked ready in demo queue.'}
                  </p>
                </div>
              )}
          </div>

          {/* Footer Guidance */}
          <div className="pt-3 mt-3 border-t border-[#EDE0CC] text-[11px] text-[#795037] flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#8C6218] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAr ? 'محاكي منصة نُسك الإلكترونية (وضع تجريبي)' : 'Nusuk Gateway Simulator (Demo Mode)'}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Demo Workspace</span>
          </div>
        </div>

        {/* FLIGHT LOGISTICS & QUICK SHORTCUTS (5 COLS) */}
        <div className="lg:col-span-5 bg-white border border-[#EDE0CC] rounded-3xl p-5 sm:p-6 text-[#44200F] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3.5">
              <h4 className="font-black text-sm sm:text-base text-[#44200F] flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#B8860B]" />
                <span>{isAr ? 'جاهزية الرحلات وتفويج المطارات' : 'Airport Flight Operations'}</span>
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6EE] text-[#7C5310] border border-[#DFC798] text-xs font-mono font-bold">
                {flights.length} {isAr ? 'رحلات' : 'Flights'}
              </span>
            </div>

            {/* Imminent Departure Card */}
            {flights[0] && (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5D5B5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#FDF4E0] text-[#7C5310] border border-[#DFC798]">
                      {flights[0].carrier} {flights[0].flightNumber}
                    </span>
                    <span className="text-xs font-bold text-[#44200F]">
                      {isAr ? flights[0].carrierAr : flights[0].carrier}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    -{flights[0].hoursUntilDeparture}h Remaining
                  </span>
                </div>

                <div className="text-[11px] text-[#795037] flex items-center justify-between">
                  <span className="font-mono font-bold text-[#44200F]">{flights[0].departureAirport} → {flights[0].arrivalAirport}</span>
                  <span className="text-emerald-700 font-bold">{flights[0].passengersCount} {isAr ? 'راكب مؤكد' : 'Passengers'}</span>
                </div>

                <div className="text-[11px] text-[#795037] pt-2 border-t border-[#EDE0CC] flex items-center justify-between">
                  <span>{isAr ? flights[0].airportCoordinatorAr : flights[0].airportCoordinatorEn}</span>
                  <span className="font-mono text-[#8C6218] font-bold">{flights[0].coordinatorPhone}</span>
                </div>
              </div>
            )}

            {/* Quick Operational Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onSwitchTab('rituals')}
                className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5D5B5] hover:border-[#B8860B] hover:bg-[#FAF3E3] transition text-start space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <HeartHandshake className="w-4 h-4 text-[#B8860B] group-hover:scale-110 transition-transform" />
                  <ChevronRight className="w-3.5 h-3.5 text-[#795037]" />
                </div>
                <h5 className="font-bold text-xs text-[#44200F]">{isAr ? 'متابعة المناسك' : 'Ritual Steps'}</h5>
                <p className="text-[10px] text-[#795037]">{isAr ? 'إنجاز أركان العمرة والحج' : 'Group rites progress'}</p>
              </button>

              <button
                onClick={() => onSwitchTab('ziyarat')}
                className="p-3.5 rounded-2xl bg-[#F5FBF8] border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/70 transition text-start space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <Compass className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <h5 className="font-bold text-xs text-emerald-950">{isAr ? 'خريطة المزارات' : 'Ziyarat Map'}</h5>
                <p className="text-[10px] text-emerald-800">{isAr ? 'المسافات الفندقية الدقيقة' : 'Hotel distance markers'}</p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDE0CC] flex items-center justify-between text-[11px] text-[#795037]">
            <span className="text-emerald-800 flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{isAr ? 'سقيا زمزم ٥ لتر معتمدة' : 'Zamzam 5L Air Cargo Clear'}</span>
            </span>
            <button
              onClick={() => onSwitchTab('calculator')}
              className="text-[#8C6218] hover:text-[#44200F] font-bold cursor-pointer"
            >
              {isAr ? 'حاسبة التكاليف' : 'Cost Calculator'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
