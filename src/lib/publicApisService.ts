/**
 * Public APIs Service for RIHAL Travel ERP
 * Grounded in the GitHub public-apis catalog:
 * - Weather & Forecasts: Open-Meteo (No auth, CORS yes, free)
 * - Currency & Foreign Exchange: open.er-api.com / ExchangeRate-API (No auth, CORS yes, free)
 * - Prayer Times & Hijri Calendar: Aladhan API (No auth, CORS yes, free)
 * - Country Demographics & Visa Rules: Open Tourism Geo & Flag services
 */

import { DESTINATION_COORDINATES, DestinationWeather } from './weatherService';
import { fetchLiveExchangeRates, getStoredExchangeRates, ExchangeRatesMap } from './currencyService';
import { Currency } from '../types';

// Extended coordinates covering all Egyptian and Saudi tourism hubs
export const ALL_TOURISM_COORDINATES: Record<string, { lat: number; lon: number; arName: string; country: 'Egypt' | 'Saudi Arabia'; region: string }> = {
  Cairo: { lat: 30.0444, lon: 31.2357, arName: 'القاهرة', country: 'Egypt', region: 'Greater Cairo' },
  Giza: { lat: 29.9792, lon: 31.1342, arName: 'الجيزة والهرم', country: 'Egypt', region: 'Pyramids Plateau' },
  Luxor: { lat: 25.6872, lon: 32.6396, arName: 'الأقصر', country: 'Egypt', region: 'Upper Egypt / Nile' },
  Aswan: { lat: 24.0889, lon: 32.8998, arName: 'أسوان', country: 'Egypt', region: 'Nubia / Upper Nile' },
  Hurghada: { lat: 27.2579, lon: 33.8116, arName: 'الغردقة', country: 'Egypt', region: 'Red Sea Coast' },
  'Sharm El Sheikh': { lat: 27.9158, lon: 34.3299, arName: 'شرم الشيخ', country: 'Egypt', region: 'South Sinai' },
  Alexandria: { lat: 31.2001, lon: 29.9187, arName: 'الإسكندرية', country: 'Egypt', region: 'Mediterranean Coast' },
  Makkah: { lat: 21.4225, lon: 39.8262, arName: 'مكة المكرمة', country: 'Saudi Arabia', region: 'Holy Sanctuary' },
  Madinah: { lat: 24.4672, lon: 39.6111, arName: 'المدينة المنورة', country: 'Saudi Arabia', region: 'Prophet Mosque' },
  Jeddah: { lat: 21.5433, lon: 39.1728, arName: 'جدة', country: 'Saudi Arabia', region: 'Red Sea Port / Gateway' },
};

export interface ComprehensiveWeather extends DestinationWeather {
  humidityPct: number;
  uvIndex: number;
  feelsLikeC: number;
  isLive?: boolean;
  isOfflineBuffer?: boolean;
  errorMessage?: string;
  forecast5Days: {
    date: string;
    dayName: string;
    dayNameAr: string;
    maxTempC: number;
    minTempC: number;
    condition: string;
    icon: string;
  }[];
  operationalAlert?: {
    level: 'normal' | 'caution' | 'warning';
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
  };
}

export interface PrayerTimings {
  city: string;
  cityAr: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijriDate: {
    day: string;
    monthEn: string;
    monthAr: string;
    year: string;
    formattedEn: string;
    formattedAr: string;
  };
  nextPrayer: {
    nameEn: string;
    nameAr: string;
    time: string;
  };
}

export interface HotelMarketBenchmark {
  city: string;
  cityAr: string;
  category: '5_star_luxury' | '5_star_standard' | '4_star_classic' | 'nile_cruise' | 'vip_transport';
  categoryLabelEn: string;
  categoryLabelAr: string;
  benchmarkRetailUsd: number;
  averageContractNetUsd: number;
  savingsPct: number;
  marketTrend: 'stable' | 'rising' | 'high_demand';
  popularHotels: string[];
}

export interface CountryVisaInfo {
  code: string;
  nameEn: string;
  nameAr: string;
  flag: string;
  capital: string;
  currency: string;
  currencySymbol: string;
  callingCode: string;
  egyptVisaType: 'Visa on Arrival / E-Visa' | 'Pre-arrival Embassy Visa' | 'Visa-free';
  saudiVisaType: 'Tourist E-Visa (Nusuk)' | 'Visa on Arrival' | 'GCC Resident E-Visa' | 'Visa-free';
  passportValidityMonths: number;
}

