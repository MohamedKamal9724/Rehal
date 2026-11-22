import type { HajjUmrahPackage, Supplier, Rate, Quote, Workspace, MealPlan } from '../types';

// Kept empty for test invariants
export const HAJJ_UMRAH_PACKAGES: HajjUmrahPackage[] = [];
export const HAJJ_UMRAH_SUPPLIERS: Supplier[] = [];
export const HAJJ_UMRAH_RATES: Rate[] = [];

export interface HajjUmrahPresetPackage {
  id: string;
  name: string;
  arabicName: string;
  tier: '5_star_vip' | '5_star_luxury' | '4_star_classic' | 'deluxe_hajj';
  seasonName: string;
  seasonNameAr: string;
  nightsMakkah: number;
  nightsMadinah: number;
  makkahHotel: string;
  makkahHotelAr: string;
  makkahStars: number;
  makkahDistanceMeters: number;
  makkahDistanceDescAr: string;
  makkahDistanceDescEn: string;
  makkahView: string;
  makkahViewAr: string;
  makkahMealPlan: MealPlan;
  madinahHotel: string;
  madinahHotelAr: string;
  madinahStars: number;
  madinahDistanceMeters: number;
  madinahDistanceDescAr: string;
  madinahDistanceDescEn: string;
  madinahMealPlan: MealPlan;
  transportTypeAr: string;
  transportTypeEn: string;
  trainIncluded: boolean;
  zamzamIncluded: boolean;
  ziyaratIncluded: boolean;
  priceDoubleUsd: number;
  priceTripleUsd: number;
  priceQuadUsd: number;
  highlightsAr: string[];
  highlightsEn: string[];
}

