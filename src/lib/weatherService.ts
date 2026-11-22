export interface DestinationWeather {
  city: string;
  arabicName: string;
  temperatureC: number;
  condition: string;
  conditionAr: string;
  icon: string;
  maxTempC: number;
  minTempC: number;
  windSpeedKmh: number;
  travelRecommendation: string;
  travelRecommendationAr: string;
}

export const DESTINATION_COORDINATES: Record<string, { lat: number; lon: number; arName: string }> = {
  Cairo: { lat: 30.0444, lon: 31.2357, arName: 'القاهرة' },
  Giza: { lat: 29.9792, lon: 31.1342, arName: 'الجيزة' },
  Luxor: { lat: 25.6872, lon: 32.6396, arName: 'الأقصر' },
  Aswan: { lat: 24.0889, lon: 32.8998, arName: 'أسوان' },
  Hurghada: { lat: 27.2579, lon: 33.8116, arName: 'الغردقة' },
  'Sharm El Sheikh': { lat: 27.9158, lon: 34.3299, arName: 'شرم الشيخ' },
  Alexandria: { lat: 31.2001, lon: 29.9187, arName: 'الإسكندرية' },
};

// Realistic fallback climate data for Egypt
const FALLBACK_WEATHER: Record<string, DestinationWeather> = {
  Cairo: {
    city: 'Cairo',
    arabicName: 'القاهرة',
    temperatureC: 27,
    condition: 'Sunny & Pleasant',
    conditionAr: 'مشمس ومعتدل',
    icon: '☀️',
    maxTempC: 30,
    minTempC: 19,
    windSpeedKmh: 14,
    travelRecommendation: 'Ideal for Citadel & Museum walking tours.',
    travelRecommendationAr: 'طقس مثالي لزيارة القلعة والمتحف المصري الكبير.',
  },
  Giza: {
    city: 'Giza',
    arabicName: 'الجيزة',
    temperatureC: 28,
    condition: 'Clear Sky & Sun',
    conditionAr: 'سماء صافية وشمس دافئة',
    icon: '☀️',
    maxTempC: 31,
    minTempC: 19,
    windSpeedKmh: 12,
    travelRecommendation: 'Comfortable plateau breeze. Hats & sunglasses recommended.',
    travelRecommendationAr: 'نسيم هضبة الأهرام معتدل. يوصى بالنظارات الشمسية.',
  },
  Luxor: {
    city: 'Luxor',
    arabicName: 'الأقصر',
    temperatureC: 32,
    condition: 'Warm Golden Sunshine',
    conditionAr: 'شمس ذهبية دافئة',
    icon: '☀️',
    maxTempC: 35,
    minTempC: 21,
    windSpeedKmh: 10,
    travelRecommendation: 'Perfect for morning Valley of the Kings & evening Karnak show.',
    travelRecommendationAr: 'مثالي لوادي الملوك صباحاً وعرض الصوت والضوء مساءً.',
  },
  Aswan: {
    city: 'Aswan',
    arabicName: 'أسوان',
    temperatureC: 33,
    condition: 'Warm & Dry Nubian Breeze',
    conditionAr: 'نسيم نوبي دافئ وجاف',
    icon: '☀️',
    maxTempC: 36,
    minTempC: 22,
    windSpeedKmh: 15,
    travelRecommendation: 'Splendid Nile felucca sailing conditions.',
    travelRecommendationAr: 'أجواء استثنائية للإبحار بالفلوكة النيلية وزيارة فيلة.',
  },
  Hurghada: {
    city: 'Hurghada',
    arabicName: 'الغردقة',
    temperatureC: 29,
    condition: 'Tropical Coastal Sun',
    conditionAr: 'أجواء ساحلية مشمسة',
    icon: '🏖️',
    maxTempC: 31,
    minTempC: 22,
    windSpeedKmh: 18,
    travelRecommendation: 'Prime Red Sea reef snorkeling & boat excursions.',
    travelRecommendationAr: 'ممتاز للغطس واستكشاف الشعاب المرجانية ورحلات اليخوت.',
  },
  'Sharm El Sheikh': {
    city: 'Sharm El Sheikh',
    arabicName: 'شرم الشيخ',
    temperatureC: 30,
    condition: 'Crystal Blue Skies',
    conditionAr: 'سماء زرقاء صافية وبحر هادئ',
    icon: '🌴',
    maxTempC: 32,
    minTempC: 23,
    windSpeedKmh: 16,
    travelRecommendation: 'Superb Ras Mohammed diving visibility.',
    travelRecommendationAr: 'رؤية ممتازة للغوص في محمية رأس محمد ومضيق تيران.',
  },
  Alexandria: {
    city: 'Alexandria',
    arabicName: 'الإسكندرية',
    temperatureC: 25,
    condition: 'Breezy Mediterranean',
    conditionAr: 'نسيم البحر المتوسط المنعش',
    icon: '🌊',
    maxTempC: 27,
    minTempC: 19,
    windSpeedKmh: 20,
    travelRecommendation: 'Delightful seaside promenades along the Corniche & Citadel.',
    travelRecommendationAr: 'أجواء رائعة للتنزه على الكورنيش وقلعة قايتباي.',
  },
};