// -------------------------------------------------------------
// 1. WEATHER & CLIMATE ENGINE (Open-Meteo)
// -------------------------------------------------------------

function getWmoDetails(code: number): { condition: string; conditionAr: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky & Sun', conditionAr: 'مشمس وصافي', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly Sunny', conditionAr: 'مشمس جزئياً', icon: '🌤️' };
  if (code <= 48) return { condition: 'Morning Haze / Mist', conditionAr: 'ضباب خفيف صباحاً', icon: '🌫️' };
  if (code <= 65) return { condition: 'Light Coastal Shower', conditionAr: 'زخات مطر خفيفة', icon: '🌦️' };
  if (code <= 82) return { condition: 'Passing Rain', conditionAr: 'أمطار متفرقة', icon: '🌧️' };
  return { condition: 'Clear & Mild', conditionAr: 'معتدل ولطيف', icon: '☀️' };
}

export async function fetchLiveComprehensiveWeather(cityName: string): Promise<ComprehensiveWeather> {
  const coord = ALL_TOURISM_COORDINATES[cityName] || ALL_TOURISM_COORDINATES['Cairo'];
  
  // Default realistic fallbacks
  const fallback: ComprehensiveWeather = {
    city: cityName,
    arabicName: coord.arName,
    temperatureC: cityName === 'Luxor' || cityName === 'Aswan' ? 34 : cityName === 'Makkah' ? 36 : 28,
    condition: 'Sunny & Pleasant',
    conditionAr: 'مشمس ومعتدل',
    icon: '☀️',
    maxTempC: 32,
    minTempC: 20,
    windSpeedKmh: 14,
    humidityPct: 35,
    uvIndex: 7,
    feelsLikeC: 29,
    travelRecommendation: 'Ideal weather for outdoor sightseeing and monument exploration.',
    travelRecommendationAr: 'طقس مثالي للجولات الميدانية وزيارة المعالم الأثرية.',
    forecast5Days: [
      { date: '2026-10-15', dayName: 'Today', dayNameAr: 'اليوم', maxTempC: 32, minTempC: 20, condition: 'Sunny', icon: '☀️' },
      { date: '2026-10-16', dayName: 'Fri', dayNameAr: 'الجمعة', maxTempC: 31, minTempC: 19, condition: 'Clear', icon: '☀️' },
      { date: '2026-10-17', dayName: 'Sat', dayNameAr: 'السبت', maxTempC: 33, minTempC: 21, condition: 'Sunny', icon: '☀️' },
      { date: '2026-10-18', dayName: 'Sun', dayNameAr: 'الأحد', maxTempC: 30, minTempC: 20, condition: 'Breezy', icon: '🌤️' },
      { date: '2026-10-19', dayName: 'Mon', dayNameAr: 'الاثنين', maxTempC: 29, minTempC: 19, condition: 'Clear', icon: '☀️' },
    ],
  };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const cur = data.current;
      const daily = data.daily;
      const { condition, conditionAr, icon } = getWmoDetails(cur.weather_code || 0);

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

      const forecast5Days = (daily.time || []).slice(0, 5).map((tStr: string, idx: number) => {
        const d = new Date(tStr);
        const dayIdx = d.getDay();
        const code = daily.weather_code?.[idx] || 0;
        const info = getWmoDetails(code);
        return {
          date: tStr,
          dayName: idx === 0 ? 'Today' : daysOfWeek[dayIdx] || tStr,
          dayNameAr: idx === 0 ? 'اليوم' : daysOfWeekAr[dayIdx] || tStr,
          maxTempC: Math.round(daily.temperature_2m_max?.[idx] ?? cur.temperature_2m + 2),
          minTempC: Math.round(daily.temperature_2m_min?.[idx] ?? cur.temperature_2m - 5),
          condition: info.condition,
          icon: info.icon,
        };
      });

      const temp = Math.round(cur.temperature_2m);
      const uv = daily.uv_index_max?.[0] ? Math.round(daily.uv_index_max[0]) : 6;
      const wind = Math.round(cur.wind_speed_10m);

      let alert: ComprehensiveWeather['operationalAlert'];
      if (temp >= 38) {
        alert = {
          level: 'warning',
          titleEn: 'Extreme Midday Heat Warning',
          titleAr: 'تحذير من حرارة الظهيرة الشديدة',
          messageEn: 'Advise guides to conduct outdoor walking tours before 11:00 AM or after 4:00 PM. Hydration mandatory.',
          messageAr: 'يوصى بتنظيم الجولات الميدانية المكشوفة قبل 11 صباحاً أو بعد 4 عصراً، وتوفير مياه مثلجة للحافلات.',
        };
      } else if (wind >= 28 && (cityName === 'Hurghada' || cityName === 'Sharm El Sheikh')) {
        alert = {
          level: 'caution',
          titleEn: 'Red Sea Marine Advisory',
          titleAr: 'تنبيه بحري للبحر الأحمر',
          messageEn: 'Wind speed exceeds 28 km/h. Check coast guard permits before launching boat snorkeling trips.',
          messageAr: 'سرعة الرياح تتجاوز 28 كم/س. يُرجى مراجعة تصاريح حرس الحدود قبل انطلاق يخوت الغطس.',
        };
      } else if (uv >= 9) {
        alert = {
          level: 'caution',
          titleEn: 'Very High UV Index Alert',
          titleAr: 'مؤشر أشعة فوق بنفسجية مرتفع جداً',
          messageEn: 'Sun umbrellas and sunscreen recommended for plateau & temple tours.',
          messageAr: 'يوصى بتنبيه السائحين بارتداء قبعات واقية واستخدام واقي الشمس بالأهرامات والمعابد.',
        };
      }

      return {
        city: cityName,
        arabicName: coord.arName,
        temperatureC: temp,
        feelsLikeC: Math.round(cur.apparent_temperature ?? temp),
        humidityPct: Math.round(cur.relative_humidity_2m ?? 40),
        windSpeedKmh: wind,
        uvIndex: uv,
        condition,
        conditionAr,
        icon,
        maxTempC: Math.round(daily.temperature_2m_max?.[0] ?? temp + 2),
        minTempC: Math.round(daily.temperature_2m_min?.[0] ?? temp - 5),
        travelRecommendation: fallback.travelRecommendation,
        travelRecommendationAr: fallback.travelRecommendationAr,
        forecast5Days,
        operationalAlert: alert,
        isLive: true,
        isOfflineBuffer: false,
      };
    }
  } catch (err: any) {
    return {
      ...fallback,
      isLive: false,
      isOfflineBuffer: true,
      errorMessage: err?.message || 'Open-Meteo API connection timed out or offline',
    };
  }

  return {
    ...fallback,
    isLive: false,
    isOfflineBuffer: true,
    errorMessage: 'Open-Meteo service responded with non-200 status',
  };
}

