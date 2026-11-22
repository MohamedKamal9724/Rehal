import { ProposalLanguage, UILanguage } from '../types';

export const UI_TRANSLATIONS: Record<UILanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.inbox': 'Inbox',
    'nav.quotes': 'Quotes & Pricing',
    'nav.pipeline': 'Pipeline',
    'nav.trips': 'Group & Trip Operations',
    'nav.rates': 'Rate Library',
    'nav.followups': 'Follow-ups',
    'nav.hajj_umrah': 'Hajj & Umrah',
    'nav.analytics': 'Analytics',
    'nav.team': 'Team & Roles',
    'nav.settings': 'Settings',
    'nav.plan': 'Subscription Plan',

    // Topbar
    'topbar.search_placeholder': 'Search quotes, inquiries, travelers, rates... (⌘K)',
    'topbar.live_badge': 'LIVE WORKSPACE',
    'topbar.reset_data': 'Clear Workspace Data',
    'topbar.switch_role': 'Role View:',

    // Common
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create New',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.currency': 'Currency',
    'common.total': 'Total',
    'common.margin': 'Margin',
    'common.cost': 'Net Cost',
    'common.price': 'Sell Price',
    'common.back': 'Back',
    'common.copied': 'Copied to clipboard!',
    'common.loading': 'Loading...',
    'common.days': 'Days',
    'common.adults': 'Adults',
    'common.children': 'Children',

    // Inquiries & Parsing
    'inbox.title': 'Inquiry Inbox',
    'inbox.subtitle': 'Incoming chats & emails across channels with AI requirements parsing',
    'inbox.new_inquiry': 'Paste New Inquiry',
    'inbox.simulate_webhook': 'Simulate Inbound Webhook',
    'inbox.sla_timer': 'SLA Timer',
    'inbox.source': 'Source',
    'inbox.assigned_to': 'Assigned Agent',
    'inbox.ai_parse_btn': 'AI Parse Requirements',
    'inbox.side_by_side': 'Side-by-Side Review',
    'inbox.raw_message': 'Original Traveler Message',
    'inbox.extracted_fields': 'Extracted Structured Requirements',
    'inbox.confirm_requirements': 'Confirm & Create Quote',
    'inbox.suggested_reply': 'Suggested Traveler Reply Draft',

    // Rate Library
    'rates.title': 'Rate Library',
    'rates.subtitle': 'Strict supplier contracting base. No AI hallucinated pricing.',
    'rates.suppliers_tab': 'Suppliers',
    'rates.rates_tab': 'Rates & Contracts',
    'rates.seasons_tab': 'Seasons',
    'rates.fx_tab': 'Exchange Rates & Buffer',
    'rates.add_rate': 'Add Rate',
    'rates.add_supplier': 'Add Supplier',
    'rates.missing_detector': 'Missing Rate Detector',
    'rates.rates_verified': 'Official Contracted Tariffs',
    'rates.filter_city': 'Filter by City',
    'rates.filter_type': 'Filter by Type',

    // Quote Builder
    'quotes.title': 'Quotes & Itineraries',
    'quotes.new_quote': 'Create Quote',
    'quotes.builder_title': 'Itinerary Quote Builder',
    'quotes.ai_draft_itinerary': 'AI Draft from Rates Only',
    'quotes.day_by_day': 'Day-by-Day Itinerary',
    'quotes.add_day': 'Add Day',
    'quotes.add_service': 'Add Service from Rate Library',
    'quotes.sticky_summary': 'Pricing & Margin Summary',
    'quotes.missing_rate_alert': 'Warning: Missing rate line items must be resolved before sending.',
    'quotes.generate_proposal': 'Generate Branded Proposal Link',

    // Proposal
    'proposal.view_proposal': 'View Public Proposal',
    'proposal.print_pdf': 'Download / Print PDF',
    'proposal.interested_btn': "I'm Interested in this Trip",
    'proposal.contact_whatsapp': 'Chat with Tour Specialist on WhatsApp',
    'proposal.views_recorded': 'Views Recorded',
    'proposal.day_itinerary': 'Your Day-by-Day Itinerary',
    'proposal.inclusions': 'What is Included',
    'proposal.payment_notice': 'Payment Instructions (Operator Direct)',

    // Follow-ups
    'followups.title': 'Follow-up Automation & Tasks',
    'followups.subtitle': 'Smart alerts when travelers open proposals or SLA deadlines approach',
    'followups.today_queue': "Today's Follow-up Queue",
    'followups.one_click_whatsapp': 'Copy Draft & Open WhatsApp',

    // Analytics
    'analytics.title': 'Executive Analytics & Pipeline',
    'analytics.subtitle': 'DMC conversion rates, inquiry-to-quote speed, margin analytics',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.inbox': 'صندوق الوارد',
    'nav.quotes': 'عروض الأسعار والتسعير',
    'nav.pipeline': 'مسار المبيعات',
    'nav.trips': 'تشغيل الأفواج والرحلات',
    'nav.rates': 'مكتبة الأسعار والعقود',
    'nav.followups': 'المتابعات والمهام',
    'nav.hajj_umrah': 'الحج والعمرة',
    'nav.analytics': 'التحليلات والأداء',
    'nav.team': 'فريق العمل والصلاحيات',
    'nav.settings': 'إعدادات الشركة',
    'nav.plan': 'باقة الاشتراك',

    // Topbar
    'topbar.search_placeholder': 'بحث في العروض والطلبات والأسعار والموردين... (⌘K)',
    'topbar.live_badge': 'مساحة العمل المباشرة',
    'topbar.reset_data': 'مسح بيانات مساحة العمل',
    'topbar.switch_role': 'معاينة الصلاحية:',

    // Common
    'common.save': 'حفظ التعديلات',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء جديد',
    'common.status': 'الحالة',
    'common.actions': 'الإجراءات',
    'common.currency': 'العملة',
    'common.total': 'الإجمالي',
    'common.margin': 'هامش الربح',
    'common.cost': 'تكلفة التوريد (الصافي)',
    'common.price': 'سعر البيع',
    'common.back': 'رجوع',
    'common.copied': 'تم النسخ للحافظة!',
    'common.loading': 'جاري التحميل...',
    'common.days': 'أيام',
    'common.adults': 'بالغين',
    'common.children': 'أطفال',

    // Inquiries & Parsing
    'inbox.title': 'صندوق طلبات السفر',
    'inbox.subtitle': 'استقبال المحادثات والرسائل مع استخراج البيانات بالذكاء الاصطناعي',
    'inbox.new_inquiry': 'لصق طلب جديد',
    'inbox.simulate_webhook': 'محاكاة رسالة واتساب واردة',
    'inbox.sla_timer': 'مؤقت الاستجابة (SLA)',
    'inbox.source': 'المصدر',
    'inbox.assigned_to': 'المسؤول',
    'inbox.ai_parse_btn': 'استخراج المتطلبات بالذكاء الاصطناعي',
    'inbox.side_by_side': 'مراجعة جنباً إلى جنب',
    'inbox.raw_message': 'رسالة العميل الأصلية',
    'inbox.extracted_fields': 'المتطلبات المنظمة المستخرجة',
    'inbox.confirm_requirements': 'تأكيد وإنشاء عرض السعر',
    'inbox.suggested_reply': 'مسودة الرد المقترح للعميل',

    // Rate Library
    'rates.title': 'مكتبة الأسعار والتعاقدات',
    'rates.subtitle': 'قاعدة تعاقدات الموردين الصارمة. لا أسعار وهمية من الذكاء الاصطناعي.',
    'rates.suppliers_tab': 'الموردين والشركاء',
    'rates.rates_tab': 'الأسعار والخدمات',
    'rates.seasons_tab': 'المواسم السياحية',
    'rates.fx_tab': 'أسعار الصرف وهامش الأمان',
    'rates.add_rate': 'إضافة سعر خدمة',
    'rates.add_supplier': 'إضافة مورد جديد',
    'rates.missing_detector': 'كاشف الأسعار الناقصة',
    'rates.rates_verified': 'عقود الموردين والأسعار الرسمية المعتمدة',
    'rates.filter_city': 'تصفية حسب المدينة',
    'rates.filter_type': 'تصفية حسب نوع الخدمة',

    // Quote Builder
    'quotes.title': 'عروض الأسعار والبرامج',
    'quotes.new_quote': 'إنشاء عرض سعر',
    'quotes.builder_title': 'مُنشئ البرامج وحساب التكلفة',
    'quotes.ai_draft_itinerary': 'توليد مسودة من مكتبة الأسعار فقط',
    'quotes.day_by_day': 'البرنامج يوماً بيوم',
    'quotes.add_day': 'إضافة يوم',
    'quotes.add_service': 'إضافة خدمة من مكتبة الأسعار',
    'quotes.sticky_summary': 'ملخص التكلفة وهامش الربح',
    'quotes.missing_rate_alert': 'تنبيه: يوجد خدمات بدون سعر مسجل، يجب تحديد السعر قبل الإرسال.',
    'quotes.generate_proposal': 'إنشاء رابط العرض التفاعلي',

    // Proposal
    'proposal.view_proposal': 'معاينة العرض الإلكتروني',
    'proposal.print_pdf': 'تحميل / طباعة ملف PDF',
    'proposal.interested_btn': 'أنا مهتم بهذا البرنامج وسأقوم بالحجز',
    'proposal.contact_whatsapp': 'تواصل معنا مباشرة عبر واتساب',
    'proposal.views_recorded': 'عدد مرات المشاهدة',
    'proposal.day_itinerary': 'تفاصيل برنامجك اليومي في مصر',
    'proposal.inclusions': 'الخدمات المشمولة في العرض',
    'proposal.payment_notice': 'تعليمات الدفع المباشر للشركة المنظمة',

    // Follow-ups
    'followups.title': 'المتابعة الذكية والمهام',
    'followups.subtitle': 'تنبيهات فورية عند فتح العميل للعرض أو اقتراب وقت المتابعة',
    'followups.today_queue': 'قائمة المتابعة لليوم',
    'followups.one_click_whatsapp': 'نسخ الرسالة وفتح واتساب بضغطة زر',

    // Analytics
    'analytics.title': 'لوحة التحليلات التنفيذية',
    'analytics.subtitle': 'مؤشرات أداء التحويل، سرعة الرد، هوامش الربحية، ومصادر الحجوزات',
  },
};

export function setDocumentDirection(lang: UILanguage) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}
