import React, { useState } from 'react';
import { 
  Compass, Inbox, FileText, Kanban, Database, Clock, 
  BarChart3, Users, Settings, Search, CreditCard, 
  Plane, Moon, Truck, UserCheck, Hotel, Receipt,
  Sparkles, ArrowRight, ShieldCheck, FileSpreadsheet,
  Globe2, CheckCircle2, Bookmark, Layers, CloudSun, Building, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UILanguage, Workspace, Quote, Inquiry } from '../types';
import { GuidanceTrigger } from './common/GuidanceTrigger';

interface AllModulesViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  quotes: Quote[];
  inquiries: Inquiry[];
  onNavigateTab: (tabId: string, subTab?: string) => void;
  onOpenNewQuote: () => void;
  onOpenNewInquiry: () => void;
}

interface ModuleItem {
  id: string;
  tabId: string;
  subTab?: string;
  category: 'sales' | 'operations' | 'hajj' | 'finance' | 'admin';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeEn?: string;
  badgeAr?: string;
  stats?: string;
  featuresEn: string[];
  featuresAr: string[];
}

export const AllModulesView: React.FC<AllModulesViewProps> = ({
  workspace,
  uiLang,
  quotes,
  inquiries,
  onNavigateTab,
  onOpenNewQuote,
  onOpenNewInquiry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isAr = uiLang === 'ar';

  const pendingInquiriesCount = inquiries.filter(i => i.status === 'New').length;
  const activeQuotesCount = quotes.filter(q => q.status === 'Accepted' || q.status === 'Sent').length;

  const modules: ModuleItem[] = [
    // --- 1. SALES & PROPOSALS ---
    {
      id: 'dashboard',
      tabId: 'dashboard',
      category: 'sales',
      titleEn: 'Executive Dashboard & Cockpit',
      titleAr: 'لوحة القيادة والمؤشرات التنفيذية',
      subtitleEn: 'High-level business analytics, radar & day-one launchpad',
      subtitleAr: 'مؤشرات الأداء ورادار الرحلات وبدء التشغيل اليومي',
      descriptionEn: 'Unified operational cockpit showing conversion win rates, average margin, 7-day arrival radar, and fast action launchpads.',
      descriptionAr: 'قمرة القيادة الشاملة لمتابعة نسبة إغلاق المبيعات، متوسط هامش الربح، رادار الأفواج الواصلة خلال 7 أيام، وروابط البدء السريع.',
      icon: Compass,
      iconBg: 'bg-blue-500/10 text-blue-600',
      iconColor: 'text-blue-600',
      badgeEn: 'Executive KPI',
      badgeAr: 'مؤشرات الأداء',
      featuresEn: ['7-Day Arrivals Radar', 'Win-Rate Analytics', 'Fast Action Center'],
      featuresAr: ['رادار وصول الأفواج القادمة', 'تحليلات سرعة الإغلاق', 'مركز الإجراءات السريعة'],
    },
    {
      id: 'live_apis',
      tabId: 'live_apis',
      category: 'operations',
      titleEn: 'Live APIs & Weather Hub',
      titleAr: 'مركز الأرصاد والبيانات السياحية المباشرة',
      subtitleEn: 'Open-Meteo weather radar, live FX rates & Aladhan prayer clock',
      subtitleAr: 'رادار الطقس المباشر، أسعار الصرف الرسمية ومواقيت الصلاة',
      descriptionEn: 'Live satellite weather for 10 tourism cities, official Central Bank exchange rates with precautionary buffers, prayer times for Makkah, Madinah & Cairo, and hotel market rate benchmarks.',
      descriptionAr: 'رادار مباشر للأرصاد لـ 10 مدن سياحية، تحديث أسعار الصرف من البنك المركزي مع هامش أمان، مواقيت الصلاة للحرمين والقاهرة، ومؤشرات أسعار الفنادق.',
      icon: CloudSun,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      iconColor: 'text-emerald-600',
      badgeEn: 'Live Public APIs',
      badgeAr: 'بيانات حية ومباشرة',
      featuresEn: ['Open-Meteo 5-Day Radar', 'Live FX Synchronizer', 'Aladhan Prayer & Hijri Clock', 'Hotel Market Benchmarks'],
      featuresAr: ['رادار الأرصاد لـ 5 أيام', 'تحديث أسعار العملات الفوري', 'مواقيت الصلاة والتقويم الهجري', 'مؤشرات أسعار الفنادق المعتمدة'],
    },
    {
      id: 'inbox',
      tabId: 'inbox',
      category: 'sales',
      titleEn: 'Inquiry Inbox & Parsing',
      titleAr: 'صندوق الوارد واستقبال الطلبات',
      subtitleEn: 'Incoming WhatsApp chats, emails & inquiry triage',
      subtitleAr: 'استقبال الرسائل ومحادثات الواتساب وتصنيف الطلبات',
      descriptionEn: 'Receive traveler leads from WhatsApp, email or webhooks. Extract structured trip parameters and turn them into ready quotes in 10 seconds.',
      descriptionAr: 'استقبال طلبات السياح من الواتساب والبريد. استخراج تفاصيل الرحلة آلياً وتحويلها مباشرة لعرض سعر جاهز للتسعير.',
      icon: Inbox,
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      iconColor: 'text-indigo-600',
      badgeEn: pendingInquiriesCount > 0 ? `${pendingInquiriesCount} Pending` : 'Live Inbox',
      badgeAr: pendingInquiriesCount > 0 ? `${pendingInquiriesCount} طلب معلق` : 'صندوق مباشر',
      stats: `${inquiries.length} Inquiries Total`,
      featuresEn: ['WhatsApp Chat Ingestion', 'Smart Requirements Parser', 'SLA Response Timer'],
      featuresAr: ['استيراد محادثات واتساب', 'استخراج المتطلبات بدقة', 'مؤقت الاستجابة السريعة SLA'],
    },
    {
      id: 'quote_builder',
      tabId: 'quotes',
      category: 'sales',
      titleEn: 'Dynamic Quote & Itinerary Builder',
      titleAr: 'صانع عروض الأسعار والبرامج السياحية',
      subtitleEn: 'Cost calculations, margins, contracted rates & PDF generator',
      subtitleAr: 'حساب التكاليف وهوامش الربح وعقود الموردين وطباعة الـ PDF',
      descriptionEn: 'Day-by-day program builder linked to real supplier contracts. Instant live profit calculation, safety buffer, and 1-click luxury PDF/Excel export.',
      descriptionAr: 'بناء البرامج السياحية يوماً بيوم بناءً على أسعار العقود الفعلية. حساب فوري لهامش الربح وهامش تقلب العملة، وتصدير PDF وإكسيل فاخر.',
      icon: FileText,
      iconBg: 'bg-amber-500/10 text-amber-600',
      iconColor: 'text-amber-600',
      badgeEn: 'Core Engine',
      badgeAr: 'المحرك الأساسي',
      stats: `${quotes.length} Total Quotes`,
      featuresEn: ['Strict Contract Rates Only', 'Live Profit Margin Control', 'Luxury PDF & Excel Exports'],
      featuresAr: ['تسعير معتمد من العقود فقط', 'تحكم فوري بنسبة الربح', 'تصدير PDF فاخر وشيت إكسيل'],
    },
    {
      id: 'pipeline',
      tabId: 'pipeline',
      category: 'sales',
      titleEn: 'Interactive Sales Pipeline (Kanban)',
      titleAr: 'مسار المبيعات التفاعلي (كانبان)',
      subtitleEn: 'Drag-and-drop deal tracking from draft to confirmed payment',
      subtitleAr: 'متابعة مسار الصفقات والعروض من المسودة حتى تأكيد الدفع',
      descriptionEn: 'Visual deal board organized by status: Draft, Sent, Viewed, Accepted, and Lost. One-click status updates, client proposal links, and Excel export.',
      descriptionAr: 'لوحة تفاعلية مرئية لعروض الأسعار: مسودة، تم الإرسال، شوهد، تم القبول، أو ملغى. تحديث بضغطة زر وتصدير كامل للشيت المالي.',
      icon: Kanban,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      iconColor: 'text-emerald-600',
      badgeEn: `${activeQuotesCount} Active Deals`,
      badgeAr: `${activeQuotesCount} صفقة نشطة`,
      featuresEn: ['Visual Kanban Columns', 'Client View Tracker', 'Export Sales Ledger Excel'],
      featuresAr: ['أعمدة بصرية تفاعلية', 'تتبع فتح العميل للرابط', 'تصدير شيت المبيعات للإكسيل'],
    },

    // --- 2. LIVE OPERATIONS & DISPATCH ---
    {
      id: 'trip_radar',
      tabId: 'trips',
      subTab: 'overview',
      category: 'operations',
      titleEn: 'Operations Radar & Group Files',
      titleAr: 'رادار العمليات وغرفة متابعة الأفواج',
      subtitleEn: 'Live operational control, arrival dates & service execution',
      subtitleAr: 'التحكم الميداني المباشر، تواريخ الوصول وتنفيذ الخدمات',
      descriptionEn: 'Central operating room for confirmed trips. View arrival countdowns, unconfirmed service alerts, and track daily program execution across Egypt.',
      descriptionAr: 'غرفة العمليات المركزية للرحلات المؤكدة. رصد مواعيد وصول الأفواج، كشف الخدمات المعلقة، ومتابعة تنفيذ البرامج اليومية في مصر.',
      icon: Plane,
      iconBg: 'bg-sky-500/10 text-sky-600',
      iconColor: 'text-sky-600',
      badgeEn: 'Operations Hub',
      badgeAr: 'غرفة العمليات',
      featuresEn: ['Daily Itinerary Execution', 'Service Status Tracker', 'Incident & Notes Log'],
      featuresAr: ['تنفيذ البرنامج اليومي', 'متابعة تأكيد الخدمات', 'سجل الحوادث والملاحظات'],
    },
    {
      id: 'fleet_transport',
      tabId: 'trips_fleet',
      category: 'operations',
      titleEn: 'Fleet & Vehicle Dispatch',
      titleAr: 'حركة النقل والسيارات والمركبات',
      subtitleEn: 'Limousines, HiAce vans, coaster buses & driver assignments',
      subtitleAr: 'توزيع الليموزين، سيارات الهاي إس، الكوستر والباصات وتعيين السائقين',
      descriptionEn: 'Assign and dispatch drivers, track license plate numbers, vehicle types, flight airport pickups, and share trip details directly to drivers via WhatsApp.',
      descriptionAr: 'تخصيص السائقين والمركبات، تسجيل أرقام اللوحات، مواعيد استقبال المطارات، وإرسال بيانات الحركة للسائق مباشرة عبر الواتساب.',
      icon: Truck,
      iconBg: 'bg-teal-500/10 text-teal-600',
      iconColor: 'text-teal-600',
      badgeEn: 'Field Movement',
      badgeAr: 'حركة الميدان',
      featuresEn: ['Driver Contact & WhatsApp', 'Vehicle Plate & Type Tracking', 'Airport Meet & Assist Transfer'],
      featuresAr: ['إرسال البرنامج للسائق واتساب', 'تسجيل لوحة ونوع المركبة', 'استقبال ونقل المطارات'],
    },
    {
      id: 'guides_reps',
      tabId: 'trips_guides',
      category: 'operations',
      titleEn: 'Tour Guides & Airport Representatives',
      titleAr: 'المرشدون السياحيون وممثلو المطارات',
      subtitleEn: 'Licensed Egyptologists, spoken languages & airport passes',
      subtitleAr: 'مرشدو الآثار المرخصون، اللغات وتصاريح استقبال المطارات',
      descriptionEn: 'Assign qualified Egyptologists by language (English, Spanish, German, French, Russian, Italian). Deliver daily program itineraries and traveler names.',
      descriptionAr: 'تعيين المرشدين المرخصين حسب لغة الفوج (إنجليزي، إسباني، ألماني، فرنسي، روسي، إيطالي)، وتزويدهم ببيانات المسافرين وبرنامج الجولة اليومية.',
      icon: UserCheck,
      iconBg: 'bg-violet-500/10 text-violet-600',
      iconColor: 'text-violet-600',
      badgeEn: 'Egyptologists',
      badgeAr: 'إرشاد سياحي',
      featuresEn: ['Language Match Filter', 'WhatsApp Daily Itinerary', 'Airport Representative Duty'],
      featuresAr: ['تطابق لغة المرشد مع الفوج', 'إرسال البرنامج عبر واتساب', 'مندوبو استقبال المطارات'],
    },
    {
      id: 'hotel_rooming',
      tabId: 'trips_rooming',
      category: 'operations',
      titleEn: 'Hotel Rooming Lists & Accommodation',
      titleAr: 'حجوزات الفنادق وقوائم التسكين والغرف',
      subtitleEn: 'Passport manifests, room allocations (Single, Double, Suite)',
      subtitleAr: 'كشف الجوازات، توزيع الغرف (مفردة، مزدوجة، أجنحة) والفنادق',
      descriptionEn: 'Manage hotel check-in manifests, dietary requirements, room distribution, and export formatted Rooming List CSV/Excel for hotel reservations desks.',
      descriptionAr: 'إدارة كشوفات التسكين، المتطلبات الخاصة والوجبات، توزيع الكبائن والغرف، وتصدير ملف Rooming List جاهز لمكاتب حجز الفنادق.',
      icon: Hotel,
      iconBg: 'bg-rose-500/10 text-rose-600',
      iconColor: 'text-rose-600',
      badgeEn: 'Rooming Ready',
      badgeAr: 'تسكين وغرف',
      featuresEn: ['Rooming List CSV Export', 'Dietary & Passport Records', 'Nile Cruise Cabin Allocation'],
      featuresAr: ['تصدير كشف التسكين CSV', 'سجل الجوازات والملاحظات', 'تسكين كبائن بواخر النيل'],
    },
    {
      id: 'vouchers_dispatch',
      tabId: 'trips_vouchers',
      category: 'operations',
      titleEn: 'Vouchers & Dispatch Orders',
      titleAr: 'قسائم الخدمات وأوامر التشغيل الرسمية',
      subtitleEn: 'Official supplier vouchers, confirmation codes & A4 printing',
      subtitleAr: 'أوامر التوريد، قسائم الموردين المعتمدة والطباعة A4',
      descriptionEn: 'Generate official branded service vouchers for hotels, cruise lines, transport companies and local suppliers. 1-click batch print for the tour leader.',
      descriptionAr: 'إصدار قسائم توريد رسمية مختومة للفنادق، البواخر، وشركات النقل. طباعة حزمة الـ A4 المجمعة بالكامل بضغطة زر واحدة لتسليمها لمدير الرحلة.',
      icon: Receipt,
      iconBg: 'bg-orange-500/10 text-orange-600',
      iconColor: 'text-orange-600',
      badgeEn: 'Print Pack',
      badgeAr: 'طباعة فورية',
      featuresEn: ['Batch Print A4 Pack', 'Supplier Confirmation Codes', 'Automated Voucher Numbers'],
      featuresAr: ['طباعة مجمعة لملف الـ A4', 'أرقام تأكيد الموردين', 'ترقيم آلي للقسائم'],
    },
    {
      id: 'passcodes',
      tabId: 'passcodes',
      category: 'operations',
      titleEn: 'Tour Passcodes & Traveler Vouchers Hub',
      titleAr: 'إدارة وتوليد أكواد الأفواج والمسافرين',
      subtitleEn: 'Master group codes and individualized guest passcodes',
      subtitleAr: 'أكواد الفوج وأكواد مخصصة لكل عميل لفتح بوابته الهاتفية',
      descriptionEn: 'Generate, manage, copy and share access passcodes for tour groups and individual guests with 1-click WhatsApp messaging and mobile preview.',
      descriptionAr: 'توليد وإدارة ومشاركة الأكواد السرية الخاصة بالفوج والعملاء، مع إرسال مباشر عبر واتساب ومعاينة شاشة السائح المباشرة.',
      icon: Key,
      iconBg: 'bg-emerald-500/10 text-emerald-800',
      iconColor: 'text-emerald-800',
      badgeEn: 'Codes Hub',
      badgeAr: 'أكواد المسافرين',
      featuresEn: ['Individual Guest Codes', 'Master Tour Code', '1-Click WhatsApp Share'],
      featuresAr: ['أكواد شخصية لكل مسافر', 'كود عام للفوج', 'مشاركة فورية عبر واتساب'],
    },

    // --- 3. HAJJ & UMRAH SECTOR ---
    {
      id: 'hajj_umrah',
      tabId: 'hajj_umrah',
      category: 'hajj',
      titleEn: 'Hajj & Umrah Operating Sector (Nusuk)',
      titleAr: 'قطاع الحج والعمرة ومنصة نُسك',
      subtitleEn: 'Economic, 4-Star & VIP packages, Haramain train & Ziyarat',
      subtitleAr: 'البرامج الاقتصادية و4 نجوم والـ VIP، قطار الحرمين والمزارات',
      descriptionEn: 'Dedicated religious tourism portal: Makkah & Madinah hotel contracts, Nusuk visa codes, ritual guides, pilgrim passport registrations, and instant quotes.',
      descriptionAr: 'منظومة السياحة الدينية المتكاملة: عقود فنادق مكة والمدينة، أكواد تراخيص منصة نسك، حجز قطار الحرمين، تسجيل بيانات المعتمرين، وتسعير البرامج فوراً.',
      icon: Moon,
      iconBg: 'bg-emerald-600/10 text-emerald-700',
      iconColor: 'text-emerald-700',
      badgeEn: 'Nusuk Integrated',
      badgeAr: 'معتمد ومنصة نسك',
      featuresEn: ['Makkah & Madinah Tariffs', 'Sacred Ziyarat Circuits', 'Haramain Train Booking Hub'],
      featuresAr: ['أسعار فنادق مكة والمدينة', 'مسارات المزارات الشريفة', 'حجوزات قطار الحرمين السريع'],
    },

    // --- 4. CONTRACTING & FINANCIALS ---
    {
      id: 'rate_library',
      tabId: 'library',
      category: 'finance',
      titleEn: 'Rates & Suppliers',
      titleAr: 'مكتبة الأسعار والموردين',
      subtitleEn: 'Hotels, Nile cruises, transport, guides & entrance fees base',
      subtitleAr: 'الفنادق، البواخر النيلية، النقل، المرشدين، ورسوم التذاكر',
      descriptionEn: 'The single source of truth for all pricing. Verified supplier contracts, seasonal tariffs, currency conversion with safety margins, and Excel imports.',
      descriptionAr: 'المرجع الرسمي والوحيد للتسعير في الشركة. عقود الموردين المعتمدة، أسعار المواسم، تحويل العملات مع هامش الأمان المالي، واستيراد وتصدير إكسيل.',
      icon: Database,
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      iconColor: 'text-cyan-600',
      badgeEn: 'Strict Contracting',
      badgeAr: 'عقود رسمية معتمدة',
      featuresEn: ['Zero-Hallucination Pricing', 'Multi-Season Rate Rules', 'Download Rate Template Excel'],
      featuresAr: ['تسعير دقيق بدون أخطاء', 'قواعد المواسم المتباينة', 'تحميل شيت التعاقدات بالإكسيل'],
    },
    {
      id: 'analytics',
      tabId: 'analytics',
      category: 'finance',
      titleEn: 'Financial Analytics & Profit Ledger',
      titleAr: 'التحليلات المالية ودفتر الأرباح',
      subtitleEn: 'Revenue streams, profit margins, conversion win rates & audits',
      subtitleAr: 'الإيرادات، هوامش الربح المحققة، نسب الإغلاق، وسجلات التدقيق',
      descriptionEn: 'Deep financial insight into operations. Track gross revenue, net supplier costs, achieved profit margins by destination, and staff quotation performance.',
      descriptionAr: 'رؤية مالية تنفيذية شاملة. متابعة الإيراد الإجمالي، تكاليف التوريد الصافية، متوسط هامش الربح حسب الوجهات، وأداء مسؤولي المبيعات.',
      icon: BarChart3,
      iconBg: 'bg-blue-600/10 text-blue-700',
      iconColor: 'text-blue-700',
      badgeEn: 'Profit Analytics',
      badgeAr: 'دفتر الأرباح',
      featuresEn: ['Gross vs Net Breakdown', 'Target Currency Audits', 'Monthly Sales Velocity'],
      featuresAr: ['تفصيل الإجمالي مقابل الصافي', 'تدقيق عملات البيع والتوريد', 'معدل سرعة المبيعات الشهري'],
    },
    {
      id: 'followups',
      tabId: 'followups',
      category: 'finance',
      titleEn: 'Client Follow-ups & Reminders',
      titleAr: 'متابعات العملاء والمهام الذكية',
      subtitleEn: 'Proposal view notifications & 1-click WhatsApp follow-ups',
      subtitleAr: 'إشعارات فتح العروض ومتابعات الواتساب السريعة بضغطة زر',
      descriptionEn: 'Never lose a lead. Receive instant notifications when a traveler views their proposal, track expiring options, and send customized follow-ups via WhatsApp.',
      descriptionAr: 'لا تفقد أي عميل محتمل. إشعارات فورية عند فتح العميل لصفحة العرض، تنبيهات قبل انتهاء صلاحية الأسعار، ومراسلة سريعة عبر واتساب.',
      icon: Clock,
      iconBg: 'bg-amber-600/10 text-amber-700',
      iconColor: 'text-amber-700',
      badgeEn: 'SLA Retention',
      badgeAr: 'حفظ المبيعات',
      featuresEn: ['1-Click WhatsApp Follow-up', 'Expiring Quote Alerts', 'Traveler Interaction Status'],
      featuresAr: ['مراسلة العميل واتساب بضغطة', 'تنبيهات انتهاء العروض', 'سجل تفاعل السائح مع الرابط'],
    },

    // --- 5. WORKSPACE & TEAM ---
    {
      id: 'team_settings',
      tabId: 'team',
      category: 'admin',
      titleEn: 'Team Management & Role Permissions',
      titleAr: 'فريق العمل وتوزيع الصلاحيات (RBAC)',
      subtitleEn: 'Owners, Ops Managers, Reservation Clerks & Guides',
      subtitleAr: 'المدير العام، مدراء التشغيل، مسؤولو الحجوزات والمرشدون',
      descriptionEn: 'Add team members and define granular permissions: hide supplier net costs from junior staff, authorize quote sending, and manage operational logs.',
      descriptionAr: 'إضافة أعضاء الفريق وتحديد الصلاحيات بدقة: حجب تكلفة التوريد الصافية عن الموظفين، اعتماد إرسال العروض، ومراجعة سجلات العمليات.',
      icon: Users,
      iconBg: 'bg-purple-500/10 text-purple-600',
      iconColor: 'text-purple-600',
      badgeEn: 'Access Control',
      badgeAr: 'صلاحيات وأمان',
      featuresEn: ['Role-Based Access (RBAC)', 'Hide Net Cost Protection', 'Audit Trail Activity Logs'],
      featuresAr: ['صلاحيات حسب الرتبة', 'حماية التكلفة الصافية', 'سجل نشاط وتدقيق العمليات'],
    },
    {
      id: 'subscription_plan',
      tabId: 'plan',
      category: 'admin',
      titleEn: 'Subscription Plan & Workspace Quotas',
      titleAr: 'باقة الاشتراك والحصص التشغيلية',
      subtitleEn: 'Active quotas, team seats & cloud sync',
      subtitleAr: 'الحصص التشغيلية، مقاعد فريق العمل والمزامنة السحابية',
      descriptionEn: 'Check current operational limits, quote quotas, team seat allocation, and upgrade to unlock advanced Hajj & Umrah modules.',
      descriptionAr: 'الاطلاع على الحصص التشغيلية لإنشاء العروض، مقاعد فريق العمل، وخيارات الترقية لفتح الميزات المتقدمة ومسارات الحج والعمرة.',
      icon: CreditCard,
      iconBg: 'bg-emerald-600/10 text-emerald-700',
      iconColor: 'text-emerald-700',
      badgeEn: 'Enterprise Active',
      badgeAr: 'باقة الشركات النشطة',
      featuresEn: ['Unlimited Quote Generation', 'Multi-User Collaboration', 'Automated PDF Engine'],
      featuresAr: ['إنشاء عروض غير محدود', 'تعاون كامل لفريق العمل', 'محرك تصدير الـ PDF'],
    },
    {
      id: 'agency_showcase',
      tabId: 'agency_showcase',
      category: 'admin',
      titleEn: 'Company Profile & Studio',
      titleAr: 'بروفايل الشركة والستوري والإعدادات',
      subtitleEn: 'Company profile, multi-currency settings, B2B showcase & gallery',
      subtitleAr: 'الهوية البصرية، العملات، القدرات التشغيلية ومعرض الصور',
      descriptionEn: 'Configure company branding, currencies, and public B2B showcase. Features operational capabilities, luxury fleet showcase, photo gallery, and Egyptologist guide roster.',
      descriptionAr: 'إدارة هوية الشركة والعملات والواجهة الرقمية أمام شركاء السياحة. تتضمن القدرات التشغيلية، أسطول الحافلات، معرض الصور، ولغات الإرشاد.',
      icon: Building,
      iconBg: 'bg-amber-600/10 text-amber-700',
      iconColor: 'text-amber-700',
      badgeEn: 'Profile & Studio',
      badgeAr: 'البروفايل والاستوديو',
      featuresEn: ['Operational Readiness Status', 'High-Res Photo Gallery & Studio', 'Multi-Currency & Branding Settings'],
      featuresAr: ['مؤشر الجاهزية التشغيلية', 'معرض صور واستوديو القصص', 'إعدادات الهوية والعملات'],
    },
  ];

  // Filtering
  const filteredModules = modules.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery = 
      m.titleEn.toLowerCase().includes(q) ||
      m.titleAr.includes(q) ||
      m.subtitleEn.toLowerCase().includes(q) ||
      m.subtitleAr.includes(q) ||
      m.descriptionEn.toLowerCase().includes(q) ||
      m.descriptionAr.includes(q) ||
      m.featuresEn.some(f => f.toLowerCase().includes(q)) ||
      m.featuresAr.some(f => f.includes(q));

    return matchesCategory && matchesQuery;
  });

  const categories = [
    { id: 'all', labelEn: `All Modules (${modules.length})`, labelAr: `كافة الأقسام (${modules.length})` },
    { id: 'sales', labelEn: 'Sales & Proposals', labelAr: 'المبيعات والعقود' },
    { id: 'operations', labelEn: 'Live Operations & Field', labelAr: 'التشغيل والحركة والميدان' },
    { id: 'hajj', labelEn: 'Hajj & Umrah Sector', labelAr: 'قطاع الحج والعمرة' },
    { id: 'finance', labelEn: 'Contracting & Finance', labelAr: 'التسعير والمالية' },
    { id: 'admin', labelEn: 'Workspace & Team', labelAr: 'إدارة النظام والشركة' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-700/60">
        <GuidanceTrigger
          sectionKey="dashboard"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={isAr ? 'دليل الأقسام' : 'Modules Guide'}
          onNavigateTab={onNavigateTab}
        />
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 ltr:pr-14 rtl:pl-14">

          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'خريطة المنظومة الشاملة لشركة السياحة' : 'Enterprise Tourism ERP Directory'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? 'دليل أقسام وإمكانيات المنظومة بالكامل' : 'All Operating Modules & Departments'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr 
                ? 'منظومة تشغيل متكاملة تغطي كافة قطاعات العمل السياحي: من استقبال رسائل واستفسارات السائحين إلى التسعير، مسار المبيعات، حركة السيارات والنقل، الإرشاد، تسكين الفنادق، قسائم التشغيل، الحج والعمرة، والتقارير المالية.'
                : 'A unified operating system covering every tourism workflow: from incoming lead intake and AI parsing, dynamic costing, interactive pipeline, fleet dispatch, Egyptology guides, rooming lists, vouchers, Hajj & Umrah, and financial analytics.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewQuote}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? '+ إنشاء عرض سعر جديد' : '+ New Itinerary Quote'}</span>
            </button>
            <button
              onClick={onOpenNewInquiry}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Inbox className="w-4 h-4" />
              <span>{isAr ? '+ تسجيل طلب وارد' : '+ Log Incoming Inquiry'}</span>
            </button>
          </div>
        </div>

        {/* Live Filter & Search Toolbar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن أي قسم أو وظيفة (فنادق، سيارات، مرشدين، نسك، أسعار، PDF)...' : 'Search modules, functions, fleet, rooming, Nusuk, pricing, Excel...'}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl ps-10 pe-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Module Counters */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{isAr ? `${filteredModules.length} قسماً معروضاً` : `${filteredModules.length} Modules Visible`}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>{isAr ? `الشركة: ${workspace.name}` : `Company: ${workspace.name}`}</span>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="luxury-tab-bar flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-nowrap">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center justify-center
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}
              `}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          );
        })}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 min-h-[350px] flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Header row: Icon & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.iconBg} shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {m.badgeEn && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {isAr ? m.badgeAr : m.badgeEn}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {isAr ? m.titleAr : m.titleEn}
                    </h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                      {isAr ? m.subtitleAr : m.subtitleEn}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2 h-9">
                      {isAr ? m.descriptionAr : m.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Feature bullets */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {(isAr ? m.featuresAr : m.featuresEn).slice(0, 3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {m.stats || (isAr ? 'جاهز للاستخدام' : 'Production Ready')}
                </span>
                <button
                  onClick={() => onNavigateTab(m.tabId, m.subTab)}
                  className="px-3 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-800 border border-slate-200 hover:border-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>{isAr ? 'فتح القسم' : 'Open Module'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'لم يتم العثور على أي قسم بهذا الاسم' : 'No matching module found'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'جرب البحث بكلمات أخرى أو اختر "كافة الأقسام" لعرض كل الإمكانيات.' : 'Try different keywords or select "All Modules" to view all available departments.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition cursor-pointer"
          >
            {isAr ? 'إعادة ضبط البحث' : 'Clear Filters'}
          </button>
        </div>
      )}
    </div>
  );
};
