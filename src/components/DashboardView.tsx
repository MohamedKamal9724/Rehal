import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, TrendingUp, DollarSign, ArrowUpRight, 
  ArrowRight, FileText, Database, Compass, Inbox, CheckCircle2,
  Sparkles, Layers, RefreshCw, Plane, Truck, UserCheck, Hotel,
  Moon, BarChart3, Users, Settings, Download, FileSpreadsheet,
  Plus, ShieldCheck, ExternalLink, Calendar, Search, CloudSun, Building, Key,
  AlertTriangle, Check, Shield, MapPin, ChevronRight, AlertCircle, PhoneCall
} from 'lucide-react';
import { Inquiry, Quote, UILanguage, Workspace } from '../types';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { exportPipelineToExcel, exportQuoteToLuxuryPDF, exportQuoteToExcel } from '../lib/exportUtils';
import { 
  ComprehensiveWeather, 
  fetchLiveComprehensiveWeather, 
  fetchLivePrayerTimes, 
  PrayerTimings 
} from '../lib/publicApisService';
import { 
  getStoredExchangeRates, 
  fetchLiveExchangeRates, 
  ExchangeRatesMap 
} from '../lib/currencyService';
import { loadTrips, TripFile, computeOperationalKpis } from '../lib/tripStore';
import { repository } from '../lib/storage';
import { PostOnboardingChecklist } from './dashboard/PostOnboardingChecklist';
import { SectionHelpTrigger } from './common/SectionHelpTrigger';

interface DashboardViewProps {
  workspace: Workspace;
  inquiries: Inquiry[];
  quotes: Quote[];
  uiLang: UILanguage;
  onNavigateTab: (tab: string, subTab?: string) => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onSelectQuote: (quote: Quote) => void;
  onOpenNewInquiry: () => void;
  onOpenOnboarding?: () => void;
  isDayOne?: boolean;
  onSimulateInquiry?: () => void;
  onSeedStarterRates?: () => void;
  onToggleDayOneMode?: (enabled: boolean) => void;
  hasRates?: boolean;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspace,
  inquiries,
  quotes,
  uiLang,
  onNavigateTab,
  onSelectInquiry,
  onSelectQuote,
  onOpenNewInquiry,
  isDayOne = false,
  onSimulateInquiry,
  onSeedStarterRates,
  hasRates = true,
  isLoading = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isAr = uiLang === 'ar';

  // Approved RIHAL Brand Palette Tokens
  const brandPrimary = workspace?.brandColors?.primary || '#44200F';
  const brandAccent = workspace?.brandColors?.accent || '#795037';
  const brandGold = workspace?.brandColors?.gold || '#C4A177';

  // Live APIs real-time state
  const [cairoWeather, setCairoWeather] = useState<ComprehensiveWeather | null>(null);
  const [luxorWeather, setLuxorWeather] = useState<ComprehensiveWeather | null>(null);
  const [makkahWeather, setMakkahWeather] = useState<ComprehensiveWeather | null>(null);
  const [makkahPrayer, setMakkahPrayer] = useState<PrayerTimings | null>(null);
  const [ratesMap, setRatesMap] = useState<ExchangeRatesMap>(() => getStoredExchangeRates());
  const [isLoadingApis, setIsLoadingApis] = useState(false);

  // Trips from store for real operations intelligence
  const [trips, setTrips] = useState<TripFile[]>(() => {
    try {
      return loadTrips();
    } catch {
      return [];
    }
  });

  const loadLiveApiData = async (forceRefresh = false) => {
    setIsLoadingApis(true);
    try {
      const fxPromise = fetchLiveExchangeRates(forceRefresh)
        .then(res => setRatesMap(res.rates))
        .catch(() => {});

      const cairoPromise = fetchLiveComprehensiveWeather('Cairo')
        .then(setCairoWeather)
        .catch(() => {});

      const luxorPromise = fetchLiveComprehensiveWeather('Luxor')
        .then(setLuxorWeather)
        .catch(() => {});

      const makkahPromise = fetchLiveComprehensiveWeather('Makkah')
        .then(setMakkahWeather)
        .catch(() => {});

      const prayerPromise = fetchLivePrayerTimes('Makkah')
        .then(setMakkahPrayer)
        .catch(() => {});

      await Promise.allSettled([fxPromise, cairoPromise, luxorPromise, makkahPromise, prayerPromise]);
    } finally {
      setIsLoadingApis(false);
    }
  };

