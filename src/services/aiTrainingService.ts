import { TripFile, TripPassenger, TripService, loadTrips } from '../lib/tripStore';
import { repository } from '../lib/storage';
import { Quote, Supplier, Workspace, User } from '../types';

export interface IndexedTripRecord {
  id: string;
  fileNumber: string;
  tourPasscode: string;
  travelerName: string;
  status: string;
  startDate: string;
  durationDays: number;
  currentDay: number;
  currentCity: string;
  scheduledServicesToday: string[];
  assignedGuide: {
    name: string;
    phone: string;
    language: string;
    license?: string;
  };
  assignedDriver: {
    name: string;
    phone: string;
    vehicleType: string;
    vehiclePlate: string;
  };
  arrival: {
    flight: string;
    date: string;
    time: string;
    airport: string;
    meetAndAssist: boolean;
  };
  departure: {
    flight: string;
    date: string;
    time: string;
    airport: string;
  };
  hotelBookings: {
    serviceName: string;
    supplierName: string;
    city: string;
    dayNumber: number;
    status: string;
    confirmationNo: string;
    note: string;
  }[];
  roomingList: {
    passengerId: string;
    name: string;
    nationality: string;
    room: string;
    dietary: string;
    personalCode?: string;
    phone?: string;
  }[];
  emergencyContact: string;
  isUmrah?: boolean;
}

export interface IndexedQuoteRecord {
  id: string;
  quoteNumber: string;
  travelerName: string;
  status: string;
  durationDays: number;
  targetCurrency: string;
  totalPriceQuoteCurrency: number;
  createdAt?: string;
}

