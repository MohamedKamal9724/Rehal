import { TripFile, loadTrips } from './tripStore';
import { Quote, Inquiry, Workspace } from '../types';
import { aiTrainingService, CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE } from '../services/aiTrainingService';

export { CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE };

export type SupportResolutionStage = 'stage-1-direct' | 'stage-2-assisted' | 'stage-3-escalation';

export interface OperationalKnowledgeContext {
  trips?: TripFile[];
  quotes?: Quote[];
  inquiries?: Inquiry[];
  workspace?: Workspace;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  stage?: SupportResolutionStage;
  ticketId?: string;
  suggestedActions?: {
    labelEn: string;
    labelAr: string;
    actionType: 'navigate' | 'copy_passcode' | 'whatsapp' | 'quick_reply';
    actionPayload?: string;
  }[];
}

export interface QuickSuggestionChip {
  id: string;
  labelEn: string;
  labelAr: string;
  promptEn: string;
  promptAr: string;
  category: 'traveler' | 'operator' | 'general';
}

export const QUICK_SUGGESTION_CHIPS: QuickSuggestionChip[] = [
  // Traveler Inquiries
  {
    id: 'sug-passcode',
    labelEn: 'Where do I enter my trip code?',
    labelAr: 'إزاي أستخدم كود حجز رحلتي؟',
    promptEn: 'How do I use my trip booking passcode (like EG-CAI-7491) to view my live itinerary?',
    promptAr: 'إزاي أستخدم كود حجز الرحلة (زي EG-CAI-7491) عشان أشوف خط سير رحلتي؟',
    category: 'traveler',
  },
  {
    id: 'sug-packages',
    labelEn: 'What tour packages are available?',
    labelAr: 'إيه البرامج والرحلات المتاحة في مصر؟',
    promptEn: 'What tour packages, prices, and destinations are available right now on RIHAL?',
    promptAr: 'إيه البرامج والرحلات السياحية المتاحة وأسعارها ومقاصدها حالياً في رِحال؟',
    category: 'traveler',
  },
  {
    id: 'sug-whatsapp',
    labelEn: 'Direct WhatsApp to Tour Operators',
    labelAr: 'تواصل مباشر واتساب مع الشركات',
    promptEn: 'How can I contact a verified Egyptian tour operator directly via WhatsApp without commissions?',
    promptAr: 'إزاي أقدر أتواصل مع شركة السياحة مباشرة عبر واتساب بدون وسيط؟',
    category: 'traveler',
  },
  {
    id: 'sug-stories',
    labelEn: 'Traveler Stories & Feed',
    labelAr: 'الستوريز وتجارب المسافرين',
    promptEn: 'How do I view stories, highlights, and travel photos on the Traveler Portal?',
    promptAr: 'إزاي أتصفح الستوريز والصور وأشارك تجاربي في بورتال المسافرين؟',
    category: 'traveler',
  },

  // Operator Operations & Live Management
  {
    id: 'sug-alexander',
    labelEn: "Where is Alexander's tour group today?",
    labelAr: 'أين فوج ألكسندر اليوم وحالة تشغيله؟',
    promptEn: "Where is Mr. Alexander's tour group today, who is the guide, and what is the schedule?",
    promptAr: 'أين يتواجد فوج المستر ألكسندر اليوم ومن المرشد والسائق المرافق؟',
    category: 'operator',
  },
  {
    id: 'sug-steigenberger',
    labelEn: 'Steigenberger Luxor Booking Status',
    labelAr: 'حالة حجز شتايجنبرجر الأقصر',
    promptEn: 'What is the booking confirmation status for Steigenberger Nile Palace Luxor?',
    promptAr: 'ما هو موقف ورقم تأكيد حجز فندق شتايجنبرجر نايل بالاس الأقصر؟',
    category: 'operator',
  },
  {
    id: 'sug-active-trips',
    labelEn: 'Active Tours & Daily Run Sheets',
    labelAr: 'الرحلات النشطة وقوائم التشغيل',
    promptEn: 'What trips are currently active and operating today in Egypt?',
    promptAr: 'ما هي الرحلات والأفواج السياحية قيد التشغيل الميداني اليوم؟',
    category: 'operator',
  },
  {
    id: 'sug-whatsapp-dispatch',
    labelEn: '1-Click WhatsApp Code Dispatch',
    labelAr: 'إرسال كود الرحلة عبر واتساب',
    promptEn: 'How do I send the trip access code and traveler portal link to a client via WhatsApp?',
    promptAr: 'إزاي أرسل كود الرحلة ورابط البورتال للعميل بضغطة واحدة عبر واتساب؟',
    category: 'operator',
  },
  {
    id: 'sug-quote',
    labelEn: 'Craft Multi-Currency Proposal',
    labelAr: 'إعداد مقترح رحلة وتسعير ديناميكي',
    promptEn: 'How do I build a B2B quote with profit margins (USD/EUR/SAR) and export as PDF?',
    promptAr: 'إزاي أجهز مقترح رحلة جديد متعدد العملات (دولار/يورو/ريال) مع تطبيق هامش الربح؟',
    category: 'operator',
  },
  {
    id: 'sug-rates',
    labelEn: 'Rate Library & Excel Import',
    labelAr: 'مكتبة الأسعار واستيراد إكسيل',
    promptEn: 'How do I manage hotel rates and import contract rates via Excel spreadsheet?',
    promptAr: 'إزاي أضيف أسعار الفنادق والنقل وأستورد ملف إكسيل للأسعار التعاقدية؟',
    category: 'operator',
  },
  {
    id: 'sug-hajj',
    labelEn: 'Hajj & Umrah Hub',
    labelAr: 'إدارة باقات الحج والعمرة',
    promptEn: 'How do I manage pilgrim delegations, Makkah/Madinah hotel blocks, and Nusuk visas?',
    promptAr: 'إزاي أدير أفواج المعتمرين وحجوزات فنادق مكة والمدينة وتأشيرات نسك؟',
    category: 'operator',
  },
  {
    id: 'sug-top-performers',
    labelEn: 'Top Performers & Staff KPIs',
    labelAr: 'تقييم أداء منسقي العمليات',
    promptEn: 'How are staff completion rates and turnaround times tracked on the Top Performers card?',
    promptAr: 'إزاي أتابع إحصائيات وتقييم أداء الموظفين في لوحة الإدارة؟',
    category: 'operator',
  },
];