// -------------------------------------------------------------
// 2. PRAYER TIMES & HIJRI CALENDAR (Aladhan API)
// -------------------------------------------------------------

export async function fetchLivePrayerTimes(city: 'Makkah' | 'Madinah' | 'Cairo'): Promise<PrayerTimings> {
  const country = city === 'Cairo' ? 'Egypt' : 'Saudi Arabia';
  const method = city === 'Cairo' ? '5' : '4'; // 5 = Egyptian General Authority of Survey, 4 = Umm Al-Qura University, Makkah

  const cityArMap: Record<string, string> = {
    Makkah: 'مكة المكرمة (الحرم المكي)',
    Madinah: 'المدينة المنورة (المسجد النبوي)',
    Cairo: 'القاهرة (جمهورية مصر العربية)',
  };

  const fallback: PrayerTimings = {
    city,
    cityAr: cityArMap[city] || city,
    fajr: city === 'Cairo' ? '04:35' : '05:00',
    sunrise: city === 'Cairo' ? '06:02' : '06:18',
    dhuhr: city === 'Cairo' ? '11:45' : '12:08',
    asr: city === 'Cairo' ? '15:08' : '15:32',
    maghrib: city === 'Cairo' ? '17:28' : '17:58',
    isha: city === 'Cairo' ? '18:45' : '19:28',
    hijriDate: {
      day: '04',
      monthEn: 'Jumada al-Awwal',
      monthAr: 'جمادى الأولى',
      year: '1448',
      formattedEn: '04 Jumada al-Awwal 1448 AH',
      formattedAr: '04 جمادى الأولى 1448 هـ',
    },
    nextPrayer: {
      nameEn: 'Maghrib',
      nameAr: 'المغرب',
      time: city === 'Cairo' ? '17:28' : '17:58',
    },
  };

  try {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        const timings = data.data.timings;
        const h = data.data.date?.hijri || {};

        // Find next prayer based on current time
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const prayers = [
          { nameEn: 'Fajr', nameAr: 'الفجر', t: timings.Fajr },
          { nameEn: 'Sunrise', nameAr: 'الشروق', t: timings.Sunrise },
          { nameEn: 'Dhuhr', nameAr: 'الظهر', t: timings.Dhuhr },
          { nameEn: 'Asr', nameAr: 'العصر', t: timings.Asr },
          { nameEn: 'Maghrib', nameAr: 'المغرب', t: timings.Maghrib },
          { nameEn: 'Isha', nameAr: 'العشاء', t: timings.Isha },
        ];

        let next = prayers[0];
        for (const p of prayers) {
          const [hh, mm] = p.t.split(':').map(Number);
          if (hh * 60 + mm > currentMins) {
            next = p;
            break;
          }
        }

        return {
          city,
          cityAr: cityArMap[city] || city,
          fajr: timings.Fajr,
          sunrise: timings.Sunrise,
          dhuhr: timings.Dhuhr,
          asr: timings.Asr,
          maghrib: timings.Maghrib,
          isha: timings.Isha,
          hijriDate: {
            day: h.day || '04',
            monthEn: h.month?.en || 'Jumada al-Awwal',
            monthAr: h.month?.ar || 'جمادى الأولى',
            year: h.year || '1448',
            formattedEn: `${h.day} ${h.month?.en} ${h.year} AH`,
            formattedAr: `${h.day} ${h.month?.ar} ${h.year} هـ`,
          },
          nextPrayer: {
            nameEn: next.nameEn,
            nameAr: next.nameAr,
            time: next.t,
          },
        };
      }
    }
  } catch {
    // Graceful offline buffer fallback
  }

  return fallback;
}