export const SAMPLE_HAJJ_UMRAH_PACKAGES: HajjUmrahPresetPackage[] = [
  {
    id: 'umrah-clocktower-royal-vip',
    name: 'Royal VIP Umrah — Clock Tower & Oberoi Madinah',
    arabicName: 'عمرة النخبة الملكية VIP — برج الساعة وفندق أوبروي المدينة',
    tier: '5_star_vip',
    seasonName: 'Rajab & Shaaban Sacred Season',
    seasonNameAr: 'موسم رجب وشعبان المبارك',
    nightsMakkah: 5,
    nightsMadinah: 4,
    makkahHotel: 'Fairmont Makkah Clock Royal Tower',
    makkahHotelAr: 'فيرمونت برج ساعة مكة الملكي',
    makkahStars: 5,
    makkahDistanceMeters: 20,
    makkahDistanceDescAr: 'إطلالة بانورامية مباشرة على الكعبة المشرفة ومصلى الحرم',
    makkahDistanceDescEn: 'Panoramic direct Kaaba & Haram prayer hall view',
    makkahView: 'Kaaba Direct View',
    makkahViewAr: 'إطلالة مباشرة على الكعبة',
    makkahMealPlan: 'Full Board',
    madinahHotel: 'The Oberoi Madinah',
    madinahHotelAr: 'فندق أوبروي المدينة المنورة',
    madinahStars: 5,
    madinahDistanceMeters: 50,
    madinahDistanceDescAr: 'خطوات من الروضة الشريفة وباب السلام',
    madinahDistanceDescEn: 'Steps from the Prophet’s Rawdah & Bab Al-Salam',
    madinahMealPlan: 'Half Board',
    transportTypeAr: 'قطار الحرمين السريع (الدرجة الأولى) + سيارة GMC يوكون خاصة',
    transportTypeEn: 'Haramain Bullet Train (1st Class) + Private GMC Yukon Chauffeur',
    trainIncluded: true,
    zamzamIncluded: true,
    ziyaratIncluded: true,
    priceDoubleUsd: 2650,
    priceTripleUsd: 2280,
    priceQuadUsd: 1980,
    highlightsAr: [
      'جناح فاخر مطل على صحن الطواف بمكة المكرمة',
      'تذاكر قطار الحرمين السريع درجة أولى مع ضيافة المقاعد الجلدية',
      'مرشد ديني وتربوي مرافق في جولات مزارات مكة والمدينة',
      'عبوة ماء زمزم ٥ لتر مختومة ومعتمدة لكل معتمر بمطار المغادرة',
      'إصدار تصاريح الروضة الشريفة والعمرة عبر منصة نُسك الرسمية'
    ],
    highlightsEn: [
      'Direct Kaaba view luxury suite in Clock Royal Tower',
      'First-Class Haramain High-Speed Rail tickets with onboard lounge service',
      'Dedicated licensed religious guide for all historical Ziyarat',
      '5L factory-sealed Zamzam water container per pilgrim at airport terminal',
      'Official Nusuk Umrah and Rawdah prayer permit coordination'
    ]
  },
  {
    id: 'umrah-jabal-omar-deluxe',
    name: 'Executive Umrah — Jabal Omar & Central Madinah',
    arabicName: 'عمرة الأعمال والراحة — هيلتون جبل عمر ودار التقوى المدينة',
    tier: '5_star_luxury',
    seasonName: 'Annual Umrah Season',
    seasonNameAr: 'موسم العمرة السنوي العام',
    nightsMakkah: 6,
    nightsMadinah: 4,
    makkahHotel: 'Hilton Convention Hotel Jabal Omar',
    makkahHotelAr: 'هيلتون كونفينشن جبل عمر مكة',
    makkahStars: 5,
    makkahDistanceMeters: 180,
    makkahDistanceDescAr: 'ساحة الحرم المكي الشريف مع مسار مخصص للكراسي المتحركة',
    makkahDistanceDescEn: 'Haram courtyard (180m) with dedicated wheelchair ramp',
    makkahView: 'Haram Courtyard View',
    makkahViewAr: 'إطلالة على ساحات الحرم',
    makkahMealPlan: 'Bed & Breakfast',
    madinahHotel: 'Dar Al Taqwa Hotel Madinah',
    madinahHotelAr: 'فندق دار التقوى المدينة المنورة',
    madinahStars: 5,
    madinahDistanceMeters: 100,
    madinahDistanceDescAr: 'المنطقة المركزية الشمالية مقابل بوابة النساء والرجال',
    madinahDistanceDescEn: 'Central Northern Courtyard facing Haram gates',
    madinahMealPlan: 'Bed & Breakfast',
    transportTypeAr: 'قطار الحرمين السريع (درجة الضيافة) + حافلة VIP مكيفة',
    transportTypeEn: 'Haramain Bullet Train (Economy) + VIP AC Coach transfers',
    trainIncluded: true,
    zamzamIncluded: true,
    ziyaratIncluded: true,
    priceDoubleUsd: 1890,
    priceTripleUsd: 1620,
    priceQuadUsd: 1410,
    highlightsAr: [
      'فنادق راقية ٥ نجوم على مسافة دقائق سيراً من بوابات الحرمين',
      'جولة مزارات مكة (غار حراء، غار ثور، وعرفات ومنى)',
      'جولة مزارات المدينة (مسجد قباء، جبل أحد ومقبرة الشهداء، القبلتين)',
      'تسليم عبوات ماء زمزم المعتمدة سعة ٥ لترات بصالة المغادرة'
    ],
    highlightsEn: [
      '5-star executive hotels within 3 minutes stroll of holy courtyards',
      'Comprehensive Makkah Ziyarat (Hira, Thawr, Mina & Arafat)',
      'Comprehensive Madinah Ziyarat (Quba, Mount Uhud, Qiblatayn)',
      'Complimentary airport Zamzam logistics handling'
    ]
  },
  {
    id: 'umrah-classic-4star',
    name: 'Classic Spiritual Umrah — Swissotel Al Maqam & Mövenpick',
    arabicName: 'عمرة البركة الكلاسيكية — سويس أوتيل المقام وأنوار المدينة موفنبيك',
    tier: '4_star_classic',
    seasonName: 'Extended Stay Pilgrimage',
    seasonNameAr: 'باقة الإقامة الممتدة المريحة',
    nightsMakkah: 8,
    nightsMadinah: 6,
    makkahHotel: 'Swissotel Al Maqam Makkah',
    makkahHotelAr: 'سويس أوتيل المقام مكة',
    makkahStars: 4,
    makkahDistanceMeters: 120,
    makkahDistanceDescAr: 'مجمع أبراج البيت مع مصاعد مباشرة لساحة الحرم',
    makkahDistanceDescEn: 'Abraj Al Bait with direct Haram elevators',
    makkahView: 'City / Haram Courtyard',
    makkahViewAr: 'إطلالة مدينة وساحة الحرم',
    makkahMealPlan: 'Bed & Breakfast',
    madinahHotel: 'Anwar Al Madinah Mövenpick',
    madinahHotelAr: 'أنوار المدينة موفنبيك',
    madinahStars: 4,
    madinahDistanceMeters: 150,
    madinahDistanceDescAr: 'المنطقة المركزية مع مركز تسوق ومصلى فندقي متصل بأذان الحرم',
    madinahDistanceDescEn: 'Central zone with indoor mall and connected prayer hall',
    madinahMealPlan: 'Bed & Breakfast',
    transportTypeAr: 'حافلات مرسيدس ترافيلو حديثة VIP مجهزة بالواي فاي والمشروبات',
    transportTypeEn: 'Mercedes-Benz Travego VIP luxury tour coach',
    trainIncluded: false,
    zamzamIncluded: true,
    ziyaratIncluded: true,
    priceDoubleUsd: 1480,
    priceTripleUsd: 1260,
    priceQuadUsd: 1090,
    highlightsAr: [
      'إقامة ممتدة ١٤ يوماً تمنح المعتمر سكينة وأداء أكثر من عمرة',
      'حافلات سياحية خاصة مكيفة مع سائقين ذوي خبرة بالمسارات الدينية',
      'كتيب إرشادي رقمي ومطبوع لمناسك العمرة خطوة بخطوة مع الأدعية النبوية',
      'توزيع مياه زمزم ٥ لتر وتصاريح الصلاة بالروضة الشريفة'
    ],
    highlightsEn: [
      'Extended 14-day stay allowing multiple Umrahs and calm worship',
      'Comfortable luxury air-conditioned highway coach transport',
      'Illustrated bilingual guide booklet for Umrah rituals and authentic Du\'aa',
      'Includes Zamzam 5L voucher and Rawdah prayer slot assistance'
    ]
  },
  {
    id: 'hajj-deluxe-vip-program',
    name: 'Deluxe Air Hajj Program — Mina VIP Tents & 5-Star Suites',
    arabicName: 'برنامج الحج السياحي الفاخر — خيام مجرى الكبش المكيفة وفنادق ٥ نجوم',
    tier: 'deluxe_hajj',
    seasonName: 'Sacred Dhul-Hijjah Hajj Season',
    seasonNameAr: 'موسم الحج الأكبر - ذو الحجة',
    nightsMakkah: 10,
    nightsMadinah: 4,
    makkahHotel: 'Raffles Makkah Palace',
    makkahHotelAr: 'رافلز قصر مكة الفاخر',
    makkahStars: 5,
    makkahDistanceMeters: 30,
    makkahDistanceDescAr: 'أمام الكعبة مباشرة مع أجنحة فاخرة وإطلالة طواف حصرية',
    makkahDistanceDescEn: 'Directly in front of Kaaba with private butler service',
    makkahView: 'Kaaba Direct View',
    makkahViewAr: 'إطلالة كعبة كاملة حصرية',
    makkahMealPlan: 'Full Board',
    madinahHotel: 'Madinah Hilton Hotel',
    madinahHotelAr: 'فندق هيلتون المدينة المنورة',
    madinahStars: 5,
    madinahDistanceMeters: 80,
    madinahDistanceDescAr: 'الجهة الشمالية لساحة الحرم النبوي الشريف',
    madinahDistanceDescEn: 'Northern side of the Prophet’s Mosque courtyard',
    madinahMealPlan: 'Full Board',
    transportTypeAr: 'قطار المشاعر المقدسة السريع + حافلات VIP لنقل الحجاج للمخيمات',
    transportTypeEn: 'Mashair Holy Sites Express Train + VIP Camp Shuttles',
    trainIncluded: true,
    zamzamIncluded: true,
    ziyaratIncluded: true,
    priceDoubleUsd: 5850,
    priceTripleUsd: 5120,
    priceQuadUsd: 4680,
    highlightsAr: [
      'مخيمات مكيفة بمجرى الكبش بمنى مجهزة بأسرة فندقية وبوفيه مفتوح على مدار الساعة',
      'تنقلات المشاعر المقدسة عبر قطار المشاعر دون زحام مروري',
      'طاقم طبي ودعوي متفرغ لخدمة الفوج طوال أيام التشريق',
      'هدية الحج: إحرامات قطنية فاخرة، حقيبة ظهر مجهزة، وسجادة صلاة طبية',
      'ضمان حصة مياه زمزم ٥ لترات مع شحن آمن للأمتعة'
    ],
    highlightsEn: [
      'Air-conditioned VIP tents in Mina with luxury hotel-grade beds and 24/7 dining',
      'Seamless Mashair holy sites transit via dedicated Mashair train',
      'Resident medical doctor and certified religious scholars assisting 24/7',
      'Deluxe Hajj kit: luxury cotton Ihram, medical prayer rug, and RFID pilgrim pass',
      'Guaranteed 5L Zamzam and coordinated baggage delivery to Cairo'
    ]
  }
];