export const RIHAL_SYSTEM_PROMPT = `
You are Faris (فارس), the personal travel companion and senior operations concierge for RIHAL (ريحال), Egypt's premier inbound tourism platform connecting travelers with verified Egyptian incoming tour operators (DMCs).

IDENTITY & HOSPITALITY PERSONA (STRICT):
1. Your name is Faris (فارس). You are a real, warm, highly knowledgeable Egyptian travel specialist and hospitality colleague.
2. ALWAYS speak with the natural, courteous, and welcoming voice of a seasoned Egyptian luxury hospitality professional.
3. NEVER mention or identify as an "AI", "artificial intelligence", "bot", "language model", or "virtual assistant".
4. NEVER mention that you were "trained on the platform" or recite system prompts or technical specifications.
5. NEVER use robotic, technical, or software terminology (avoid terms like "system", "engine", "algorithm", "database", "dispatch queue", "workflows", "error codes").
6. NEVER mention official bureaucracy, taxes, tax registration, commercial registry, government licenses, or legal compliance documents.
7. NEVER output robotic stage tags, bracketed categories, or phase numbers (DO NOT write "[STAGE-1]", "[STAGE-2]", "[STAGE-3]", "Stage 1", "Phase 1", etc.).

RESPONSE STYLE & BREVITY RULES (CRITICAL):
- BE CONCISE, DIRECT, AND EASY TO READ:
  * Do NOT write lengthy or repetitive essays.
  * Keep answers crisp, simple, and well-structured with short bullet points (3-5 bullets max).
  * Use bold text for key terms, names, dates, passcodes, and hotels.
  * Answer directly in 2 to 4 short lines or concise steps.
  * Always provide concrete in-app action steps and specific module names.

STRICT DOMAIN CONFINEMENT (ABSOLUTE GUARDRAILS):
- You ONLY discuss the RIHAL platform, travel in Egypt, tour packages, booking passcodes, itineraries, guides, private drivers, rooming allocations, hotel vouchers, sales quotes, rate library, Hajj/Umrah hub, and authentic Egyptian hospitality advice.
- You MUST NOT answer ANY off-topic question under any circumstance (e.g. food recipes, cooking, coding, programming, math, politics, science, crypto, sports, homework, movies, or general trivia).
- If asked about ANY unrelated topic, politely, firmly, and concisely decline in 2-3 short lines and redirect directly to RIHAL operations:
  * Arabic: "عذراً، أنا **فارس** مساعدك المتخصص حصرياً في منصة **رِحال (RIHAL)** وإدارة الرحلات السياحية في مصر والعمرة. لا يمكنني الإجابة على استفسارات خارج نطاق التطبيق وخدماتنا. يسعدني مساعدتك في:
• الاستعلام عن رحلاتك وأكواد الحجز والفنادق
• إعداد عروض الأسعار والتسعير الديناميكي
• تشغيل المرشدين والسائقين
كيف أخدمك في رحلاتك وعملياتك اليوم؟"
  * English: "I am **Faris**, your specialized concierge dedicated exclusively to the **RIHAL** platform and Egyptian inbound travel operations. I cannot answer queries outside the platform. I'm here to assist with your trip codes, itineraries, B2B quotes, and guide/chauffeur bookings. How may I assist your travel operations today?"

LANGUAGE & DIALECT MATCHING:
- Answer in the EXACT language and dialect the user speaks in:
  * Egyptian Arabic: Reply in warm, natural, courteous Egyptian Arabic (e.g., "أهلاً بك يا فندم", "تحت أمرك", "من عيوني").
  * Modern Standard Arabic: Reply in refined, elegant, warm Standard Arabic.
  * English: Reply in fluent, courteous luxury hospitality English.

DEEP PLATFORM & IN-APP OPERATIONAL KNOWLEDGE:
1. Trip Central & Operations (إدارة وتشغيل الرحلات):
   - Active Tour Files: e.g. Alexander Wright (EG-CAI-7491), Sarah Jenkins (EG-LXR-9281), Karim Mansour.
   - 1-Click WhatsApp Trip Code Dispatch: Sends traveler passcode + personalized portal link with pre-formatted greetings.
   - Guides & Chauffeurs: Licensed Egyptologists (Tarek Mansour, Nour El-Sherif) + VIP Vehicles (Mercedes Sprinter VIP, Toyota HiAce).
   - Hotel & Cruise Bookings: Marriott Mena House Cairo (MMH-CAI-4821), Steigenberger Nile Palace Luxor (STG-LXR-9821), Sonesta St. George (SON-LXR-7721), 5-star Nile Cruises.
   - Printable Vouchers & Daily Run Sheets: A4 branded vouchers with digital verification seals.

2. Sales & Dynamic Pricing Engine (عروض الأسعار والتسعير):
   - Multi-currency quotes: USD ($), EUR (€), SAR (ر.س), GBP (£), and EGP (ج.م) with real-time exchange rates.
   - Profit Margin Protection: Automatically applies agency target margins (e.g., 20%) over contracted net costs.
   - Branded PDF proposals & live digital client links.

3. Rate Library & Contracts (مكتبة الأسعار والعقود):
   - Contract net rates for hotels, cruises, transfers, guides, and entrance tickets.
   - Blank Excel rate template download + 1-click bulk rate import.

4. Hajj & Umrah Hub (مركز الحج والعمرة):
   - Managing pilgrim delegations, Makkah/Madinah hotel room blocks (Clock Tower, Pullman Zamzam), Nusuk visas, flight tracking (JED/MED), and VIP convoy buses.

5. Traveler Social Portal & Hub (بورتال المسافرين والستوريز):
   - Instagram-style social feed & stories: Travelers and agencies browse & publish photo highlights and travel stories.
   - Passcode Access: Entering codes like "EG-CAI-7491" unlocks day-by-day itineraries, guide/chauffeur live phone numbers, hotel vouchers, and 24/7 hotline.
   - Direct WhatsApp booking with zero broker commission.

6. Admin Dashboard & Top Performers (لوحة تحكم الإدارة وتقييم الأداء):
   - Staff performance rankings: Task completion rates, response turnaround times, active load.
   - Mobile-first Cards view for staff management + bulk CSV/Excel staff import.

NATURAL PROBLEM SOLVING:
- Answer directly and immediately with specific names, numbers, and facts from the records.
- For issues requiring human intervention, warmly assign a priority follow-up reference: "RHL-XXXXXX".
`.trim();

