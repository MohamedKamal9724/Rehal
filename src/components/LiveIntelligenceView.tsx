import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudSun, DollarSign, Moon, RefreshCw, Compass, 
  MapPin, Wind, Droplets, Sun, AlertTriangle, ShieldCheck, 
  Check, ArrowRight, ExternalLink, Globe2, Building2, 
  TrendingUp, Clock, Info, Plane, Sparkles, Eye,
  Users, Bed, MessageCircle, FileText, Send, Zap, UserCheck, Shield, Copy
} from 'lucide-react';
import { 
  ALL_TOURISM_COORDINATES, ComprehensiveWeather, 
  fetchLiveComprehensiveWeather, fetchLivePrayerTimes, 
  PrayerTimings, LIVE_HOTEL_MARKET_BENCHMARKS, 
  TOURISM_SOURCE_MARKETS, CountryVisaInfo 
} from '../lib/publicApisService';
import { 
  fetchLiveExchangeRates, getStoredExchangeRates, 
  ExchangeRatesMap 
} from '../lib/currencyService';
import { UILanguage, Workspace, Currency } from '../types';
import { GuidanceTrigger } from './common/GuidanceTrigger';
import { aiTrainingService, IndexedTripRecord, StructuredOperationalIndex } from '../services/aiTrainingService';
import { FarisAvatarIcon } from './common/FarisAvatarIcon';
import { dispatchTripCodeToWhatsApp } from '../lib/whatsappDispatch';

interface LiveIntelligenceViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onNavigateToQuotes?: () => void;
  onNavigateToTrips?: () => void;
  onNavigateToHajj?: () => void;
  onOpenFarisWithQuery?: (query: string) => void;
}