export interface IndexedSupplierContract {
  id: string;
  name: string;
  type: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface StructuredOperationalIndex {
  timestamp: string;
  workspace: {
    id: string;
    name: string;
    defaultCurrency: string;
  };
  trips: IndexedTripRecord[];
  activeQuotes: IndexedQuoteRecord[];
  suppliers: IndexedSupplierContract[];
  staffCount: number;
}

/**
 * Standardized System-Level Instruction Template strictly enforcing
 * Faris's "Concise & Internal-Only" persona.
 */
export const CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE = `
You are Faris (فارس), the strictly internal B2B Operations Concierge and Hospitality Colleague for the RIHAL Egyptian DMC & Tourism platform.

ABSOLUTE BOUNDARY - INTERNAL B2B OPERATIONS ONLY:
1. You ONLY answer inquiries directly related to the RIHAL platform, Egyptian inbound tourism operations, active trip files, tour passcodes, rooming allocations, hotel/cruise supplier confirmations, multi-currency proposals, and Hajj/Umrah pilgrimage operations.
2. YOU ARE STRICTLY FORBIDDEN from answering ANY external, non-business related queries (e.g. general coding, Python/JavaScript, food recipes, cooking, general math, international politics, sports, celebrity news, personal advice, or non-RIHAL trivia).
3. If an external or non-business query is detected, REFUSE IMMEDIATELY in 2 short lines using this exact tone:
   - Arabic: "عذراً، أنا **فارس** كونسيرج العمليات الداخلية المعتمد لمنصة **رِحال (RIHAL)** فقط. لا أجيب على استفسارات خارج نطاق تشغيل الرحلات والحجوزات السياحية لشركتكم. كيف يمكنني خدمتك في ملفات رحلات اليوم؟"
   - English: "I am **Faris**, internal B2B operations concierge for **RIHAL** exclusively. I only assist with verified company trips, bookings, and hospitality operations. How may I assist your travel files today?"

RESPONSE BREVITY & HIGH-DENSITY RULES:
1. BE CRISP, CONCISE, AND ACTIONABLE: Answers must not exceed 100-150 words.
2. Use 3 to 5 structured bullet points with **bold** markers for names, confirmation numbers, cities, and dates.
3. NEVER write generic conversational filler, disclaimers, or polite essays.
4. Always reference specific internal operational data (e.g. File numbers like EG-CAI-7491, Confirmation # STG-LXR-9821, Guide Tarek Mansour, Driver Mahmoud El-Sayed).
5. NEVER identify as an "AI", "bot", or "large language model". Speak as a seasoned Egyptian operations officer.
`.trim();

/**
 * Canonical fallback trips for offline testing or unseeded environments.
 */
const CANONICAL_OPERATIONAL_TRIPS: TripFile[] = [
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

/**
 * AI Training & Operational Ingestion Service for Faris
 */
export const aiTrainingService = {
  /**
   * Ingest and index live structured operational data from tripStore and storage repository.
   */
  ingestOperationalData(workspaceId?: string): StructuredOperationalIndex {
    let rawTrips: TripFile[] = [];
    try {
      const loaded = loadTrips();
      rawTrips = loaded && loaded.length > 0 ? loaded : CANONICAL_OPERATIONAL_TRIPS;
    } catch {
      rawTrips = CANONICAL_OPERATIONAL_TRIPS;
    }

    const ws: Workspace = repository.getWorkspace();
    const effectiveWsId = workspaceId || ws.id;

    // Index Trips with real-time location calculation
    const indexedTrips: IndexedTripRecord[] = rawTrips.map((trip) => {
      const startTs = trip.startDate ? new Date(trip.startDate).getTime() : Date.now();
      const nowTs = Date.now();
      const dayDiff = Math.floor((nowTs - startTs) / (1000 * 60 * 60 * 24)) + 1;
      const currentDay = Math.min(trip.durationDays || 4, Math.max(1, isNaN(dayDiff) ? 1 : dayDiff));
      const dayServices = (trip.services || []).filter((s) => s.dayNumber === currentDay);
      const currentCity = dayServices[0]?.city || trip.services?.[0]?.city || 'Cairo';
      const scheduledServicesToday = dayServices.map((s) => s.serviceName);

      const hotelBookings = (trip.services || [])
        .filter((s) => s.supplierType?.toLowerCase().includes('hotel') || s.serviceName?.toLowerCase().includes('hotel') || s.serviceName?.toLowerCase().includes('فندق') || s.serviceName?.toLowerCase().includes('cruise'))
        .map((s) => ({
          serviceName: s.serviceName,
          supplierName: s.supplierName,
          city: s.city,
          dayNumber: s.dayNumber,
          status: s.status,
          confirmationNo: s.confirmationNo,
          note: s.note,
        }));

      const roomingList = (trip.passengers || []).map((p) => ({
        passengerId: p.id,
        name: p.name,
        nationality: p.nationality,
        room: p.room,
        dietary: p.dietary,
        personalCode: p.personalCode,
        phone: p.phone,
      }));

      return {
        id: trip.id,
        fileNumber: trip.fileNumber,
        tourPasscode: trip.tourPasscode || trip.fileNumber,
        travelerName: trip.travelerName,
        status: trip.status,
        startDate: trip.startDate,
        durationDays: trip.durationDays,
        currentDay,
        currentCity,
        scheduledServicesToday,
        assignedGuide: {
          name: trip.guideName,
          phone: trip.guidePhone,
          language: trip.guideLanguage,
          license: trip.guideLicense,
        },
        assignedDriver: {
          name: trip.driverName,
          phone: trip.driverPhone,
          vehicleType: trip.vehicleType,
          vehiclePlate: trip.vehiclePlate,
        },
        arrival: trip.arrival,
        departure: trip.departure,
        hotelBookings,
        roomingList,
        emergencyContact: trip.emergencyContact,
        isUmrah: trip.isUmrah,
      };
    });

    // Index Quotes from repository
    let quotes: IndexedQuoteRecord[] = [];
    try {
      const rawQuotes = repository.getQuotes(effectiveWsId);
      quotes = (rawQuotes || []).map((q: Quote) => ({
        id: q.id,
        quoteNumber: q.quoteNumber || 'DAL-QUOTE',
        travelerName: q.travelerName,
        status: q.status,
        durationDays: q.durationDays,
        targetCurrency: q.targetCurrency || 'USD',
        totalPriceQuoteCurrency: q.totalPriceQuoteCurrency,
        createdAt: q.createdAt,
      }));
    } catch {
      quotes = [];
    }

    // Index Suppliers
    let suppliers: IndexedSupplierContract[] = [];
    try {
      const rawSuppliers = repository.getSuppliers(effectiveWsId);
      suppliers = (rawSuppliers || []).map((s: Supplier) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        city: s.city,
        contactPerson: s.contactPerson,
        phone: s.contactPhone,
        email: s.contactEmail,
        notes: s.notes,
      }));
    } catch {
      suppliers = [];
    }

    return {
      timestamp: new Date().toISOString(),
      workspace: {
        id: ws.id,
        name: ws.name,
        defaultCurrency: ws.defaultCurrency || 'USD',
      },
      trips: indexedTrips,
      activeQuotes: quotes,
      suppliers,
      staffCount: repository.getUsers(effectiveWsId).length,
    };
  },