  useEffect(() => {
    loadLiveApiData(false);
    try {
      setTrips(loadTrips());
    } catch {}
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      setTrips(loadTrips());
    } catch {}
    loadLiveApiData(true).finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    });
  };

  // Operational Attention Calculations (What needs attention today?)
  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'inquiry' | 'quote' | 'trip' | 'operational_missing';
      titleEn: string;
      titleAr: string;
      subtitleEn: string;
      subtitleAr: string;
      urgency: 'high' | 'medium' | 'low';
      actionLabelEn: string;
      actionLabelAr: string;
      onClick: () => void;
    }> = [];

    // 1. Open Inquiries awaiting action
    const newInquiries = inquiries.filter(i => i.status === 'New' || i.status === 'In Progress');
    newInquiries.slice(0, 3).forEach(inq => {
      items.push({
        id: `inq-${inq.id}`,
        category: 'inquiry',
        titleEn: `${inq.status === 'In Progress' ? 'Open Enquiry' : 'New Enquiry'}: ${inq.travelerName || 'Guest'}`,
        titleAr: `${inq.status === 'In Progress' ? 'طلب مفتوح' : 'طلب وارد جديد'}: ${inq.travelerName || 'عميل'}`,
        subtitleEn: `${inq.requirements?.cities?.[0] || inq.requirements?.destinationSummary || 'Egypt'} · ${inq.requirements?.durationDays || 4} days · Needs review or quote`,
        subtitleAr: `${inq.requirements?.cities?.[0] || inq.requirements?.destinationSummary || 'مصر'} · ${inq.requirements?.durationDays || 4} أيام · بانتظار الفحص أو التسعير`,
        urgency: 'high',
        actionLabelEn: 'Open Inquiry',
        actionLabelAr: 'فحص الطلب',
        onClick: () => {
          onSelectInquiry(inq);
          onNavigateTab('sales', 'inbox');
        },
      });
    });

    // 2. Quotes waiting for follow-up or customer decision
    const quotesWaiting = quotes.filter(q => q.status === 'Sent' || q.status === 'Viewed');
    quotesWaiting.slice(0, 2).forEach(q => {
      const sellVal = q.totals?.totalSell ?? (q as any).totalPriceQuoteCurrency ?? 0;
      const curr = q.displayCurrency || (q as any).targetCurrency || 'EGP';
      items.push({
        id: `q-${q.id}`,
        category: 'quote',
        titleEn: `Quote ${q.quoteNumber} awaiting decision`,
        titleAr: `عرض ${q.quoteNumber} بانتظار قرار العميل`,
        subtitleEn: `${q.travelerName} · ${curr} ${sellVal.toLocaleString()} · Sent to client`,
        subtitleAr: `${q.travelerName} · ${sellVal.toLocaleString()} ${curr} · تم الإرسال للعميل`,
        urgency: 'medium',
        actionLabelEn: 'View Quote',
        actionLabelAr: 'متابعة العرض',
        onClick: () => {
          onSelectQuote(q);
          onNavigateTab('sales', 'quotes');
        },
      });
    });

    // 3. Approaching trips (starting within 7 days) & Missing operational items
    const now = Date.now();
    const activeTrips = trips.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    
    activeTrips.forEach(t => {
      const tripStartMs = t.startDate ? new Date(t.startDate).getTime() : 0;
      const daysUntil = tripStartMs ? Math.ceil((tripStartMs - now) / (1000 * 60 * 60 * 24)) : 999;

      // Missing driver check
      if (!t.driverName || !t.driverPhone) {
        items.push({
          id: `trip-driver-${t.id}`,
          category: 'operational_missing',
          titleEn: `Driver not assigned: ${t.fileNumber}`,
          titleAr: `لم يتم تعيين سائق: ${t.fileNumber}`,
          subtitleEn: `${t.travelerName} · ${daysUntil <= 1 ? 'Departs tomorrow' : `Departs in ${daysUntil} days`} · Assign vehicle & driver`,
          subtitleAr: `${t.travelerName} · ${daysUntil <= 1 ? 'تغادر غداً' : `تغادر خلال ${daysUntil} أيام`} · تعيين السائق والمركبة`,
          urgency: daysUntil <= 3 ? 'high' : 'medium',
          actionLabelEn: 'Assign Driver',
          actionLabelAr: 'تعيين السائق',
          onClick: () => onNavigateTab('trips'),
        });
      }

      // Missing guide check
      if (!t.guideName || !t.guidePhone) {
        items.push({
          id: `trip-guide-${t.id}`,
          category: 'operational_missing',
          titleEn: `Tour guide unassigned: ${t.fileNumber}`,
          titleAr: `لم يتم تخصيص مرشد: ${t.fileNumber}`,
          subtitleEn: `${t.travelerName} · Language: ${t.guideLanguage || 'English'}`,
          subtitleAr: `${t.travelerName} · اللغة: ${t.guideLanguage || 'الإنجليزية'}`,
          urgency: daysUntil <= 3 ? 'high' : 'medium',
          actionLabelEn: 'Assign Guide',
          actionLabelAr: 'تخصيص المرشد',
          onClick: () => onNavigateTab('trips'),
        });
      }

      // Unconfirmed services or missing vouchers
      const unconfirmed = t.services.filter(s => s.status === 'To request' || s.status === 'Requested');
      if (unconfirmed.length > 0 && daysUntil <= 5) {
        items.push({
          id: `trip-vouchers-${t.id}`,
          category: 'operational_missing',
          titleEn: `Unconfirmed services on ${t.fileNumber}`,
          titleAr: `خدمات غير مؤكدة في ملف ${t.fileNumber}`,
          subtitleEn: `${unconfirmed.length} services need supplier confirmation & vouchers`,
          subtitleAr: `${unconfirmed.length} خدمات بحاجة لتأكيد الموردين وإصدار القسائم`,
          urgency: 'high',
          actionLabelEn: 'Open Trip',
          actionLabelAr: 'فتح الرحلة',
          onClick: () => onNavigateTab('trips'),
        });
      }

      // Approaching trip reminder
      if (daysUntil >= 0 && daysUntil <= 7) {
        items.push({
          id: `trip-approach-${t.id}`,
          category: 'trip',
          titleEn: `Trip ${t.fileNumber} departs in ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `${daysUntil} days`}`,
          titleAr: `الرحلة ${t.fileNumber} تبدأ ${daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'غداً' : `خلال ${daysUntil} أيام`}`,
          subtitleEn: `${t.travelerName} (${t.passengers?.length || 2} pax) · Check manifest & arrival flight`,
          subtitleAr: `${t.travelerName} (${t.passengers?.length || 2} ركاب) · مراجعة كشف الاستقبال والرحلة`,
          urgency: daysUntil <= 2 ? 'high' : 'medium',
          actionLabelEn: 'Review Trip',
          actionLabelAr: 'مراجعة الرحلة',
          onClick: () => onNavigateTab('trips'),
        });
      }
    });

    return items;
  }, [inquiries, quotes, trips, onNavigateTab, onSelectInquiry, onSelectQuote]);

  const liveKpis = useMemo(() => {
    const followUps = repository.getFollowUps(workspace.id);
    return computeOperationalKpis({ quotes, inquiries, trips, followUps });
  }, [quotes, inquiries, trips, workspace.id]);

  const confirmedQuotes = quotes.filter(q => q.status === 'Accepted');
  const activeInquiries = inquiries.filter(i => i.status === 'New' || i.status === 'In Progress');

  // The 5 Primary Core Workspaces
  const primaryWorkspaces = [
    {
      id: 'sales',
      titleEn: 'Sales Workspace',
      titleAr: 'مساحة المبيعات والعروض',
      descEn: 'Inquiry Inbox, Quote Builder, Decision Pipeline & Follow-ups',
      descAr: 'صندوق الطلبات، صانع العروض، مسار المبيعات ومتابعات العملاء',
      icon: Inbox,
      badge: `${activeInquiries.length} Active`,
      badgeAr: `${activeInquiries.length} طلب نشط`,
      action: () => onNavigateTab('sales'),
      borderColor: '#C4A177',
    },
    {
      id: 'trips',
      titleEn: 'Trips & Operations',
      titleAr: 'إدارة وتشغيل الرحلات',
      descEn: 'Upcoming, In Progress & Completed Trips, Rooming, Drivers & Vouchers',
      descAr: 'الرحلات القادمة، قيد التنفيذ، التسكين، السائقين، المرشدين والقسائم',
      icon: Plane,
      badge: `${trips.length} Trips`,
      badgeAr: `${trips.length} رحلات`,
      action: () => onNavigateTab('trips'),
      borderColor: '#44200F',
    },
    {
      id: 'library',
      titleEn: 'Rates & Operational Library',
      titleAr: 'مكتبة الأسعار والموردين',
      descEn: 'Contracted supplier tariffs, seasons, margins & multi-currency rules',
      descAr: 'أسعار العقود الرسمية، الموردين، المواسم، وهوامش الأمان للعملات',
      icon: Database,
      badge: hasRates ? 'Active Tariffs' : 'Needs Tariffs',
      badgeAr: hasRates ? 'الأسعار مفعلة' : 'بدء إدخال الأسعار',
      action: () => onNavigateTab('library'),
      borderColor: '#795037',
    },
    {
      id: 'company',
      titleEn: 'Company & Team',
      titleAr: 'إدارة الشركة وفريق العمل',
      descEn: 'Public B2B Showcase, Team Roles & Permissions, Preferences & Plan',
      descAr: 'الملف التعريفي العام، أعضاء الفريق والصلاحيات، والإعدادات',
      icon: Building,
      badge: 'Admin',
      badgeAr: 'الإدارة',
      action: () => onNavigateTab('team'),
      borderColor: '#C4A177',
    },
    ...(workspace.enableHajjUmrah !== false ? [{
      id: 'hajj_umrah',
      titleEn: 'Hajj & Umrah Sector',
      titleAr: 'قطاع الحج والعمرة (نُسك)',
      descEn: 'VIP & Economic packages, Makkah/Madinah hotels & Haramain train',
      descAr: 'برامج العمرة الاقتصادية والفاخرة، فنادق الحرمين والقطار السريع',
      icon: Moon,
      badge: 'Nusuk Ready',
      badgeAr: 'معتمد نُسك',
      action: () => onNavigateTab('hajj_umrah'),
      borderColor: '#10b981',
    }] : []),
  ];

  return (
    <div 
      className="space-y-6 animate-fadeIn"
      style={{
        '--brand-primary': brandPrimary,
        '--brand-accent': brandAccent,
        '--brand-gold': brandGold,
      } as React.CSSProperties}
    >
      {/* 1. OPERATIONAL WELCOME & PRIMARY ACTIONS */}
      <div 
        className="relative overflow-hidden rounded-2xl bg-white border border-[#EDE0CC] p-5 sm:p-7 shadow-xs"
        style={{ borderTop: `4px solid ${brandGold}` }}
      >
        <SectionHelpTrigger
          sectionKey="dashboard"
          uiLang={uiLang}
          size="sm"
          pinned={true}
          label={isAr ? 'دليل الاستخدام' : 'Guide'}
          onNavigateTab={onNavigateTab}
        />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 ltr:pr-14 rtl:pl-14">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
                {isAr ? 'نظام إدارة العمليات السياحية الموحد' : 'Unified Travel Operations Desk'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#44200F] tracking-tight">
              {isAr ? `مرحباً بك في ${workspace.name}` : `Welcome to ${workspace.name}`}
            </h1>
            <p className="text-xs text-[#795037] max-w-2xl leading-relaxed">
              {isAr 
                ? 'لوحة العمليات اليومية: فحص ما يحتاج تدخلك فوراً، متابعة عروض الأسعار، تشغيل الرحلات، وإصدار قسائم الخدمات للموردين.'
                : 'Your daily operations center: identify what needs immediate attention, track quote progress, dispatch approaching trips, and manage vouchers.'}
            </p>
          </div>

          {/* Quick Workflow Action Buttons - Standardized Equal Height h-10 & Balanced Layout */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('sales', 'quotes')}
              className="h-10 px-4 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-white border border-orange-500/30 hover:border-orange-400 w-full sm:w-auto min-w-[140px]"
            >
              <Plus className="w-4 h-4 text-orange-300" />
              <span>{isAr ? 'إنشاء عرض سعر' : 'Create Quote'}</span>
            </button>
            <button
              onClick={onOpenNewInquiry}
              className="h-10 px-4 bg-[#FAF7F2] hover:bg-orange-50/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#EDE0CC] hover:border-orange-300 text-[#44200F] w-full sm:w-auto min-w-[140px]"
            >
              <Inbox className="w-4 h-4 text-orange-600" />
              <span>{isAr ? 'تسجيل طلب وارد' : 'Add Enquiry'}</span>
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigateTab('trips')}
                className="h-10 px-4 bg-white hover:bg-orange-50/40 text-[#44200F] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#EDE0CC] hover:border-orange-300 flex-1 sm:flex-initial sm:min-w-[140px]"
              >
                <Plane className="w-4 h-4 text-[#795037]" />
                <span>{isAr ? 'إدارة الرحلات' : 'Manage Trips'}</span>
              </button>
              <button
                onClick={handleRefresh}
                className="h-10 w-10 flex items-center justify-center text-[#795037] hover:text-[#44200F] bg-[#FAF7F2] hover:bg-orange-50/60 border border-[#EDE0CC] hover:border-orange-300 rounded-xl transition cursor-pointer shrink-0"
                title={isAr ? 'تحديث البيانات' : 'Refresh Operations'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Onboarding Launch Checklist (Dismissible, opens exact screens) */}
      <PostOnboardingChecklist
        workspace={workspace}
        uiLang={uiLang}
        onNavigateTab={onNavigateTab}
      />

      {/* 1.5 SINGLE SOURCE OF TRUTH LIVE KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('sales', 'pipeline')}
          className="bg-white rounded-2xl border border-[#EDE0CC] hover:border-[#C4A177] p-4 text-start shadow-2xs transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'الإيرادات المؤكدة' : 'Booked Revenue'}
          </span>
          <div className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums mt-1">
            EGP {liveKpis.bookedRevenueEgp.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">
            {liveKpis.acceptedQuotesCount > 0
              ? (isAr ? `${liveKpis.acceptedQuotesCount} عرض مقبول ومؤكد` : `${liveKpis.acceptedQuotesCount} accepted quote${liveKpis.acceptedQuotesCount === 1 ? '' : 's'}`)
              : (isAr ? 'لا توجد عروض مؤكدة بعد' : 'No accepted quotes yet')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('sales', 'pipeline')}
          className="bg-white rounded-2xl border border-[#EDE0CC] hover:border-[#C4A177] p-4 text-start shadow-2xs transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'قيمة مسار المبيعات' : 'Pipeline Value'}
          </span>
          <div className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums mt-1">
            EGP {liveKpis.pipelineValueEgp.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-600 font-semibold mt-1">
            {liveKpis.activePipelineQuotesCount > 0
              ? (isAr ? `${liveKpis.activePipelineQuotesCount} عروض قيد التفاوض` : `${liveKpis.activePipelineQuotesCount} active quote${liveKpis.activePipelineQuotesCount === 1 ? '' : 's'} in pipeline`)
              : (isAr ? 'المسار فارغ حالياً' : 'No active quotes — pipeline empty')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('trips')}
          className="bg-white rounded-2xl border border-[#EDE0CC] hover:border-[#C4A177] p-4 text-start shadow-2xs transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'الرحلات النشطة' : 'Active Trips'}
          </span>
          <div className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums mt-1">
            {liveKpis.activeTripsCount}
          </div>
          <span className="text-[11px] text-slate-600 font-semibold mt-1">
            {isAr ? `من إجمالي ${liveKpis.totalTripsCount} ملف رحلة` : `${liveKpis.totalTripsCount} total trip file${liveKpis.totalTripsCount === 1 ? '' : 's'}`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('trips_vouchers')}
          className="bg-white rounded-2xl border border-[#EDE0CC] hover:border-[#C4A177] p-4 text-start shadow-2xs transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'القسائم المصدرة' : 'Issued Vouchers'}
          </span>
          <div className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums mt-1">
            {liveKpis.issuedVouchersCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">
            {isAr ? `${liveKpis.confirmedServicesCount} خدمة مؤكدة` : `${liveKpis.confirmedServicesCount} confirmed services`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('sales', 'inbox')}
          className="bg-white rounded-2xl border border-[#EDE0CC] hover:border-[#C4A177] p-4 text-start shadow-2xs transition cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'الطلبات والمتابعات' : 'Inquiries & Follow-ups'}
          </span>
          <div className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums mt-1">
            {liveKpis.openInquiriesCount} / {liveKpis.pendingFollowUpsCount}
          </div>
          <span className="text-[11px] text-slate-600 font-semibold mt-1">
            {isAr ? `${liveKpis.openInquiriesCount} طلب مفتوح · ${liveKpis.pendingFollowUpsCount} متابعة` : `${liveKpis.openInquiriesCount} open · ${liveKpis.pendingFollowUpsCount} follow-ups`}
          </span>
        </button>
      </div>

      {/* 2. OPERATIONAL ATTENTION CENTER ("What needs my attention?") */}
      <div className="bg-white rounded-2xl border border-[#EDE0CC] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EDE0CC]/60">
          <div className="flex items-center gap-2.5">
            <div className="luxury-icon-box luxury-icon-box-md luxury-icon-box-amber">
              <AlertCircle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#44200F]">
                {isAr ? 'ما يحتاج إلى انتباهك اليوم' : 'What Needs Your Attention Today?'}
              </h2>
              <p className="text-[11px] text-[#795037]">
                {isAr ? 'الطلبات الواردة الجديدة، العروض بانتظار الرد، والخدمات التشغيلية الناقصة' : 'New enquiries, quotes waiting for decision, and missing operational items'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]">
            {attentionItems.length} {isAr ? 'عناصر تتطلب تدخلاً' : 'Items require action'}
          </span>
        </div>

        {attentionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.map(item => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={item.onClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.onClick(); } }}
                className={`p-3.5 rounded-xl border transition-all text-start cursor-pointer group flex flex-col justify-between min-h-[110px] h-[110px] ${
                  item.urgency === 'high' 
                    ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200/90 text-amber-950' 
                    : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] border-[#EDE0CC] text-[#44200F]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.urgency === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.category === 'inquiry' ? (isAr ? 'طلب جديد' : 'New Lead') :
                       item.category === 'quote' ? (isAr ? 'متابعة عرض' : 'Quote Decision') :
                       item.category === 'trip' ? (isAr ? 'رحلة مقبلة' : 'Upcoming Trip') :
                       (isAr ? 'نقص تشغيلي' : 'Missing Item')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 flex items-center gap-0.5">
                      {isAr ? item.actionLabelAr : item.actionLabelEn}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-snug">
                    {isAr ? item.titleAr : item.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {isAr ? item.subtitleAr : item.subtitleEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-800 space-y-1">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold">
              {isAr ? 'كل العمليات تسير بانتظام ولا توجد نواقص تشغيلية حالياً!' : 'All operations are up to date! No pending bottlenecks.'}
            </p>
            <p className="text-[11px] text-emerald-600">
              {isAr ? 'يمكنك إنشاء عرض سعر جديد أو فحص مكتبة الأسعار والموردين.' : 'You can create a new quote or review your rates and suppliers.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. CORE BUSINESS JOURNEY WORKFLOW TIMELINE */}
      <div className="bg-white rounded-2xl border border-[#EDE0CC] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-extrabold text-[#44200F]">
              {isAr ? 'مسار العمليات السياحية الأساسي' : 'Core Travel Business Journey'}
            </h3>
            <p className="text-[11px] text-[#795037]">
              {isAr ? 'من استلام الطلب الأولي وحتى إتمام الرحلة الميدانية' : 'From initial lead intake to field trip completion'}
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#795037] hidden sm:inline">
            {isAr ? 'مسار عمل موحد وسلس' : 'Seamless End-to-End Flow'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {[
            { step: '1', titleEn: 'Inquiry', titleAr: 'الطلب الوارد', subEn: 'WhatsApp / Web', subAr: 'واتساب أو استمارة', tab: 'sales', subTab: 'inbox', active: activeInquiries.length > 0 },
            { step: '2', titleEn: 'Quote', titleAr: 'عرض السعر', subEn: 'Cost & Margins', subAr: 'التكلفة وهامش الربح', tab: 'sales', subTab: 'quotes', active: quotes.length > 0 },
            { step: '3', titleEn: 'Decision', titleAr: 'قرار العميل', subEn: 'Pipeline follow-up', subAr: 'متابعة الصفقات', tab: 'sales', subTab: 'pipeline', active: quotes.some(q => q.status === 'Sent' || q.status === 'Viewed') },
            { step: '4', titleEn: 'Confirmed Trip', titleAr: 'تأكيد الرحلة', subEn: 'Trip file generated', subAr: 'توليد ملف الرحلة', tab: 'trips', subTab: 'overview', active: confirmedQuotes.length > 0 },
            { step: '5', titleEn: 'Operations', titleAr: 'التشغيل والميدان', subEn: 'Vouchers, Drivers, Guides', subAr: 'القسائم، السائقين، المرشدين', tab: 'trips', subTab: 'overview', active: trips.length > 0 },
            { step: '6', titleEn: 'Completion', titleAr: 'اكتمال الرحلة', subEn: 'Guest review & report', subAr: 'التقييم والتقرير المالي', tab: 'analytics', active: true },
          ].map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => onNavigateTab(s.tab, s.subTab)}
              className="p-3 rounded-xl border border-[#EDE0CC] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] hover:border-[#C4A177] transition-all text-start cursor-pointer group flex flex-col justify-between h-[92px] min-h-[92px]"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 group-hover:text-[#44200F] mb-1">
                  <span>STEP {s.step}</span>
                  {s.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </div>
                <div className="text-xs font-black text-[#44200F] group-hover:text-[#795037]">
                  {isAr ? s.titleAr : s.titleEn}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {isAr ? s.subAr : s.subEn}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. FIRST-RUN WORKFLOW GUIDANCE (Simple 3 Actions) */}
      <div 
        className="rounded-2xl p-5 border border-[#C4A177]/40 shadow-xs"
        style={{
          background: `linear-gradient(135deg, ${brandPrimary}08 0%, ${brandGold}12 50%, #FAF7F2 100%)`
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#795037]">
              <Sparkles className="w-4 h-4 text-[#C4A177]" />
              <span>{isAr ? 'دليل الانطلاق والبدء السريع' : 'Quick Start Guidance'}</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#44200F] mt-1">
              {isAr ? 'كيف تبدأ العمل في رحال بدون تدريب مسبق؟' : 'How RIHAL Works In 3 Simple Steps'}
            </h3>
            <p className="text-xs text-[#795037] mt-0.5 max-w-xl">
              {isAr
                ? 'استقبل طلب السائح، اضغط تحويل لعرض سعر لسحب أسعار العقود تلقائياً، ثم انقل العرض المقبول لغرفة العمليات لإصدار القسائم.'
                : 'Intake traveller request, convert to a quote with automatic contracted rates, and transfer accepted quotes to trips for vouchers and drivers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <button
              onClick={onOpenNewInquiry}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition shadow-2xs cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
            >
              <Inbox className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{isAr ? '1. تسجيل طلب' : '1. Add Enquiry'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('sales', 'quotes')}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition shadow-2xs cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{isAr ? '2. بناء عرض سعر' : '2. Create Quote'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('trips')}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition shadow-2xs cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
            >
              <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{isAr ? '3. إدارة الرحلة' : '3. Manage Trip'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. THE 5 PRIMARY WORKSPACES (Replacing the 16 scattered technical modules) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#44200F]">
              {isAr ? 'المساحات التشغيلية الرئيسية' : 'Primary Operating Workspaces'}
            </h2>
            <p className="text-xs text-[#795037]">
              {isAr ? 'منظمة بدقة وفق مهامك اليومية بدون مصطلحات تقنية معقدة' : 'Organized around your core goals, without travel software clutter'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryWorkspaces.map(ws => {
            const Icon = ws.icon;
            return (
              <div
                key={ws.id}
                role="button"
                tabIndex={0}
                onClick={ws.action}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    ws.action();
                  }
                }}
                className="bg-white rounded-2xl border border-[#EDE0CC] p-5 shadow-xs hover:shadow-md hover:border-[#C4A177] transition-all cursor-pointer min-h-[220px] h-full flex flex-col justify-between group active:scale-[0.99]"
                style={{ borderTop: `3px solid ${ws.borderColor}` }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-gold transition-transform group-hover:scale-105">
                      <Icon className="w-5 h-5 text-amber-800" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-slate-700 border border-[#EDE0CC]">
                      {isAr ? ws.badgeAr : ws.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#44200F] transition-colors">
                      {isAr ? ws.titleAr : ws.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed h-10">
                      {isAr ? ws.descAr : ws.descEn}
                    </p>
                  </div>
                </div>

                <div 
                  className="pt-3 mt-3 border-t border-[#EDE0CC]/60 flex items-center justify-between text-xs font-bold"
                  style={{ color: brandPrimary }}
                >
                  <span>{isAr ? 'فتح مساحة العمل' : 'Open Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. COMPACT LIVE INTELLIGENCE STATUS BAR (Weather & FX) */}
      <div 
        className="border border-[#EDE0CC] rounded-2xl p-3.5 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#44200F]">
            <CloudSun className="w-4 h-4 text-[#C4A177]" />
            <span>{isAr ? 'الطقس وأسعار الصرف الحية:' : 'Live Weather & Currency Rates:'}</span>
          </div>

          <div className="h-8 inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 rounded-lg border border-[#EDE0CC] text-slate-700 font-semibold text-[11px] whitespace-nowrap shrink-0">
            <span>📍 {isAr ? 'القاهرة' : 'Cairo'}:</span>
            <span className="font-mono font-bold tabular-nums">{cairoWeather?.temperatureC ? `${cairoWeather.temperatureC}°C` : '28°C'}</span>
          </div>

          <div className="h-8 inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 rounded-lg border border-[#EDE0CC] text-slate-700 font-semibold text-[11px] whitespace-nowrap shrink-0">
            <span>📍 {isAr ? 'الأقصر' : 'Luxor'}:</span>
            <span className="font-mono font-bold tabular-nums">{luxorWeather?.temperatureC ? `${luxorWeather.temperatureC}°C` : '32°C'}</span>
          </div>

          <div className="h-8 inline-flex items-center gap-1 bg-[#FAF7F2] px-3 rounded-lg border border-[#EDE0CC] text-slate-700 font-semibold text-[11px] whitespace-nowrap shrink-0">
            <DollarSign className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="font-mono font-bold tabular-nums">1 USD = {(ratesMap.USD?.rateToEgp || 50.85).toFixed(2)} EGP</span>
          </div>
        </div>

        <div className="text-[11px] font-bold text-[#795037] flex items-center gap-1 whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isAr ? 'متصل ومحدث تلقائياً' : 'Auto-synced'}</span>
        </div>
      </div>

      {/* 7. RECENT CLIENT PROPOSALS & DIRECT ACTIONS */}
      <div className="bg-white rounded-2xl border border-[#EDE0CC] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#EDE0CC]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#44200F]">
              {isAr ? 'عروض الأسعار الحديثة وملفات العملاء' : 'Recent Client Proposals & Quotes'}
            </h3>
            <p className="text-xs text-[#795037] mt-0.5">
              {isAr ? 'تحميل مباشر لملفات الـ PDF الفاخرة وشيتات الإكسيل للتشغيل' : '1-Click Luxury PDF Proposals & Operator Excel Cost Sheets'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('sales', 'pipeline')}
              className="h-9 px-3.5 bg-[#FAF7F2] hover:bg-slate-100 text-slate-700 border border-[#EDE0CC] rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center whitespace-nowrap shrink-0"
            >
              {isAr ? 'عرض مسار المبيعات' : 'View Pipeline'}
            </button>
            <button
              onClick={() => onNavigateTab('sales', 'quotes')}
              style={{
                backgroundColor: brandPrimary,
                color: '#ffffff',
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-95"
            >
              <Plus className="w-3.5 h-3.5" style={{ color: brandGold }} />
              <span>{isAr ? 'عرض سعر جديد' : 'New Quote'}</span>
            </button>
          </div>
        </div>

        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#FAF7F2] text-[#795037] font-bold uppercase tracking-wider text-[10px] border-b border-[#EDE0CC]">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'رقم العرض / المسافر' : 'Quote # / Traveler'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المدة والتواريخ' : 'Duration & Dates'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'سعر البيع' : 'Sell Price'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'هامش الربح' : 'Margin'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'التحميلات والإجراءات' : 'Exports & Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE0CC]/40">
                {quotes.slice(0, 6).map(q => (
                  <tr key={q.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#44200F]">{q.travelerName || 'VIP Traveler'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{q.quoteNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{q.durationDays} {isAr ? 'أيام' : 'Days'}</div>
                      <div className="text-[11px] text-slate-400">{q.startDate || 'Upcoming'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#44200F] font-mono">
                        {(q.displayCurrency || (q as any).targetCurrency || 'EGP')} {(q.totals?.totalSell ?? (q as any).totalPriceQuoteCurrency ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">{q.displayCurrency || (q as any).targetCurrency || 'EGP'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="font-bold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${brandAccent}15`,
                          borderColor: `${brandAccent}35`,
                          color: brandAccent,
                        }}
                      >
                        {Math.round(q.totals?.marginPct ?? (q as any).marginPercent ?? 22)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        q.status === 'Sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => exportQuoteToLuxuryPDF(q, workspace)}
                          style={{
                            backgroundColor: `${brandGold}15`,
                            borderColor: `${brandGold}40`,
                            color: '#8C6D23',
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border hover:opacity-85"
                          title={isAr ? 'تحميل ملف PDF فاخر للعميل' : 'Download Luxury PDF Proposal'}
                        >
                          <Download className="w-3 h-3" style={{ color: '#8C6D23' }} />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => exportQuoteToExcel(q, workspace)}
                          style={{
                            backgroundColor: `${brandAccent}15`,
                            borderColor: `${brandAccent}40`,
                            color: brandAccent,
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border hover:opacity-85"
                          title={isAr ? 'تحميل شيت التكاليف بالإكسيل' : 'Download Cost Sheet Excel'}
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => onSelectQuote(q)}
                          style={{
                            backgroundColor: `${brandPrimary}10`,
                            borderColor: `${brandPrimary}30`,
                            color: brandPrimary,
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border hover:opacity-85"
                          title={isAr ? 'معاينة العرض الإلكتروني' : 'Preview Electronic Proposal'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isAr ? 'معاينة' : 'View'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="luxury-icon-box luxury-icon-box-xl luxury-icon-box-sand mx-auto">
              <FileText className="w-6 h-6 text-[#795037]" />
            </div>
            <h4 className="text-sm font-bold text-[#44200F]">
              {isAr ? 'لا توجد عروض أسعار مسجلة حتى الآن' : 'No quotes created yet'}
            </h4>
            <p className="text-xs text-[#795037] max-w-sm mx-auto">
              {isAr ? 'ابدأ الآن بإنشاء أول عرض سعر سياحي، واحسب التكلفة بدقة من مكتبة العقود مع تصدير PDF وإكسيل بضغطة زر.' : 'Start by creating your first travel proposal, calculate accurate supplier costs and export luxury PDFs and Excel sheets.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onNavigateTab('sales', 'quotes')}
                style={{
                  backgroundColor: brandPrimary,
                  color: '#ffffff',
                }}
                className="px-4 py-2 hover:opacity-95 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isAr ? 'إنشاء أول عرض سعر' : 'Create First Quote'}
              </button>
              {onSimulateInquiry && (
                <button
                  onClick={onSimulateInquiry}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC]/40 text-[#44200F] border border-[#EDE0CC] rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {isAr ? 'محاكاة طلب سياحي وارد' : 'Simulate Sample Inquiry'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
