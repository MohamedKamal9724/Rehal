import { Quote, Workspace, Currency } from '../types';
import { TripFile, loadTrips } from './tripStore';

export interface ConciergeGroundContact {
  role: 'guide' | 'driver' | 'ops' | 'rep';
  name: string;
  arabicName?: string;
  phone: string;
  whatsappUrl: string;
  callUrl: string;
  title: string;
  badge?: string;
  languages?: string;
  vehicleModel?: string;
  licensePlate?: string;
  photoUrl?: string;
}

export interface TaxiCardAddress {
  englishName: string;
  arabicName: string;
  phoneticPronunciation: string;
  city: string;
  district: string;
  fullArabicAddress: string;
  emergencyPhone: string;
  driverInstructionsArabic: string;
  googleMapsUrl?: string;
}

export interface ConciergeDayDetails {
  dayNumber: number;
  totalDays: number;
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
  city: string;
  title: string;
  description: string;
  pickupTime: string;
  pickupLocation: string;
  guide?: ConciergeGroundContact;
  driver?: ConciergeGroundContact;
  dutyManager: ConciergeGroundContact;
  tonightStay?: {
    name: string;
    type: 'hotel' | 'cruise' | 'resort';
    city: string;
    taxiCard: TaxiCardAddress;
  };
  monumentPasses: {
    name: string;
    status: 'included' | 'optional';
    skipTheLine: boolean;
    note: string;
  }[];
  etiquetteTips: string[];
  weatherAlert?: {
    tempC: number;
    condition: string;
    uvIndex: 'Moderate' | 'High' | 'Extreme';
    packingAdvice: string;
  };
}

export function getTripFileForQuote(quoteId: string): TripFile | null {
  try {
    const all = loadTrips();
    return all.find(t => t.quoteId === quoteId) || null;
  } catch {
    return null;
  }
}

export function resolveActiveDayNumber(quote: Quote, requestedDay?: number): number {
  if (requestedDay && requestedDay >= 1 && requestedDay <= quote.durationDays) {
    return requestedDay;
  }

  // Calculate day difference if travel is currently ongoing
  if (quote.startDate) {
    const start = new Date(quote.startDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 1 && diffDays <= quote.durationDays) {
      return diffDays;
    }
  }

  return 1;
}

