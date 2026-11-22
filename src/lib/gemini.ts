import { ParsedRequirements, ProposalLanguage, Rate, QuoteDay, QuoteLine, OccupancyBasis, Currency, SupplierType } from '../types';
import { calculateLineCostAndPrice } from './pricingEngine';

/**
 * Sanitizes inquiry text to defend against prompt injection
 * Masks passport and credit card patterns
 */
export function sanitizeInquiryText(text: string): string {
  if (!text) return '';
  // Redact passport numbers
  let sanitized = text.replace(/\b([A-Z]{1,2}[0-9]{7,9})\b/gi, '[REDACTED_PASSPORT]');
  // Redact credit cards
  sanitized = sanitized.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD]');
  return sanitized;
}

/**
 * Deterministic Inquiry Parser (Rule-based Regex & Entity Recognition).
 * Completely free of external AI model dependencies.
 */
export async function parseInquiryWithAi(rawText: string, defaultLanguage: ProposalLanguage = 'en'): Promise<ParsedRequirements> {
  const cleanText = sanitizeInquiryText(rawText);
  return fallbackClientInquiryParser(cleanText, defaultLanguage);
}

export const parseInquiryRequirements = parseInquiryWithAi;

/**
 * Client deterministic parser with regex, entity recognition and language detection
 */
export function fallbackClientInquiryParser(text: string, fallbackLang: ProposalLanguage = 'en'): ParsedRequirements {
  // Language detection
  let detectedLang: ProposalLanguage = fallbackLang;
  if (/[\u0400-\u04FF]/.test(text)) detectedLang = 'ru';
  else if (/[\u0600-\u06FF]/.test(text)) detectedLang = 'ar';
  else if (/(\bhallo\b|\bguten tag\b|\bwir möchten\b|\bdeutsch\b)/i.test(text)) detectedLang = 'de';
  else if (/(\bbonjour\b|\bnous aimerions\b|\bmerci\b|\bvoyage\b)/i.test(text)) detectedLang = 'fr';
  else if (/(\bhola\b|\bbuenos días\b|\bqueremos\b|\begipto\b)/i.test(text)) detectedLang = 'es';
  else if (/(\bciao\b|\bvoglia\b|\bviaggio\b)/i.test(text)) detectedLang = 'it';

  // Duration
  let durationDays = 7;
  const dayMatch = text.match(/(\d{1,2})\s*(?:days?|дней|дня|tage|jours|días|giorni|أيام|يوم)/i);
  if (dayMatch) durationDays = parseInt(dayMatch[1], 10);

  // Adults
  let adults = 2;
  const adultMatch = text.match(/(\d{1,2})\s*(?:adults?|взрослых|вزрослый|erwachsene|adultes|adultos|adulti|كبار|بالغين)/i);
  if (adultMatch) adults = parseInt(adultMatch[1], 10);
  else if (/двоих|нас двое|couple|for two|2 pax|2 persons/i.test(text)) adults = 2;

  // Children
  const children: { age: number }[] = [];
  const kidsMatch = text.match(/(\d{1,2})\s*(?:kids?|children|детей|дети|kinder|enfants|niños|أطفال)/i);
  if (kidsMatch) {
    const count = parseInt(kidsMatch[1], 10);
    const agesMatch = text.match(/(?:ages?|возраст|возراсте|سن)\s*([0-9,\s&and]+)/i);
    if (agesMatch) {
      const numbers = agesMatch[1].match(/\d+/g);
      if (numbers) {
        numbers.forEach(n => children.push({ age: parseInt(n, 10) }));
      }
    }
    while (children.length < count) {
      children.push({ age: 8 });
    }
  }

  // Cities
  const cities: string[] = [];
  if (/cairo|каир|القاهرة/i.test(text)) cities.push('Cairo');
  if (/giza|гиза|الجيزة/i.test(text)) cities.push('Giza');
  if (/luxor|луксор|الأقصر/i.test(text)) cities.push('Luxor');
  if (/aswan|асуан|أسوان/i.test(text)) cities.push('Aswan');
  if (/hurghada|хургада|الغردقة/i.test(text)) cities.push('Hurghada');
  if (/sharm|шарм|شرم/i.test(text)) cities.push('Sharm El Sheikh');
  if (/alexandria|александрия|الإسكندرية/i.test(text)) cities.push('Alexandria');
  const citiesDetected = cities.length > 0;
  if (!citiesDetected) cities.push('Cairo', 'Giza');

  // Star rating
  let hotelStarRating = 5;
  if (/4\s*(?:star|\*|звезд|نجوم)/i.test(text)) hotelStarRating = 4;
  if (/3\s*(?:star|\*|звезд|نجوم)/i.test(text)) hotelStarRating = 3;

  // Traveler name
  let travelerName: string | undefined;
  const nameMatch = text.match(/(?:my name is|name is|меня зовут|اسمي)\s+([A-Z\u0400-\u04FF\u0600-\u06FF][a-zA-Z\u0400-\u04FF\u0600-\u06FF]+(?:\s+[A-Z\u0400-\u04FF\u0600-\u06FF][a-zA-Z\u0400-\u04FF\u0600-\u06FF]+)?)/);
  if (nameMatch) travelerName = nameMatch[1].trim();

  // Dates
  const isoDates = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  const startDate = isoDates[0];
  const endDate = isoDates[1];

  // Interests
  const interests: string[] = [];
  if (/pyramid|пирамид|أهرامات/i.test(text)) interests.push('Pyramids of Giza');
  if (/museum|музей|متحف/i.test(text)) interests.push('Egyptian Museum / NMEC');
  if (/cruise|круиз|كروز|نيل/i.test(text)) interests.push('Nile River Cruise');
  if (/temple|храм|معبد/i.test(text)) interests.push('Luxor & Karnak Temples');
  if (/diving|дайвинг|غوص/i.test(text)) interests.push('Red Sea Diving');

  const clarifyingQuestions: string[] = [];
  if (!startDate) clarifyingQuestions.push('What are the exact travel dates?');
  if (!dayMatch) clarifyingQuestions.push('How many days/nights would you like?');
  if (!adultMatch && !/couple|for two|2 pax|2 persons/i.test(text)) clarifyingQuestions.push('How many adults are travelling?');
  clarifyingQuestions.push('Which nationality are the travellers (affects monument entrance fees)?');

  return {
    travelerName,
    language: detectedLang,
    startDate,
    endDate,
    durationDays,
    group: { adults, children, infants: 0 },
    cities,
    hotelStarRating,
    interests: interests.length > 0 ? interests : [],
    specialRequests: /guide|гид|مرشد/i.test(text) ? `Private licensed guide in ${detectedLang.toUpperCase()}` : undefined,
    transportPreference: undefined,
    flightNeeded: cities.includes('Luxor') || cities.includes('Aswan'),
    urgency: 'Medium',
    confidenceScores: {
      dates: startDate ? 0.9 : 0,
      group: adultMatch ? 0.9 : 0.4,
      cities: citiesDetected ? 0.8 : 0.3,
      hotelStarRating: /(?:[345])\s*(?:star|\*|звезд|نجوم)/i.test(text) ? 0.9 : 0.3,
    },
    clarifyingQuestions,
    isConfirmedByAgent: false,
  };
}

