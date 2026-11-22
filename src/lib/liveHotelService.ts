export type HotelRegionId =
  | 'all'
  | 'Cairo'
  | 'Luxor'
  | 'Aswan'
  | 'Hurghada'
  | 'Sharm El Sheikh'
  | 'Dahab'
  | 'Alexandria'
  | 'Siwa';

export type MealPlanType = 'BB' | 'HB' | 'AI';

export type HotelPropertyCategory = 'all' | '5-Star Luxury' | '5-Star Deluxe' | 'Nile Cruise' | 'Boutique & Eco';

export interface HotelGeoCoordinates {
  lat: number;
  lng: number;
}

export interface LiveHotelRoomOption {
  code: 'SGL' | 'DBL' | 'SUITE';
  nameEn: string;
  nameAr: string;
  capacityAdults: number;
  baseNightlyUsd: number;
  liveNightlyUsd: number;
  totalStayUsd: number;
  availableCount: number;
}

export interface LiveHotelItem {
  id: string;
  nameEn: string;
  nameAr: string;
  regionId: Exclude<HotelRegionId, 'all'>;
  cityEn: string;
  cityAr: string;
  districtEn: string;
  districtAr: string;
  coordinates: HotelGeoCoordinates;
  stars: 5 | 4;
  category: Exclude<HotelPropertyCategory, 'all'>;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  galleryUrls?: string[];
  amenitiesEn: string[];
  amenitiesAr: string[];
  baseRatesUsd: {
    sgl: number;
    dbl: number;
    suite: number;
  };
  mealSupplementUsd: {
    BB: number;
    HB: number;
    AI: number;
  };
  availabilityStatus: 'Available' | 'High Demand' | 'Limited Rooms';
  availableRoomsTotal: number;
  officialWebsite: string;
  bookingSlug: string;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  freeCancellationHours: number;
  // Computed live fields
  nights?: number;
  mealPlan?: MealPlanType;
  seasonLabelEn?: string;
  seasonLabelAr?: string;
  roomOptions?: LiveHotelRoomOption[];
  directBookingUrl?: string;
  officialBookingUrl?: string;
  lastUpdatedIso?: string;
}

export interface HotelSearchFilterParams {
  region?: HotelRegionId;
  category?: HotelPropertyCategory;
  checkIn?: string;
  checkOut?: string;
  mealPlan?: MealPlanType;
  roomsCount?: number;
  adultsCount?: number;
  query?: string;
  maxPriceUsd?: number;
}

export const HOTEL_REGIONS: {
  id: HotelRegionId;
  labelEn: string;
  labelAr: string;
  count: number;
  center: HotelGeoCoordinates;
  zoom: number;
}[] = [
  { id: 'all', labelEn: 'All Regions (Egypt)', labelAr: 'كل المناطق السياحية', count: 22, center: { lat: 27.18, lng: 31.18 }, zoom: 6 },
  { id: 'Cairo', labelEn: 'Cairo & Giza', labelAr: 'القاهرة والجيزة', count: 5, center: { lat: 30.035, lng: 31.21 }, zoom: 11 },
  { id: 'Luxor', labelEn: 'Luxor & Nile', labelAr: 'الأقصر والكرنك', count: 5, center: { lat: 25.695, lng: 32.638 }, zoom: 13 },
  { id: 'Aswan', labelEn: 'Aswan & Nubia', labelAr: 'أسوان والنوبة', count: 4, center: { lat: 24.082, lng: 32.885 }, zoom: 13 },
  { id: 'Hurghada', labelEn: 'Hurghada & El Gouna', labelAr: 'الغردقة والجونة', count: 3, center: { lat: 27.215, lng: 33.815 }, zoom: 10 },
  { id: 'Sharm El Sheikh', labelEn: 'Sharm El Sheikh', labelAr: 'شرم الشيخ', count: 2, center: { lat: 27.975, lng: 34.405 }, zoom: 11 },
  { id: 'Dahab', labelEn: 'Dahab & Sinai', labelAr: 'دهب وسيناء', count: 1, center: { lat: 28.482, lng: 34.502 }, zoom: 13 },
  { id: 'Alexandria', labelEn: 'Alexandria', labelAr: 'الإسكندرية', count: 1, center: { lat: 31.245, lng: 29.966 }, zoom: 12 },
  { id: 'Siwa', labelEn: 'Siwa Oasis', labelAr: 'واحة سيوة', count: 1, center: { lat: 29.218, lng: 25.432 }, zoom: 12 },
];