function parseWmoCode(code: number): { condition: string; conditionAr: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky & Sun', conditionAr: 'مشمس وصافي', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly Sunny', conditionAr: 'مشمس جزئياً', icon: '🌤️' };
  if (code <= 48) return { condition: 'Morning Mist / Light Haze', conditionAr: 'ضباب خفيف صباحاً', icon: '🌫️' };
  if (code <= 65) return { condition: 'Light Coastal Shower', conditionAr: 'زخات مطر خفيفة', icon: '🌦️' };
  return { condition: 'Clear & Mild', conditionAr: 'معتدل ولطيف', icon: '☀️' };
}

/**
 * Fetch live weather from Open-Meteo free public API (from public-apis repository)
 */
export async function fetchDestinationWeather(cityName: string): Promise<DestinationWeather> {
  const coords = DESTINATION_COORDINATES[cityName] || DESTINATION_COORDINATES['Cairo'];
  const fallback = FALLBACK_WEATHER[cityName] || FALLBACK_WEATHER['Cairo'];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Africa%2FCairo`;
    
    // 3-second timeout for snappy UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Weather API status ${res.status}`);

    const data = await res.json();
    if (data && data.current_weather) {
      const cur = data.current_weather;
      const daily = data.daily || {};
      const { condition, conditionAr, icon } = parseWmoCode(cur.weathercode || 0);

      const maxTemp = Array.isArray(daily.temperature_2m_max) ? Math.round(daily.temperature_2m_max[0]) : Math.round(cur.temperature + 3);
      const minTemp = Array.isArray(daily.temperature_2m_min) ? Math.round(daily.temperature_2m_min[0]) : Math.round(cur.temperature - 5);

      return {
        city: cityName,
        arabicName: coords.arName,
        temperatureC: Math.round(cur.temperature),
        condition,
        conditionAr,
        icon,
        maxTempC: maxTemp,
        minTempC: minTemp,
        windSpeedKmh: Math.round(cur.windspeed),
        travelRecommendation: fallback.travelRecommendation,
        travelRecommendationAr: fallback.travelRecommendationAr,
      };
    }
  } catch {
    // Graceful offline fallback
  }

  return fallback;
}

/**
 * Fetch weather for multiple cities concurrently
 */
export async function fetchMultipleDestinationsWeather(cities: string[]): Promise<Record<string, DestinationWeather>> {
  const uniqueCities = Array.from(new Set(cities));
  const results = await Promise.all(uniqueCities.map(c => fetchDestinationWeather(c)));
  
  const map: Record<string, DestinationWeather> = {};
  results.forEach(w => {
    map[w.city] = w;
  });
  return map;
}