export interface HotelTierOption {
  id: string;
  nameEn: string;
  nameAr: string;
  city: 'Makkah' | 'Madinah';
  stars: number;
  distanceMeters: number;
  distanceDescAr: string;
  distanceDescEn: string;
  pricePerNightUsd: number;
  sampleHotelsAr: string;
  sampleHotelsEn: string;
}

export const MAKKAH_HOTEL_TIERS: HotelTierOption[] = [
  {
    id: 'makkah-5star-front',
    nameEn: '5-Star Direct Haram Front & Clock Tower',
    nameAr: '٥ نجوم صف أول مباشر والحرم (أبراج البيت)',
    city: 'Makkah',
    stars: 5,
    distanceMeters: 30,
    distanceDescAr: 'أمام الكعبة المشرفة وبوابات الحرم مباشرة (٠ إلى ٥٠ متراً)',
    distanceDescEn: 'Directly on Haram courtyard (0 - 50m)',
    pricePerNightUsd: 260,
    sampleHotelsAr: 'فيرمونت، رافلز قصر مكة، سويس أوتيل، دار التوحيد',
    sampleHotelsEn: 'Fairmont Clock Tower, Raffles, Swissotel, Dar Al Tawhid'
  },
  {
    id: 'makkah-5star-jabal-omar',
    nameEn: '5-Star Jabal Omar Courtyard View',
    nameAr: '٥ نجوم ساحة جبل عمر الفاخرة',
    city: 'Makkah',
    stars: 5,
    distanceMeters: 180,
    distanceDescAr: 'ساحات الحرم الخارجية (١٥٠ - ٢٥٠ متراً) مع ممرات ممهدة ومصاعد',
    distanceDescEn: 'Outer Haram courtyards (150 - 250m) with elevators',
    pricePerNightUsd: 175,
    sampleHotelsAr: 'هيلتون جبل عمر، كونراد، ماريوت، حياة ريجنسي مكة',
    sampleHotelsEn: 'Hilton Jabal Omar, Conrad, Marriott, Hyatt Regency Makkah'
  },
  {
    id: 'makkah-4star-central',
    nameEn: '4-Star Premium Central & Ajyad',
    nameAr: '٤ نجوم متميزة بالمنطقة المركزية وأجياد',
    city: 'Makkah',
    stars: 4,
    distanceMeters: 450,
    distanceDescAr: 'مسافة ٥ إلى ٧ دقائق مشياً (٣٥0 - ٥٠٠ متر) من ساحات الحرم',
    distanceDescEn: '5 - 7 minutes walk (350 - 500m) to Haram',
    pricePerNightUsd: 110,
    sampleHotelsAr: 'مكWindow أجياد، فلسطين أجياد، شيراتون مكة جبل الكعبة',
    sampleHotelsEn: 'Makarem Ajyad, Palestine, Sheraton Makkah'
  },
  {
    id: 'makkah-economic-shuttle',
    nameEn: 'Economic Standard with 24/7 Haram Shuttle',
    nameAr: 'اقتصادي مريح مع حافلات ترددية للحرم على مدار الساعة',
    city: 'Makkah',
    stars: 3,
    distanceMeters: 1200,
    distanceDescAr: 'حافلات ترددية خاصة مجانية تصل لأنفاق الحرم في ٥ دقائق',
    distanceDescEn: 'Free 24/7 direct shuttle buses to Haram tunnels (5 min)',
    pricePerNightUsd: 65,
    sampleHotelsAr: 'فنادق العزيزية، محبس الجن، وشارع إبراهيم الخليل',
    sampleHotelsEn: 'Aziziyah & Mahbas Al-Jinn standard hotels'
  }
];