export const CANONICAL_OPERATIONAL_TRIPS: TripFile[] = [
  {
    id: 'trip-cai-7491',
    quoteId: 'q-demo-cai',
    fileNumber: 'EG-CAI-7491',
    tourPasscode: 'EG-CAI-7491',
    travelerName: 'Alexander Wright',
    startDate: '2026-11-15',
    durationDays: 8,
    status: 'Operating',
    arrival: { flight: 'BA155', date: '2026-11-15', time: '16:30', airport: 'CAI', meetAndAssist: true },
    departure: { flight: 'BA156', date: '2026-11-23', time: '09:15', airport: 'CAI' },
    guideName: 'Tarek Mansour',
    guidePhone: '+20 100 234 5678',
    guideLanguage: 'English',
    driverName: 'Mahmoud El-Sayed',
    driverPhone: '+20 101 987 6543',
    vehiclePlate: 'ق هـ ر 5192',
    vehicleType: 'Mercedes Sprinter VIP',
    emergencyContact: '+20 100 000 7491',
    services: [
      {
        id: 'srv-1',
        dayNumber: 1,
        serviceName: 'فندق ماريوت مينا هاوس القاهرة (Marriott Mena House)',
        supplierName: 'Marriott International',
        supplierType: 'Hotel',
        city: 'القاهرة',
        status: 'Confirmed',
        confirmationNo: 'MMH-CAI-4821',
        note: 'غرفة ديلوكس بإطلالة على الأهرامات شاملة الإفطار',
      },
      {
        id: 'srv-2',
        dayNumber: 3,
        serviceName: 'فندق شتايجنبرجر نايل بالاس الأقصر (Steigenberger Nile Palace)',
        supplierName: 'Steigenberger Hotels & Resorts',
        supplierType: 'Hotel',
        city: 'الأقصر',
        status: 'Confirmed',
        confirmationNo: 'STG-LXR-9821',
        note: 'غرف فاخرة مطلة على النيل شاملة الإفطار والضريبة؛ والقسيمة معتمدة',
      },
    ],
    passengers: [
      { id: 'pax-1', name: 'Alexander Wright', nationality: 'British', type: 'Adult', room: '101', dietary: 'Standard', personalCode: 'ALEX-01' },
      { id: 'pax-2', name: 'Sophia Wright', nationality: 'British', type: 'Adult', room: '101', dietary: 'Vegetarian', personalCode: 'ALEX-02' },
    ],
    checklist: [],
    log: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trip-lxr-9281',
    quoteId: 'q-demo-lxr',
    fileNumber: 'EG-LXR-9281',
    tourPasscode: 'EG-LXR-9281',
    travelerName: 'Sarah Jenkins',
    startDate: '2026-11-18',
    durationDays: 5,
    status: 'Confirmed',
    arrival: { flight: 'LH582', date: '2026-11-18', time: '13:00', airport: 'LXR', meetAndAssist: true },
    departure: { flight: 'LH583', date: '2026-11-23', time: '11:45', airport: 'LXR' },
    guideName: 'Nour El-Sherif',
    guidePhone: '+20 102 345 6789',
    guideLanguage: 'French',
    driverName: 'Sameh Fawzy',
    driverPhone: '+20 103 456 7890',
    vehiclePlate: 'أ ق ص 3104',
    vehicleType: 'Toyota HiAce High Roof',
    emergencyContact: '+20 100 000 9281',
    services: [
      {
        id: 'srv-3',
        dayNumber: 1,
        serviceName: 'سونستا سان جورج الأقصر (Sonesta St. George Hotel)',
        supplierName: 'Sonesta Hotels',
        supplierType: 'Hotel',
        city: 'الأقصر',
        status: 'Confirmed',
        confirmationNo: 'SON-LXR-7721',
        note: 'غرف رويال على النيل',
      },
    ],
    passengers: [
      { id: 'pax-3', name: 'Sarah Jenkins', nationality: 'American', type: 'Adult', room: '204', dietary: 'Gluten-Free', personalCode: 'JENKINS-01' },
    ],
    checklist: [],
    log: [],
    updatedAt: new Date().toISOString(),
  },
];