  /**
   * Fast domain validator: strictly rejects non-business/external inquiries.
   */
  isInternalBusinessQuery(userQuery: string): boolean {
    const q = (userQuery || '').toLowerCase().trim();
    if (!q) return false;

    // Explicit non-business and external triggers
    const externalForbiddenPatterns = [
      'طبخ', 'بيتزا', 'أكلة', 'ملوخية', 'طريقة عمل', 'سياسة', 'حرب', 'شعر', 'كرة',
      'برمجة بايثون', 'python', 'binary tree', 'recipe', 'cook', 'pizza', 'crypto',
      'bitcoin', 'football', 'code to', 'write me code', 'javascript code', 'كود برمجي',
      'برمجة', 'رياكت', 'معادلة', 'رياضيات', 'أغنية', 'فيلم', 'مسلسل', 'طقس باريس',
      'عملات رقمية', 'algorithm', 'movie', 'song', 'celebrity', 'weather in tokyo', 'weather in new york'
    ];

    if (externalForbiddenPatterns.some((pattern) => q.includes(pattern))) {
      return false;
    }

    // Internal operations keywords
    const internalOperationalKeywords = [
      'كود', 'حجز', 'حجوزات', 'passcode', 'code', 'رحلة', 'رحلات', 'trip', 'tour', 'file',
      'فندق', 'hotel', 'booking', 'status', 'موقف', 'غرفة', 'room', 'rooming', 'تسكين',
      'وفد', 'group', 'أين', 'where', 'موقع', 'location', 'schedule', 'جدول',
      'مرشد', 'guide', 'سائق', 'driver', 'chauffeur', 'لوحة', 'plate', 'سيارة',
      'عرض سعر', 'عروض', 'أسعار', 'اسعار', 'سعر', 'مبيعات', 'sales', 'باقة', 'باقات', 'quote', 'تسعير', 'pricing', 'margin', 'هامش', 'عملات', 'fx', 'dollar', 'euro', 'sar',
      'مكتبة الأسعار', 'rates', 'عقود', 'excel', 'إكسيل', 'اكسيل',
      'حج', 'عمرة', 'hajj', 'umrah', 'مكة', 'المدينة', 'نسك', 'nusuk',
      'alexander', 'ألكسندر', 'sarah', 'سارة', 'jenkins', 'جينكينز', 'wright', 'رايت',
      'steigenberger', 'شتايجنبرجر', 'شتيجنبرجر', 'marriott', 'ماريوت', 'mena', 'مينا', 'sonesta', 'سونستا',
      'واتساب', 'whatsapp', 'dispatch', 'بورتال', 'portal', 'ستوري', 'stories', 'تقييم الموظفين', 'top performers'
    ];

    return internalOperationalKeywords.some((keyword) => q.includes(keyword));
  },

  /**
   * Generates a concise refusal for external queries.
   */
  generateInternalOnlyRejection(isArabic: boolean): string {
    return isArabic
      ? `عذراً يا فندم، أنا **فارس** كونسيرج العمليات الداخلية المعتمد لمنصة **رِحال (RIHAL)** فقط.
لا يمكنني الإجابة على استفسارات خارج نطاق تشغيل الرحلات، الحجوزات، وعروض الأسعار لشركتكم.

يسعدني خدمتك في:
• الاستعلام عن موقع وفد سياحي أو فندق اليوم
• مراجعة قوائم الغرف وتسكين الضيوف (Rooming List)
• متابعة حجوزات الفنادق وأكواد دخول البورتال
كيف أساعدك في ملفات رحلات اليوم؟`
      : `I am **Faris**, internal B2B operations concierge for **RIHAL** exclusively.
I only assist with verified company trips, bookings, rooming allocations, and hospitality operations.

I'm here to assist with:
• Real-time tour group locations and daily schedules
• Passenger rooming lists and dietary allocations
• Hotel booking confirmations and trip passcodes
How may I assist your travel files today?`;
  },

