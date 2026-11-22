/**
 * Geospatial coordination and routing utility for Egyptian and Saudi Arabian travel.
 * Provides known coordinates for luxury hotels, historical monuments, airports, and cruise docks,
 * plus great-circle (Haversine) distance calculation and leg aggregations.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
  nameAr?: string;
  city: string;
  type: 'hotel' | 'sightseeing' | 'airport' | 'cruise' | 'transfer' | 'hub';
  address?: string;
  rating?: number;
  description?: string;
  descriptionAr?: string;
}

export interface RouteLeg {
  from: GeoPoint;
  to: GeoPoint;
  distanceKm: number;
  estimatedMinutes: number;
  mode: 'driving' | 'flight' | 'cruise' | 'walking';
}

export interface TripRouteOverview {
  waypoints: GeoPoint[];
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  center: { lat: number; lng: number };
  zoom: number;
}

// Known coordinates for major travel hubs, iconic hotels, and key landmarks
export const KNOWN_GEOLOCATIONS: Record<string, GeoPoint> = {
  // CAIRO & GIZA HOTELS
  'mena house': {
    name: 'Marriott Mena House, Giza',
    nameAr: 'فندق ماريوت مينا هاوس، الجيزة',
    city: 'Cairo',
    type: 'hotel',
    lat: 29.9852,
    lng: 31.1328,
    rating: 4.8,
    address: '6 Pyramids Road, Giza',
    description: 'Iconic luxury palace hotel at the foot of the Great Pyramids.',
    descriptionAr: 'قصر تاريخي فاخر بإطلالة مباشرة على أهرامات الجيزة.',
  },
  'four seasons nile plaza': {
    name: 'Four Seasons Hotel Cairo at Nile Plaza',
    nameAr: 'فندق فورسيزونز نايل بلازا، القاهرة',
    city: 'Cairo',
    type: 'hotel',
    lat: 30.0354,
    lng: 31.2312,
    rating: 4.9,
    address: 'Garden City, 1089 Corniche El Nil, Cairo',
    description: '5-star Nilefront luxury with panoramic river views.',
    descriptionAr: 'فندق فاخر بإطلالة بانورامية على كورنيش النيل بجاردن سيتي.',
  },
  'st regis cairo': {
    name: 'The St. Regis Cairo',
    nameAr: 'فندق سانت ريجيس القاهرة',
    city: 'Cairo',
    type: 'hotel',
    lat: 30.0617,
    lng: 31.2298,
    rating: 4.9,
    address: '1189 Corniche El Nil, Cairo',
    description: 'Bespoke luxury on the Nile with signature butler service.',
    descriptionAr: 'قمة الفخامة والخدمة الخاصة على ضفاف نهر النيل.',
  },
  'kempinski nile': {
    name: 'Kempinski Nile Hotel Cairo',
    nameAr: 'فندق كمبنسكي النيل، القاهرة',
    city: 'Cairo',
    type: 'hotel',
    lat: 30.0345,
    lng: 31.2307,
    rating: 4.7,
    address: '12 Ahmed Ragheb St, Garden City, Cairo',
    description: 'Boutique European luxury in the embassy district.',
    descriptionAr: 'فخامة أوروبية راقية بحي جاردن سيتي الدبلوماسي.',
  },

  // CAIRO SIGHTSEEING & AIRPORT
  'cairo airport': {
    name: 'Cairo International Airport (CAI)',
    nameAr: 'مطار القاهرة الدولي (CAI)',
    city: 'Cairo',
    type: 'airport',
    lat: 30.1219,
    lng: 31.4056,
    address: 'Oruba Road, Heliopolis, Cairo',
    description: 'Egypt’s primary international aviation gateway.',
    descriptionAr: 'بوابة مصر الجوية الدولية الأولى ومقر الاستقبال والمساعدة.',
  },
  'pyramids of giza': {
    name: 'Giza Pyramids & Great Sphinx',
    nameAr: 'أهرامات الجيزة وأبو الهول',
    city: 'Cairo',
    type: 'sightseeing',
    lat: 29.9792,
    lng: 31.1342,
    rating: 4.9,
    address: 'Al Haram, Giza Governorate',
    description: 'Sole surviving Wonder of the Ancient World.',
    descriptionAr: 'إحدى عجائب الدنيا السبع الأسطورية وتمثال أبو الهول.',
  },
  'grand egyptian museum': {
    name: 'Grand Egyptian Museum (GEM)',
    nameAr: 'المتحف المصري الكبير (GEM)',
    city: 'Cairo',
    type: 'sightseeing',
    lat: 29.9944,
    lng: 31.1197,
    rating: 4.9,
    address: 'Alexandria Desert Rd, Kafr Nassar, Giza',
    description: 'World’s largest archaeological museum, housing King Tutankhamun’s complete treasure.',
    descriptionAr: 'أكبر متحف أثري في العالم يضم كنوز توت عنخ آمون الكاملة.',
  },
  'nmec': {
    name: 'National Museum of Egyptian Civilization',
    nameAr: 'المتحف القومي للحضارة المصرية (الفستاط)',
    city: 'Cairo',
    type: 'sightseeing',
    lat: 30.0083,
    lng: 31.2483,
    rating: 4.8,
    address: 'Ein El Sira, Old Cairo',
    description: 'Home to the Royal Mummies Hall and comprehensive Egyptian civilization artifacts.',
    descriptionAr: 'قاعة المومياوات الملكية ومتحف الحضارة المصرية القديمة.',
  },
  'khan el khalili': {
    name: 'Khan el-Khalili & Islamic Cairo',
    nameAr: 'خان الخليلي والقاهرة الفاطمية',
    city: 'Cairo',
    type: 'sightseeing',
    lat: 30.0472,
    lng: 31.2625,
    rating: 4.7,
    address: 'El-Gamaleya, Cairo',
    description: 'Historic medieval bazaar, artisan stalls, and ancient mosques.',
    descriptionAr: 'السوق التراثي الشهير وأقدم أسواق الشرق الأوسط الحية.',
  },

  // LUXOR
  'winter palace': {
    name: 'Sofitel Winter Palace Luxor',
    nameAr: 'فندق سوفيتيل ونتر بالاس الأقصر',
    city: 'Luxor',
    type: 'hotel',
    lat: 25.6947,
    lng: 32.6375,
    rating: 4.8,
    address: 'Corniche El Nile, Luxor',
    description: 'Historic Victorian palace overlooking the Nile and Luxor Temple.',
    descriptionAr: 'قصر فيكتوري ساحر على كورنيش الأقصر استضاف ملوك العالم.',
  },
  'hilton luxor': {
    name: 'Hilton Luxor Resort & Spa',
    nameAr: 'منتجع هيلتون الأقصر والسبا',
    city: 'Luxor',
    type: 'hotel',
    lat: 25.7278,
    lng: 32.6592,
    rating: 4.7,
    address: 'New Karnak, Luxor',
    description: 'Nile-side resort near Karnak Temple with sunset infinity pools.',
    descriptionAr: 'منتجع استجمام نيلي راقٍ بالقرب من معابد الكرنك.',
  },
  'karnak temple': {
    name: 'Karnak Temple Complex',
    nameAr: 'مجمع معابد الكرنك',
    city: 'Luxor',
    type: 'sightseeing',
    lat: 25.7188,
    lng: 32.6573,
    rating: 4.9,
    address: 'Karnak, Luxor',
    description: 'Massive hypostyle hall dedicated to Amun-Ra, built over 1,500 years.',
    descriptionAr: 'أكبر دار عبادة أثرية في العالم وقاعة الأعمدة الضخمة.',
  },
  'valley of kings': {
    name: 'Valley of the Kings (Wadi al-Muluk)',
    nameAr: 'وادي الملوك والبر الغربي',
    city: 'Luxor',
    type: 'sightseeing',
    lat: 25.7402,
    lng: 32.6014,
    rating: 4.9,
    address: 'West Bank, Luxor',
    description: 'Ancient royal burial ground of New Kingdom Pharaohs, including Tutankhamun and Ramses VI.',
    descriptionAr: 'مقابر الفراعنة الملكية المنحوتة في قلب الصخر بالبر الغربي.',
  },
  'luxor airport': {
    name: 'Luxor International Airport (LXR)',
    nameAr: 'مطار الأقصر الدولي (LXR)',
    city: 'Luxor',
    type: 'airport',
    lat: 25.6711,
    lng: 32.7064,
    description: 'International airport serving Upper Egypt and the Nile Valley.',
    descriptionAr: 'مطار صعيد مصر الرئيسي لاستقبال الرحلات الداخلية والدولية.',
  },

  // ASWAN
  'old cataract': {
    name: 'Sofitel Legend Old Cataract Aswan',
    nameAr: 'فندق سوفيتيل أولد كتراكت أسوان',
    city: 'Aswan',
    type: 'hotel',
    lat: 24.0815,
    lng: 32.8887,
    rating: 4.9,
    address: 'Abtal El Tahrir St, Aswan',
    description: 'Legendary 19th-century palace on the pink granite cliffs of the First Cataract.',
    descriptionAr: 'الفندق الأسطوري الذي أقامت به أجاثا كريستي وملوك العالم.',
  },
  'philae temple': {
    name: 'Philae Temple of Isis',
    nameAr: 'معبد فيلة (إيزيس)',
    city: 'Aswan',
    type: 'sightseeing',
    lat: 24.0253,
    lng: 32.8842,
    rating: 4.9,
    address: 'Agilkia Island, Aswan',
    description: 'Rescued island sanctuary dedicated to Goddess Isis, reached by traditional felucca.',
    descriptionAr: 'جزيرة أجيليكا ومعبد إيزيس المنقذ برعاية اليونسكو.',
  },
  'aswan airport': {
    name: 'Aswan International Airport (ASW)',
    nameAr: 'مطار أسوان الدولي (ASW)',
    city: 'Aswan',
    type: 'airport',
    lat: 23.9644,
    lng: 32.8197,
    description: 'Gateway to Nubian antiquities and Lake Nasser.',
    descriptionAr: 'بوابة النوبة ومعالم أقصى جنوب مصر.',
  },

  // RED SEA / HURGHADA / SHARM
  'steigenberger aldau': {
    name: 'Steigenberger ALDAU Beach Hotel, Hurghada',
    nameAr: 'فندق شتيجنبرجر الداو بيتش، الغردقة',
    city: 'Hurghada',
    type: 'hotel',
    lat: 27.1583,
    lng: 33.8263,
    rating: 4.8,
    address: 'Youssef Afifi Road, Hurghada',
    description: 'Deluxe beachfront golf & dive resort on the turquoise Red Sea coast.',
    descriptionAr: 'منتجع شاطئي فاخر مع ملاعب جولف ورياضات غوص البحر الأحمر.',
  },
  'four seasons sharm': {
    name: 'Four Seasons Resort Sharm El Sheikh',
    nameAr: 'منتجع فورسيزونز شرم الشيخ',
    city: 'Sharm El Sheikh',
    type: 'hotel',
    lat: 27.9622,
    lng: 34.4211,
    rating: 4.9,
    address: '1 Four Seasons Blvd, Sharks Bay, Sharm El Sheikh',
    description: 'Arabian fairy-tale hillside resort with private dive reef and coral gardens.',
    descriptionAr: 'منتجع فخم على تلال خليج القرش بشعب مرجانية خاصة.',
  },

  // SAUDI ARABIA / UMRAH / HAJJ
  'fairmont makkah': {
    name: 'Makkah Clock Royal Tower, A Fairmont Hotel',
    nameAr: 'فندق ساعة مكة فيرمونت، مكة المكرمة',
    city: 'Makkah',
    type: 'hotel',
    lat: 21.4192,
    lng: 39.8256,
    rating: 4.8,
    address: 'King Abdul Aziz Endowment, Abraj Al Bait, Makkah',
    description: 'Iconic tower hotel directly facing the Holy Kaaba and Haram plaza.',
    descriptionAr: 'برج الساعة الشهير بإطلالة مباشرة على الكعبة المشرفة وساحات الحرم.',
  },
  'masjid al haram': {
    name: 'The Grand Mosque (Masjid al-Haram)',
    nameAr: 'المسجد الحرام والكعبة المشرفة',
    city: 'Makkah',
    type: 'sightseeing',
    lat: 21.4225,
    lng: 39.8262,
    rating: 5.0,
    address: 'Makkah, Saudi Arabia',
    description: 'Holiest sanctuary in Islam, site of Tawaf and Sa’i.',
    descriptionAr: 'قبلة المسلمين وأعظم بقعة مباركة في الأرض.',
  },
  'jeddah airport': {
    name: 'King Abdulaziz International Airport (JED)',
    nameAr: 'مطار الملك عبدالعزيز الدولي بجدة (JED)',
    city: 'Jeddah',
    type: 'airport',
    lat: 21.6796,
    lng: 39.1565,
    description: 'Main arrival airport for Hajj & Umrah pilgrims.',
    descriptionAr: 'صالة الحجاج ومطار الاستقبال الرئيسي للعمرة والحج.',
  },
  'oberoi madinah': {
    name: 'The Oberoi Madinah',
    nameAr: 'فندق أوبروي المدينة المنورة',
    city: 'Madinah',
    type: 'hotel',
    lat: 24.4712,
    lng: 39.6111,
    rating: 4.9,
    address: 'North Central Area, Madinah',
    description: 'Luxury hotel directly steps from Al-Masjid an-Nabawi ladies and main gates.',
    descriptionAr: 'فندق النخبة المجاور مباشرة لساحات المسجد النبوي الشريف.',
  },
  'masjid an nabawi': {
    name: 'The Prophet’s Mosque (Al-Masjid an-Nabawi)',
    nameAr: 'المسجد النبوي الشريف والروضة الشريفة',
    city: 'Madinah',
    type: 'sightseeing',
    lat: 24.4672,
    lng: 39.6112,
    rating: 5.0,
    address: 'Madinah, Saudi Arabia',
    description: 'Second holiest site in Islam containing the Rawdah Mubarakah.',
    descriptionAr: 'المسجد النبوي الشريف وروضة الجنة وقبر المصطفى ﷺ.',
  },
};

/**
 * City default fallback center coordinates
 */
