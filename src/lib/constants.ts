import { Currency, ProposalLanguage, Season, SupplierType, UILanguage } from '../types';

export const EGYPT_CITIES = [
  'Cairo',
  'Giza',
  'Luxor',
  'Aswan',
  'Hurghada',
  'Sharm El Sheikh',
  'Alexandria',
  'Dahab',
  'Marsa Alam',
  'Siwa Oasis',
  'Makkah',
  'Madinah',
  'Jeddah',
] as const;

export const SUPPLIER_TYPES: { type: SupplierType; labelEn: string; labelAr: string; icon: string }[] = [
  { type: 'Hotel', labelEn: 'Hotels & Resorts', labelAr: 'فنادق ومنتجعات', icon: 'Hotel' },
  { type: 'Nile Cruise', labelEn: 'Nile Cruise', labelAr: 'كروز النيل', icon: 'Ship' },
  { type: 'Transport', labelEn: 'Private Transport', labelAr: 'نقل خاص وليموزين', icon: 'Car' },
  { type: 'Guide', labelEn: 'Licensed Egyptologists', labelAr: 'مرشدين سياحيين مرخصين', icon: 'Compass' },
  { type: 'Attraction', labelEn: 'Monuments & Tickets', labelAr: 'معالم ومزارات وتذاكر', icon: 'Landmark' },
  { type: 'Restaurant', labelEn: 'Restaurants & Dining', labelAr: 'مطاعم وتجارب طعام', icon: 'Utensils' },
  { type: 'Domestic Flight', labelEn: 'Domestic Flights', labelAr: 'طيران داخلي', icon: 'Plane' },
  { type: 'Visa/Services', labelEn: 'Airport VIP & Meet', labelAr: 'استقبال وتسهيلات مطار', icon: 'ShieldCheck' },
  { type: 'Other', labelEn: 'Special Tours & Desert', labelAr: 'أنشطة خاصة ورحلات سفاري', icon: 'Sparkles' },
];

export const PROPOSAL_LANGUAGES: { code: ProposalLanguage; name: string; nativeName: string; flag: string; isRtl?: boolean }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬', isRtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
];

export const UI_LANGUAGES: { code: UILanguage; name: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية (RTL)', dir: 'rtl' },
];

export const INITIAL_SEASONS: Season[] = [
  {
    id: 'season-high-winter',
    workspaceId: 'ws-egypt-live',
    name: 'Winter High Season (Oct - Apr)',
    startDate: '2026-10-01',
    endDate: '2027-04-30',
    color: '#006ce4',
  },
  {
    id: 'season-peak-holiday',
    workspaceId: 'ws-egypt-live',
    name: 'Peak Holiday Season (Dec - Jan)',
    startDate: '2026-12-20',
    endDate: '2027-01-06',
    color: '#d97706',
  },
  {
    id: 'season-summer-value',
    workspaceId: 'ws-egypt-live',
    name: 'Summer Season (May - Sep)',
    startDate: '2026-05-01',
    endDate: '2026-09-30',
    color: '#008009',
  },
];

// Reference exchange rates (EGP base with safety buffers)
export const DEFAULT_EXCHANGE_RATES: Record<Currency, { toEgp: number; bufferPct: number }> = {
  EGP: { toEgp: 1.0, bufferPct: 0 },
  USD: { toEgp: 49.50, bufferPct: 3.0 },
  EUR: { toEgp: 54.20, bufferPct: 3.0 },
  GBP: { toEgp: 63.80, bufferPct: 3.5 },
  RUB: { toEgp: 0.52, bufferPct: 4.0 },
  SAR: { toEgp: 13.20, bufferPct: 2.0 },
};

export const COLOR_TOKENS = {
  sidebarBg: '#FFFFFF',
  sidebarBorder: '#EDE0CC',
  sidebarText: '#44200F',
  sidebarMuted: '#795037',
  appBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  cardBorder: '#EDE0CC',
  trustBlue: '#795037',
  trustBlueHover: '#5C3823',
  primaryNavy: '#44200F',
  secondaryNavy: '#321609',
  accentYellow: '#C4A177',
  accentYellowHover: '#B38F64',
  textDark: '#44200F',
  textMuted: '#795037',
};