export const RAW_EGYPT_HOTEL_INVENTORY: LiveHotelItem[] = [
  // ================= CAIRO & GIZA =================
  {
    id: 'htl_cai_mena_house',
    nameEn: 'Marriott Mena House, Cairo (Pyramids View)',
    nameAr: 'فندق ماريوت مينا هاوس الأهرامات',
    regionId: 'Cairo',
    cityEn: 'Giza, Cairo',
    cityAr: 'الجيزة، القاهرة',
    districtEn: 'Al Haram · Direct Great Pyramids Gate',
    districtAr: 'الهرم · إطلالة مباشرة على أهرامات الجيزة',
    coordinates: { lat: 29.9854, lng: 31.1325 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.9,
    reviewCount: 2840,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Direct Pyramid View', '40-Acre Royal Gardens', 'Heated Pool', '1399 Restaurant', 'VIP Group Check-in'],
    amenitiesAr: ['إطلالة مباشرة للأهرامات', 'حدائق ملكية ٤٠ فدان', 'مسبح مدفأ', 'مطعم 1399', 'تسكين خاص للأفواج'],
    baseRatesUsd: { sgl: 340, dbl: 380, suite: 790 },
    mealSupplementUsd: { BB: 0, HB: 48, AI: 110 },
    availabilityStatus: 'High Demand',
    availableRoomsTotal: 14,
    officialWebsite: 'https://www.marriott.com/en-us/hotels/caimn-marriott-mena-house-cairo/overview/',
    bookingSlug: 'Marriott Mena House Cairo Giza Egypt',
    phone: '+20 2 33773222',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_cai_fourseasons_nile',
    nameEn: 'Four Seasons Hotel Cairo at Nile Plaza',
    nameAr: 'فورسيزونز القاهرة نايل بلازا',
    regionId: 'Cairo',
    cityEn: 'Cairo',
    cityAr: 'القاهرة',
    districtEn: 'Garden City · Corniche El Nil',
    districtAr: 'جاردن سيتي · كورنيش النيل',
    coordinates: { lat: 30.0362, lng: 31.2298 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.95,
    reviewCount: 1960,
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Panoramic Nile Terrace', '3 Outdoor Pools', 'Luxury Spa', 'Zitouni Egyptian Dining', '24h Concierge'],
    amenitiesAr: ['تراس بانورامي على النيل', '٣ مسابح خارجية', 'سبا فاخر', 'مطعم زيتوني المصري', 'كونسيرج ٢٤ ساعة'],
    baseRatesUsd: { sgl: 420, dbl: 465, suite: 940 },
    mealSupplementUsd: { BB: 0, HB: 65, AI: 145 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 22,
    officialWebsite: 'https://www.fourseasons.com/caironp/',
    bookingSlug: 'Four Seasons Hotel Cairo at Nile Plaza Egypt',
    phone: '+20 2 27917000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_cai_stregis',
    nameEn: 'The St. Regis Cairo Corniche',
    nameAr: 'ذا سانت ريجيس القاهرة كورنيش النيل',
    regionId: 'Cairo',
    cityEn: 'Cairo',
    cityAr: 'القاهرة',
    districtEn: 'Corniche El Nil · Downtown Towers',
    districtAr: 'كورنيش النيل · وسط البلد',
    coordinates: { lat: 30.0661, lng: 31.2275 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.92,
    reviewCount: 1410,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['St. Regis Butler Service', 'Nile View Suites', 'Iridium Spa', '7 Signature Restaurants', 'Ballroom & VIP Lounge'],
    amenitiesAr: ['خدمة المساعد الشخصي', 'أجنحة مطلة على النيل', 'سبا إيريديوم', '٧ مطاعم عالمية', 'قاعات واستقبال VIP'],
    baseRatesUsd: { sgl: 390, dbl: 430, suite: 880 },
    mealSupplementUsd: { BB: 0, HB: 60, AI: 135 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 19,
    officialWebsite: 'https://www.marriott.com/en-us/hotels/caixr-the-st-regis-cairo/overview/',
    bookingSlug: 'The St Regis Cairo Corniche El Nil',
    phone: '+20 2 25979000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_cai_zamalek_marriott',
    nameEn: 'Cairo Marriott Hotel & Omar Khayyam Casino',
    nameAr: 'فندق ماريوت القاهرة وقصر عمر الخيام الزمالك',
    regionId: 'Cairo',
    cityEn: 'Zamalek, Cairo',
    cityAr: 'الزمالك، القاهرة',
    districtEn: 'Zamalek Island · Historic Royal Palace',
    districtAr: 'جزيرة الزمالك · القصر الملكي التاريخي',
    coordinates: { lat: 30.0569, lng: 31.2244 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.78,
    reviewCount: 3420,
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['1869 Khedive Palace Gardens', 'Large Group Allocation', 'Nile & Garden Balconies', 'Saraya Gallery', 'Coach Parking'],
    amenitiesAr: ['حدائق قصر الخديوي ١٨٦٩', 'سعة كبيرة للأفواج', 'شرفات على النيل والحدائق', 'سرايا جاليري', 'موقف حافلات سياحية'],
    baseRatesUsd: { sgl: 215, dbl: 245, suite: 510 },
    mealSupplementUsd: { BB: 0, HB: 38, AI: 85 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 38,
    officialWebsite: 'https://www.marriott.com/en-us/hotels/caieg-cairo-marriott-hotel-and-omar-khayyam-casino/overview/',
    bookingSlug: 'Cairo Marriott Hotel Zamalek Egypt',
    phone: '+20 2 27283000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },
  {
    id: 'htl_cai_steigenberger_tahrir',
    nameEn: 'Steigenberger Hotel El Tahrir Cairo',
    nameAr: 'فندق شتايجنبرجر التحرير القاهرة',
    regionId: 'Cairo',
    cityEn: 'Downtown Cairo',
    cityAr: 'وسط البلد، القاهرة',
    districtEn: 'Kasr El Nil · Steps from Egyptian Museum',
    districtAr: 'قصر النيل · أمام المتحف المصري بالتحرير',
    coordinates: { lat: 30.0459, lng: 31.2351 },
    stars: 4,
    category: '5-Star Deluxe',
    rating: 4.82,
    reviewCount: 4190,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['1 Min to Egyptian Museum', 'Fast DMC Group Desk', 'Outdoor Heated Pool', 'Downtown Location', 'High-Speed Wi-Fi'],
    amenitiesAr: ['دقيقة للمتحف المصري', 'مكتب تسكين سريع للأفواج', 'مسبح خارجي مدفأ', 'قلب القاهرة', 'إنترنت فائق السرعة'],
    baseRatesUsd: { sgl: 165, dbl: 190, suite: 360 },
    mealSupplementUsd: { BB: 0, HB: 30, AI: 70 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 42,
    officialWebsite: 'https://hrewards.com/en/steigenberger-hotel-el-tahrir-cairo',
    bookingSlug: 'Steigenberger Hotel El Tahrir Cairo',
    phone: '+20 2 25750777',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },

  // ================= LUXOR & NILE =================
  {
    id: 'htl_lxr_winter_palace',
    nameEn: 'Sofitel Winter Palace Luxor (1886 Royal Heritage)',
    nameAr: 'سوفيتيل وينتر بالاس الأقصر التاريخي',
    regionId: 'Luxor',
    cityEn: 'Luxor',
    cityAr: 'الأقصر',
    districtEn: 'Corniche El Nil · Next to Luxor Temple',
    districtAr: 'كورنيش النيل · بجوار معبد الأقصر',
    coordinates: { lat: 25.6989, lng: 32.6384 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.93,
    reviewCount: 2150,
    imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Victorian Royal Palace', 'Botanical Oasis Gardens', '1886 Fine Dining', 'West Bank Sunset Views', 'Private Felucca Dock'],
    amenitiesAr: ['قصر ملكي تاريخي ١٨٨٦', 'حدائق استوائية ملكية', 'مطعم 1886 الفاخر', 'إطلالة غروب البر الغربي', 'مرسى فلوكة خاص'],
    baseRatesUsd: { sgl: 295, dbl: 335, suite: 720 },
    mealSupplementUsd: { BB: 0, HB: 45, AI: 98 },
    availabilityStatus: 'High Demand',
    availableRoomsTotal: 11,
    officialWebsite: 'https://all.accor.com/hotel/1661/index.en.shtml',
    bookingSlug: 'Sofitel Winter Palace Luxor Egypt',
    phone: '+20 95 2380422',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_lxr_hilton_resort',
    nameEn: 'Hilton Luxor Resort & Spa',
    nameAr: 'منتجع وسبا هيلتون الأقصر',
    regionId: 'Luxor',
    cityEn: 'Luxor',
    cityAr: 'الأقصر',
    districtEn: 'New Karnak · Direct East Bank Waterfront',
    districtAr: 'الكرنك الجديد · إطلالة مباشرة على النيل',
    coordinates: { lat: 25.7266, lng: 32.6512 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.89,
    reviewCount: 2890,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['2 Infinity Nile Pools', 'Holistic Thermal Spa', '5 Minutes to Karnak Temple', 'Sunset Cabanas', 'Asian & Mediterranean Dining'],
    amenitiesAr: ['مسبحان إنفينيتي على النيل', 'سبا علاجي متكامل', '٥ دقائق لمعبد الكرنك', 'كابينات غروب خاصة', 'مطاعم آسيوية ومتوسطية'],
    baseRatesUsd: { sgl: 230, dbl: 265, suite: 540 },
    mealSupplementUsd: { BB: 0, HB: 40, AI: 92 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 26,
    officialWebsite: 'https://www.hilton.com/en/hotels/luxhitw-hilton-luxor-resort-and-spa/',
    bookingSlug: 'Hilton Luxor Resort and Spa Egypt',
    phone: '+20 95 2399000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },
  {
    id: 'htl_lxr_steigenberger_nile_palace',
    nameEn: 'Steigenberger Nile Palace Luxor',
    nameAr: 'شتايجنبرجر نايل بالاس الأقصر',
    regionId: 'Luxor',
    cityEn: 'Luxor',
    cityAr: 'الأقصر',
    districtEn: 'Khaled Ibn El Walid St · East Bank',
    districtAr: 'شارع خالد بن الوليد · البر الشرقي',
    coordinates: { lat: 25.6869, lng: 32.6315 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.79,
    reviewCount: 3740,
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Private Boat Pier', '300+ Room Group Capacity', 'Nile Courtyard Pool', '5 Restaurants', 'Tour Coach Bay'],
    amenitiesAr: ['مرسى مراكب خاص', 'سعة ضخمة للأفواج السياحية', 'مسبح مطل على النيل', '٥ مطاعم متنوعة', 'ساحة حافلات الأفواج'],
    baseRatesUsd: { sgl: 145, dbl: 170, suite: 340 },
    mealSupplementUsd: { BB: 0, HB: 28, AI: 65 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 54,
    officialWebsite: 'https://hrewards.com/en/steigenberger-nile-palace-luxor',
    bookingSlug: 'Steigenberger Nile Palace Luxor Egypt',
    phone: '+20 95 2366999',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },
  {
    id: 'htl_lxr_sonesta_stgeorge',
    nameEn: 'Sonesta St. George Hotel Luxor',
    nameAr: 'فندق سونستا سان جورج الأقصر',
    regionId: 'Luxor',
    cityEn: 'Luxor',
    cityAr: 'الأقصر',
    districtEn: 'Corniche El Nil · Central Luxor',
    districtAr: 'كورنيش النيل · وسط الأقصر',
    coordinates: { lat: 25.6842, lng: 32.6301 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.76,
    reviewCount: 2480,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Royal Classic Marble Decor', 'Heated Nile Pool', 'Health Club & Sauna', 'Group Banquet Halls', 'Balloon Pickup Point'],
    amenitiesAr: ['تصميم ملكي كلاسيكي', 'مسبح مدفأ على النيل', 'نادي صحي وساونا', 'قاعات طعام للأفواج', 'نقطة انطلاق البالون الطائر'],
    baseRatesUsd: { sgl: 135, dbl: 158, suite: 310 },
    mealSupplementUsd: { BB: 0, HB: 26, AI: 60 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 39,
    officialWebsite: 'https://www.sonesta.com/sonesta-hotels-resorts/egypt/luxor/sonesta-st-george-hotel-luxor',
    bookingSlug: 'Sonesta St George Hotel Luxor Egypt',
    phone: '+20 95 2382575',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },
  {
    id: 'htl_lxr_oberoi_zahra_cruise',
    nameEn: 'The Oberoi Zahra, Luxury Nile Cruiser (Luxor–Aswan)',
    nameAr: 'باخرة أوبروي زهرة النيلية الفاخرة (الأقصر - أسوان)',
    regionId: 'Luxor',
    cityEn: 'Luxor / Aswan Nile',
    cityAr: 'الأقصر / أسوان (كروز نيلي)',
    districtEn: 'Private Nile Dock · 4/7 Night Itinerary',
    districtAr: 'مرسى نيلي خاص · إبحار ٤ أو ٧ ليالٍ',
    coordinates: { lat: 25.6765, lng: 32.6262 },
    stars: 5,
    category: 'Nile Cruise',
    rating: 4.97,
    reviewCount: 890,
    imageUrl: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['27 Luxury Cabins & Suites', 'Private Egyptologist Onboard', 'Full-Board Fine Dining', '4 Private Spa Suites', 'Upper Deck Infinity Pool'],
    amenitiesAr: ['٢٧ كابينة وجناحاً فاخراً', 'مرشد أثري خاص على الباخرة', 'إقامة كاملة فاخرة', '٤ أجنحة سبا خاصة', 'مسبح علوي بانورامي'],
    baseRatesUsd: { sgl: 480, dbl: 540, suite: 1050 },
    mealSupplementUsd: { BB: 0, HB: 0, AI: 65 },
    availabilityStatus: 'Limited Rooms',
    availableRoomsTotal: 6,
    officialWebsite: 'https://www.oberoihotels.com/nile-cruisers-zahra/',
    bookingSlug: 'The Oberoi Zahra Luxury Nile Cruiser Luxor',
    phone: '+20 2 35681700',
    checkInTime: '12:00',
    checkOutTime: '08:00',
    freeCancellationHours: 72,
  },

  // ================= ASWAN & NUBIA =================
  {
    id: 'htl_asw_old_cataract',
    nameEn: 'Sofitel Legend Old Cataract Aswan',
    nameAr: 'سوفيتيل ليجند أولد كتاراكت أسوان',
    regionId: 'Aswan',
    cityEn: 'Aswan',
    cityAr: 'أسوان',
    districtEn: 'Abtal El Tahrir · Pink Granite Cliff Over Nile',
    districtAr: 'أبطال التحرير · هضبة الجرانيت المطلة على جزيرة الفنتين',
    coordinates: { lat: 24.0825, lng: 32.8856 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.98,
    reviewCount: 2340,
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Agatha Christie Historic Suite', '1902 Grand Restaurant', 'Indoor & Outdoor Pools', 'Private Nubian Felucca Jetty', 'Royal Butler Service'],
    amenitiesAr: ['جناح أجاثا كريستي التاريخي', 'مطعم 1902 الملكي', 'مسبح داخلي وخارجي', 'مرسى فلوكة نوبية خاص', 'خدمة بتلر ملكية'],
    baseRatesUsd: { sgl: 440, dbl: 495, suite: 1120 },
    mealSupplementUsd: { BB: 0, HB: 65, AI: 140 },
    availabilityStatus: 'Limited Rooms',
    availableRoomsTotal: 8,
    officialWebsite: 'https://all.accor.com/hotel/1666/index.en.shtml',
    bookingSlug: 'Sofitel Legend Old Cataract Aswan Egypt',
    phone: '+20 97 2316000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 72,
  },
  {
    id: 'htl_asw_movenpick_elephantine',
    nameEn: 'Mövenpick Resort Aswan (Elephantine Island)',
    nameAr: 'منتجع موفنبيك أسوان (جزيرة الفنتين)',
    regionId: 'Aswan',
    cityEn: 'Aswan',
    cityAr: 'أسوان',
    districtEn: 'Elephantine Island · 24h Private Ferry',
    districtAr: 'جزيرة الفنتين · عبارة نيلية خاصة ٢٤ ساعة',
    coordinates: { lat: 24.0908, lng: 32.8884 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.84,
    reviewCount: 3110,
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['360° Panorama Bar', 'Private Nile Island', 'Organic Farm & Gardens', 'Large Group Villas & Rooms', 'Abu Simbel Early Box Breakfast'],
    amenitiesAr: ['بانوراما ٣٦٠ درجة', 'جزيرة خاصة وسط النيل', 'حدائق ومزرعة عضوية', 'غرف وفيلات للأفواج', 'إفطار مبكر لرحلات أبو سمبل'],
    baseRatesUsd: { sgl: 185, dbl: 215, suite: 430 },
    mealSupplementUsd: { BB: 0, HB: 35, AI: 82 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 34,
    officialWebsite: 'https://movenpick.accor.com/en/africa/egypt/aswan/resort-aswan.html',
    bookingSlug: 'Movenpick Resort Aswan Elephantine Island',
    phone: '+20 97 2454455',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },
  {
    id: 'htl_asw_benben_heissa',
    nameEn: 'Benben by Dhara Hotels (Heissa Island Adults-Only)',
    nameAr: 'فندق بن بن جزيرة هيسا النوبية البوتيكي',
    regionId: 'Aswan',
    cityEn: 'Aswan',
    cityAr: 'أسوان',
    districtEn: 'Heissa Island · Between First & Old Dam',
    districtAr: 'جزيرة هيسا · بالقرب من معبد فيلة',
    coordinates: { lat: 24.0218, lng: 32.8782 },
    stars: 5,
    category: 'Boutique & Eco',
    rating: 4.91,
    reviewCount: 740,
    imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Outdoor Jacuzzi Suites', '5 Min Boat to Philae Temple', 'Nubian Heritage Architecture', 'Sunset Rock Lounge', 'Private Motorboats'],
    amenitiesAr: ['أجنحة بجاكوزي خارجي', '٥ دقائق بالمركب لمعبد فيلة', 'عمارة نوبية أصيلة', 'تراس صخري للغروب', 'لنشات نيلية خاصة'],
    baseRatesUsd: { sgl: 240, dbl: 275, suite: 490 },
    mealSupplementUsd: { BB: 0, HB: 42, AI: 95 },
    availabilityStatus: 'High Demand',
    availableRoomsTotal: 9,
    officialWebsite: 'https://dharahotels.com/benben/',
    bookingSlug: 'Benben by Dhara Hotels Aswan Egypt',
    phone: '+20 120 0666341',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_asw_sunboat_cruise',
    nameEn: 'Sanctuary Sun Boat IV Luxury Nile Cruise',
    nameAr: 'باخرة سانكتشواري صن بوت ٤ النيلية الفاخرة',
    regionId: 'Aswan',
    cityEn: 'Aswan / Luxor Nile',
    cityAr: 'أسوان / الأقصر (كروز نيلي)',
    districtEn: 'Aswan Private Mooring · Kom Ombo & Edfu Route',
    districtAr: 'مرسى أسوان الخاص · مسار كوم أمبو وإدفو',
    coordinates: { lat: 24.0985, lng: 32.8952 },
    stars: 5,
    category: 'Nile Cruise',
    rating: 4.94,
    reviewCount: 620,
    imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Art Deco Nile Cruiser', 'All-Inclusive Sightseeing', 'Gourmet Galabeya Night', 'Private Temple Entries', '36 Royal Cabins'],
    amenitiesAr: ['تصميم آرت ديكو فاخر', 'برنامج مزارات شامل', 'حفلة جلابية نوبية فاخرة', 'زيارات خاصة للمعابد', '٣٦ كابينة ملكية'],
    baseRatesUsd: { sgl: 410, dbl: 460, suite: 890 },
    mealSupplementUsd: { BB: 0, HB: 0, AI: 55 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 12,
    officialWebsite: 'https://www.sanctuaryretreats.com/egypt-cruises-sun-boat-iv',
    bookingSlug: 'Sanctuary Sun Boat IV Nile Cruise Aswan',
    phone: '+20 2 27359131',
    checkInTime: '12:00',
    checkOutTime: '08:00',
    freeCancellationHours: 72,
  },

  // ================= HURGHADA & EL GOUNA =================
  {
    id: 'htl_hrg_chedi_elgouna',
    nameEn: 'The Chedi El Gouna Red Sea',
    nameAr: 'ذا تشيدي الجونة البحر الأحمر',
    regionId: 'Hurghada',
    cityEn: 'El Gouna, Hurghada',
    cityAr: 'الجونة، الغردقة',
    districtEn: 'Hilltop Beachfront · El Gouna Lagoon',
    districtAr: 'شاطئ الجونة الخاص · البحر الأحمر',
    coordinates: { lat: 27.3945, lng: 33.6812 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.94,
    reviewCount: 1120,
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Private Red Sea Beach', 'Asian Luxury Spa', 'Nihon Japanese Restaurant', 'Yacht Marina Access', 'Heated Beachfront Pools'],
    amenitiesAr: ['شاطئ خاص بالبحر الأحمر', 'سبا آسيوي فاخر', 'مطعم نيهون الياباني', 'قرب مارينا اليخوت', 'مسابح شاطئية مدفأة'],
    baseRatesUsd: { sgl: 280, dbl: 320, suite: 640 },
    mealSupplementUsd: { BB: 0, HB: 45, AI: 105 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 17,
    officialWebsite: 'https://www.ghmhotels.com/en/el-gouna/',
    bookingSlug: 'The Chedi El Gouna Hurghada Red Sea',
    phone: '+20 65 3545160',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_hrg_oberoi_sahl_hasheesh',
    nameEn: 'The Oberoi Beach Resort, Sahl Hasheesh',
    nameAr: 'منتجع أوبروي بيتش سهل حشيش الغردقة',
    regionId: 'Hurghada',
    cityEn: 'Sahl Hasheesh, Hurghada',
    cityAr: 'سهل حشيش، الغردقة',
    districtEn: 'Private Coral Reef Bay · 48 Acres',
    districtAr: 'خليج الشعاب المرجانية الخاص · ٤٨ فداناً',
    coordinates: { lat: 27.0412, lng: 33.8925 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.96,
    reviewCount: 1680,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['All-Suite Private Courtyards', 'PADI Diving Center', 'Private Coral Jetty', 'Royal Pool Villas', '24h Butler'],
    amenitiesAr: ['أجنحة مستقلة بأفنية خاصة', 'مركز غوص معتمد PADI', 'سقالة شعاب مرجانية خاصة', 'فيلات بمسبح خاص', 'خدمة بتلر ٢٤ ساعة'],
    baseRatesUsd: { sgl: 350, dbl: 395, suite: 780 },
    mealSupplementUsd: { BB: 0, HB: 55, AI: 125 },
    availabilityStatus: 'High Demand',
    availableRoomsTotal: 10,
    officialWebsite: 'https://www.oberoihotels.com/hotels-in-sahl-hasheesh/',
    bookingSlug: 'The Oberoi Beach Resort Sahl Hasheesh Hurghada',
    phone: '+20 65 3440777',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_hrg_steigenberger_aldau',
    nameEn: 'Steigenberger ALDAU Beach Hotel Hurghada',
    nameAr: 'فندق شتايجنبرجر الداو بيتش الغردقة',
    regionId: 'Hurghada',
    cityEn: 'Hurghada',
    cityAr: 'الغردقة',
    districtEn: 'Youssef Afifi Tourist Promenade',
    districtAr: 'الممشى السياحي · الغردقة',
    coordinates: { lat: 27.1815, lng: 33.8294 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.88,
    reviewCount: 4520,
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['24h Luxury All-Inclusive', '5,000 sqm Lazy River Pool', '9-Hole Golf Course', 'Thalasso Spa', 'Group Conference & Incentive'],
    amenitiesAr: ['إقامة شاملة كلياً ٢٤ ساعة', 'مسبح ونهر مائي ٥٠٠٠ م٢', 'ملعب جولف ٩ حفر', 'سبا تالاسو علاجي', 'مناسب للأفواج والمؤتمرات'],
    baseRatesUsd: { sgl: 210, dbl: 245, suite: 480 },
    mealSupplementUsd: { BB: 0, HB: 25, AI: 50 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 45,
    officialWebsite: 'https://hrewards.com/en/steigenberger-aldau-beach-hotel-hurghada',
    bookingSlug: 'Steigenberger ALDAU Beach Hotel Hurghada',
    phone: '+20 65 3465400',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },

  // ================= SHARM EL SHEIKH =================
  {
    id: 'htl_ssh_fourseasons',
    nameEn: 'Four Seasons Resort Sharm El Sheikh',
    nameAr: 'منتجع فورسيزونز شرم الشيخ',
    regionId: 'Sharm El Sheikh',
    cityEn: 'Sharm El Sheikh',
    cityAr: 'شرم الشيخ',
    districtEn: '1 Four Seasons Blvd · Sharks Bay',
    districtAr: 'خليج القرش · شرم الشيخ',
    coordinates: { lat: 27.9654, lng: 34.4008 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.95,
    reviewCount: 1920,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['1 km Private Red Sea Coast', 'Funicular Railway to Beach', '5 Pools', 'Private Dive Yacht Jetty', '12 Restaurants & Lounges'],
    amenitiesAr: ['شاطئ خاص بطول ١ كم', 'قطار جبلي للشاطئ', '٥ مسابح فاخرة', 'مرسى يخوت وغوص خاص', '١٢ مطعماً ولاونج'],
    baseRatesUsd: { sgl: 410, dbl: 460, suite: 920 },
    mealSupplementUsd: { BB: 0, HB: 65, AI: 150 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 20,
    officialWebsite: 'https://www.fourseasons.com/sharmelsheikh/',
    bookingSlug: 'Four Seasons Resort Sharm El Sheikh Egypt',
    phone: '+20 69 3603555',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },
  {
    id: 'htl_ssh_rixos_seagate',
    nameEn: 'Rixos Premium Seagate Sharm El Sheikh (Ultra AI)',
    nameAr: 'ريكسوس بريميوم سي جيت شرم الشيخ',
    regionId: 'Sharm El Sheikh',
    cityEn: 'Sharm El Sheikh',
    cityAr: 'شرم الشيخ',
    districtEn: 'Nabq Bay · Coral Reef Protected Reserve',
    districtAr: 'خليج نبق · محمية الشعاب المرجانية',
    coordinates: { lat: 28.0278, lng: 34.4382 },
    stars: 5,
    category: '5-Star Deluxe',
    rating: 4.91,
    reviewCount: 5120,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Ultra All-Inclusive Concept', '850m Coral Pier', 'Aquaventure Waterpark', '9 A-La-Carte Restaurants', 'Anjana Turkish Spa'],
    amenitiesAr: ['إقامة ألترا شاملة كلياً', 'ممشى مرجاني ٨٥٠ متراً', 'أكوا بارك ترفيهية', '٩ مطاعم عالمية', 'سبا أنجانا التركي'],
    baseRatesUsd: { sgl: 290, dbl: 340, suite: 680 },
    mealSupplementUsd: { BB: 0, HB: 0, AI: 30 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 32,
    officialWebsite: 'https://www.rixos.com/en/hotel-resort/rixos-premium-seagate',
    bookingSlug: 'Rixos Premium Seagate Sharm El Sheikh',
    phone: '+20 69 3710130',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },

  // ================= DAHAB =================
  {
    id: 'htl_dhb_jaz_dahabeya',
    nameEn: 'Jaz Dahabeya Lagoon Resort, Dahab',
    nameAr: 'منتجع جاز دهبية لاجون دهب',
    regionId: 'Dahab',
    cityEn: 'Dahab, South Sinai',
    cityAr: 'دهب، جنوب سيناء',
    districtEn: 'Dahab Lagoon · Sandy Beach & Sinai Mountains',
    districtAr: 'لاجون دهب · شاطئ رملي وإطلالة جبال سيناء',
    coordinates: { lat: 28.4789, lng: 34.4995 },
    stars: 4,
    category: 'Boutique & Eco',
    rating: 4.83,
    reviewCount: 1540,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Direct Blue Lagoon Beach', 'Kitesurf & Freediving Hub', 'Mount Sinai St. Catherine Dispatch', 'Heated Pool', 'Bedouin Dinner Nights'],
    amenitiesAr: ['شاطئ رملي بلاجون دهب', 'مركز غوص حر وكايت سيرف', 'انطلاق رحلات جبل موسى وسانت كاترين', 'مسبح مدفأ', 'سهرات بدوية أصيلة'],
    baseRatesUsd: { sgl: 140, dbl: 165, suite: 310 },
    mealSupplementUsd: { BB: 0, HB: 24, AI: 52 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 21,
    officialWebsite: 'https://www.jazhotels.com/hoteldetail/24-egypt-dahab-jaz-dahabeya',
    bookingSlug: 'Jaz Dahabeya Resort Dahab South Sinai',
    phone: '+20 69 3640425',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 24,
  },

  // ================= ALEXANDRIA =================
  {
    id: 'htl_aly_fourseasons_sanstefano',
    nameEn: 'Four Seasons Hotel Alexandria at San Stefano',
    nameAr: 'فورسيزونز الإسكندرية سان ستيفانو',
    regionId: 'Alexandria',
    cityEn: 'Alexandria',
    cityAr: 'الإسكندرية',
    districtEn: '399 El Geish Road · Mediterranean Corniche',
    districtAr: 'طريق الجيش · كورنيش البحر المتوسط بسان ستيفانو',
    coordinates: { lat: 31.2456, lng: 29.9662 },
    stars: 5,
    category: '5-Star Luxury',
    rating: 4.92,
    reviewCount: 1870,
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Private Mediterranean Beach', 'Byblos Lebanese Dining', 'Indoor & Infinity Sea Pools', 'Royal Sea Suites', '20 Min to Bibliotheca Alexandrina'],
    amenitiesAr: ['شاطئ رملي خاص على المتوسط', 'مطعم بيبلوس اللبناني', 'مسبح داخلي وإنفينيتي على البحر', 'أجنحة بحرية ملكية', '٢٠ دقيقة لمكتبة الإسكندرية'],
    baseRatesUsd: { sgl: 310, dbl: 350, suite: 710 },
    mealSupplementUsd: { BB: 0, HB: 50, AI: 115 },
    availabilityStatus: 'Available',
    availableRoomsTotal: 18,
    officialWebsite: 'https://www.fourseasons.com/alexandria/',
    bookingSlug: 'Four Seasons Hotel Alexandria at San Stefano',
    phone: '+20 3 5818000',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    freeCancellationHours: 48,
  },

  // ================= SIWA OASIS =================
  {
    id: 'htl_siw_adrere_amellal',
    nameEn: 'Adrère Amellal Desert Eco-Lodge, Siwa Oasis',
    nameAr: 'قرية أدرير أميلال البيئية بواحة سيوة',
    regionId: 'Siwa',
    cityEn: 'Siwa Oasis',
    cityAr: 'واحة سيوة',
    districtEn: 'White Mountain Foot · Siwa Salt Lakes',
    districtAr: 'سفح الجبل الأبيض · بحيرات الملح بسيوة',
    coordinates: { lat: 29.2185, lng: 25.4321 },
    stars: 5,
    category: 'Boutique & Eco',
    rating: 4.96,
    reviewCount: 540,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
    ],
    amenitiesEn: ['Kershef Salt-Rock Architecture', 'Candlelit Starlight Dining', 'Natural Roman Spring Pool', '4x4 Great Sand Sea Safari', 'Organic Oasis Cuisine'],
    amenitiesAr: ['عمارة الكرشيف الملحية التراثية', 'عشاء على ضوء الشموع والنجوم', 'عين مياه طبيعية للسباحة', 'سفاري بحر الرمال الأعظم ٤×٤', 'مأكولات واحة سيوة العضوية'],
    baseRatesUsd: { sgl: 380, dbl: 430, suite: 760 },
    mealSupplementUsd: { BB: 0, HB: 35, AI: 70 },
    availabilityStatus: 'Limited Rooms',
    availableRoomsTotal: 5,
    officialWebsite: 'https://www.adrereamellal.com/',
    bookingSlug: 'Adrere Amellal Eco Lodge Siwa Oasis Egypt',
    phone: '+20 2 27367879',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    freeCancellationHours: 72,
  },
];

/**
 * Builds a direct external booking URL with pre-populated hotel name, dates, rooms, and guests.
 */
export function buildDirectBookingUrl(
  hotel: LiveHotelItem,
  checkIn = '2026-11-20',
  checkOut = '2026-11-24',
  rooms = 1,
  adults = 2
): string {
  const encodedQuery = encodeURIComponent(hotel.bookingSlug || `${hotel.nameEn} ${hotel.cityEn}`);
  return `https://www.booking.com/searchresults.html?ss=${encodedQuery}&checkin=${encodeURIComponent(
    checkIn
  )}&checkout=${encodeURIComponent(checkOut)}&group_adults=${Math.max(1, adults)}&no_rooms=${Math.max(
    1,
    rooms
  )}&selected_currency=USD`;
}

/**
 * Returns the curated multi-photo gallery for a given hotel ID.
 */
export function getHotelGalleryById(hotelId: string): string[] {
  const found = RAW_EGYPT_HOTEL_INVENTORY.find((h) => h.id === hotelId);
  if (found?.galleryUrls && found.galleryUrls.length > 0) {
    return found.galleryUrls;
  }
  return [
    found?.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
  ];
}

/**
 * Async mock API call to fetch a hotel's real-time image carousel data.
 * Queries `/api/hotels/:id/images` when running in browser and falls back to resolved local carousel array.
 */
export async function fetchHotelImages(hotelId: string): Promise<string[]> {
  try {
    if (typeof fetch === 'function') {
      const res = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}/images`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.images) && data.images.length > 0) {
          return data.images;
        }
      }
    }
  } catch {
    // Fallback to simulated async mock API resolution
  }

  // Simulated real-time image carousel response
  await new Promise((resolve) => setTimeout(resolve, 15));
  return getHotelGalleryById(hotelId);
}

/**
 * Computes live dynamic pricing and room options for a given filter set.
 */
export function searchAndPriceLiveHotels(params: HotelSearchFilterParams = {}): LiveHotelItem[] {
  const {
    region = 'all',
    category = 'all',
    checkIn = '2026-11-20',
    checkOut = '2026-11-24',
    mealPlan = 'BB',
    roomsCount = 1,
    adultsCount = 2,
    query = '',
    maxPriceUsd,
  } = params;

  // Compute nights between checkIn and checkOut
  let nights = 4;
  try {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (!Number.isNaN(diff) && diff >= 1 && diff <= 60) {
      nights = diff;
    }
  } catch {
    nights = 4;
  }

  // Seasonal multiplier: Oct–Apr is Egypt High Winter Tourism Season (1.06x), May–Sep is Green Summer Season (0.88x)
  let seasonMultiplier = 1.0;
  let seasonLabelEn = 'Standard Contracted Rate';
  let seasonLabelAr = 'سعر التعاقد القياسي';
  try {
    const month = new Date(checkIn).getMonth() + 1; // 1-12
    if (month >= 10 || month <= 4) {
      seasonMultiplier = 1.06;
      seasonLabelEn = 'Peak Winter Season Tariff';
      seasonLabelAr = 'تعريفة الموسم الشتوي السياحي';
    } else {
      seasonMultiplier = 0.88;
      seasonLabelEn = 'Summer Promotional Tariff (-12%)';
      seasonLabelAr = 'عرض الموسم الصيفي (-١٢٪)';
    }
  } catch {
    seasonMultiplier = 1.0;
  }

  const cleanQ = query.trim().toLowerCase();

  return RAW_EGYPT_HOTEL_INVENTORY.filter((hotel) => {
    if (region !== 'all' && hotel.regionId !== region) return false;
    if (category !== 'all' && hotel.category !== category) return false;
    if (cleanQ) {
      const hay = [
        hotel.nameEn,
        hotel.nameAr,
        hotel.cityEn,
        hotel.cityAr,
        hotel.districtEn,
        hotel.districtAr,
        ...hotel.amenitiesEn,
        ...hotel.amenitiesAr,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(cleanQ)) return false;
    }
    return true;
  })
    .map((hotel) => {
      const mealSupp = hotel.mealSupplementUsd[mealPlan] || 0;
      const sglLive = Math.round(hotel.baseRatesUsd.sgl * seasonMultiplier + mealSupp);
      const dblLive = Math.round(hotel.baseRatesUsd.dbl * seasonMultiplier + mealSupp * 1.6);
      const suiteLive = Math.round(hotel.baseRatesUsd.suite * seasonMultiplier + mealSupp * 1.8);

      const roomOptions: LiveHotelRoomOption[] = [
        {
          code: 'SGL',
          nameEn: 'Deluxe Single Room (SGL)',
          nameAr: 'غرفة ديلوكس مفردة (SGL)',
          capacityAdults: 1,
          baseNightlyUsd: hotel.baseRatesUsd.sgl,
          liveNightlyUsd: sglLive,
          totalStayUsd: sglLive * nights,
          availableCount: Math.max(2, Math.floor(hotel.availableRoomsTotal * 0.3)),
        },
        {
          code: 'DBL',
          nameEn: 'Deluxe Double / Twin Room (DBL)',
          nameAr: 'غرفة ديلوكس مزدوجة / توأم (DBL)',
          capacityAdults: 2,
          baseNightlyUsd: hotel.baseRatesUsd.dbl,
          liveNightlyUsd: dblLive,
          totalStayUsd: dblLive * nights,
          availableCount: Math.max(4, Math.floor(hotel.availableRoomsTotal * 0.55)),
        },
        {
          code: 'SUITE',
          nameEn: 'Royal / Nile View Suite',
          nameAr: 'جناح ملكي مطل (Suite)',
          capacityAdults: 3,
          baseNightlyUsd: hotel.baseRatesUsd.suite,
          liveNightlyUsd: suiteLive,
          totalStayUsd: suiteLive * nights,
          availableCount: Math.max(1, Math.floor(hotel.availableRoomsTotal * 0.15)),
        },
      ];

      const defaultGallery = getHotelGalleryById(hotel.id);

      return {
        ...hotel,
        galleryUrls: hotel.galleryUrls && hotel.galleryUrls.length > 0 ? hotel.galleryUrls : defaultGallery,
        nights,
        mealPlan,
        seasonLabelEn,
        seasonLabelAr,
        roomOptions,
        directBookingUrl: buildDirectBookingUrl(hotel, checkIn, checkOut, roomsCount, adultsCount),
        officialBookingUrl: hotel.officialWebsite,
        lastUpdatedIso: new Date().toISOString(),
      };
    })
    .filter((hotel) => {
      if (maxPriceUsd && maxPriceUsd > 0) {
        const dblRate = hotel.roomOptions?.find((r) => r.code === 'DBL')?.liveNightlyUsd || hotel.baseRatesUsd.dbl;
        return dblRate <= maxPriceUsd;
      }
      return true;
    });
}

/**
 * Async service method that queries the backend `/api/hotels/live-search` endpoint
 * with automatic local fallback so `HotelSearchEngine` works reliably in both runtime and test environments.
 */
export async function fetchHotelInventory(params: HotelSearchFilterParams = {}): Promise<{
  hotels: LiveHotelItem[];
  syncedAt: string;
}> {
  try {
    if (typeof fetch === 'function') {
      const qs = new URLSearchParams();
      if (params.region) qs.set('region', params.region);
      if (params.category) qs.set('category', params.category);
      if (params.checkIn) qs.set('checkIn', params.checkIn);
      if (params.checkOut) qs.set('checkOut', params.checkOut);
      if (params.mealPlan) qs.set('mealPlan', params.mealPlan);
      if (params.query) qs.set('query', params.query);
      if (params.maxPriceUsd) qs.set('maxPriceUsd', String(params.maxPriceUsd));

      const res = await fetch(`/api/hotels/live-search?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.hotels)) {
          return {
            hotels: data.hotels,
            syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
      }
    }
  } catch {
    // Fallback to mock-backed local engine
  }

  return {
    hotels: searchAndPriceLiveHotels(params),
    syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