export const CITY_DEFAULT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  cairo: { lat: 30.0444, lng: 31.2357 },
  giza: { lat: 29.9870, lng: 31.1350 },
  alexandria: { lat: 31.2001, lng: 29.9187 },
  luxor: { lat: 25.6872, lng: 32.6396 },
  aswan: { lat: 24.0889, lng: 32.8998 },
  hurghada: { lat: 27.2579, lng: 33.8116 },
  'sharm el sheikh': { lat: 27.9158, lng: 34.3299 },
  dahab: { lat: 28.5097, lng: 34.5136 },
  siwa: { lat: 29.2032, lng: 25.5195 },
  makkah: { lat: 21.4225, lng: 39.8262 },
  medina: { lat: 24.4672, lng: 39.6112 },
  madinah: { lat: 24.4672, lng: 39.6112 },
  jeddah: { lat: 21.5433, lng: 39.1728 },
  riyadh: { lat: 24.7136, lng: 46.6753 },
};

/**
 * Resolve GPS coordinates from service name, supplier name, or city.
 */
export function resolveLocationPoint(
  serviceName: string,
  supplierName?: string,
  city?: string,
  supplierType?: string
): GeoPoint {
  const combined = `${serviceName || ''} ${supplierName || ''} ${city || ''}`.toLowerCase();

  // 1. Direct dictionary match
  for (const [key, point] of Object.entries(KNOWN_GEOLOCATIONS)) {
    if (combined.includes(key)) {
      return { ...point };
    }
  }

  // 2. City fallback with contextual jitter so points don't stack exactly on top of each other
  const cleanCity = (city || 'Cairo').toLowerCase().trim();
  const baseCoord = CITY_DEFAULT_COORDINATES[cleanCity] || CITY_DEFAULT_COORDINATES.cairo;

  // Generate reproducible deterministic jitter based on name string length
  const hash = Math.abs(
    (serviceName || 'pt').split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1000, 7)
  );
  const latOffset = ((hash % 100) - 50) * 0.00035;
  const lngOffset = (((hash * 7) % 100) - 50) * 0.00035;

  let inferredType: GeoPoint['type'] = 'sightseeing';
  const sType = (supplierType || '').toLowerCase();
  if (sType.includes('hotel') || combined.includes('hotel') || combined.includes('resort') || combined.includes('palace')) {
    inferredType = 'hotel';
  } else if (sType.includes('cruise') || combined.includes('cruise') || combined.includes('ship')) {
    inferredType = 'cruise';
  } else if (sType.includes('transfer') || combined.includes('airport') || combined.includes('flight')) {
    inferredType = combined.includes('airport') ? 'airport' : 'transfer';
  }

  return {
    lat: baseCoord.lat + latOffset,
    lng: baseCoord.lng + lngOffset,
    name: serviceName || supplierName || `${city || 'Egypt'} Activity`,
    city: city || 'Egypt',
    type: inferredType,
    address: `${city || 'Egypt'}, GPS Resolved Location`,
    description: supplierName ? `Arranged via ${supplierName}` : undefined,
  };
}