// -------------------------------------------------------------
// 3. HOTEL & SUPPLIER BENCHMARK MARKET RATES
// -------------------------------------------------------------

export const LIVE_HOTEL_MARKET_BENCHMARKS: HotelMarketBenchmark[] = [
  {
    city: 'Cairo',
    cityAr: 'القاهرة والجيزة',
    category: '5_star_luxury',
    categoryLabelEn: '5-Star Luxury (Nile Front / Pyramids View)',
    categoryLabelAr: '5 نجوم فاخر (إطلالة نيلية / إطلالة الأهرامات)',
    benchmarkRetailUsd: 280,
    averageContractNetUsd: 185,
    savingsPct: 34,
    marketTrend: 'high_demand',
    popularHotels: ['Marriott Mena House Giza', 'Four Seasons Nile Plaza', 'Kempinski Nile Hotel'],
  },
  {
    city: 'Cairo',
    cityAr: 'القاهرة',
    category: '4_star_classic',
    categoryLabelEn: '4-Star Classic City Hotel',
    categoryLabelAr: '4 نجوم كلاسيكي متميز',
    benchmarkRetailUsd: 135,
    averageContractNetUsd: 85,
    savingsPct: 37,
    marketTrend: 'stable',
    popularHotels: ['Steigenberger El Tahrir', 'Novotel Cairo El Borg', 'Baron Hotel Heliopolis'],
  },
  {
    city: 'Luxor',
    cityAr: 'الأقصر',
    category: '5_star_luxury',
    categoryLabelEn: '5-Star Historic & Palace Hotels',
    categoryLabelAr: '5 نجوم تاريخي وفخم',
    benchmarkRetailUsd: 260,
    averageContractNetUsd: 160,
    savingsPct: 38,
    marketTrend: 'rising',
    popularHotels: ['Sofitel Winter Palace Luxor', 'Hilton Luxor Resort & Spa', 'Steigenberger Nile Palace'],
  },
  {
    city: 'Nile River',
    cityAr: 'كروزات النيل (الأقصر - أسوان)',
    category: 'nile_cruise',
    categoryLabelEn: '5-Star Deluxe Nile Cruise (Full Board)',
    categoryLabelAr: 'كروز نيل 5 نجوم ديلوكس (إقامة كاملة)',
    benchmarkRetailUsd: 210,
    averageContractNetUsd: 130,
    savingsPct: 38,
    marketTrend: 'high_demand',
    popularHotels: ['M/S Esplanade Nile Cruise', 'M/S Mayfair', 'Sonesta St. George I'],
  },
  {
    city: 'Hurghada',
    cityAr: 'الغردقة',
    category: '5_star_luxury',
    categoryLabelEn: '5-Star All-Inclusive Beach Resort',
    categoryLabelAr: 'منتجع 5 نجوم إقامة شاملة (شاطئ خاص)',
    benchmarkRetailUsd: 220,
    averageContractNetUsd: 140,
    savingsPct: 36,
    marketTrend: 'stable',
    popularHotels: ['Steigenberger ALDAU Beach', 'Rixos Premium Magawish', 'Baron Palace Sahl Hasheesh'],
  },
  {
    city: 'Makkah',
    cityAr: 'مكة المكرمة',
    category: '5_star_luxury',
    categoryLabelEn: 'Haram Front Row VIP Suites',
    categoryLabelAr: 'أبراج الصف الأول المطلة على الحرم الشريف',
    benchmarkRetailUsd: 380,
    averageContractNetUsd: 245,
    savingsPct: 35,
    marketTrend: 'high_demand',
    popularHotels: ['Fairmont Makkah Clock Royal Tower', 'Swissôtel Al Maqam', 'Raffles Makkah Palace'],
  },
  {
    city: 'Madinah',
    cityAr: 'المدينة المنورة',
    category: '5_star_luxury',
    categoryLabelEn: 'Northern Piazza Courtyard Luxury',
    categoryLabelAr: 'فنادق الساحة الشمالية أمام المسجد النبوي',
    benchmarkRetailUsd: 290,
    averageContractNetUsd: 195,
    savingsPct: 33,
    marketTrend: 'high_demand',
    popularHotels: ['The Oberoi Madinah', 'Dar Al Taqwa Hotel', 'Madinah Hilton'],
  },
];