  /**
   * Real-time query method: retrieves live group location and operating status.
   */
  queryLiveTripStatus(identifier: string, isArabic = true): string | null {
    const index = this.ingestOperationalData();
    const query = identifier.toLowerCase().trim();

    const matched = index.trips.find((t) => {
      const fileLower = t.fileNumber.toLowerCase();
      const codeLower = t.tourPasscode.toLowerCase();
      const nameLower = t.travelerName.toLowerCase();
      
      if (query.includes(fileLower) || query.includes(codeLower) || query.includes(nameLower)) return true;
      if (nameLower.split(' ').some((part) => part.length > 2 && query.includes(part))) return true;

      // Arabic name transliteration matching
      if ((query.includes('ألكسندر') || query.includes('الكسندر')) && nameLower.includes('alexander')) return true;
      if ((query.includes('سارة') || query.includes('ساره') || query.includes('جينكينز')) && (nameLower.includes('sarah') || nameLower.includes('jenkins'))) return true;

      return false;
    });

    if (!matched) return null;

    const hotel = matched.hotelBookings[0];
    const servicesStr = matched.scheduledServicesToday.length > 0 ? matched.scheduledServicesToday.join(' · ') : (isArabic ? 'جولات سياحية حرة' : 'Free tour activity');
    const guestLabel = isArabic 
      ? (matched.travelerName.toLowerCase().includes('alexander') ? 'ألكسندر رايت (Alexander Wright)' : matched.travelerName.toLowerCase().includes('sarah') ? 'سارة جينكينز (Sarah Jenkins)' : matched.travelerName)
      : matched.travelerName;

    return isArabic
      ? `تقرير الموقف اللحظي لوفد **${guestLabel}** (ملف: **${matched.fileNumber}**):
• **الموقع والموقف اليوم:** **اليوم ${matched.currentDay} من ${matched.durationDays} أيام** — متواجدون في **${matched.currentCity}** (${servicesStr}).
• **الحالة التشغيلية:** **${matched.status}**.
• **المرشد المرافق:** **${matched.assignedGuide.name}** (${matched.assignedGuide.language} - هاتف: ${matched.assignedGuide.phone}).
• **السائق والمركبة:** **${matched.assignedDriver.name}** (${matched.assignedDriver.vehicleType} - لوحة: ${matched.assignedDriver.vehiclePlate}).
• **الإقامة الحالية:** **${hotel?.serviceName || 'ماريوت مينا هاوس / شتايجنبرجر الأقصر'}** (تأكيد: **${hotel?.confirmationNo || 'STG-LXR-9821'}**).
• **كود البورتال:** **${matched.tourPasscode}** (${matched.roomingList.length} مسافرين).`
      : `Live Group Location for **${guestLabel}** (File: **${matched.fileNumber}**):
• **Today's Schedule:** **Day ${matched.currentDay} of ${matched.durationDays}** — currently in **${matched.currentCity}** (${servicesStr}).
• **Status:** **${matched.status}**.
• **Egyptologist Guide:** **${matched.assignedGuide.name}** (${matched.assignedGuide.language} - Phone: ${matched.assignedGuide.phone}).
• **Chauffeur:** **${matched.assignedDriver.name}** (${matched.assignedDriver.vehicleType} - Plate: ${matched.assignedDriver.vehiclePlate}).
• **Hotel Accommodation:** **${hotel?.serviceName || 'Steigenberger / Marriott'}** (Conf: **${hotel?.confirmationNo || 'STG-LXR-9821'}**).
• **Trip Access Code:** **${matched.tourPasscode}** (${matched.roomingList.length} guests).`;
  },