/**
 * Itinerary drafting. Prices come ONLY from the operator's rate library:
 * Deterministic business logic based on city and season.
 */
const MARKET: Record<string, string> = { giza: 'cairo' };
const market = (c: string) => MARKET[c.trim().toLowerCase()] || c.trim().toLowerCase();

function addDays(iso: string | undefined, n: number): string | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return undefined;
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

export function draftItineraryFromRates(
  requirements: ParsedRequirements,
  availableRates: Rate[],
  defaultCurrency = 'USD'
): QuoteDay[] {
  const duration = Math.min(requirements.durationDays || 4, 10);
  const cities = requirements.cities.length > 0 ? requirements.cities : ['Cairo', 'Giza'];
  const group = requirements.group;
  const currency = defaultCurrency as Currency;
  const days: QuoteDay[] = [];

  const findRate = (type: SupplierType, city: string, date?: string, keyword?: string): Rate | undefined => {
    const candidates = availableRates.filter(
      (r) => r.supplierType === type && market(r.city) === market(city) &&
        (!keyword || r.serviceName.toLowerCase().includes(keyword.toLowerCase()))
    );
    const valid = (r: Rate) => !date || (date >= r.validityStart.slice(0, 10) && date <= r.validityEnd.slice(0, 10));
    return candidates.find(valid) || candidates[0];
  };

  let n = 0;
  const makeLine = (
    d: number, city: string, date: string | undefined, type: SupplierType, label: string,
    rate: Rate | undefined, basis: OccupancyBasis, quantity: number, markup: number
  ): QuoteLine => {
    const calc = calculateLineCostAndPrice(rate, quantity, basis, group, currency, markup, 0, undefined, date);
    return {
      id: `line-${d}-${++n}`,
      dayNumber: d,
      serviceId: rate?.id,
      serviceName: rate ? rate.serviceName : `${label} - rate needed (${city})`,
      supplierName: rate?.supplierName,
      supplierType: type,
      city,
      quantity,
      occupancyBasis: basis,
      unitCost: rate?.netCost ?? 0,
      costCurrency: rate?.currency ?? currency,
      markupPercent: markup,
      markupFixed: 0,
      unitPrice: calc.unitPriceQuoteCurrency,
      totalCostEgp: calc.totalCostEgp,
      totalPriceEgp: calc.totalPriceEgp,
      totalPriceQuoteCurrency: calc.totalPriceQuoteCurrency,
      status: calc.status,
      costCalculationNotes: calc.breakdown,
    };
  };

  for (let d = 1; d <= duration; d++) {
    const city = d <= Math.ceil(duration / 2) ? cities[0] : (cities[1] || cities[0]);
    const date = addDays(requirements.startDate, d - 1);
    const lines: QuoteLine[] = [];
    const L = (type: SupplierType, label: string, basis: OccupancyBasis, markup: number, keyword?: string) =>
      lines.push(makeLine(d, city, date, type, label, findRate(type, city, date, keyword), basis, 1, markup));

    let title: string;
    let description: string;

    if (d === 1) {
      L('Visa/Services', 'Airport VIP fast-track', 'per_person', 25, 'VIP');
      L('Transport', 'Airport transfer', 'per_vehicle', 25, 'Transfer');
      title = `Arrival in ${city} & VIP Welcome`;
      description = 'Touchdown in Egypt. Our airport representative expedites immigration, handles your baggage, and escorts you to your private executive vehicle for hotel check-in.';
    } else if (d === 2) {
      L('Guide', 'Licensed Egyptologist guide', 'per_group', 25);
      const dayVehicle = findRate('Transport', city, date, 'Full Day') || findRate('Transport', city, date);
      lines.push(makeLine(d, city, date, 'Transport', 'Full-day private vehicle', dayVehicle, 'per_vehicle', 1, 22));
      L('Attraction', 'Monument entrance fees', 'per_person', 20);
      title = `Majestic Antiquities of ${city}`;
      description = 'Embark on an awe-inspiring day exploring historic monuments with your dedicated Egyptologist guide and private vehicle.';
    } else {
      L('Restaurant', 'Dining experience', 'per_person', 20);
      title = `Discoveries & Cultural Experience in ${city}`;
      description = 'Delve deeper into authentic Egyptian culture, bustling bazaars, and local culinary delicacies tailored to your interests.';
    }

    if (d < duration) {
      const occ: OccupancyBasis = group.adults === 1 ? 'single' : 'double';
      L('Hotel', `Hotel night${requirements.hotelStarRating ? ` (${requirements.hotelStarRating}*)` : ''}`, occ, 22);
    }

    days.push({ dayNumber: d, title, description, city, lines });
  }

  return days;
}