export const MADINAH_HOTEL_TIERS: HotelTierOption[] = [
  {
    id: 'madinah-5star-rawdah',
    nameEn: '5-Star Front Row Facing Prophet’s Rawdah',
    nameAr: '٥ نجوم صف أول مقابل الروضة الشريفة وباب السلام',
    city: 'Madinah',
    stars: 5,
    distanceMeters: 40,
    distanceDescAr: 'على ساحة الحرم النبوي مباشرة أمام باب السلام ومصلى الرجال',
    distanceDescEn: 'Directly on northern/western plaza (0 - 50m)',
    pricePerNightUsd: 210,
    sampleHotelsAr: 'أوبروي المدينة، دار التقوى، دار الإيمان إنتركونتيننتال',
    sampleHotelsEn: 'The Oberoi, Dar Al Taqwa, Dar Al Iman InterContinental'
  },
  {
    id: 'madinah-5star-central',
    nameEn: '5-Star Central Northern Zone',
    nameAr: '٥ نجوم المنطقة المركزية الشمالية والشرقية',
    city: 'Madinah',
    stars: 5,
    distanceMeters: 130,
    distanceDescAr: 'خطوات من بوابات النساء والرجال (١٠٠ - ١٨٠ متراً)',
    distanceDescEn: 'Short 2-minute stroll (100 - 180m) to Haram gates',
    pricePerNightUsd: 145,
    sampleHotelsAr: 'هيلتون المدينة، أنوار المدينة موفنبيك، بولمان زمزم المدينة',
    sampleHotelsEn: 'Madinah Hilton, Anwar Al Madinah Mövenpick, Pullman Zamzam'
  },
  {
    id: 'madinah-4star-central',
    nameEn: '4-Star Deluxe Central Plaza',
    nameAr: '٤ نجوم ديلوكس بالمنطقة المركزية',
    city: 'Madinah',
    stars: 4,
    distanceMeters: 280,
    distanceDescAr: 'مسافة ٣ إلى ٥ دقائق مشياً (٢٥٠ - ٣٥٠ متراً) من الساحات',
    distanceDescEn: '3 - 5 min walk (250 - 350m) to Prophet’s Mosque',
    pricePerNightUsd: 95,
    sampleHotelsAr: 'مكارم طيبة، سجى المدينة، ميلينيوم العقيق',
    sampleHotelsEn: 'Makarem Taiba, Saja Al Madinah, Millennium Al Aqeeq'
  }
];

export interface UmrahCalculationParams {
  makkahTierId: string;
  makkahNights: number;
  madinahTierId: string;
  madinahNights: number;
  roomType: 'double' | 'triple' | 'quad';
  transportType: 'haramain_first' | 'haramain_economy' | 'vip_gmc' | 'bus_coach';
  includeZamzam: boolean;
  includeZiyarat: boolean;
  groupPaxCount: number;
}

export interface UmrahCalculationResult {
  pricePerPersonUsd: number;
  totalGroupPriceUsd: number;
  pricePerPersonSar: number;
  pricePerPersonEgp: number;
  totalGroupPriceEgp: number;
  breakdown: {
    makkahHotelCostPerPerson: number;
    madinahHotelCostPerPerson: number;
    transportCostPerPerson: number;
    zamzamCostPerPerson: number;
    ziyaratCostPerPerson: number;
    visaInsurancePerPerson: number;
  };
}