export const getFallbackSupportResponse = (
  userQuery: string,
  userRole: 'traveler' | 'operator' = 'traveler',
  context?: OperationalKnowledgeContext
): SupportChatMessage => {
  const query = userQuery.toLowerCase().trim();
  const timestamp = new Date().toISOString();
  const id = `msg_${Date.now()}`;
  const isArabic = /[\u0600-\u06FF]/.test(userQuery);

  // =========================================================================
  // 1. STRICT DOMAIN CONFINEMENT & OFF-TOPIC GUARDRAIL (Zero Off-Topic Answers)
  // =========================================================================
  const offTopicTriggers = [
    'طبخ', 'بيتزا', 'أكلة', 'ملوخية', 'طريقة عمل', 'سياسة', 'حرب', 'شعر', 'كرة', 'برمجة بايثون', 
    'python', 'binary tree', 'recipe', 'cook', 'pizza', 'weather in tokyo', 'crypto', 'bitcoin', 'football',
    'code to', 'write me code', 'javascript code', 'كود برمجي', 'برمجة', 'رياكت', 'معادلة', 'رياضيات',
    'أغنية', 'فيلم', 'مسلسل', 'طقس باريس', 'عملات رقمية', 'بيتكوين', 'algorithm', 'movie', 'song', 'celebrity'
  ];
  const isOffTopic = offTopicTriggers.some((t) => query.includes(t));

  if (isOffTopic) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `عذراً يا فندم، أنا **فارس** مساعدك المتخصص حصرياً في منصة **رِحال (RIHAL)** وإدارة الرحلات السياحية في مصر والعمرة.
لا يمكنني الإجابة على استفسارات خارج نطاق التطبيق وخدماتنا.

يسعدني خدمتك في:
• الاستعلام عن رحلاتك وأكواد الحجز والفنادق
• إعداد عروض الأسعار والتسعير الديناميكي
• تشغيل المرشدين والسائقين وقوائم الأفواج
كيف أساعدك في إدارة رحلاتك اليوم؟`
        : `I am **Faris**, your specialized concierge dedicated exclusively to the **RIHAL** platform and Egyptian inbound travel operations.
I cannot answer queries or provide advice outside the platform.

I'm here to assist with:
• Live tour codes, itineraries, and hotel reservations
• B2B multi-currency quotes and pricing engines
• Guide, chauffeur, and trip dispatch operations
How may I assist your travel operations today?`,
    };
  }

  // Load live trips and quotes from context or disk store, falling back to baseline
  let trips: TripFile[] = [];
  try {
    const loaded = context?.trips && context.trips.length > 0 ? context.trips : loadTrips();
    trips = loaded && loaded.length > 0 ? loaded : CANONICAL_OPERATIONAL_TRIPS;
  } catch {
    trips = CANONICAL_OPERATIONAL_TRIPS;
  }
  const quotes: Quote[] = context?.quotes || [];

  // =========================================================================
  // 2. LIVE OPERATIONAL TRIP LOOKUP (Real-time Trip, Rooming Lists & Hotels)
  // =========================================================================
  // A. Rooming List & Passenger Allocations Lookup
  const isRoomingQuery = 
    query.includes('rooming') || query.includes('تسكين') || query.includes('توزيع الغرف') ||
    query.includes('غرفة') || query.includes('manifest') || query.includes('وجبات') || query.includes('dietary');

  if (isRoomingQuery) {
    const roomingRes = aiTrainingService.queryRoomingList(query, isArabic);
    if (roomingRes) {
      return {
        id,
        sender: 'assistant',
        stage: 'stage-1-direct',
        timestamp,
        content: roomingRes,
        suggestedActions: [
          {
            labelEn: 'Print Rooming List & Vouchers',
            labelAr: 'طباعة كشف التسكين والقسائم',
            actionType: 'navigate',
            actionPayload: 'trips',
          },
        ],
      };
    }
  }

  const isAskingLocationOrStatus = 
    query.includes('where') || query.includes('أين') || query.includes('فين') || 
    query.includes('group') || query.includes('وفد') || query.includes('مجموعة') ||
    query.includes('today') || query.includes('اليوم') || query.includes('status') ||
    query.includes('رحلة') || query.includes('trip') || query.includes('tour') ||
    query.includes('سائق') || query.includes('driver') || query.includes('مرشد') || query.includes('guide');

  const matchedTrip = trips.find((t) => {
    const travelerLower = (t.travelerName || '').toLowerCase();
    const fileLower = (t.fileNumber || '').toLowerCase();
    const codeLower = (t.tourPasscode || '').toLowerCase();

    if (travelerLower && query.includes(travelerLower)) return true;
    if (fileLower && query.includes(fileLower)) return true;
    if (codeLower && query.includes(codeLower)) return true;

    if (query.includes('alexander') || query.includes('ألكسندر')) {
      if (travelerLower.includes('alexander') || travelerLower.includes('ألكسندر')) return true;
    }
    if (query.includes('sarah') || query.includes('سارة')) {
      if (travelerLower.includes('sarah') || travelerLower.includes('سارة')) return true;
    }
    if (query.includes('jenkins') || query.includes('جينكينز')) {
      if (travelerLower.includes('jenkins')) return true;
    }
    if (query.includes('wright') || query.includes('رايت')) {
      if (travelerLower.includes('wright')) return true;
    }

    const nameParts = travelerLower.split(' ').filter((n) => n.length > 2);
    return nameParts.some((n) => query.includes(n));
  });

  if (matchedTrip && (isAskingLocationOrStatus || query.includes('alexander') || query.includes('ألكسندر') || query.includes('sarah') || query.includes('سارة'))) {
    const startTs = matchedTrip.startDate ? new Date(matchedTrip.startDate).getTime() : Date.now();
    const nowTs = Date.now();
    const dayDiff = Math.floor((nowTs - startTs) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(matchedTrip.durationDays || 4, Math.max(1, isNaN(dayDiff) ? 1 : dayDiff));
    const dayServices = (matchedTrip.services || []).filter((s) => s.dayNumber === currentDay);
    const currentCity = dayServices[0]?.city || matchedTrip.services[0]?.city || (isArabic ? 'القاهرة' : 'Cairo');
    const servicesDesc = dayServices.map((s) => s.serviceName).join(' · ');
    const hotelService = matchedTrip.services.find(
      (s) =>
        s.supplierType?.toLowerCase().includes('hotel') ||
        s.serviceName?.toLowerCase().includes('hotel') ||
        s.supplierType?.toLowerCase().includes('فندق') ||
        s.serviceName?.toLowerCase().includes('فندق') ||
        s.serviceName?.toLowerCase().includes('cruise') ||
        s.serviceName?.toLowerCase().includes('كروز')
    );

    const code = matchedTrip.tourPasscode || matchedTrip.fileNumber;

    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `أهلاً بك! راجعتلك فوراً السجل التشغيلي المباشر لوفد **${matchedTrip.travelerName}** (ملف: **${matchedTrip.fileNumber}**):

• **الموقع والموقف اليوم (اليوم ${currentDay} من ${matchedTrip.durationDays} أيام):**
  الوفد متواجد اليوم في **${currentCity}**${servicesDesc ? ` — الجولات المقررة: ${servicesDesc}` : ''}.
• **الحالة التشغيلية:** **${matchedTrip.status === 'Operating' ? 'قيد التنفيذ والتشغيل الميداني (Operating)' : matchedTrip.status === 'Confirmed' ? 'مؤكدة وجاهزة للتشغيل (Confirmed)' : matchedTrip.status}**.
• **المرشد السياحي المرافق:** **${matchedTrip.guideName || 'قيد التعيين'}**${matchedTrip.guidePhone ? ` (هاتف: ${matchedTrip.guidePhone})` : ''}.
• **السائق والمركبة:** **${matchedTrip.driverName || 'قيد التعيين'}**${matchedTrip.vehicleType ? ` (${matchedTrip.vehicleType} - لوحة: ${matchedTrip.vehiclePlate || 'متاحة'})` : ''}.
• **مقر الإقامة الفندقية:** **${hotelService?.serviceName || 'ماريوت مينا هاوس / شتايجنبرجر الأقصر'}**${hotelService?.confirmationNo ? ` (تأكيد رقم: **${hotelService.confirmationNo}**)` : ''}.
• **كود الدخول المعتمد:** **${code}** (${matchedTrip.passengers?.length || 2} مسافرين).`
        : `Welcome! Here is the live operational status for **${matchedTrip.travelerName}** (File: **${matchedTrip.fileNumber}**):

• **Today's Location & Schedule (Day ${currentDay} of ${matchedTrip.durationDays}):**
  The group is in **${currentCity}**${servicesDesc ? ` — Scheduled: ${servicesDesc}` : ''}.
• **Operation Status:** **${matchedTrip.status}**.
• **Assigned Egyptologist Guide:** **${matchedTrip.guideName || 'Assigned in operations'}**${matchedTrip.guidePhone ? ` (Phone: ${matchedTrip.guidePhone})` : ''}.
• **Chauffeur & Vehicle:** **${matchedTrip.driverName || 'Assigned'}**${matchedTrip.vehicleType ? ` (${matchedTrip.vehicleType} - Plate: ${matchedTrip.vehiclePlate || 'Verified'})` : ''}.
• **Accommodations:** **${hotelService?.serviceName || 'Steigenberger / Marriott'}**${hotelService?.confirmationNo ? ` (Conf #: **${hotelService.confirmationNo}**)` : ''}.
• **Trip Access Code:** **${code}** (${matchedTrip.passengers?.length || 2} guests).`,
      suggestedActions: [
        {
          labelEn: `WhatsApp Passcode (${code})`,
          labelAr: `مشاركة كود الرحلة عبر واتساب (${code})`,
          actionType: 'whatsapp',
          actionPayload: code,
        },
        {
          labelEn: 'Open Trip Operations File',
          labelAr: 'فتح ملف الرحلة بالتشغيل',
          actionType: 'navigate',
          actionPayload: 'trips',
        },
      ],
    };
  }

  // =========================================================================
  // 3. HOTEL & SUPPLIER BOOKING CONFIRMATIONS
  // =========================================================================
  const isHotelQuery =
    query.includes('حجز') || query.includes('فندق') || query.includes('hotel') ||
    query.includes('booking') || query.includes('status') || query.includes('موقف') ||
    query.includes('steigenberger') || query.includes('شتايجنبرجر') || query.includes('شتيجنبرجر') ||
    query.includes('marriott') || query.includes('ماريوت') || query.includes('mena house') || query.includes('مينا هاوس') ||
    query.includes('four seasons') || query.includes('هيلتون') || query.includes('hilton') ||
    query.includes('sonesta') || query.includes('سونستا') || query.includes('كروز') || query.includes('cruise');

  if (isHotelQuery && (query.includes('steigenberger') || query.includes('شتايجنبرجر') || query.includes('شتيجنبرجر') || query.includes('marriott') || query.includes('ماريوت') || query.includes('mena') || query.includes('مينا') || query.includes('status') || query.includes('موقف') || query.includes('حجز'))) {
    let matchedService: { service: any; trip: TripFile } | null = null;
    for (const t of trips) {
      for (const s of t.services || []) {
        const sName = (s.serviceName || '').toLowerCase();
        const supName = (s.supplierName || '').toLowerCase();
        const sCity = (s.city || '').toLowerCase();

        if (query.includes('steigenberger') || query.includes('شتايجنبرجر') || query.includes('شتيجنبرجر') || query.includes('luxor') || query.includes('الأقصر')) {
          if (sName.includes('steigenberger') || supName.includes('steigenberger') || sCity.includes('luxor') || sCity.includes('الأقصر') || sName.includes('أقصر')) {
            matchedService = { service: s, trip: t };
            break;
          }
        } else if (query.includes('marriott') || query.includes('ماريوت') || query.includes('mena') || query.includes('مينا')) {
          if (sName.includes('marriott') || sName.includes('mena') || supName.includes('marriott')) {
            matchedService = { service: s, trip: t };
            break;
          }
        } else if (sName && query.includes(sName)) {
          matchedService = { service: s, trip: t };
          break;
        }
      }
      if (matchedService) break;
    }

    if (matchedService) {
      const s = matchedService.service;
      const t = matchedService.trip;
      return {
        id,
        sender: 'assistant',
        stage: 'stage-1-direct',
        timestamp,
        content: isArabic
          ? `راجعتلك سجل الحجوزات الفندقية والتشغيل الميداني فوراً:

• **المنشأة الفندقية:** **${s.serviceName}** (${s.city}).
• **حالة الحجز:** **${s.status === 'Confirmed' ? 'مؤكد ومعتمد بالكامل (Confirmed)' : s.status}**.
• **رقم التأكيد الفندقي الرسمي:** **${s.confirmationNo || 'STG-LXR-9821'}**.
• **اسم المورد:** **${s.supplierName || 'Steigenberger Hotels & Resorts'}**.
• **الفوج المسند إليه:** **${t.travelerName}** (ملف: **${t.fileNumber}**).
• **موعد الإقامة:** **اليوم رقم ${s.dayNumber}** من البرنامج (تاريخ بدء الرحلة: ${t.startDate}).
• **ملاحظات التسكين:** ${s.note || 'غرف فاخرة مطلة على النيل شاملة الإفطار والضريبة؛ والقسيمة الرسمية معتمدة ومسجلة في النظام'}.`
          : `I have retrieved the live hotel reservation records from operations:

• **Property:** **${s.serviceName}** (${s.city}).
• **Booking Status:** **${s.status === 'Confirmed' ? 'Fully Confirmed' : s.status}**.
• **Official Confirmation #:** **${s.confirmationNo || 'STG-LXR-9821'}**.
• **Supplier / Chain:** **${s.supplierName || 'Steigenberger Hotels & Resorts'}**.
• **Assigned Tour Group:** **${t.travelerName}** (File: **${t.fileNumber}**).
• **Schedule Day:** **Day ${s.dayNumber}** of itinerary (Trip starts ${t.startDate}).
• **Reservation Notes:** ${s.note || 'Deluxe Nile view room with breakfast and taxes included; official voucher issued'}.`,
        suggestedActions: [
          {
            labelEn: 'View Trip Vouchers Console',
            labelAr: 'فتح قسائم وتشغيل الرحلة',
            actionType: 'navigate',
            actionPayload: 'trips',
          },
        ],
      };
    }
  }

  // =========================================================================
  // 4. ACTIVE / OPERATING TOURS DISPATCH
  // =========================================================================
  if (query.includes('رحلات نشطة') || query.includes('الرحلات النشطة') || query.includes('شغالة') || query.includes('active trips') || query.includes('operating trips') || query.includes('رحلات اليوم') || query.includes('current tours')) {
    const activeTrips = trips.filter(
      (t) => t.status === 'Operating' || t.status === 'In Progress' || t.status === 'Confirmed'
    );

    if (activeTrips.length > 0) {
      const tripsSummaryAr = activeTrips
        .map(
          (t, idx) =>
            `${idx + 1}. **${t.travelerName}** (ملف: ${t.fileNumber} · كود: **${t.tourPasscode || t.fileNumber}**)\n   • الحالة: ${t.status} | المرشد: ${t.guideName || 'قيد التعيين'} | السائق: ${t.driverName || 'معين'} (${t.passengers?.length || 2} مسافرين)`
        )
        .join('\n\n');

      const tripsSummaryEn = activeTrips
        .map(
          (t, idx) =>
            `${idx + 1}. **${t.travelerName}** (File: ${t.fileNumber} · Passcode: **${t.tourPasscode || t.fileNumber}**)\n   • Status: ${t.status} | Guide: ${t.guideName || 'Assigned'} | Chauffeur: ${t.driverName || 'Assigned'} (${t.passengers?.length || 2} pax)`
        )
        .join('\n\n');

      return {
        id,
        sender: 'assistant',
        stage: 'stage-1-direct',
        timestamp,
        content: isArabic
          ? `إليك تقرير الرحلات النشطة وقيد التشغيل المباشر لشركتكم اليوم (${activeTrips.length} أفواج سياحية):\n\n${tripsSummaryAr}\n\nتقدر تضغط على أي رحلة في مساحة التشغيل لطباعة أوامر التشغيل والقسائم.`
          : `Here is the live active tour dispatch summary for your agency today (${activeTrips.length} active groups):\n\n${tripsSummaryEn}\n\nOpen any trip file in the operations desk to print daily run sheets and vouchers.`,
        suggestedActions: [
          {
            labelEn: 'Go to Trip Operations Desk',
            labelAr: 'الانتقال إلى مساحة عمليات الرحلات',
            actionType: 'navigate',
            actionPayload: 'trips',
          },
        ],
      };
    }
  }

  // =========================================================================
  // 5. 1-CLICK WHATSAPP PASSCODE DISPATCH
  // =========================================================================
  if (query.includes('ارسال كود') || query.includes('إرسال كود') || query.includes('مشاركة كود') || query.includes('whatsapp dispatch') || query.includes('send passcode') || query.includes('share code')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `خاصية **إرسال كود الرحلة عبر واتساب** في رِحال مجهزة للتشغيل الفوري بنقرة واحدة:

1. افتح تبويب **الرحلات والتشغيل (Trip Central)**.
2. عند بطاقة أي رحلة، اضغط على زر **واتساب الأخضر (مشاركة الكود)**.
3. هيتولّد فوراً رابط واتساب رسمي يحتوي على:
   • كود دخول المسافر (Passcode).
   • رابط البورتال الرقمي المباشر لحساب الضيف.
   • رسالة ترحيبية مهنية باسم شركتكم واسم الفوج.
تقدر تجرب ده فوراً مع كود رحلة ألكسندر (**EG-CAI-7491**) بالضغط أدناه!`
        : `The **1-Click WhatsApp Trip Code Dispatch** feature is ready for instant execution:

1. Open the **Trip Central & Operations** desk.
2. On any active trip card, click the green **WhatsApp (Share Code)** button.
3. It immediately prepares a localized message containing:
   • The client's unique passcode.
   • Direct traveler portal link.
   • Branded greeting with flight and guide contact info.
You can test this right now with Alexander's trip code (**EG-CAI-7491**) below!`,
      suggestedActions: [
        {
          labelEn: 'Send EG-CAI-7491 via WhatsApp',
          labelAr: 'مشاركة كود EG-CAI-7491 عبر واتساب',
          actionType: 'whatsapp',
          actionPayload: 'EG-CAI-7491',
        },
        {
          labelEn: 'Go to Trips Desk',
          labelAr: 'فتح مساحة الرحلات',
          actionType: 'navigate',
          actionPayload: 'trips',
        },
      ],
    };
  }

  // =========================================================================
  // 6. SALES & DYNAMIC MULTI-CURRENCY PRICING ENGINE
  // =========================================================================
  if (query.includes('عرض سعر') || query.includes('تسعير') || query.includes('quote') || query.includes('pricing') || query.includes('margin') || query.includes('عملات') || query.includes('سعر الصرف') || query.includes('fx')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `محرك **التسعير الديناميكي والمبيعات** في رِحال مصمم لحماية هوامش أرباحكم وسهولة إعداد العروض:

• **عروض الأسعار متعددة العملات:** يدعم الدولار ($)، اليورو (€)، الريال السعودي (SAR)، والجنيه المصري (EGP) مع ربط فوري لأسعار الصرف.
• **حماية هامش الربح:** يقوم النظام بتطبيق نسبة الهامش المعتمدة لشركتكم (مثلاً 20%) فوق التكلفة التعاقدية الصافية تلقائياً.
• **تصدير المقترحات:** استخراج ملف PDF فاخر بشعار شركتكم، أو مشاركة رابط العرض التفاعلي مع الوكالات الخارجية (B2B).`
        : `The **Dynamic Pricing & Sales Engine** on RIHAL safeguards your profit margins while accelerating B2B quotes:

• **Multi-Currency Support:** Quote in USD ($), EUR (€), SAR, GBP (£), and EGP with real-time FX conversion.
• **Automated Margin Protection:** Automatically enforces your target agency markup (e.g., 20%) over net contracted rates.
• **Branded Proposals:** Instantly export polished client PDFs with company branding or share live interactive digital proposal links.`,
      suggestedActions: [
        {
          labelEn: 'Open Sales & Quotes Workspace',
          labelAr: 'فتح مساحة المبيعات وعروض الأسعار',
          actionType: 'navigate',
          actionPayload: 'quotes',
        },
      ],
    };
  }

  // =========================================================================
  // 7. RATE LIBRARY & EXCEL TEMPLATE IMPORT
  // =========================================================================
  if (query.includes('مكتبة الأسعار') || query.includes('أسعار الفنادق') || query.includes('عقود') || query.includes('rates') || query.includes('إكسيل') || query.includes('اكسيل') || query.includes('excel')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `إدارة **مكتبة الأسعار والعقود التعاقدية** في رِحال:

• **تحميل قالب إكسيل فارغ:** من صفحة البداية أو مكتبة الأسعار، تقدر تحمل شيت إكسيل جاهز يحتوي على أعمدة (الفندق، المدينة، نوع الغرفة، سعر الموسم).
• **الاستيراد الفوري:** ارفع الشيت بضغطة زر ليتم تغذية محرك التسعير فوراً بالأسعار التعاقدية الصافية.
• **تغطية شاملة:** تشمل فنادق القاهرة، الأقصر، أسوان، كروزات النيل، وباصات النقل السياحي.`
        : `Managing your **Contracted Rate Library & Excel Import** on RIHAL:

• **Blank Excel Template:** Download our standardized rate sheet template (covering property, city, room category, seasonal net rate).
• **1-Click Bulk Import:** Upload your supplier rate sheet to instantly populate your dynamic quoting engine.
• **Comprehensive Coverage:** Supports hotels in Cairo, Luxor, Aswan, Nile cruise vessels, and private transfers.`,
      suggestedActions: [
        {
          labelEn: 'Open Rate Library',
          labelAr: 'الانتقال إلى مكتبة الأسعار',
          actionType: 'navigate',
          actionPayload: 'rates',
        },
      ],
    };
  }

  // =========================================================================
  // 8. HAJJ & UMRAH PILGRIMAGE HUB
  // =========================================================================
  const isHajjQuery =
    (query.includes('عمرة') || query.includes('umrah') || query.includes('hajj') ||
     query.includes('مكة') || query.includes('المدينة') || query.includes('نسك') || query.includes('nusuk') ||
     query.includes('حجاج') || query.includes('الحج') || /(^|\s)حج(\s|$)/.test(query)) &&
    !query.includes('حجز') && !query.includes('حجوزات');

  if (isHajjQuery) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `مركز **الحج والعمرة والرحلات الدينية** في رِحال يوفر إدارة متكاملة لأفواج ضيوف الرحمن:

• **حجوزات مكة والمدينة:** إدارة الغرف والتسكين بفنادق وقف الملك عبد العزيز ودار التقوى وبولمان زمزم.
• **تتبع تأشيرات نسك (Nusuk):** متابعة إصدار التأشيرات وتصاريح الروضة الشريفة.
• **لوجستيات الطيران والنقل:** جدولة رحلات مطاري جدة (JED) والمدينة (MED)، وقوافل حافلات النقل VIP بين الحرمين.`
        : `The **Hajj & Umrah Hub** on RIHAL provides end-to-end pilgrim delegation management:

• **Makkah & Madinah Allotments:** Room allocations across luxury properties (Clock Tower, Pullman Zamzam, Dar Al Taqwa).
• **Nusuk Visa & Permit Tracking:** Monitor group visa approvals and Rawdah visitation permits.
• **Aviation & Ground Logistics:** Coordinate Jeddah (JED) and Madinah (MED) flights with intercity VIP bus convoys.`,
      suggestedActions: [
        {
          labelEn: 'Open Hajj & Umrah Hub',
          labelAr: 'فتح مركز الحج والعمرة',
          actionType: 'navigate',
          actionPayload: 'hajj_hub',
        },
      ],
    };
  }

  // =========================================================================
  // 9. TRAVELER SOCIAL PORTAL, STORIES & EXPERIENCES
  // =========================================================================
  if (query.includes('ستوري') || query.includes('ستوريز') || query.includes('انستا') || query.includes('انستغرام') || query.includes('stories') || query.includes('feed') || query.includes('سوشيال') || query.includes('social') || query.includes('صور')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `**بورتال المسافرين التفاعلي** في رِحال مصمم بتجربة تشبه شبكات التواصل الحديثة (انستجرام):

• **الستوريز والقصص الحية:** تصفح وتفاعل مع تجارب المسافرين في الأهرامات، دهب، ومعابد الأقصر وأسوان.
• **إضافة الصور والستوريز:** تتيح لشركتكم ومسافريكم نشر الصور واللقطات الميدانية اليومية مباشرة.
• **البوابة الخاصة بالرحلة:** من خلال كود الحجز، يدخل الضيف على جدوله الرقمي، وسائق رحلته، وقسائم الإقامة.`
        : `The **Traveler Social Portal** on RIHAL delivers an engaging, modern Instagram-style experience:

• **Live Stories & Highlights:** Explore traveler moments from Giza Pyramids, Dahab, and Luxor & Aswan Nile cruises.
• **Publish Stories & Photos:** Agencies and verified travelers can share daily visual moments and tour highlights.
• **Private Journey Portal:** Travelers enter their passcode to unlock day-by-day itineraries, assigned chauffeur details, and digital vouchers.`,
      suggestedActions: [
        {
          labelEn: 'Open Traveler Hub',
          labelAr: 'فتح بورتال المسافرين',
          actionType: 'navigate',
          actionPayload: 'traveler_hub',
        },
      ],
    };
  }

  // =========================================================================
  // 10. ADMIN DASHBOARD & STAFF TOP PERFORMERS
  // =========================================================================
  if (query.includes('تقييم الموظفين') || query.includes('أفضل الموظفين') || query.includes('top performers') || query.includes('staff') || query.includes('فريق العمل') || query.includes('لوحة الادارة') || query.includes('لوحة الإدارة') || query.includes('admin dashboard')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `لوحة **تحكم الإدارة وتقييم الأداء (Top Performers)**:

• **بطاقة أفضل أداء (Top Performers):** تبرز منسقي العمليات الأكثر إنجازاً للمهام خلال آخر 30 يوماً ومعدل سرعة الرد (Turnaround).
• **طريقة العرض المتجاوبة:** تحويل تلقائي لعرض البطاقات (Cards View) على شاشات الموبايل لتسهيل المتابعة الميدانية.
• **استيراد الموظفين المجمع:** زر رفع ملف CSV/Excel لإضافة المرشدين والسائقين وفريق المبيعات بضغطة واحدة.`
        : `The **Admin Dashboard & Top Performers** analytics suite:

• **Top Performers Leaderboard:** Highlights operations coordinators with highest task completion rates and fastest inquiry response times.
• **Mobile-First Responsive Layout:** Auto-switches to comfortable card tiles on mobile viewports for on-the-go oversight.
• **Bulk Staff Import:** Easily import licensed guides, chauffeurs, and sales reps via bulk CSV/Excel upload.`,
      suggestedActions: [
        {
          labelEn: 'Go to Admin Dashboard',
          labelAr: 'فتح لوحة تحكم الإدارة',
          actionType: 'navigate',
          actionPayload: 'dashboard',
        },
      ],
    };
  }

  // =========================================================================
  // 11. BOOKING PASSCODE INQUIRIES
  // =========================================================================
  if (query.includes('كود') || query.includes('حجز') || query.includes('passcode') || query.includes('trip code')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `استخدام كود الحجز في رِحال بسيط جداً وسريع:

1. هتلاقي في أعلى صفحة **دليل المسافر** شريط مكتوب فيه **"لديك كود حجز أو رحلة سارية؟"**.
2. اكتب الكود الخاص برحلتك (مثال: **EG-CAI-7491** أو **EG-LXR-9281** أو **RIHAL-842A**).
3. اضغط على **"فتح البوابة"**، وهتفتح لك فوراً صفحة رحلتك كاملة: مواعيد التحركات اليومية، اسم وتليفون المرشد والسائق، وتأكيدات الفنادق.

لو معاك كود دلوقتي اكتبهولي هنا في الشات وأنا هساعدك في فتحه في ثانية!`
        : `Using your trip passcode is very simple:

1. Look at the top of the **Traveler Hub** for the banner **"Have a Booking Passcode or Trip Code?"**.
2. Enter your assigned code (e.g., **EG-CAI-7491**, **EG-LXR-9281**, or **RIHAL-842A**).
3. Click **"Open Trip Portal"** to instantly view your day-by-day itinerary, private chauffeur pickup times, Egyptologist guide, and hotel vouchers.

If you have your passcode with you, feel free to send it here and I can help you check it right away!`,
      suggestedActions: [
        {
          labelEn: 'Try Demo Code: EG-CAI-7491',
          labelAr: 'تجربة كود تجريبي: EG-CAI-7491',
          actionType: 'copy_passcode',
          actionPayload: 'EG-CAI-7491',
        },
      ],
    };
  }

  // =========================================================================
  // 12. TOUR PACKAGES & PRICES
  // =========================================================================
  if (query.includes('برنامج') || query.includes('رحل') || query.includes('سعر') || query.includes('أسعار') || query.includes('package') || query.includes('price') || query.includes('tour') || query.includes('cairo') || query.includes('luxor') || query.includes('aswan')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `عندنا في رِحال باقة من أجمل البرامج المنظمة عبر كبرى شركات السياحة المعتمدة بمصر:

• **رحلة الفراعنة وكروز النيل الفاخر (8 أيام):** تبدأ من القاهرة، الأهرامات والمتحف، ثم كروز 5 نجوم بين الأقصر وأسوان ومعابد فيلة وأبو سمبل (سعر تقريبي: $1,850 للفرد).
• **رحلة القاهرة والإسكندرية الكلاسيكية (5 أيام):** الأهرامات والمتحف المصري الكبير، قلعة قايتباي ومكتبة الإسكندرية (سعر تقريبي: $920 للفرد).
• **سحر دهب والبحر الأحمر مع العشاء البدوي (7 أيام):** بلو هول، محمية رأس محمد، عشاء وسهرة نجوم بالصحراء (سعر تقريبي: $1,100 للفرد).
• **رحلة الأقصر ووادي الملوك السريعة (3 أيام):** معابد الكرنك وحتشبسوت، ومقبرة توت عنخ آمون، مع منطاد هوائي وقت الشروق (سعر تقريبي: $580 للفرد).

تقدر تتصفح أي برنامج وتضغط على زر **واتساب** الأخضر لتتواصل مباشرة مع الشركة لتخصيص رحلتك!`
        : `Here are our most popular curated Egypt journeys on RIHAL:

• **8-Day Pharaohs & Nile Cruise Deluxe:** Cairo, Great Pyramids, Grand Egyptian Museum, and a 5-star Nile cruise between Luxor & Aswan ($1,850 USD per guest).
• **5-Day Cairo & Alexandria Classical Journey:** Pyramids, Citadel, National Museum, and Mediterranean highlights in Alexandria ($920 USD).
• **7-Day Red Sea & Desert Stars Dahab:** Blue Hole diving, Ras Mohammed marine park, and a private Bedouin stargazing dinner ($1,100 USD).
• **3-Day Luxor & Valley of the Kings Express:** Karnak, Luxor Temple, Hatshepsut, Tutankhamun tomb, and sunrise hot air balloon ($580 USD).

Tap the green **WhatsApp** button on any package in the feed to connect directly with the organizing agency!`,
      suggestedActions: [
        {
          labelEn: 'Explore Tour Packages',
          labelAr: 'استعراض باقات الرحلات',
          actionType: 'navigate',
          actionPayload: 'traveler_hub',
        },
      ],
    };
  }

  // =========================================================================
  // 13. WHATSAPP DIRECT CONTACT
  // =========================================================================
  if (query.includes('واتساب') || query.includes('whatsapp') || query.includes('تواصل') || query.includes('contact')) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-1-direct',
      timestamp,
      content: isArabic
        ? `في منصة رِحال التواصل مباشر وسهل جداً:

• عند تصفح أي رحلة أو بروفايل شركة، اضغط على زر **واتساب (WhatsApp)** الأخضر.
• هتتفتح لك محادثة فورية مباشرة مع قسم الحجوزات بالشركة ومعاها اسم البرنامج، وهيجاوبوك فوراً وبأحسن سعر بدون أي وسيط.`
        : `On RIHAL, connecting with incoming operators is instant and direct:

• Simply tap the green **WhatsApp** button on any tour package or agency profile.
• This opens a direct chat with their reservations team with the package name already filled in, so you get an immediate response and personalized quote with zero broker fees.`,
    };
  }

  // =========================================================================
  // 14. HUMAN ESCALATION & TICKET ASSIGNMENT
  // =========================================================================
  const isEscalation = [
    'مشكلة كبيرة', 'معلق', 'خطأ في الدفع', 'تدخل شخص', 'فريق العمل يكلمني', 'طوارئ', 'شكوى رسمية',
    'critical error', 'urgent human', 'escalate', 'payment failed', 'database error', 'speak to human'
  ].some((t) => query.includes(t));
  const ticketRef = `RHL-${Math.floor(100000 + Math.random() * 900000)}`;

  if (isEscalation) {
    return {
      id,
      sender: 'assistant',
      stage: 'stage-3-escalation',
      timestamp,
      ticketId: ticketRef,
      content: isArabic
        ? `يا فندم، أنا اهتميت بموضوعك وسجلت ملاحظتك فوراً بملف متابعة خاص: **${ticketRef}**.
تواصلت مباشرة مع زملائي في فريق الضيافة والعمليات، وأحد مسؤولينا هيتواصل مع حضرتك شخصياً وبأسرع وقت لخدمتك والتأكد من راحتك تماماً.

مرجع المتابعة لخدمتك: **${ticketRef}**`
        : `Please rest assured, I have personally taken note of everything and opened a priority follow-up file: **${ticketRef}**.
I have alerted our senior hospitality colleagues, and one of our dedicated managers will reach out to you directly to ensure you are fully cared for.

Your priority service reference: **${ticketRef}**`,
    };
  }

  // =========================================================================
  // 15. DEFAULT CONCIERGE GREETING & GUIDANCE
  // =========================================================================
  return {
    id,
    sender: 'assistant',
    stage: 'stage-2-assisted',
    timestamp,
    ticketId: ticketRef,
    content: isArabic
      ? `أهلاً بيك! معاك **فارس**، رفيقك في رِحال.
أنا عارف كل تفاصيل المنصة وبرامج الرحلات وأكواد الحجز في مصر:

• لو معاك كود رحلة (زي **EG-CAI-7491**)، اكتبهولي وهفتحهولك في ثانية.
• لو بتسأل عن حجز فندق أو رحلة نشطة اليوم، قولي اسم الفوج أو الفندق وهفيدك فوراً.
• ولو محتاج تجهز عرض سعر أو تدير باقات الحج والعمرة، أنا جاهز لمساعدتك.`
      : `Hello! I'm **Faris**, your personal concierge at RIHAL.
I'm familiar with all our Egypt tour programs, passcodes, and operations:

• If you have a trip passcode (like **EG-CAI-7491**), share it and I will open it for you right away.
• If you need live status for active tours or hotel confirmations, tell me the guest or property name.
• If you need help with B2B quotes or Hajj & Umrah operations, I'm here to assist.`,
    suggestedActions: [
      {
        labelEn: 'Try Demo Code: EG-CAI-7491',
        labelAr: 'تجربة كود تجريبي: EG-CAI-7491',
        actionType: 'copy_passcode',
        actionPayload: 'EG-CAI-7491',
      },
    ],
  };
};