/**
 * Calculate distance in Kilometers between two points using Great-Circle Haversine Formula.
 */
export function calculateHaversineDistanceKm(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimate transit duration in minutes based on distance and route profile.
 */
export function estimateTransitMinutes(distanceKm: number, mode: RouteLeg['mode']): number {
  if (mode === 'flight') {
    return Math.round(45 + (distanceKm / 750) * 60); // Runway taxi + flight speed
  }
  if (mode === 'cruise') {
    return Math.round((distanceKm / 15) * 60); // 15 km/h cruise speed
  }
  if (mode === 'walking') {
    return Math.round((distanceKm / 4.5) * 60);
  }
  // Driving (highway vs city traffic average ~60 km/h)
  return Math.max(10, Math.round((distanceKm / 55) * 60));
}

/**
 * Compile a comprehensive route overview with all waypoints, legs, total distance, and center.
 */
export function buildTripRouteOverview(points: GeoPoint[]): TripRouteOverview {
  if (points.length === 0) {
    return {
      waypoints: [],
      legs: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      center: CITY_DEFAULT_COORDINATES.cairo,
      zoom: 11,
    };
  }

  const legs: RouteLeg[] = [];
  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const dist = calculateHaversineDistanceKm(from, to);

    // Determine likely mode of transport
    let mode: RouteLeg['mode'] = 'driving';
    if (dist > 350) {
      mode = 'flight';
    } else if (
      (from.city.toLowerCase() === 'luxor' && to.city.toLowerCase() === 'aswan') ||
      (from.city.toLowerCase() === 'aswan' && to.city.toLowerCase() === 'luxor')
    ) {
      mode = 'cruise';
    } else if (dist < 1.5) {
      mode = 'walking';
    }

    const duration = estimateTransitMinutes(dist, mode);
    legs.push({
      from,
      to,
      distanceKm: dist,
      estimatedMinutes: duration,
      mode,
    });
    totalKm += dist;
    totalMin += duration;
  }

  // Calculate geometric center
  const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
  const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;

  // Approximate zoom level based on bounding box
  const minLat = Math.min(...points.map(p => p.lat));
  const maxLat = Math.max(...points.map(p => p.lat));
  const minLng = Math.min(...points.map(p => p.lng));
  const maxLng = Math.max(...points.map(p => p.lng));
  const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

  let zoom = 12;
  if (maxDiff > 8) zoom = 6;
  else if (maxDiff > 4) zoom = 7;
  else if (maxDiff > 1.5) zoom = 9;
  else if (maxDiff > 0.4) zoom = 11;
  else zoom = 13;

  return {
    waypoints: points,
    legs,
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    totalDurationMinutes: totalMin,
    center: { lat: avgLat, lng: avgLng },
    zoom,
  };
}