export function calculateUmrahPackageCost(params: UmrahCalculationParams): UmrahCalculationResult {
  const makkahTier = MAKKAH_HOTEL_TIERS.find(t => t.id === params.makkahTierId) || MAKKAH_HOTEL_TIERS[0];
  const madinahTier = MADINAH_HOTEL_TIERS.find(t => t.id === params.madinahTierId) || MADINAH_HOTEL_TIERS[0];

  // Room sharing factor: Double = 1.0, Triple = 0.78, Quad = 0.65
  const occupancyFactor = params.roomType === 'double' ? 1.0 : params.roomType === 'triple' ? 0.78 : 0.65;

  const makkahHotelCostPerPerson = Math.round(makkahTier.pricePerNightUsd * params.makkahNights * occupancyFactor);
  const madinahHotelCostPerPerson = Math.round(madinahTier.pricePerNightUsd * params.madinahNights * occupancyFactor);

  let transportCostPerPerson = 70;
  if (params.transportType === 'haramain_first') {
    transportCostPerPerson = 160;
  } else if (params.transportType === 'haramain_economy') {
    transportCostPerPerson = 95;
  } else if (params.transportType === 'vip_gmc') {
    transportCostPerPerson = 220;
  } else {
    transportCostPerPerson = 60;
  }

  const zamzamCostPerPerson = params.includeZamzam ? 15 : 0;
  const ziyaratCostPerPerson = params.includeZiyarat ? 45 : 0;
  const visaInsurancePerPerson = 140; // Saudi Umrah Electronic Visa + Medical Insurance

  const subtotal = makkahHotelCostPerPerson + madinahHotelCostPerPerson + transportCostPerPerson +
    zamzamCostPerPerson + ziyaratCostPerPerson + visaInsurancePerPerson;

  // Add 12% operator margin & operational buffer
  const pricePerPersonUsd = Math.round(subtotal * 1.12);
  const totalGroupPriceUsd = pricePerPersonUsd * Math.max(1, params.groupPaxCount);

  // FX rates
  const USD_TO_SAR = 3.75;
  const USD_TO_EGP = 50.5;

  const pricePerPersonSar = Math.round(pricePerPersonUsd * USD_TO_SAR);
  const pricePerPersonEgp = Math.round(pricePerPersonUsd * USD_TO_EGP);
  const totalGroupPriceEgp = Math.round(totalGroupPriceUsd * USD_TO_EGP);

  return {
    pricePerPersonUsd,
    totalGroupPriceUsd,
    pricePerPersonSar,
    pricePerPersonEgp,
    totalGroupPriceEgp,
    breakdown: {
      makkahHotelCostPerPerson,
      madinahHotelCostPerPerson,
      transportCostPerPerson,
      zamzamCostPerPerson,
      ziyaratCostPerPerson,
      visaInsurancePerPerson,
    }
  };
}