export function generateTaxiCard(destinationName: string, city: string, phone: string): TaxiCardAddress {
  const norm = destinationName.toLowerCase();

  let arabicName = 'فندق الإقامة السياحي';
  let phonetic = 'Al-Funduq';
  let district = city;
  let fullArabicAddress = `جمهورية مصر العربية، ${city}`;
  let driverInstructions = 'من فضلك وصّل السائح الكريم إلى مقر إقامته الموضح أعلاه بأمان، والحساب مدفوع من الشركة.';

  if (norm.includes('mena house') || norm.includes('marriott mena')) {
    arabicName = 'فندق ماريوت مينا هاوس - الأهرامات';
    phonetic = 'Marriott Mena House - Al-Ahramat';
    district = 'الهرم، الجيزة';
    fullArabicAddress = 'طريق الأهرام، ميدان الرماية، الجيزة، بجوار أهرامات الجيزة';
    driverInstructions = 'من فضلك وصّل الضيف لفندق مينا هاوس عند بوابة مدخل الهرم ميدان الرماية.';
  } else if (norm.includes('four seasons') && norm.includes('first')) {
    arabicName = 'فندق فور سيزونز فرست ريزيدنس - الجيزة';
    phonetic = 'Four Seasons First Residence - Giza';
    district = 'شارع الجيزة، النيل';
    fullArabicAddress = '35 شارع الجيزة، أمام حديقة الحيوان، الجيزة';
    driverInstructions = 'من فضلك وصّل الضيف لبرج فرست مول وفندق فورسيزونز كورنيش النيل بالجيزة.';
  } else if (norm.includes('kempinski') || norm.includes('garden city')) {
    arabicName = 'فندق كمبنسكي النيل - جاردن سيتي';
    phonetic = 'Kempinski Nile Hotel - Garden City';
    district = 'جاردن سيتي، القاهرة';
    fullArabicAddress = '12 شارع أحمد راغب، كورنيش النيل، جاردن سيتي، القاهرة';
    driverInstructions = 'من فضلك وصّل الضيف لفندق كمبنسكي كورنيش النيل جاردن سيتي.';
  } else if (norm.includes('sofitel') && norm.includes('legend') && norm.includes('cataract')) {
    arabicName = 'فندق سوفيتيل ليجند أولد كتراكت - أسوان';
    phonetic = 'Sofitel Legend Old Cataract - Aswan';
    district = 'طريق أبطال التحرير، أسوان';
    fullArabicAddress = 'شارع أبطال التحرير، كورنيش النيل، أسوان، على ضفاف النيل';
    driverInstructions = 'من فضلك وصّل الضيف لفندق أولد كتراكت التاريخي على كورنيش أسوان.';
  } else if (norm.includes('winter palace') || norm.includes('sofitel winter')) {
    arabicName = 'فندق ونتر بالاس الأقصر التاريخي';
    phonetic = 'Sofitel Winter Palace - Luxor';
    district = 'كورنيش النيل، الأقصر';
    fullArabicAddress = 'شارع كورنيش النيل، بجوار معبد الأقصر، الأقصر';
    driverInstructions = 'من فضلك وصّل الضيف لفندق ونتر بالاس على كورنيش النيل بجوار معبد الأقصر.';
  } else if (norm.includes('cruise') || norm.includes('mayfair') || norm.includes('steigenberger')) {
    arabicName = `رصيف الباخرة النيلية السياحية (${destinationName})`;
    phonetic = 'Raseef Al-Krooz Al-Neeli';
    district = city;
    fullArabicAddress = `مراسي البواخر السياحية، كورنيش النيل، ${city}`;
    driverInstructions = `من فضلك وصّل الضيف إلى مرسى الباخرة النيلية (${destinationName}) على الكورنيش.`;
  } else {
    arabicName = destinationName;
    phonetic = destinationName;
    district = city;
    fullArabicAddress = `مقر الإقامة السياحي في ${city}، جمهورية مصر العربية`;
  }

  return {
    englishName: destinationName,
    arabicName,
    phoneticPronunciation: phonetic,
    city,
    district,
    fullArabicAddress,
    emergencyPhone: phone,
    driverInstructionsArabic: driverInstructions,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationName + ' ' + city + ' Egypt')}`,
  };
}

const CANONICAL_7_DAY_FALLBACK: Record<number, { city: string; title: string; description: string; stayName: string; stayType: 'hotel' | 'cruise' }> = {
  1: {
    city: 'Cairo',
    title: 'VIP Arrival at Cairo & Four Seasons Nile Plaza Check-in',
    description: 'VIP Lounge Meet & Assist at Cairo International Airport (CAI), private Mercedes-Benz V-Class transfer to Four Seasons Hotel Cairo at Nile Plaza (Voucher #FS-CAI-88412), and welcome Nile dinner briefing with Egyptologist Sherif Al-Muniri.',
    stayName: 'Four Seasons Hotel Cairo at Nile Plaza',
    stayType: 'hotel',
  },
  2: {
    city: 'Giza',
    title: 'Giza Plateau, Great Sphinx & Grand Egyptian Museum (GEM) Royal Wing',
    description: 'Private tour of the Great Pyramids of Khufu, Khafre & Menkaure, Great Sphinx Enclosure, Pyramid-view lunch at 9 Pyramids Lounge, and private curator access at the Grand Egyptian Museum (Voucher #GEM-VIP-114).',
    stayName: 'Four Seasons Hotel Cairo at Nile Plaza',
    stayType: 'hotel',
  },
  3: {
    city: 'Luxor',
    title: 'Flight to Luxor, Sofitel Winter Palace & Karnak / Luxor Temples',
    description: 'Morning flight MS 062 to Luxor, suite check-in at Historic Royal Wing of Sofitel Winter Palace Luxor (Voucher #SWP-LXR-55109), afternoon tour of Karnak Temple & Illuminated Luxor Temple (#LXR-KRK-409), and 1886 Royal Dining.',
    stayName: 'Sofitel Winter Palace Luxor',
    stayType: 'hotel',
  },
  4: {
    city: 'Luxor',
    title: 'Luxor West Bank (Valley of the Kings, Hatshepsut, Colossi) & Sanctuary Sun Boat IV Embarkation',
    description: 'Private West Bank exploration of Valley of the Kings (Tutankhamun & Seti I VIP tombs), Temple of Queen Hatshepsut, and Colossi of Memnon with Sherif Al-Muniri, followed by embarkation on 5★ Sanctuary Sun Boat IV (Voucher #SSB-NILE-4402).',
    stayName: 'Sanctuary Sun Boat IV Luxury Nile Cruise',
    stayType: 'cruise',
  },
  5: {
    city: 'Edfu & Kom Ombo',
    title: 'Nile Sailing Luxor to Aswan via Edfu (Temple of Horus) & Kom Ombo',
    description: 'Scenic Nile sailing aboard Sanctuary Sun Boat IV via Esna Lock, morning visit to Temple of Horus at Edfu, upper-deck Egyptian afternoon tea, and sunset tour of the Double Temple of Kom Ombo & Crocodile Museum (Voucher #SSB-SAIL-5503).',
    stayName: 'Sanctuary Sun Boat IV Luxury Nile Cruise',
    stayType: 'cruise',
  },
  6: {
    city: 'Aswan',
    title: 'Aswan Royal Program: Abu Simbel Temples, Philae Island & Sunset Felucca',
    description: 'Morning flight to Abu Simbel Sun Temples of Ramesses II & Nefertari, motorboat to Philae Island Temple of Isis, sunset Nile felucca sail around Elephantine Island, and Captain Farewell Gala Dinner aboard Sanctuary Sun Boat IV (Voucher #ASW-VIP-6604).',
    stayName: 'Sanctuary Sun Boat IV Luxury Nile Cruise',
    stayType: 'cruise',
  },
  7: {
    city: 'Cairo',
    title: 'Disembarkation in Aswan & Executive Transfer to Cairo International Airport (CAI)',
    description: 'Gourmet breakfast and disembarkation from Sanctuary Sun Boat IV in Aswan, domestic Business Class flight MS 085 to Cairo, VIP First Class Lounge hospitality, and international departure transfer (Voucher #CAI-DEP-7705).',
    stayName: 'Four Seasons Hotel Cairo / CAI VIP Terminal',
    stayType: 'hotel',
  },
};

export function getConciergeDayDetails(
  quote: Quote,
  tripFile: TripFile | null,
  dayNumber: number,
  workspace: Workspace
): ConciergeDayDetails {
  const canonicalDay = CANONICAL_7_DAY_FALLBACK[dayNumber] || CANONICAL_7_DAY_FALLBACK[7];
  const matchedQuoteDay = quote.days?.find(d => d.dayNumber === dayNumber);
  const day = matchedQuoteDay || {
    dayNumber,
    title: canonicalDay.title,
    description: canonicalDay.description,
    city: canonicalDay.city,
    lines: [],
  };

  // Date calculation
  let dateStr = quote.startDate || new Date().toISOString().slice(0, 10);
  let formattedDate = dateStr;
  try {
    const d = new Date(quote.startDate);
    d.setDate(d.getDate() + (dayNumber - 1));
    dateStr = d.toISOString().slice(0, 10);
    formattedDate = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    // fallback
  }

  const isToday = (() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return dateStr === todayStr;
  })();

  const dutyPhone = workspace.contactPhone || '+20 100 000 0000';
  const dutyWhatsapp = workspace.whatsappNumber || dutyPhone;
  const cleanDutyWa = dutyWhatsapp.replace(/\D/g, '');

  const dutyManager: ConciergeGroundContact = {
    role: 'ops',
    name: workspace.name ? `${workspace.name} 24/7 Operations Desk` : 'RIHAL DMC Operations Room',
    title: '24/7 Senior Operations Duty Manager',
    phone: dutyPhone,
    whatsappUrl: `https://wa.me/${cleanDutyWa}?text=${encodeURIComponent(`[Concierge Request] Hello! I am currently traveling on quote #${quote.quoteNumber} (Day ${dayNumber} in ${day.city}). Guest: ${quote.travelerName}. I need assistance with:`)}`,
    callUrl: `tel:${dutyPhone.replace(/\s+/g, '')}`,
    badge: '',
  };

  // Guide
  const guideName = tripFile?.guideName || 'Sherif Al-Muniri (أ. شريف المنيري)';
  const guidePhone = tripFile?.guidePhone || '+20 100 555 0198';
  const guideLang = tripFile?.guideLanguage || 'Arabic / English';
  const guide: ConciergeGroundContact = {
    role: 'guide',
    name: guideName,
    title: 'Licensed Egyptologist Tour Guide',
    languages: guideLang,
    phone: guidePhone,
    whatsappUrl: `https://wa.me/${guidePhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${guideName}! I am ${quote.travelerName} on Day ${dayNumber} of our tour.`)}`,
    callUrl: `tel:${guidePhone.replace(/\s+/g, '')}`,
    badge: '',
  };

  // Driver
  const driverName = tripFile?.driverName || 'Capt. Mahmoud El-Masry (كابتن محمود المصري)';
  const driverPhone = tripFile?.driverPhone || '+20 100 882 4190';
  const vehicleType = tripFile?.vehicleType || 'Mercedes-Benz V-Class VIP (2026)';
  const vehiclePlate = tripFile?.vehiclePlate || 'س ي ا ٩١٤ - مصر';
  const driver: ConciergeGroundContact = {
    role: 'driver',
    name: driverName,
    title: 'Private Chauffeur & Logistics Expert',
    phone: driverPhone,
    vehicleModel: vehicleType,
    licensePlate: vehiclePlate,
    whatsappUrl: `https://wa.me/${driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${driverName}! This is ${quote.travelerName}. We are ready at the hotel lobby.`)}`,
    callUrl: `tel:${driverPhone.replace(/\s+/g, '')}`,
    badge: 'Chauffeured',
  };

  // Accommodations for tonight
  const hotelLine = day.lines?.find(l => l.supplierType === 'Hotel' || /hotel|resort|lodge/i.test(l.serviceName));
  const cruiseLine = day.lines?.find(l => l.supplierType === 'Nile Cruise' || /cruise|ship|sun boat/i.test(l.serviceName));

  let stayName = canonicalDay.stayName;
  let stayType: 'hotel' | 'cruise' | 'resort' = canonicalDay.stayType;

  if (cruiseLine) {
    stayName = cruiseLine.serviceName;
    stayType = 'cruise';
  } else if (hotelLine) {
    stayName = hotelLine.serviceName;
    stayType = 'hotel';
  }

  const taxiCard = generateTaxiCard(stayName, day.city || 'Cairo', dutyPhone);

  // Pre-paid passes
  const monumentPasses: ConciergeDayDetails['monumentPasses'] = [];
  const textDesc = `${day.title} ${day.description}`.toLowerCase();

  if (textDesc.includes('pyramid') || textDesc.includes('giza')) {
    monumentPasses.push({
      name: 'Giza Plateau & Great Pyramid Area Access',
      status: 'included',
      skipTheLine: true,
      note: 'Pre-reserved by RIHAL. Mobile camera photography is free. Inside Khufu chamber entry requires separate ticket.',
    });
  }
  if (textDesc.includes('museum') || textDesc.includes('gem')) {
    monumentPasses.push({
      name: 'Grand Egyptian Museum (GEM) / NMEC Royal Mummies',
      status: 'included',
      skipTheLine: true,
      note: 'Timed entry pass allocated. No flash photography in Tutankhamun galleries.',
    });
  }
  if (textDesc.includes('karnak') || textDesc.includes('luxor temple')) {
    monumentPasses.push({
      name: 'Karnak & Luxor Temple Sacred Precinct Passes',
      status: 'included',
      skipTheLine: true,
      note: 'Official e-ticket with barcoded fast-track entry managed by your Egyptologist.',
    });
  }
  if (textDesc.includes('valley of the kings') || textDesc.includes('tut')) {
    monumentPasses.push({
      name: 'Valley of the Kings (3 Main Royal Tombs)',
      status: 'included',
      skipTheLine: true,
      note: 'Electrical tram transit included. King Tutankhamun / Seti I special tombs available on request.',
    });
  }
  if (monumentPasses.length === 0) {
    monumentPasses.push({
      name: `VIP Access Passes for ${day.city} Sites`,
      status: 'included',
      skipTheLine: true,
      note: 'All entry tickets and guided permits arranged in advance by your Egyptologist tour specialist.',
    });
  }

  // Etiquette tips
  const etiquetteTips: string[] = [
    'Always carry small Egyptian Pound banknotes (20 & 50 EGP) for restrooms and tipping.',
    'Drink only bottled water with sealed caps provided in your private vehicle.',
    'Comfortable walking shoes are vital for uneven ancient stone pavements.',
  ];
  if (textDesc.includes('mosque') || textDesc.includes('islamic') || textDesc.includes('citadel')) {
    etiquetteTips.push('Modest dress required for Mosque entry: shoulders and knees covered; ladies please carry a scarf for hair covering; shoes removed at threshold.');
  }
  if (textDesc.includes('tomb') || textDesc.includes('pyramid')) {
    etiquetteTips.push('Flash photography strictly forbidden inside painted tombs to protect 3,000-year-old natural pigments.');
  }
  if (day.city.toLowerCase() === 'luxor' || day.city.toLowerCase() === 'aswan') {
    etiquetteTips.push('Upper Egypt midday sun is intense: high-SPF sunscreen, wide-brim hat, and sunglasses strongly recommended.');
  }

  // Weather guidance
  const isUpperEgypt = day.city.toLowerCase() === 'luxor' || day.city.toLowerCase() === 'aswan';
  const weatherAlert = {
    tempC: isUpperEgypt ? 34 : 28,
    condition: 'Sunny & Crisp Blue Skies',
    uvIndex: (isUpperEgypt ? 'Extreme' : 'High') as 'Extreme' | 'High',
    packingAdvice: isUpperEgypt 
      ? 'Breathable light cotton or linen clothing, sun hat, UV sunglasses, and lip balm.'
      : 'Comfortable layers: light breathable daywear with a light cardigan or wrap for air-conditioned museums.',
  };

  return {
    dayNumber,
    totalDays: quote.durationDays,
    dateStr,
    formattedDate,
    isToday,
    city: day.city || 'Cairo',
    title: day.title,
    description: day.description,
    pickupTime: dayNumber === 1 ? 'Upon Flight Arrival' : '08:30 AM (Lobby)',
    pickupLocation: dayNumber === 1 ? 'Cairo International Airport (Terminal Hall)' : `${stayName} Main Lobby`,
    guide,
    driver,
    dutyManager,
    tonightStay: {
      name: stayName,
      type: stayType,
      city: day.city,
      taxiCard,
    },
    monumentPasses,
    etiquetteTips,
    weatherAlert,
  };
}

export function formatEmergencyWhatsAppMessage(quote: Quote, dayNumber: number, locationName: string): string {
  return encodeURIComponent(
    `[SOS - CONCIERGE ASSISTANCE NEEDED]\n` +
    `Guest Name: ${quote.travelerName}\n` +
    `Booking Ref: ${quote.quoteNumber}\n` +
    `Current Day: Day ${dayNumber} in ${locationName}\n` +
    `Please call or message me immediately. Location / Situation:`
  );
}