// -------------------------------------------------------------
// 4. PASSPORT & TOURIST VISA DEMOGRAPHICS
// -------------------------------------------------------------

export const TOURISM_SOURCE_MARKETS: CountryVisaInfo[] = [
  {
    code: 'US',
    nameEn: 'United States',
    nameAr: 'الولايات المتحدة الأمريكية',
    flag: '🇺🇸',
    capital: 'Washington, D.C.',
    currency: 'USD',
    currencySymbol: '$',
    callingCode: '+1',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'GB',
    nameEn: 'United Kingdom',
    nameAr: 'المملكة المتحدة (بريطانيا)',
    flag: '🇬🇧',
    capital: 'London',
    currency: 'GBP',
    currencySymbol: '£',
    callingCode: '+44',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'DE',
    nameEn: 'Germany',
    nameAr: 'ألمانيا',
    flag: '🇩🇪',
    capital: 'Berlin',
    currency: 'EUR',
    currencySymbol: '€',
    callingCode: '+49',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'FR',
    nameEn: 'France',
    nameAr: 'فرنسا',
    flag: '🇫🇷',
    capital: 'Paris',
    currency: 'EUR',
    currencySymbol: '€',
    callingCode: '+33',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'IT',
    nameEn: 'Italy',
    nameAr: 'إيطاليا',
    flag: '🇮🇹',
    capital: 'Rome',
    currency: 'EUR',
    currencySymbol: '€',
    callingCode: '+39',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'ES',
    nameEn: 'Spain',
    nameAr: 'إسبانيا',
    flag: '🇪🇸',
    capital: 'Madrid',
    currency: 'EUR',
    currencySymbol: '€',
    callingCode: '+34',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'RU',
    nameEn: 'Russian Federation',
    nameAr: 'روسيا الاتحادية',
    flag: '🇷🇺',
    capital: 'Moscow',
    currency: 'RUB',
    currencySymbol: '₽',
    callingCode: '+7',
    egyptVisaType: 'Visa on Arrival / E-Visa',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
  {
    code: 'SA',
    nameEn: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    capital: 'Riyadh',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    callingCode: '+966',
    egyptVisaType: 'Visa-free',
    saudiVisaType: 'Visa-free',
    passportValidityMonths: 3,
  },
  {
    code: 'EG',
    nameEn: 'Egypt',
    nameAr: 'جمهورية مصر العربية',
    flag: '🇪🇬',
    capital: 'Cairo',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    callingCode: '+20',
    egyptVisaType: 'Visa-free',
    saudiVisaType: 'Tourist E-Visa (Nusuk)',
    passportValidityMonths: 6,
  },
];