export function convertPresetToQuote(
  preset: HajjUmrahPresetPackage,
  workspace: Workspace,
  roomType: 'double' | 'triple' | 'quad' = 'double',
  paxCount = 2,
  travelerName = 'Pilgrim Group'
): Quote {
  const priceUsd = roomType === 'double' ? preset.priceDoubleUsd : roomType === 'triple' ? preset.priceTripleUsd : preset.priceQuadUsd;
  const totalDays = preset.nightsMakkah + preset.nightsMadinah + 1;
  const quoteNumber = `HAJJ-${Math.floor(1000 + Math.random() * 9000)}`;

  const quote: Quote = {
    id: `quote-${preset.id}-${Date.now()}`,
    workspaceId: workspace.id,
    quoteNumber,
    travelerName,
    travelerEmail: 'pilgrim@umrah-desk.com',
    travelerPhone: '+20 100 000 0000',
    version: 1,
    startDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    durationDays: totalDays,
    targetCurrency: 'USD',
    status: 'Draft',
    group: {
      adults: paxCount,
      children: [],
      infants: 0,
    },
    days: [
      {
        dayNumber: 1,
        title: `Arrival at Jeddah / Madinah & Transfer to ${preset.makkahHotel}`,
        description: `Meet & assist at airport, private transfer to Makkah, hotel check-in at ${preset.makkahHotel}. Performing Umrah rituals with authorized guide assistance.`,
        city: 'Makkah',
        hotel: preset.makkahHotel,
        hotelMealPlan: preset.makkahMealPlan,
        lines: [
          {
            id: 'svc-makkah-hotel',
            dayNumber: 1,
            supplierType: 'Hotel',
            serviceName: `${preset.makkahHotel} (${preset.nightsMakkah} Nights - ${preset.makkahView})`,
            city: 'Makkah',
            quantity: Math.ceil(paxCount / (roomType === 'double' ? 2 : roomType === 'triple' ? 3 : 4)),
            occupancyBasis: roomType === 'double' ? 'double' : roomType === 'triple' ? 'triple' : 'per_person',
            unitCost: Math.round(priceUsd * 0.4),
            costCurrency: 'USD',
            markupPercent: 20,
            markupFixed: 0,
            unitPrice: Math.round(priceUsd * 0.48),
            totalCostEgp: Math.round(priceUsd * 0.4 * 50.5),
            totalPriceEgp: Math.round(priceUsd * 0.48 * 50.5),
            totalPriceQuoteCurrency: Math.round(priceUsd * 0.48),
            status: 'OK',
            costCalculationNotes: 'Umrah Tier Contract Rate',
          },
          {
            id: 'svc-hhr-train',
            dayNumber: 1,
            supplierType: 'Transport',
            serviceName: preset.transportTypeEn,
            city: 'Makkah',
            quantity: paxCount,
            occupancyBasis: 'per_person',
            unitCost: 80,
            costCurrency: 'USD',
            markupPercent: 25,
            markupFixed: 0,
            unitPrice: 100,
            totalCostEgp: Math.round(80 * 50.5 * paxCount),
            totalPriceEgp: Math.round(100 * 50.5 * paxCount),
            totalPriceQuoteCurrency: 100 * paxCount,
            status: 'OK',
            costCalculationNotes: 'Haramain High-Speed Rail Transfer',
          }
        ]
      },
      {
        dayNumber: preset.nightsMakkah + 1,
        title: `Transfer to Madinah & Stay at ${preset.madinahHotel}`,
        description: `Depart Makkah via Haramain High-Speed Rail to Madinah Al-Munawwarah. Hotel check-in at ${preset.madinahHotel}. Salutations at the Prophet’s Mosque & Rawdah Al-Sharifah.`,
        city: 'Madinah',
        hotel: preset.madinahHotel,
        hotelMealPlan: preset.madinahMealPlan,
        lines: [
          {
            id: 'svc-madinah-hotel',
            dayNumber: preset.nightsMakkah + 1,
            supplierType: 'Hotel',
            serviceName: `${preset.madinahHotel} (${preset.nightsMadinah} Nights)`,
            city: 'Madinah',
            quantity: Math.ceil(paxCount / (roomType === 'double' ? 2 : roomType === 'triple' ? 3 : 4)),
            occupancyBasis: roomType === 'double' ? 'double' : roomType === 'triple' ? 'triple' : 'per_person',
            unitCost: Math.round(priceUsd * 0.35),
            costCurrency: 'USD',
            markupPercent: 20,
            markupFixed: 0,
            unitPrice: Math.round(priceUsd * 0.42),
            totalCostEgp: Math.round(priceUsd * 0.35 * 50.5),
            totalPriceEgp: Math.round(priceUsd * 0.42 * 50.5),
            totalPriceQuoteCurrency: Math.round(priceUsd * 0.42),
            status: 'OK',
            costCalculationNotes: 'Madinah Hotel Contract Rate',
          }
        ]
      }
    ],
    displayCurrency: 'USD',
    exchangeRateUsed: 50.5,
    totalCostEgp: Math.round(priceUsd * 0.82 * paxCount * 50.5),
    totalPriceEgp: Math.round(priceUsd * paxCount * 50.5),
    marginPercent: 18,
    totalPriceQuoteCurrency: priceUsd * paxCount,
    totals: {
      totalCost: Math.round(priceUsd * 0.82 * paxCount),
      totalSell: priceUsd * paxCount,
      marginAmount: Math.round(priceUsd * 0.18 * paxCount),
      marginPct: 18,
      perPersonSell: priceUsd,
    },
    validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    assignedAgentId: 'agent-hajj-desk',
    assignedAgentName: 'RIHAL Hajj & Umrah Desk',
    publicToken: quoteNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 1,
    language: 'ar',
  };

  return quote;
}

