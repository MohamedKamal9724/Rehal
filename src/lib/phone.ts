/**
 * Egyptian Phone & WhatsApp Normalization and Validation Helper
 * Plus Arabic Company Name Transliteration Suggester for Onboarding Step 1.
 */

export interface EgyptianPhoneValidationResult {
  valid: boolean;
  normalized: string; // e.g. "+20 100 000 0000"
  e164: string;       // e.g. "+201000000000"
  waDigits: string;   // e.g. "201000000000"
  type?: 'mobile' | 'landline';
  errorEn?: string;
  errorAr?: string;
}

/**
 * Strips spaces, dashes, parentheses, dots, and non-digit characters (preserving optional leading +).
 */
export function stripPhoneFormatting(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalizes an Egyptian mobile or landline phone number into canonical display format:
 *   - "01000000000"      -> "+20 100 000 0000"
 *   - "+20 100 000 0000" -> "+20 100 000 0000"
 *   - "0020-100-123-4567"-> "+20 100 123 4567"
 *   - "02-2736-1234"     -> "+20 2 2736 1234"
 * Returns empty string if input is empty, or the trimmed original if it cannot be normalized as Egyptian.
 */
export function normalizeEgyptianPhone(raw: string): string {
  const result = validateEgyptianPhone(raw);
  return result.valid ? result.normalized : (raw || '').trim();
}

/**
 * Validates and normalizes Egyptian mobile (010/011/012/015) and landline (02/03/0X) numbers.
 * Rejects short or malformed numbers such as "123".
 */
export function validateEgyptianPhone(raw: string): EgyptianPhoneValidationResult {
  const cleaned = stripPhoneFormatting(raw || '');
  if (!cleaned || cleaned === '+') {
    return {
      valid: false,
      normalized: '',
      e164: '',
      waDigits: '',
      errorEn: 'Phone / WhatsApp number is required.',
      errorAr: 'رقم الهاتف أو الواتساب مطلوب.',
    };
  }

  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Convert 0020 international exit prefix -> 20
  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  }

  // Convert local leading 0 -> 20 (e.g. 01000000000 -> 201000000000, 0227361234 -> 20227361234)
  if (digits.startsWith('0') && !digits.startsWith('00')) {
    digits = `20${digits.slice(1)}`;
  }

  // Handle "+20 010..." double-zero mistake -> "2010..."
  if (digits.startsWith('200') && digits.length >= 12) {
    digits = `20${digits.slice(3)}`;
  }

  // Bare 10-digit Egyptian mobile starting with 10/11/12/15 (missing leading 0 / +20)
  if (/^1[0125]\d{8}$/.test(digits)) {
    digits = `20${digits}`;
  }

  // Must start with Egypt country code 20
  if (!digits.startsWith('20')) {
    return {
      valid: false,
      normalized: raw.trim(),
      e164: '',
      waDigits: '',
      errorEn: 'Enter a valid Egyptian number (e.g. +20 100 000 0000 or 01000000000).',
      errorAr: 'أدخل رقماً مصرياً صحيحاً (مثال: 01000000000 أو +20 100 000 0000).',
    };
  }

  const national = digits.slice(2);

  // Egyptian Mobile: 10 digits starting with 10, 11, 12, or 15
  if (/^1[0125]\d{8}$/.test(national)) {
    const normalized = `+20 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
    return {
      valid: true,
      normalized,
      e164: `+20${national}`,
      waDigits: `20${national}`,
      type: 'mobile',
    };
  }

  // Cairo/Giza Landline: 9 digits starting with 2 (e.g. 2 2736 1234)
  if (/^2\d{8}$/.test(national)) {
    const normalized = `+20 2 ${national.slice(1, 5)} ${national.slice(5)}`;
    return {
      valid: true,
      normalized,
      e164: `+20${national}`,
      waDigits: `20${national}`,
      type: 'landline',
    };
  }

  // Other Egyptian Governorate Landlines: 8-9 digits starting with 3..9
  if (/^[3-9]\d{7,8}$/.test(national)) {
    const areaLen = national.startsWith('3') ? 1 : 2;
    const area = national.slice(0, areaLen);
    const rest = national.slice(areaLen);
    const mid = Math.ceil(rest.length / 2);
    const normalized = `+20 ${area} ${rest.slice(0, mid)} ${rest.slice(mid)}`;
    return {
      valid: true,
      normalized,
      e164: `+20${national}`,
      waDigits: `20${national}`,
      type: 'landline',
    };
  }

  return {
    valid: false,
    normalized: raw.trim(),
    e164: '',
    waDigits: '',
    errorEn: 'Invalid Egyptian phone format. Use +20 100 000 0000 or 01000000000.',
    errorAr: 'صيغة رقم الهاتف المصري غير صحيحة. استخدم 01000000000 أو +20 100 000 0000.',
  };
}

/**
 * Converts any Egyptian or international phone string into clean digits suitable for https://wa.me/<digits>.
 * Prioritizes Egyptian normalization (so local "010..." becomes "2010...").
 */
export function toWhatsAppDigits(raw?: string | null): string {
  if (!raw || !raw.trim()) return '';
  const eg = validateEgyptianPhone(raw);
  if (eg.valid) return eg.waDigits;

  // Fallback for valid non-Egyptian international numbers (e.g., +971 50..., +33 6..., +44 7...)
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

/**
 * Builds a canonical wa.me URL using the shared normalizer.
 */
export function buildWhatsAppUrl(phone?: string | null, message?: string): string {
  const digits = toWhatsAppDigits(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return digits ? `https://wa.me/${digits}${query}` : `https://wa.me/${query}`;
}

const COMMON_TRAVEL_TERMS_AR: Record<string, string> = {
  abbas: 'عباس',
  hassan: 'حسن',
  kamal: 'كمال',
  cairo: 'القاهرة',
  giza: 'الجيزة',
  luxor: 'الأقصر',
  aswan: 'أسوان',
  alexandria: 'الإسكندرية',
  hurghada: 'الغردقة',
  sharm: 'شرم الشيخ',
  egypt: 'مصر',
  nile: 'النيل',
  red: 'الأحمر',
  sea: 'البحر',
  sahara: 'الصحراء',
  pharaoh: 'فرعون',
  pharaohs: 'الفراعنة',
  karnak: 'الكرنك',
  memphis: 'ممفيس',
  oasis: 'الواحة',
  royal: 'الملكية',
  golden: 'الذهبية',
  grand: 'الكبرى',
  heritage: 'التراث',
  luxury: 'الفاخرة',
  tours: 'للسياحة',
  tour: 'للسياحة',
  travel: 'للسياحة والسفر',
  travels: 'للسياحة والسفر',
  expeditions: 'للرحلات الاستكشافية',
  expedition: 'للرحلات',
  voyages: 'للرحلات',
  holidays: 'للعطلات',
  vacations: 'للعطلات',
  agency: 'للسياحة',
  dmc: 'لإدارة المقاصد',
  sae: 'ش.م.م',
  llc: 'ذ.م.م',
  ltd: 'المحدودة',
  group: 'جروب',
  international: 'الدولية',
};

const CHAR_MAP: Record<string, string> = {
  a: 'ا',
  b: 'ب',
  c: 'ك',
  d: 'د',
  e: 'ي',
  f: 'ف',
  g: 'ج',
  h: 'ه',
  i: 'ي',
  j: 'ج',
  k: 'ك',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'و',
  p: 'ب',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'و',
  v: 'ف',
  w: 'و',
  x: 'كس',
  y: 'ي',
  z: 'ز',
};

function transliterateWord(word: string): string {
  const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!lower) return '';
  if (COMMON_TRAVEL_TERMS_AR[lower]) return COMMON_TRAVEL_TERMS_AR[lower];

  let out = '';
  let i = 0;
  while (i < lower.length) {
    const pair = lower.slice(i, i + 2);
    if (pair === 'sh') {
      out += 'ش';
      i += 2;
      continue;
    }
    if (pair === 'ch') {
      out += 'تش';
      i += 2;
      continue;
    }
    if (pair === 'th') {
      out += 'ث';
      i += 2;
      continue;
    }
    if (pair === 'kh') {
      out += 'خ';
      i += 2;
      continue;
    }
    if (pair === 'ph') {
      out += 'ف';
      i += 2;
      continue;
    }
    if (pair === 'gh') {
      out += 'غ';
      i += 2;
      continue;
    }
    const ch = lower[i];
    // Avoid doubling repeated consonants/vowels crudely
    if (i > 0 && ch === lower[i - 1]) {
      i += 1;
      continue;
    }
    out += CHAR_MAP[ch] ?? ch;
    i += 1;
  }
  return out;
}

/**
 * Generates a natural Arabic company name suggestion from an English trading name.
 * Example: "Abbas Tours" -> "عباس للسياحة"
 */
export function suggestArabicCompanyName(englishName: string): string {
  const trimmed = (englishName || '').trim();
  if (!trimmed) return '';
  // If already contains Arabic characters, return as-is
  if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;

  const words = trimmed
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !['and', 'of', 'the', 'for'].includes(w.toLowerCase()));

  if (words.length === 0) return '';

  const mapped = words.map(transliterateWord).filter(Boolean);
  return mapped.join(' ');
}