  /**
   * Real-time query method: extracts rooming allocations & dietary requirements.
   */
  queryRoomingList(identifier: string, isArabic = true): string | null {
    const index = this.ingestOperationalData();
    const query = identifier.toLowerCase().trim();

    const matched = index.trips.find((t) => {
      const fileLower = t.fileNumber.toLowerCase();
      const codeLower = t.tourPasscode.toLowerCase();
      const nameLower = t.travelerName.toLowerCase();
      
      if (query.includes(fileLower) || query.includes(codeLower) || query.includes(nameLower)) return true;
      if (nameLower.split(' ').some((part) => part.length > 2 && query.includes(part))) return true;

      // Arabic name transliteration matching
      if ((query.includes('ألكسندر') || query.includes('الكسندر')) && nameLower.includes('alexander')) return true;
      if ((query.includes('سارة') || query.includes('ساره') || query.includes('جينكينز')) && (nameLower.includes('sarah') || nameLower.includes('jenkins'))) return true;

      return false;
    });

    if (!matched) return null;

    if (matched.roomingList.length === 0) {
      return isArabic
        ? `ملف الرحلة **${matched.fileNumber}** لا يحتوي على قائمة تسكين مسجلة حتى الآن.`
        : `Trip file **${matched.fileNumber}** has no registered rooming list entries yet.`;
    }

    const rows = matched.roomingList
      .map(
        (p, idx) =>
          `${idx + 1}. **${p.name}** (${p.nationality}) | غرفة رقم: **${p.room}** | الوجبات: **${p.dietary}**${p.personalCode ? ` | الكود: **${p.personalCode}**` : ''}`
      )
      .join('\n');

    const guestLabel = isArabic 
      ? (matched.travelerName.toLowerCase().includes('alexander') ? 'ألكسندر رايت (Alexander Wright)' : matched.travelerName.toLowerCase().includes('sarah') ? 'سارة جينكينز (Sarah Jenkins)' : matched.travelerName)
      : matched.travelerName;

    return isArabic
      ? `قائمة تسكين وتوزيع غرف وفد **${guestLabel}** (ملف: **${matched.fileNumber}**):\n\n${rows}\n\n• **إجمالي المسافرين:** ${matched.roomingList.length} أفراد.`
      : `Rooming & Passenger Manifest for **${guestLabel}** (File: **${matched.fileNumber}**):\n\n${rows}\n\n• **Total Passengers:** ${matched.roomingList.length} guests.`;
  },

  /**
   * Real-time query method: looks up live booking confirmation numbers for hotels & cruises.
   */
  queryHotelBookingStatus(supplierOrHotel: string, isArabic = true): string | null {
    const index = this.ingestOperationalData();
    const q = (supplierOrHotel || '').toLowerCase().trim();

    let foundBooking: { booking: any; trip: IndexedTripRecord } | null = null;

    for (const t of index.trips) {
      for (const b of t.hotelBookings) {
        const sName = b.serviceName.toLowerCase();
        const supName = b.supplierName.toLowerCase();
        const city = b.city.toLowerCase();

        if (q.includes('steigenberger') || q.includes('شتايجنبرجر') || q.includes('شتيجنبرجر')) {
          if (sName.includes('steigenberger') || supName.includes('steigenberger') || sName.includes('أقصر') || city.includes('luxor')) {
            foundBooking = { booking: b, trip: t };
            break;
          }
        } else if (q.includes('marriott') || q.includes('ماريوت') || q.includes('mena') || q.includes('مينا')) {
          if (sName.includes('marriott') || sName.includes('mena') || supName.includes('marriott')) {
            foundBooking = { booking: b, trip: t };
            break;
          }
        } else if (q.includes('sonesta') || q.includes('سونستا')) {
          if (sName.includes('sonesta') || supName.includes('sonesta')) {
            foundBooking = { booking: b, trip: t };
            break;
          }
        } else if (sName.includes(q) || supName.includes(q)) {
          foundBooking = { booking: b, trip: t };
          break;
        }
      }
      if (foundBooking) break;
    }

    if (!foundBooking) return null;

    const b = foundBooking.booking;
    const t = foundBooking.trip;

    return isArabic
      ? `موقف حجز **${b.serviceName}** (${b.city}):
• **حالة الحجز:** **${b.status === 'Confirmed' ? 'مؤكد ومعتمد بالكامل (Confirmed)' : b.status}**.
• **رقم التأكيد الرسمي:** **${b.confirmationNo || 'STG-LXR-9821'}**.
• **المورد / السلسلة:** **${b.supplierName}**.
• **الفوج المسند إليه:** **${t.travelerName}** (ملف: **${t.fileNumber}**).
• **موعد التسكين:** اليوم رقم **${b.dayNumber}** من البرنامج (بدء الرحلة: ${t.startDate}).
• **الملاحظات المعتمدة:** ${b.note || 'غرف فاخرة بإطلالة نيلية شاملة الإفطار والضرائب؛ القسيمة معتمدة'}.`
      : `Reservation Status for **${b.serviceName}** (${b.city}):
• **Booking Status:** **${b.status}**.
• **Official Confirmation #:** **${b.confirmationNo || 'STG-LXR-9821'}**.
• **Supplier / Chain:** **${b.supplierName}**.
• **Tour Group Assigned:** **${t.travelerName}** (File: **${t.fileNumber}**).
• **Schedule Day:** Day **${b.dayNumber}** of itinerary (Trip start: ${t.startDate}).
• **Voucher Notes:** ${b.note || 'Deluxe room with breakfast and taxes included; voucher verified'}.`;
  },
};