export const SACRED_ZIYARAT_SITES = [
  {
    id: 'site-ghar-hira',
    city: 'Makkah',
    name: 'Cave of Hira & Jabal Al-Noor',
    arabicName: 'غار حراء وجبل النور',
    significance: 'Site of the first revelation of the Holy Quran to Prophet Muhammad (PBUH).',
    arabicSignificance: 'موقع مهبط الوحي الأول ونزول سورة العلق على النبي ﷺ.',
    distanceHaramKm: '4.8 km',
    distanceHaramDescAr: 'يبعد ٤.٨ كم شمال شرق الحرم المكي الشريف',
    visitDuration: '1.5 - 2 Hours',
    dressCode: 'Comfortable footwear, modest pilgrimage attire',
    categoryAr: 'معلم تاريخي ومهبط الوحي',
  },
  {
    id: 'site-ghar-thawr',
    city: 'Makkah',
    name: 'Cave of Thawr (Jabal Thawr)',
    arabicName: 'غار ثور وجبل ثور',
    significance: 'Sanctuary where the Prophet ﷺ and Abu Bakr (RA) took refuge during the Hijrah to Madinah.',
    arabicSignificance: 'الغار المبارك الذي أوى إليه النبي ﷺ وصاحبه الصديق رضي الله عنه أثناء الهجرة الشريفة.',
    distanceHaramKm: '6.2 km',
    distanceHaramDescAr: 'يبعد ٦.٢ كم جنوب المسجد الحرام',
    visitDuration: '1.5 Hours',
    dressCode: 'Modest attire, water bottle recommended',
    categoryAr: 'معلم الهجرة النبوية',
  },
  {
    id: 'site-quba-mosque',
    city: 'Madinah',
    name: 'Quba Mosque (Masjid Quba)',
    arabicName: 'مسجد قباء الشريف',
    significance: 'First mosque built in Islam. Performing two Rak\'ahs prayer here equals the spiritual reward of an Umrah.',
    arabicSignificance: 'أول مسجد أسس في الإسلام، والصلاة فيه تعدل أجر عمرة تامة كما ثبت في الحديث الشريف.',
    distanceHaramKm: '3.2 km',
    distanceHaramDescAr: 'يبعد ٣.٢ كم جنوب المسجد النبوي مع ممشى قباء المظلل',
    visitDuration: '45 - 60 Minutes',
    dressCode: 'Wudu / Ritual Purity recommended prior to arrival',
    categoryAr: 'مسجد تاريخي وثواب عمرة',
  },
  {
    id: 'site-mount-uhud',
    city: 'Madinah',
    name: 'Mount Uhud & Martyrs Cemetery',
    arabicName: 'جبل أحد ومقبرة شهداء أحد',
    significance: 'Site of the Battle of Uhud and resting place of 70 companions including Hamza ibn Abdul-Muttalib.',
    arabicSignificance: 'موقع غزوة أحد وجبل الرماة، ويضم مقبرة الشهداء وسيد الشهداء حمزة بن عبد المطلب رضي الله عنه.',
    distanceHaramKm: '4.5 km',
    distanceHaramDescAr: 'يبعد ٤.٥ كم شمال الحرم النبوي الشريف',
    visitDuration: '45 Minutes',
    dressCode: 'Modest attire, reflection and salams to martyrs',
    categoryAr: 'موقع تاريخي ومقبرة الشهداء',
  },
  {
    id: 'site-qiblatayn',
    city: 'Madinah',
    name: 'Masjid Al-Qiblatayn (The Two Qiblas)',
    arabicName: 'مسجد القبلتين',
    significance: 'Historical mosque where the Qibla was changed from Jerusalem to the Holy Kaaba in Makkah.',
    arabicSignificance: 'المسجد التاريخي الذي نزل فيه الأمر الإلهي بتحويل القبلة من المسجد الأقصى إلى الكعبة المشرفة.',
    distanceHaramKm: '4.0 km',
    distanceHaramDescAr: 'يبعد ٤.٠ كم شمال غرب الحرم النبوي',
    visitDuration: '30 - 45 Minutes',
    dressCode: 'Sunnah Tahiyyat Al-Masjid prayer',
    categoryAr: 'مسجد تاريخي وشاهد تحويل القبلة',
  },
  {
    id: 'site-mashair-mina-arafat',
    city: 'Makkah',
    name: 'Holy Sites of Mina, Muzdalifah & Arafat',
    arabicName: 'المشاعر المقدسة (منى، مزدلفة، وصعيد عرفات)',
    significance: 'Sacred grounds of the Hajj pilgrimage including Jabal Al-Rahmah and the Jamarat.',
    arabicSignificance: 'المشاعر العظام التي يؤدي فيها الحجاج مناسك الحج الكبرى وجبل الرحمة وجسر الجمرات.',
    distanceHaramKm: '9.0 - 20.0 km',
    distanceHaramDescAr: 'يمتد من ٩ كم شرق مكة حتى صعيد عرفات على بعد ٢٠ كم',
    visitDuration: '2 - 3 Hours',
    dressCode: 'Sun protection, prayer and reflection',
    categoryAr: 'مشاعر الحج الكبرى',
  },
  {
    id: 'site-jannat-al-baqi',
    city: 'Madinah',
    name: 'Jannat Al-Baqi Cemetery',
    arabicName: 'مقبرة بقيع الغرقد',
    significance: 'Historic resting place of thousands of companions, the Prophet’s wives, and family members.',
    arabicSignificance: 'المقبرة التاريخية المجاورة للحرم النبوي، تضم رفات آلاف الصحابة وأمهات المؤمنين وآل البيت.',
    distanceHaramKm: '0.1 km',
    distanceHaramDescAr: 'ملاصقة مباشرة للساحة الشرقية للمسجد النبوي الشريف',
    visitDuration: '30 Minutes',
    dressCode: 'Open after Fajr and Asr prayers for men, respectful remembrance',
    categoryAr: 'روضة من رياض الجنة ومقبرة الصحابة',
  }
];