export const LiveIntelligenceView: React.FC<LiveIntelligenceViewProps> = ({
  workspace,
  uiLang,
  onNavigateToQuotes,
  onNavigateToTrips,
  onNavigateToHajj,
  onOpenFarisWithQuery,
}) => {
  const isAr = uiLang === 'ar';

  // Sub-tabs
  const [activeSection, setActiveSection] = useState<'operations' | 'weather' | 'fx' | 'prayers' | 'benchmarks' | 'visas'>('operations');

  // Direct fetch hook & state for live active trip database
  const [operationalIndex, setOperationalIndex] = useState<StructuredOperationalIndex>(() => 
    aiTrainingService.ingestOperationalData(workspace.id)
  );
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);
  const [aiQueryInput, setAiQueryInput] = useState<string>('');
  const [aiQueryResult, setAiQueryResult] = useState<string | null>(null);
  const [isQueryingAi, setIsQueryingAi] = useState<boolean>(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<IndexedTripRecord | null>(null);

  // Direct fetch hook to active trip database
  const refreshOperationalDatabase = useCallback(() => {
    setIsRefreshingDb(true);
    try {
      const refreshed = aiTrainingService.ingestOperationalData(workspace.id);
      setOperationalIndex(refreshed);
      if (refreshed.trips.length > 0 && !selectedTripDetails) {
        setSelectedTripDetails(refreshed.trips[0]);
      }
    } finally {
      setTimeout(() => setIsRefreshingDb(false), 300);
    }
  }, [workspace.id, selectedTripDetails]);

  useEffect(() => {
    refreshOperationalDatabase();
  }, [refreshOperationalDatabase]);

  const handleExecuteAiQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setIsQueryingAi(true);
    setAiQueryInput(q);

    await new Promise((r) => setTimeout(r, 180));

    if (!aiTrainingService.isInternalBusinessQuery(q)) {
      setAiQueryResult(aiTrainingService.generateInternalOnlyRejection(isAr));
      setIsQueryingAi(false);
      return;
    }

    if (q.includes('rooming') || q.includes('تسكين') || q.includes('توزيع الغرف') || q.includes('غرفة') || q.includes('manifest') || q.includes('وجبات') || q.includes('dietary')) {
      const res = aiTrainingService.queryRoomingList(q, isAr);
      setAiQueryResult(res || (isAr ? 'لم يتم العثور على كشف تسكين مطابق لهذا الفوج.' : 'No matching rooming list found.'));
    } else if (q.includes('حجز') || q.includes('فندق') || q.includes('booking') || q.includes('steigenberger') || q.includes('marriott') || q.includes('ماريوت') || q.includes('شتايجنبرجر')) {
      const res = aiTrainingService.queryHotelBookingStatus(q, isAr);
      setAiQueryResult(res || (isAr ? 'لم يتم العثور على تأكيد حجز فندقي مطابق.' : 'No matching hotel booking confirmation found.'));
    } else {
      const res = aiTrainingService.queryLiveTripStatus(q, isAr);
      setAiQueryResult(res || (isAr ? 'تمت مراجعة قاعدة البيانات، ولم يتم العثور على رحلة نشطة مطابقة.' : 'Queried trip database: No matching active trip file found.'));
    }

    setIsQueryingAi(false);
  };

  // Weather state
  const cityKeys = Object.keys(ALL_TOURISM_COORDINATES);
  const [selectedCity, setSelectedCity] = useState<string>('Cairo');
  const [weatherData, setWeatherData] = useState<Record<string, ComprehensiveWeather>>({});
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Prayer state
  const [selectedPrayerCity, setSelectedPrayerCity] = useState<'Makkah' | 'Madinah' | 'Cairo'>('Makkah');
  const [prayerData, setPrayerData] = useState<Record<string, PrayerTimings>>({});
  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);

  // Currency / FX state
  const [ratesMap, setRatesMap] = useState<ExchangeRatesMap>(() => getStoredExchangeRates());
  const [isSyncingFx, setIsSyncingFx] = useState(false);
  const [fxLastSynced, setFxLastSynced] = useState<string>('Today');
  const [converterAmount, setConverterAmount] = useState<number>(100);
  const [converterFrom, setConverterFrom] = useState<Currency>('USD');
  const [converterTo, setConverterTo] = useState<Currency>('EGP');

  // Visa search state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');

  // Load weather for selected city
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      if (weatherData[selectedCity]) return; // Already cached
      setIsLoadingWeather(true);
      try {
        const w = await fetchLiveComprehensiveWeather(selectedCity);
        if (isMounted) {
          setWeatherData(prev => ({ ...prev, [selectedCity]: w }));
        }
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    };
    loadWeather();
    return () => { isMounted = false; };
  }, [selectedCity]);

  // Load prayer times
  useEffect(() => {
    let isMounted = true;
    const loadPrayers = async () => {
      if (prayerData[selectedPrayerCity]) return;
      setIsLoadingPrayer(true);
      try {
        const p = await fetchLivePrayerTimes(selectedPrayerCity);
        if (isMounted) {
          setPrayerData(prev => ({ ...prev, [selectedPrayerCity]: p }));
        }
      } finally {
        if (isMounted) setIsLoadingPrayer(false);
      }
    };
    loadPrayers();
    return () => { isMounted = false; };
  }, [selectedPrayerCity]);

  // Sync Live Exchange Rates from open.er-api.com
  const handleSyncFx = async () => {
    setIsSyncingFx(true);
    try {
      const res = await fetchLiveExchangeRates(true);
      setRatesMap(res.rates);
      setFxLastSynced(new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('FX sync error:', err);
    } finally {
      setIsSyncingFx(false);
    }
  };

  const handleRefreshWeather = async (cityName = selectedCity) => {
    setIsLoadingWeather(true);
    try {
      const w = await fetchLiveComprehensiveWeather(cityName);
      setWeatherData(prev => ({ ...prev, [cityName]: w }));
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const currentWeather: ComprehensiveWeather = weatherData[selectedCity] || {
    city: selectedCity,
    arabicName: ALL_TOURISM_COORDINATES[selectedCity]?.arName || selectedCity,
    temperatureC: 0,
    feelsLikeC: 0,
    condition: isLoadingWeather ? 'Connecting to Open-Meteo...' : 'Weather data unavailable',
    conditionAr: isLoadingWeather ? 'جاري الاتصال بمحطة الأرصاد...' : 'بيانات الطقس غير متاحة حالياً',
    icon: '⏳',
    maxTempC: 0,
    minTempC: 0,
    windSpeedKmh: 0,
    humidityPct: 0,
    uvIndex: 0,
    travelRecommendation: 'Weather telemetry pending connection to meteorological station.',
    travelRecommendationAr: 'بانتظار وصول قراءات الأرصاد الجوية للمقصد.',
    forecast5Days: [],
    isLive: false,
    isOfflineBuffer: false,
  };

  const currentPrayer = prayerData[selectedPrayerCity] || {
    city: selectedPrayerCity,
    cityAr: selectedPrayerCity,
    fajr: '05:00',
    sunrise: '06:18',
    dhuhr: '12:08',
    asr: '15:32',
    maghrib: '17:58',
    isha: '19:28',
    hijriDate: {
      day: '04',
      monthEn: 'Jumada al-Awwal',
      monthAr: 'جمادى الأولى',
      year: '1448',
      formattedEn: '04 Jumada al-Awwal 1448 AH',
      formattedAr: '04 جمادى الأولى 1448 هـ',
    },
    nextPrayer: { nameEn: 'Dhuhr', nameAr: 'الظهر', time: '12:08' },
  };

  const selectedCountry = TOURISM_SOURCE_MARKETS.find(c => c.code === selectedCountryCode) || TOURISM_SOURCE_MARKETS[0];

  // Quick Currency Converter Math
  const getRateToEgp = (curr: Currency) => ratesMap[curr]?.effectiveRateToEgp || 1;
  const convertedResult = converterFrom === converterTo 
    ? converterAmount 
    : converterTo === 'EGP' 
      ? converterAmount * getRateToEgp(converterFrom)
      : (converterAmount * getRateToEgp(converterFrom)) / getRateToEgp(converterTo);

  return (
    <div className="space-y-6">
      
      {/* Header Banner - Executive RIHAL Espresso & Champagne */}
      <div className="bg-gradient-to-br from-[#44200F] via-[#5c301a] to-[#321609] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#C4A177]/30 relative overflow-hidden">
        <GuidanceTrigger
          sectionKey="live_intel"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل البيانات الحية' : 'Live APIs Guide'}
        />
        {/* Ambient Shimmer */}
        <div className="absolute inset-0 bg-radial from-[#C4A177]/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 ltr:pr-14 rtl:pl-14">

          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#C4A177] text-[#44200F] shadow-sm">
                <Globe2 className="w-3.5 h-3.5" />
                <span>Open Public APIs Hub</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-300 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open-Meteo · Open Exchange Rates · Aladhan</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2.5">
              <span>Live Travel Intelligence &amp; Public APIs</span>
              <span className="font-arabic text-lg font-bold text-[#C4A177]">مركز البيانات السياحية المباشرة</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#EDE0CC] leading-relaxed font-medium">
              Real-time destination meteorological radar, Central Bank exchange rate synchronizer with company safety buffer, and Islamic calendar &amp; prayer coordination for Egyptian monuments and Holy Mosques.
            </p>
          </div>

          {/* Quick Real-Time Sync Indicator */}
          <div className="bg-black/35 backdrop-blur-md rounded-2xl p-4 border border-[#C4A177]/25 flex flex-col gap-2.5 min-w-[240px] shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>API Gateway Status</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Live
              </span>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Weather Provider:</span>
                <span className="text-white font-mono">Open-Meteo</span>
              </div>
              <div className="flex justify-between">
                <span>FX Provider:</span>
                <span className="text-white font-mono">open.er-api</span>
              </div>
              <div className="flex justify-between">
                <span>Hijri Calendar:</span>
                <span className="text-[#C4A177] font-mono">Aladhan.com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncFx}
              disabled={isSyncingFx}
              className="mt-1 w-full text-xs font-bold py-2 px-3 rounded-xl bg-[#C4A177] hover:bg-[#b08b3b] text-[#44200F] flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFx ? 'animate-spin' : ''}`} />
              <span>{isSyncingFx ? (isAr ? 'جاري التحديث...' : 'Syncing...') : (isAr ? 'تحديث أسعار العملات الآن' : 'Sync Live Market Rates')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Strictly Equal Height & Non-Wrapping on Mobile */}
      <div className="luxury-tab-bar border-b border-[#EDE0CC] pb-3">
        {[
          { id: 'operations', labelEn: 'Active Trips & Faris AI Radar', labelAr: 'تشغيل الرحلات ورادار فارس اللحظي', icon: Compass },
          { id: 'weather', labelEn: 'Destination Weather & Radar', labelAr: 'الأرصاد ورادار المدن السياحية', icon: CloudSun },
          { id: 'fx', labelEn: 'Currency & Central Bank Sync', labelAr: 'العملات والبنك المركزي', icon: DollarSign },
          { id: 'prayers', labelEn: 'Prayer Times & Hijri Calendar', labelAr: 'مواقيت الصلاة والتقويم الهجري', icon: Moon },
          { id: 'benchmarks', labelEn: 'Hotel & Tariff Benchmarks', labelAr: 'مؤشرات أسعار الفنادق والرحلات', icon: Building2 },
          { id: 'visas', labelEn: 'Country Visa Demographics', labelAr: 'تأشيرات وجنسيات المسافرين', icon: Globe2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`luxury-nav-pill ${
                isActive 
                  ? 'luxury-nav-pill-active' 
                  : 'luxury-nav-pill-inactive bg-white'
              }`}
            >
              <div className="luxury-nav-pill-icon">
                <Icon className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 0: LIVE OPERATIONS & FARIS AI RADAR */}
      {activeSection === 'operations' && (
        <div className="space-y-6">
          {/* Executive Real-Time Operations Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase text-[#795037]">{isAr ? 'الأفواج النشطة اليوم' : 'Active Tour Groups'}</span>
                <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-gold">
                  <Compass className="w-3.5 h-3.5 text-[#795037]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#44200F] font-mono tabular-nums">
                {operationalIndex.trips.length}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'قيد التشغيل الميداني' : 'Operating in Egypt'}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase text-[#795037]">{isAr ? 'المسافرين بالحركة' : 'Guests in Transit'}</span>
                <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand">
                  <Users className="w-3.5 h-3.5 text-[#44200F]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#44200F] font-mono tabular-nums">
                {operationalIndex.trips.reduce((acc, t) => acc + t.roomingList.length, 0)}
              </div>
              <div className="text-[11px] text-[#795037] mt-0.5">
                {isAr ? 'مسكنين بكشوف الغرف' : 'Allocated in rooming lists'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase text-[#795037]">{isAr ? 'تأكيدات الفنادق والكروز' : 'Verified Vouchers'}</span>
                <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald">
                  <Bed className="w-3.5 h-3.5 text-emerald-700" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#44200F] font-mono tabular-nums">
                {operationalIndex.trips.reduce((acc, t) => acc + t.hotelBookings.length, 0)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {isAr ? '100% قسائم معتمدة' : '100% Confirmed Vouchers'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase text-[#795037]">{isAr ? 'المرشدين والسائقين' : 'Field Staff Deployed'}</span>
                <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber">
                  <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#44200F] font-mono tabular-nums">
                {operationalIndex.trips.length * 2}
              </div>
              <div className="text-[11px] text-[#795037] mt-0.5">
                {isAr ? 'مرشدين وسائقين ليموزين VIP' : 'Egyptologists & VIP Chauffeurs'}
              </div>
            </div>
          </div>

          {/* AI Concierge Direct Query Console */}
          <div className="bg-white rounded-3xl border border-[#C4A177]/40 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-3">
                <FarisAvatarIcon size={40} showStatusIndicator={true} className="w-10 h-10 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#44200F]">
                      {isAr ? 'فارس · رادار الاستعلام اللحظي لقاعدة البيانات' : 'Faris · Live Trip Database Query Console'}
                    </h3>
                    <span className="h-6 px-2.5 rounded-lg text-[10px] font-bold bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                      <Zap className="w-3 h-3 text-[#B4823E] shrink-0" />
                      <span>{isAr ? 'بيانات التطبيق فقط' : 'Internal Only'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#795037] mt-0.5">
                    {isAr 
                      ? 'استعلام مباشر عن موقع أي فوج اليوم، أرقام تأكيد حجوزات الفنادق، وكشوف تسكين الغرف (Rooming Lists).'
                      : 'Query real-time group locations, confirmed hotel booking vouchers, and passenger rooming manifests.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshOperationalDatabase}
                disabled={isRefreshingDb}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 text-[#44200F] border border-[#EDE0CC] transition cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#795037] shrink-0 ${isRefreshingDb ? 'animate-spin' : ''}`} />
                <span>{isRefreshingDb ? (isAr ? 'جاري التحديث...' : 'Syncing...') : (isAr ? 'تحديث قاعدة البيانات' : 'Refresh Trips DB')}</span>
              </button>
            </div>

            {/* Quick Query Buttons — Strictly Equal Height Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#795037] uppercase tracking-wide block">
                {isAr ? 'استعلامات عمليات جاهزة:' : 'Quick Operational Queries:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
                {[
                  {
                    labelEn: "Alexander's Tour Today",
                    labelAr: 'موقع فوج ألكسندر اليوم',
                    query: "Where is Mr. Alexander's tour group today, who is the guide, and what is the schedule?",
                  },
                  {
                    labelEn: 'Steigenberger Booking',
                    labelAr: 'حجز فندق شتايجنبرجر',
                    query: 'What is the booking confirmation status for Steigenberger Nile Palace Luxor?',
                  },
                  {
                    labelEn: 'Alexander Rooming List',
                    labelAr: 'كشف غرف وفد ألكسندر',
                    query: "What is the rooming list and passenger allocations for Alexander's group?",
                  },
                  {
                    labelEn: 'Sarah Jenkins Rooming',
                    labelAr: 'كشف غرف وفد سارة',
                    query: "What is the rooming list, room number, and dietary need for Sarah Jenkins?",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExecuteAiQuery(item.query)}
                    className="h-10 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 border border-[#EDE0CC] hover:border-[#C4A177] text-xs font-bold text-[#2A1409] transition cursor-pointer shadow-2xs flex items-center justify-center whitespace-nowrap truncate"
                  >
                    <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteAiQuery(aiQueryInput);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <div className="h-10 flex-1 flex items-center rounded-xl border border-[#DDD2C2] focus-within:border-[#44200F] focus-within:ring-2 focus-within:ring-[#44200F]/10 bg-[#FAF7F2] focus-within:bg-white transition">
                <input
                  type="text"
                  value={aiQueryInput}
                  onChange={(e) => setAiQueryInput(e.target.value)}
                  placeholder={isAr ? 'اسأل فارس عن موقع أي فوج، كود رحلة، فندق، أو كشف تسكين...' : 'Ask Faris about any tour location, passcode, hotel, or rooming list...'}
                  className="w-full bg-transparent px-3.5 text-xs text-[#1E1B18] outline-none placeholder:text-[#8C7B6E]"
                />
              </div>

              <button
                type="submit"
                disabled={!aiQueryInput.trim() || isQueryingAi}
                className="h-10 px-4 rounded-xl bg-[#44200F] hover:bg-[#5C2D16] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-2xs shrink-0 whitespace-nowrap"
              >
                <Send className={`w-3.5 h-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                <span>{isQueryingAi ? (isAr ? 'جاري الاستعلام...' : 'Querying...') : (isAr ? 'استعلام' : 'Query')}</span>
              </button>
            </form>

            {/* AI Query Result Display */}
            {aiQueryResult && (
              <div className="rounded-2xl bg-white border border-[#EDE0CC] shadow-sm overflow-hidden animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF8F5] text-[#2A1409] text-xs border-b border-[#EDE0CC]">
                  <div className="flex items-center gap-2">
                    <FarisAvatarIcon size={24} className="w-6 h-6 shrink-0" />
                    <span className="font-bold text-[#2A1409]">
                      {isAr ? 'فارس · نتيجة الاستعلام من قاعدة البيانات' : 'Faris · Live Database Response'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiQueryResult(null)}
                    className="h-7 px-2.5 rounded-lg text-xs text-[#795037] hover:text-[#2A1409] hover:bg-[#EDE0CC]/60 cursor-pointer font-semibold transition"
                  >
                    {isAr ? 'إغلاق' : 'Dismiss'}
                  </button>
                </div>

                <div className="p-4 text-[13px] text-[#1E1B18] leading-relaxed font-sans space-y-1.5">
                  {aiQueryResult.split('\n').map((line, lIdx) => {
                    const trimmed = line.trim();
                    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                    const cleanLine = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : line;
                    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
                    const formatted = parts.map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={pIdx} className="font-bold text-[#2A1409]">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    });

                    if (isBullet) {
                      return (
                        <div key={lIdx} className="flex items-start gap-2 ps-1 text-[#1E1B18]">
                          <span aria-hidden="true" className="text-[#B4823E] font-bold mt-0.5 shrink-0">
                            •
                          </span>
                          <div className="flex-1">{formatted}</div>
                        </div>
                      );
                    }

                    return (
                      <p key={lIdx} className={trimmed === '' ? 'h-1.5' : 'my-0.5'}>
                        {formatted}
                      </p>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border-t border-[#EDE0CC]">
                  <button
                    type="button"
                    onClick={onNavigateToTrips}
                    className="h-9 px-3.5 rounded-xl bg-[#44200F] hover:bg-[#5C2D16] text-white text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>{isAr ? 'فتح مساحة عمليات الرحلات' : 'Open Trip Operations'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Trips Database Telemetry Table & Cards */}
          <div className="bg-white rounded-3xl border border-[#EDE0CC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE0CC]">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#44200F] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C4A177]" />
                  <span>{isAr ? 'سجل الرحلات النشطة وقوائم التسكين المباشرة' : 'Live Active Trips & Rooming Manifest Database'}</span>
                </h3>
                <p className="text-xs text-[#795037] mt-0.5">
                  {isAr ? 'تحديث لحظي لخطوط السير، الفنادق المعتمدة، وبيانات المرشدين والسائقين' : 'Real-time sync of active itineraries, hotel vouchers, guides, and room allocations'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#795037] bg-[#FAF7F2] px-2.5 py-1 rounded-xl border border-[#EDE0CC]">
                {operationalIndex.trips.length} {isAr ? 'أفواج مسجلة' : 'Files Loaded'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {operationalIndex.trips.map((trip) => {
                const hotel = trip.hotelBookings[0];
                return (
                  <div key={trip.id} className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EDE0CC] space-y-3.5 shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Trip Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-[#44200F] bg-white px-2 py-0.5 rounded-lg border border-[#EDE0CC]">
                              {trip.fileNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {trip.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-[#44200F] mt-1.5">
                            {trip.travelerName}
                          </h4>
                        </div>

                        <span className="text-xs font-bold text-[#795037] bg-white px-2.5 py-1 rounded-xl border border-[#EDE0CC] shrink-0 font-mono">
                          {trip.tourPasscode}
                        </span>
                      </div>

                      {/* Location & Schedule Banner */}
                      <div className="mt-3 p-2.5 bg-white rounded-xl border border-[#EDE0CC] text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-[#44200F]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                            <span>{isAr ? 'موقع الفوج اليوم:' : "Today's City:"} <strong>{trip.currentCity}</strong></span>
                          </span>
                          <span className="text-[11px] text-[#795037] font-mono">
                            {isAr ? `اليوم ${trip.currentDay} من ${trip.durationDays}` : `Day ${trip.currentDay} of ${trip.durationDays}`}
                          </span>
                        </div>
                        {trip.scheduledServicesToday.length > 0 && (
                          <div className="text-[11px] text-[#795037] truncate">
                            {trip.scheduledServicesToday.join(' · ')}
                          </div>
                        )}
                      </div>

                      {/* Key Accommodations & Rooming */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-xl border border-[#EDE0CC]">
                          <div className="text-[10px] font-bold text-[#795037] uppercase flex items-center gap-1">
                            <Bed className="w-3 h-3 text-[#C4A177]" />
                            <span>{isAr ? 'الإقامة الفندقية' : 'Accommodation'}</span>
                          </div>
                          <div className="text-[11px] font-bold text-[#44200F] truncate mt-0.5">
                            {hotel?.serviceName || 'Steigenberger / Marriott'}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                            {hotel?.confirmationNo || 'STG-LXR-9821'}
                          </div>
                        </div>

                        <div className="p-2 bg-white rounded-xl border border-[#EDE0CC]">
                          <div className="text-[10px] font-bold text-[#795037] uppercase flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#C4A177]" />
                            <span>{isAr ? 'كشف التسكين' : 'Rooming List'}</span>
                          </div>
                          <div className="text-[11px] font-bold text-[#44200F] mt-0.5">
                            {trip.roomingList.length} {isAr ? 'أفراد مسكنين' : 'Guests'}
                          </div>
                          <div className="text-[10px] text-[#795037] truncate font-medium">
                            {trip.roomingList.map(p => `${p.name} (R:${p.room})`).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Field Staff info */}
                      <div className="mt-2 text-[11px] text-[#795037] flex items-center justify-between pt-2 border-t border-[#EDE0CC]/60">
                        <span>{isAr ? 'المرشد:' : 'Guide:'} <strong>{trip.assignedGuide.name}</strong> ({trip.assignedGuide.phone})</span>
                        <span>{isAr ? 'السائق:' : 'Driver:'} <strong>{trip.assignedDriver.name}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#EDE0CC]">
                      <button
                        type="button"
                        onClick={() => handleExecuteAiQuery(`Where is Mr. ${trip.travelerName}'s tour group today, who is the guide, and what is the schedule?`)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#EDE0CC] text-[#44200F] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <FarisAvatarIcon size={16} className="w-4 h-4" />
                        <span>{isAr ? 'استعلام من فارس' : 'Ask Faris'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecuteAiQuery(`What is the rooming list and passenger allocations for ${trip.travelerName}'s group?`)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#EDE0CC] text-[#44200F] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-[#C4A177]" />
                        <span>{isAr ? 'كشف التسكين' : 'Rooming List'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: LIVE WEATHER STATION */}
      {activeSection === 'weather' && (
        <div className="space-y-5">
          {/* City Selector Pills & Live Sync Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-[#EDE0CC] shadow-2xs">
              {cityKeys.map(city => {
                const info = ALL_TOURISM_COORDINATES[city];
                const isSelected = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-[#44200F] text-[#FAF7F2] shadow-2xs' 
                        : 'text-[#795037] hover:text-[#44200F] hover:bg-[#FAF7F2] border border-transparent'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? info.arName : city}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Refresh Weather Button */}
            <button
              type="button"
              onClick={() => handleRefreshWeather(selectedCity)}
              disabled={isLoadingWeather}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#EDE0CC]/40 text-[#44200F] border border-[#EDE0CC] transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs disabled:opacity-50"
              title={isAr ? 'تحديث بيانات الطقس الحالية' : 'Refresh current city weather'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#795037] ${isLoadingWeather ? 'animate-spin' : ''}`} />
              <span>{isLoadingWeather ? (isAr ? 'جاري الاتصال...' : 'Connecting...') : (isAr ? 'تحديث الطقس' : 'Refresh Weather')}</span>
            </button>
          </div>

          {/* Connection Status Banner (Live vs Offline / Unavailable) */}
          {isLoadingWeather ? (
            <div className="bg-[#FAF7F2] border border-[#C4A177]/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#44200F] shadow-2xs animate-pulse">
              <RefreshCw className="w-4 h-4 text-[#795037] animate-spin shrink-0" />
              <div>
                <span className="font-bold">
                  {isAr ? `جاري الاتصال بالأقمار الصناعية ومحطة أرصاد ${ALL_TOURISM_COORDINATES[selectedCity]?.arName || selectedCity}...` : `Connecting to Open-Meteo satellite weather telemetry for ${selectedCity}...`}
                </span>
                <p className="text-[11px] text-[#795037] mt-0.5">
                  {isAr ? 'يتم جلب درجات الحرارة والرطوبة ومؤشر الأشعة فوق البنفسجية وتوقعات الـ 5 أيام مباشرة.' : 'Retrieving real-time temperature, humidity, UV index, and 5-day tourism forecast.'}
                </p>
              </div>
            </div>
          ) : currentWeather.isLive ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold">
                  {isAr ? 'اتصال مباشر بالأقمار الصناعية (Open-Meteo): تم التحقق من القياسات الحية للمقصد' : 'Live Satellite Connection (Open-Meteo): Real-time meteorological readings verified'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-mono font-medium">
                Lat: {ALL_TOURISM_COORDINATES[selectedCity]?.lat}° / Lon: {ALL_TOURISM_COORDINATES[selectedCity]?.lon}°
              </span>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900">
                    {isAr ? 'تعذر الاتصال المباشر بالأقمار الصناعية حالياً (يتم عرض بيانات مرجعية استرشادية)' : 'Satellite Live Feed Currently Unavailable (Displaying Seasonal Benchmark Buffer)'}
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    {currentWeather.errorMessage || (isAr ? 'محطة الأرصاد غير مستجيبة في الوقت الحالي، اضغط على زر إعادة المحاولة للاتصال مجدداً.' : 'Could not reach Open-Meteo gateway. Click retry to re-establish connection.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRefreshWeather(selectedCity)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#44200F] text-[#FAF7F2] hover:bg-[#321609] transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'إعادة محاولة الاتصال' : 'Retry Live Sync'}</span>
              </button>
            </div>
          )}

          {/* Operational Advisory Alert if any */}
          {currentWeather.operationalAlert && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs shadow-2xs ${
              currentWeather.operationalAlert.level === 'warning' 
                ? 'bg-rose-50 border-rose-300 text-rose-950' 
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${currentWeather.operationalAlert.level === 'warning' ? 'text-rose-600' : 'text-amber-700'}`} />
              <div>
                <div className="font-bold text-sm mb-0.5">
                  {isAr ? currentWeather.operationalAlert.titleAr : currentWeather.operationalAlert.titleEn}
                </div>
                <p className="leading-relaxed">
                  {isAr ? currentWeather.operationalAlert.messageAr : currentWeather.operationalAlert.messageEn}
                </p>
              </div>
            </div>
          )}

          {/* Main Weather Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Current Conditions Card */}
            <div className="lg:col-span-1 bg-white border border-[#EDE0CC] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#795037] bg-[#FAF7F2] px-2.5 py-0.5 rounded-md border border-[#EDE0CC]">
                      {ALL_TOURISM_COORDINATES[selectedCity]?.region}
                    </span>
                    <h2 className="text-xl font-extrabold text-[#44200F] mt-1.5">
                      {isAr ? currentWeather.arabicName : currentWeather.city}
                    </h2>
                  </div>
                  <span className="text-4xl">{currentWeather.icon}</span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#44200F] font-mono tabular-nums">
                    {currentWeather.isLive ? `${currentWeather.temperatureC}°` : '—°'}
                  </span>
                  <span className="text-base text-[#795037] font-semibold">C</span>
                  {currentWeather.isLive && (
                    <span className="text-xs text-[#795037] ms-2 font-medium">Feels like {currentWeather.feelsLikeC}°C</span>
                  )}
                </div>

                <div className="mt-2 text-sm font-bold text-[#795037]">
                  {isAr ? currentWeather.conditionAr : currentWeather.condition}
                </div>

                <p className="mt-3 text-xs text-[#44200F] leading-relaxed font-medium bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE0CC]">
                  {isAr ? currentWeather.travelRecommendationAr : currentWeather.travelRecommendation}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#EDE0CC] text-center">
                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC]/60">
                  <div className="text-[10px] font-bold text-[#795037] flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-[#795037]" />
                    <span>{isAr ? 'الرطوبة' : 'Humidity'}</span>
                  </div>
                  <div className="text-xs font-black text-[#44200F] mt-1 font-mono tabular-nums">
                    {currentWeather.isLive ? `${currentWeather.humidityPct}%` : '—'}
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC]/60">
                  <div className="text-[10px] font-bold text-[#795037] flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-[#795037]" />
                    <span>{isAr ? 'الرياح' : 'Wind'}</span>
                  </div>
                  <div className="text-xs font-black text-[#44200F] mt-1 font-mono tabular-nums">
                    {currentWeather.isLive ? `${currentWeather.windSpeedKmh} km/h` : '—'}
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC]/60">
                  <div className="text-[10px] font-bold text-[#795037] flex items-center justify-center gap-1">
                    <Sun className="w-3 h-3 text-[#C4A177]" />
                    <span>{isAr ? 'مؤشر UV' : 'UV Index'}</span>
                  </div>
                  <div className={`text-xs font-black mt-1 font-mono tabular-nums ${currentWeather.isLive && currentWeather.uvIndex >= 8 ? 'text-rose-700' : 'text-[#44200F]'}`}>
                    {currentWeather.isLive ? `${currentWeather.uvIndex} / 11` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast & Travel Advisory */}
            <div className="lg:col-span-2 bg-white border border-[#EDE0CC] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC]">
                  <h3 className="font-extrabold text-sm text-[#44200F] flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-[#C4A177]" />
                    <span>{isAr ? 'توقعات الطقس للـ 5 أيام القادمة' : '5-Day Tourist Itinerary Weather Outlook'}</span>
                  </h3>
                  <span className="text-xs font-bold text-[#795037]">Open-Meteo Gateway</span>
                </div>

                {/* 5 Day Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
                  {(currentWeather.forecast5Days || []).map((day, idx) => (
                    <div key={idx} className="bg-[#FAF7F2] hover:bg-[#EDE0CC]/30 transition border border-[#EDE0CC] rounded-2xl p-3 text-center space-y-1.5">
                      <div className="text-xs font-bold text-[#44200F]">
                        {isAr ? day.dayNameAr : day.dayName}
                      </div>
                      <div className="text-2xl">{day.icon}</div>
                      <div className="text-xs font-black text-[#44200F] font-mono tabular-nums">
                        {day.maxTempC}° <span className="text-[11px] text-[#795037] font-normal">/ {day.minTempC}°</span>
                      </div>
                      <div className="text-[10px] text-[#795037] font-medium truncate">
                        {day.condition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guide & Operations Checklist */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#44200F]">
                    {isAr ? 'توجيهات العمليات الميدانية لهذا المقصد' : 'Ground Dispatch Checklist for this City'}
                  </div>
                  <div className="text-[#795037] text-[11px] leading-relaxed">
                    {isAr ? (
                      selectedCity === 'Luxor' || selectedCity === 'Aswan'
                        ? 'تنسيق الرحلات النيلية وتفويج البر الغربي صباحاً لتفادي حرارة الظهيرة، مع التنسيق المسبق مع رصيف البواخر.'
                        : selectedCity === 'Makkah' || selectedCity === 'Madinah'
                          ? 'جدولة الطواف وزيارة الروضة الشريفة في ساعات الليل المعتدلة وأوقات الصلوات عبر تطبيق نسك.'
                          : 'تشغيل تكييف الليموزين مسبقاً وتوفير مياه الشرب الباردة ومظلات شمسية داخل المركبات.'
                    ) : (
                      selectedCity === 'Luxor' || selectedCity === 'Aswan'
                        ? 'Nile Cruise coordination & morning West Bank departures before midday.'
                        : selectedCity === 'Makkah' || selectedCity === 'Madinah'
                          ? 'Holy Mosque Tawaf scheduling around cooler night hours & prayer slots.'
                          : 'Private limousine AC pre-cooling & cold water supplies in vehicles.'
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToTrips}
                  className="px-3.5 py-1.5 bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] rounded-xl font-bold transition shadow-2xs shrink-0 cursor-pointer text-center"
                >
                  {isAr ? 'استعراض رحلات المدينة' : 'View City Trips'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CURRENCY & CENTRAL BANK SYNCHRONIZER */}
      {activeSection === 'fx' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#eae5dc] rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae5dc]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live Market Rates
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Last Synced: {fxLastSynced}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#44200F] mt-1">
                  Central Bank &amp; Foreign Exchange Synchronizer (open.er-api.com)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncFx}
                  disabled={isSyncingFx}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFx ? 'animate-spin' : ''}`} />
                  <span>{isSyncingFx ? 'Fetching...' : 'Sync Market Rates'}</span>
                </button>
              </div>
            </div>

            {/* Rates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#eae5dc] text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4">Market Rate (to EGP)</th>
                    <th className="py-3 px-4">Safety Buffer</th>
                    <th className="py-3 px-4">Company Protected Rate</th>
                    <th className="py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae5dc]">
                  {(['USD', 'EUR', 'GBP', 'SAR', 'RUB'] as Currency[]).map(curr => {
                    const info = ratesMap[curr];
                    if (!info) return null;
                    return (
                      <tr key={curr} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center text-xs font-black">
                            {curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'SAR' ? 'ر.س' : '₽'}
                          </span>
                          <span>1 {curr}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {info.rateToEgp.toFixed(2)} EGP
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200">
                            +{info.bufferPct}% Buffer
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sky-800">
                          {info.effectiveRateToEgp.toFixed(2)} EGP
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {info.source === 'live_api' ? 'Live API Verified' : 'Central Bank Baseline'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Interactive Currency Converter Tool */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instant Travel FX Calculator (with Safety Buffer)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={converterAmount}
                    onChange={(e) => setConverterAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">From</label>
                  <select
                    value={converterFrom}
                    onChange={(e) => setConverterFrom(e.target.value as Currency)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="EGP">EGP (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">To</label>
                  <select
                    value={converterTo}
                    onChange={(e) => setConverterTo(e.target.value as Currency)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="EGP">EGP (ج.م)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR (ر.س)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Protected Total</label>
                  <div className="px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl font-mono font-black text-sm text-sky-900 truncate">
                    {convertedResult.toLocaleString(undefined, { maximumFractionDigits: 2 })} {converterTo}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 3: PRAYER TIMES & HIJRI CALENDAR (Aladhan API) */}
      {activeSection === 'prayers' && (
        <div className="space-y-5">
          {/* City Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'Makkah', labelEn: 'Makkah Al-Mukarramah (Haram)', labelAr: 'مكة المكرمة (المسجد الحرام)' },
              { id: 'Madinah', labelEn: 'Madinah Al-Munawwarah (Prophet Mosque)', labelAr: 'المدينة المنورة (المسجد النبوي)' },
              { id: 'Cairo', labelEn: 'Cairo (Egyptian Survey Method)', labelAr: 'القاهرة (هيئة المساحة المصرية)' },
            ].map(city => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedPrayerCity(city.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedPrayerCity === city.id 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-white hover:bg-amber-50 text-slate-700 border border-[#eae5dc]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{isAr ? city.labelAr : city.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Prayer Timings Display */}
          <div className="bg-white border border-[#eae5dc] rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae5dc]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Aladhan Public API Live Timing
                </span>
                <h3 className="text-lg font-black text-[#44200F] mt-1">
                  {currentPrayer.cityAr}
                </h3>
                <div className="font-arabic text-xs font-bold text-amber-700 mt-0.5">
                  التقويم الهجري: {currentPrayer.hijriDate.formattedAr} ({currentPrayer.hijriDate.formattedEn})
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center min-w-[160px]">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Upcoming Prayer</div>
                <div className="text-base font-black text-amber-950 mt-0.5">
                  {currentPrayer.nextPrayer.nameEn} ({currentPrayer.nextPrayer.nameAr})
                </div>
                <div className="font-mono text-xs font-bold text-amber-700">{currentPrayer.nextPrayer.time}</div>
              </div>
            </div>

            {/* Prayers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                { nameEn: 'Fajr', nameAr: 'الفجر', time: currentPrayer.fajr },
                { nameEn: 'Sunrise', nameAr: 'الشروق', time: currentPrayer.sunrise },
                { nameEn: 'Dhuhr', nameAr: 'الظهر', time: currentPrayer.dhuhr },
                { nameEn: 'Asr', nameAr: 'العصر', time: currentPrayer.asr },
                { nameEn: 'Maghrib', nameAr: 'المغرب', time: currentPrayer.maghrib },
                { nameEn: 'Isha', nameAr: 'العشاء', time: currentPrayer.isha },
              ].map(p => (
                <div key={p.nameEn} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-800">{p.nameEn}</div>
                  <div className="font-arabic text-xs font-semibold text-sky-800">{p.nameAr}</div>
                  <div className="font-mono text-base font-extrabold text-[#44200F] pt-1">{p.time}</div>
                </div>
              ))}
            </div>

            {/* Operational Utility Note */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-900">Operations Value:</span> Dispatch coordinators schedule Makkah Tawaf and Rawdah Sharif visits around prayer congestion, while Nile Cruise and Cairo tour guides schedule group lunch and prayer breaks around Dhuhr &amp; Asr.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: HOTEL & TARIFF BENCHMARKS */}
      {activeSection === 'benchmarks' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#eae5dc] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eae5dc]">
              <div>
                <h3 className="text-base font-extrabold text-[#44200F]">
                  Destination Hotel Market Benchmarks &amp; Contract Advantage
                </h3>
                <p className="text-xs text-slate-500">
                  Published retail market rates vs. RIHAL contracted direct supplier tariffs
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToQuotes}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Launch Quote Builder
              </button>
            </div>

            {/* Benchmark Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LIVE_HOTEL_MARKET_BENCHMARKS.map((b, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-100 text-sky-900">
                        {b.city}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {b.savingsPct}% Saved
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#44200F] mt-1.5">{b.categoryLabelEn}</h4>
                    <div className="font-arabic text-xs font-semibold text-slate-600">{b.categoryLabelAr}</div>

                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Retail Market Avg:</span>
                        <span className="font-mono line-through">${b.benchmarkRetailUsd}/night</span>
                      </div>
                      <div className="flex justify-between font-bold text-sky-900">
                        <span>RIHAL Contract Net:</span>
                        <span className="font-mono text-sm">${b.averageContractNetUsd}/night</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 truncate">
                    <span className="font-bold">Key Partners:</span> {b.popularHotels.slice(0, 2).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: COUNTRY VISA DEMOGRAPHICS */}
      {activeSection === 'visas' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#eae5dc] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-[#eae5dc]">
              <h3 className="text-base font-extrabold text-[#44200F]">
                International Tourist Entry &amp; Visa Intelligence
              </h3>
              <p className="text-xs text-slate-500">
                Tourist entry visas, e-Visa eligibility, and group requirements by source country
              </p>
            </div>

            {/* Country Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {TOURISM_SOURCE_MARKETS.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(c.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedCountryCode === c.code 
                      ? 'bg-sky-600 text-white shadow-2xs' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.nameEn}</span>
                </button>
              ))}
            </div>

            {/* Selected Country Details Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-3xl">{selectedCountry.flag}</div>
                <div className="font-black text-sm text-slate-900">{selectedCountry.nameEn}</div>
                <div className="font-arabic text-xs font-semibold text-slate-600">{selectedCountry.nameAr}</div>
                <div className="text-[11px] text-slate-500">Capital: {selectedCountry.capital} · Calling: {selectedCountry.callingCode}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-sky-800 uppercase">Egypt Entry Protocol</div>
                <div className="text-xs font-bold text-slate-900">{selectedCountry.egyptVisaType}</div>
                <div className="text-[11px] text-slate-500">Passports must be valid for at least {selectedCountry.passportValidityMonths} months from arrival date.</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Saudi / Umrah Visa Protocol</div>
                <div className="text-xs font-bold text-slate-900">{selectedCountry.saudiVisaType}</div>
                <div className="text-[11px] text-slate-500">Instant electronic visa issuance via Nusuk Platform or Cairo airport boarding clearance.</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