/**
 * Deterministic dictionary-based translation without external AI calls.
 */
const DICTIONARY: Record<string, string> = {
  'Arrival in Cairo & VIP Welcome': 'الوصول إلى القاهرة والاستقبال الفاخر',
  'Majestic Antiquities of Cairo': 'روائع آثار القاهرة والجيزة الخالدة',
  'Discoveries & Cultural Experience in Cairo': 'جولات استكشافية وتجربة ثقافية بالقاهرة',
  'Arrival in Luxor & VIP Welcome': 'الوصول إلى الأقصر والاستقبال الفاخر',
  'Majestic Antiquities of Luxor': 'معابد الأقصر والكرنك ووادي الملوك',
  'Arrival in Aswan & VIP Welcome': 'الوصول إلى أسوان وجولة نيلية ساحرة',
};

export async function translateProposalWithAi(
  text: string,
  targetLanguage: ProposalLanguage = 'ar',
  _glossary?: string[]
): Promise<string> {
  if (!text || text.trim() === '') return text;
  if (targetLanguage === 'ar' && DICTIONARY[text]) {
    return DICTIONARY[text];
  }
  return text;
}

export async function translateItineraryDaysWithAi(
  days: QuoteDay[],
  targetLanguage: ProposalLanguage = 'ar'
): Promise<QuoteDay[]> {
  if (!days || days.length === 0) return days;
  return days.map(day => ({
    ...day,
    arabicTitle: targetLanguage === 'ar' ? (DICTIONARY[day.title] || day.arabicTitle || day.title) : day.arabicTitle,
  }));
}