export const UMRAH_RITUAL_STEPS = [
  {
    step: 1,
    titleEn: 'Ihram & Niyyah at Miqat',
    titleAr: 'الإحرام والنية من الميقات',
    subtitleEn: 'Spiritual preparation and boundary declaration',
    subtitleAr: 'التجرد لله وإعلان الدخول في النسك',
    descEn: 'Purification, wearing the two-piece white unstitched cloth (men), declaring Niyyah (Labbayk Allahumma Umrah), and continuously chanting Talbiyah until seeing the Kaaba.',
    descAr: 'الاغتسال والتطيب (في البدن فقط)، وارتداء ثياب الإحرام البيضاء، وإعلان النية (لبيك اللهم عمرة) والبدء بالتلبية حتى الوصول للمسجد الحرام.',
    duaa: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً، لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لا شَرِيكَ لَكَ',
    audioCue: 'Talbiyah (التلبية المشرفة)',
    tipsAr: 'نصيحة ميدانية: يحرم القادمون جواً من مصر قبل محاذاة ميقات (رابغ/الجحفة) بالطائرة بنحو ٢٠ دقيقة عند إعلان قائد الطائرة.',
    tipsEn: 'Field tip: Air travelers from Egypt enter Ihram prior to overflying the Rabigh/Yalamlam Miqat when announced by the pilot.'
  },
  {
    step: 2,
    titleEn: 'Tawaf Al-Umrah (7 Circuits Around Kaaba)',
    titleAr: 'طواف العمرة (سبعة أشواط حول الكعبة المشرفة)',
    subtitleEn: 'Circumambulation starting at the Black Stone',
    subtitleAr: 'الطواف جاعلاً الكعبة المشرفة عن يساره',
    descEn: 'Starting at the Black Stone alignment with Bismillah & Allahu Akbar, circumambulating the Holy Kaaba 7 complete times anti-clockwise, and praying 2 Rak\'ahs behind Maqam Ibrahim.',
    descAr: 'البدء من محاذاة الحجر الأسود بالتكبير، والطواف حول الكعبة المشرفة ٧ أشواط جاعلاً الكعبة عن يساره، ثم صلاة ركعتين خلف مقام إبراهيم والشرب من ماء زمزم.',
    duaa: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ · بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    audioCue: 'Between Yemeni Corner & Black Stone',
    tipsAr: 'نصيحة ميدانية: الصحن الأرضي مخصص للمعتمرين فقط المحرمين. يمكن للعائلات وكبار السن الطواف بالأدوار العلوية أو عبر عربات الجولف الكهربائية.',
    tipsEn: 'Field tip: Ground Mataf floor is reserved for Ihram pilgrims. Upper shaded decks provide electric carts for elderly pilgrims.'
  },
  {
    step: 3,
    titleEn: 'Sa\'i between Safa & Marwah (7 Laps)',
    titleAr: 'السعي بين الصفا والمروة (سبعة أشواط)',
    subtitleEn: 'Walking in the footsteps of Lady Hajar',
    subtitleAr: 'السعي اقتداءً بالسيدة هاجر عليها السلام',
    descEn: 'Ascending Mount Safa, facing the Kaaba, then walking towards Mount Marwah (counts as Lap 1). Walking back to Safa is Lap 2. Completing exactly 7 laps, finishing at Marwah.',
    descAr: 'البدء من جبل الصفا متوجهاً إلى المروة (شوط أول)، والعودة إلى الصفا (شوط ثانٍ)، حتى إتمام ٧ أشواط كاملة تنتهي عند المروة، مع الإسراع بين العلمين الأخضرين للرجال.',
    duaa: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ ۖ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَن يَطَّوَّفَ بِهِمَا · لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    audioCue: 'On Mount Safa & Marwah',
    tipsAr: 'نصيحة ميدانية: المسعى مكيف بالكامل ومجهز بمسارات خاصة لكراسي الدفع والمقاعد المتحركة الكهربائية بالدور الثاني والميزانين.',
    tipsEn: 'Field tip: The Masa\'a corridor is fully air-conditioned with dedicated electric vehicle lanes on the mezzanine floor.'
  },
  {
    step: 4,
    titleEn: 'Halq or Taqseer (Release from Ihram)',
    titleAr: 'الحلق أو التقصير (التحلل المبارك من الإحرام)',
    subtitleEn: 'Completion and spiritual renewal',
    subtitleAr: 'إتمام مناسك العمرة وخلع ثياب الإحرام',
    descEn: 'Men shave head (Halq - spiritually highest reward) or trim hair evenly all around (Taqseer). Women trim one fingertip length from hair. Umrah is now complete.',
    descAr: 'حلق شعر الرأس كاملاً للرجال (وهو الأفضل ثواباً ودعا النبي ﷺ للمحلقين ثلاثاً) أو تقصيره، وللنساء قص قيد أنملة من أطراف الشعر. وبذلك تمت العمرة بحمد الله.',
    duaa: 'الْحَمْدُ لِلَّهِ الَّذِي قَضَى عَنَّا نُسُكَنَا وَتَقَبَّلَ مِنَّا، اللَّهُمَّ زِدْنَا إِيمَانًا وَيَقِينًا وَتَوْفِيقًا',
    audioCue: 'Completion Supplication',
    tipsAr: 'نصيحة ميدانية: تنتشر صالونات الحلاقة الصحية المعتمدة بساحات المروة وأبراج البيت المجهزة بأدوات معقمة تستخدم لمرة واحدة فقط.',
    tipsEn: 'Field tip: Licensed hygienic barbershops with single-use sterile blades are located immediately outside the Marwah exit.'
  }
];
