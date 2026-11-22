import { AgencyDirectoryItem } from '../types';
import { normalizeEgyptianPhone } from './phone';

export const EGYPT_TOURISM_AGENCIES: AgencyDirectoryItem[] = [
  {
    id: 'comp_bluenile_01',
    name: 'Blue Nile Expeditions SAE',
    arabicName: 'النيل الأزرق للسياحة والرحلات ش.م.م',
    slug: 'blue-nile-expeditions',
    logoUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80',
    rating: 4.97,
    reviewCount: 184,
    tourismLicenseNumber: 'EG-MOT-ClassA-8491',
    licenseClass: 'Class A',
    commercialRegistry: 'CR-104820-Cairo',
    taxRegistrationNumber: 'TR-748-910-239',
    address: '14 Gezira Street, Zamalek, Cairo',
    addressAr: '١٤ شارع الجزيرة، الزمالك، القاهرة',
    governorates: ['Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Alexandria', 'Siwa Oasis'],
    supportedLanguages: ['English', 'Spanish', 'Italian', 'French', 'German', 'Russian', 'Arabic'],
    minGroupPax: 2,
    maxGroupPax: 50,
    guideRosterCount: 18,
    fleetCount: 12,
    foundedYear: 2012,
    description: 'Premier Egyptian Destination Management Company specializing in bespoke VIP cultural expeditions, Nile cruise charters, and high-touch private logistics.',
    descriptionAr: 'شركة إدارة مقاصد سياحية رائدة متخصصة في تنظيم الرحلات الثقافية الفاخرة، كروزات النيل الخاصة، والبعثات الأثرية بأعلى معايير الضيافة المصرية.',
    whatsappNumber: '+20 2 2736 1234',
    contactPhone: '+20 2 2736 1234',
    contactEmail: '',
    brandColors: {
      primary: '#44200F',
      accent: '#795037',
      gold: '#C4A177',
    },
    samplePackageName: '8-Day Pharaohs & Nile Cruise Deluxe',
    samplePackagePriceUsd: 1850,
    isVerified: true,
    isDemo: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=800&q=80',
    specialties: ['VIP Archaeology Missions', 'Private Nile Cruise Charters', 'Mercedes Travego Fleet'],
    specialtiesAr: ['رحلات أثرية خاصة', 'كروزات نيلية فاخرة', 'أسطول حافلات مرسيدس VIP'],
  },
  {
    id: 'agency-karnak-heritage',
    name: 'Karnak Heritage Travel & Expeditions',
    arabicName: 'الكرنك للتراث والرحلات السياحية',
    slug: 'karnak-heritage',
    logoUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=200&q=80',
    rating: 4.92,
    reviewCount: 156,
    tourismLicenseNumber: 'EG-MOT-ClassA-7102',
    licenseClass: 'Class A',
    commercialRegistry: 'CR-88410-Luxor',
    taxRegistrationNumber: 'TR-621-490-118',
    address: 'Corniche El Nile, Luxor & Downtown Cairo',
    addressAr: 'كورنيش النيل، الأقصر ووسط البلد، القاهرة',
    governorates: ['Luxor', 'Aswan', 'Cairo', 'Giza', 'Qena'],
    supportedLanguages: ['English', 'French', 'German', 'Spanish', 'Japanese'],
    minGroupPax: 4,
    maxGroupPax: 40,
    guideRosterCount: 14,
    fleetCount: 8,
    foundedYear: 2008,
    description: 'Luxor-based upper Egypt specialists with deeply rooted family heritage in Nile navigation and archaeological excursions.',
    descriptionAr: 'خبراء صعيد مصر والأقصر وأسوان، إرث عريق في الملاحة النيلية والرحلات الاستكشافية للمعابد والمقابر الفرعونية.',
    whatsappNumber: '+20 102 334 5566',
    contactPhone: '+20 95 238 4400',
    contactEmail: '',
    brandColors: {
      primary: '#44200F',
      accent: '#795037',
      gold: '#C4A177',
    },
    samplePackageName: '5-Day Upper Egypt Treasures',
    samplePackagePriceUsd: 980,
    isVerified: true,
    isDemo: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
    specialties: ['Dahabiya Charters', 'Valley of the Kings Private Access', 'Egyptologist Roster'],
    specialtiesAr: ['تأجير دهبيات نيلية خاصة', 'تصاريح وادي الملوك الخاصة', 'نخبة من أساتذة علم المصريات'],
  },
  {
    id: 'agency-memphis-tours',
    name: 'Memphis Tours Egypt',
    arabicName: 'ممفيس تورز مصر للسياحة',
    slug: 'memphis-tours',
    logoUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=200&q=80',
    rating: 4.89,
    reviewCount: 310,
    tourismLicenseNumber: 'EG-MOT-ClassA-1420',
    licenseClass: 'Class A',
    commercialRegistry: 'CR-54120-Giza',
    taxRegistrationNumber: 'TR-119-482-901',
    address: 'Pyramids Road, Giza, Greater Cairo',
    addressAr: 'شارع الهرم، الجيزة، القاهرة الكبرى',
    governorates: ['Cairo', 'Giza', 'Alexandria', 'Hurghada', 'Sharm El Sheikh', 'Luxor', 'Aswan'],
    supportedLanguages: ['English', 'Spanish', 'Portuguese', 'Italian', 'German', 'French'],
    minGroupPax: 2,
    maxGroupPax: 60,
    guideRosterCount: 28,
    fleetCount: 22,
    foundedYear: 1955,
    description: 'One of the oldest accredited Egyptian tourism companies, providing end-to-end DMC services across all Egyptian governorates.',
    descriptionAr: 'من أقدم وأعرق شركات السياحة المصرية المعتمدة، تقدم خدمات إدارة المقاصد الشاملة وحجوزات الطيران والنقل السياحي الفاخر.',
    whatsappNumber: '+20 100 123 4567',
    contactPhone: '+20 2 3386 0000',
    contactEmail: '',
    brandColors: {
      primary: '#44200F',
      accent: '#795037',
      gold: '#C4A177',
    },
    samplePackageName: '10-Day Complete Egypt Grand Explorer',
    samplePackagePriceUsd: 2200,
    isVerified: true,
    isDemo: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80',
    specialties: ['Large Incentive Groups', 'Red Sea Resorts & Diving', 'Fast-Track Logistics'],
    specialtiesAr: ['سياحة الحوافز والمؤتمرات', 'منتجعات البحر الأحمر والغوص', 'خدمات الاستقبال السريع VIP'],
  },
  {
    id: 'agency-red-sea-voyages',
    name: 'Red Sea Oasis Voyages & Safari',
    arabicName: 'واحة البحر الأحمر للرحلات والسفاري',
    slug: 'red-sea-oasis',
    logoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80',
    rating: 4.95,
    reviewCount: 94,
    tourismLicenseNumber: 'EG-MOT-ClassA-9281',
    licenseClass: 'Class A',
    commercialRegistry: 'CR-33910-Hurghada',
    taxRegistrationNumber: 'TR-890-123-554',
    address: 'El Mamsha, Hurghada, Red Sea Governorate',
    addressAr: 'الممشى السياحي، الغردقة، محافظة البحر الأحمر',
    governorates: ['Hurghada', 'Sharm El Sheikh', 'Marsa Alam', 'El Gouna', 'Luxor'],
    supportedLanguages: ['English', 'German', 'Russian', 'Polish', 'Czech'],
    minGroupPax: 2,
    maxGroupPax: 35,
    guideRosterCount: 10,
    fleetCount: 9,
    foundedYear: 2016,
    description: 'Specialists in Red Sea marine expeditions, private yacht charters, desert quad safari camps, and day trips to Luxor.',
    descriptionAr: 'متخصصون في الرحلات البحرية بالبحر الأحمر، يخوت خاصة، سفاري الصحراء الشرقية، ورحلات اليوم الواحد للأقصر.',
    whatsappNumber: '+20 109 876 5432',
    contactPhone: '+20 65 344 8800',
    contactEmail: '',
    brandColors: {
      primary: '#44200F',
      accent: '#795037',
      gold: '#C4A177',
    },
    samplePackageName: '7-Day Sea & Sand Adventure Deluxe',
    samplePackagePriceUsd: 1350,
    isVerified: true,
    isDemo: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    specialties: ['Private Yacht Charters', 'Stargazing Desert Camps', 'Certified Dive Instructors'],
    specialtiesAr: ['يخوت بحرية خاصة', 'مخيمات سفاري فلكية', 'مدربو غوص دوليون معتمدون'],
  }
];

export const REGISTERED_AGENCIES_KEY = 'rihal_directory_agencies';

const DEFAULT_AGENCY_LOGO =
  'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80';
const DEFAULT_AGENCY_COVER =
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80';

function normalizeDirectoryAgency(raw: Partial<AgencyDirectoryItem> & { id: string; name: string }): AgencyDirectoryItem {
  const enName = (raw.name || '').trim();
  const arName = (raw.arabicName || enName).trim();
  const slug =
    (raw.slug || enName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) ||
    raw.id;
  return {
    id: raw.id,
    name: enName,
    arabicName: arName,
    slug,
    logoUrl: raw.logoUrl || DEFAULT_AGENCY_LOGO,
    coverImageUrl: raw.coverImageUrl || DEFAULT_AGENCY_COVER,
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? raw.rating : 5.0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 1,
    tourismLicenseNumber: raw.tourismLicenseNumber || '',
    licenseClass: raw.licenseClass || 'Class A',
    commercialRegistry: raw.commercialRegistry || '',
    taxRegistrationNumber: raw.taxRegistrationNumber || '',
    address: raw.address || 'Cairo, Egypt',
    addressAr: raw.addressAr || raw.address || 'القاهرة، مصر',
    governorates: raw.governorates && raw.governorates.length > 0 ? raw.governorates : ['Cairo', 'Giza', 'Luxor', 'Aswan'],
    supportedLanguages: raw.supportedLanguages && raw.supportedLanguages.length > 0 ? raw.supportedLanguages : ['Arabic', 'English'],
    minGroupPax: raw.minGroupPax || 1,
    maxGroupPax: raw.maxGroupPax || 40,
    guideRosterCount: raw.guideRosterCount || 1,
    fleetCount: raw.fleetCount || 1,
    foundedYear: raw.foundedYear || new Date().getFullYear(),
    description: raw.description || `${enName} — accredited Egyptian incoming tour operator & DMC.`,
    descriptionAr: raw.descriptionAr || raw.description || `${arName} — شركة سياحة مصرية معتمدة لتنظيم البرامج والرحلات.`,
    whatsappNumber: (() => {
      const rawPhone = raw.whatsappNumber || raw.contactPhone || '';
      const norm = rawPhone ? normalizeEgyptianPhone(rawPhone) : null;
      return norm?.isValid ? norm.display : rawPhone;
    })(),
    contactPhone: (() => {
      const rawPhone = raw.contactPhone || raw.whatsappNumber || '';
      const norm = rawPhone ? normalizeEgyptianPhone(rawPhone) : null;
      return norm?.isValid ? norm.display : rawPhone;
    })(),
    contactEmail: '',
    brandColors: raw.brandColors || { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
    samplePackageName: raw.samplePackageName || '',
    samplePackagePriceUsd: raw.samplePackagePriceUsd ?? 0,
    isVerified: raw.isVerified ?? true,
    isDemo: false,
    specialties: raw.specialties && raw.specialties.length > 0 ? raw.specialties : ['Incoming Tours', 'Bespoke Egypt Trips'],
    specialtiesAr: raw.specialtiesAr && raw.specialtiesAr.length > 0 ? raw.specialtiesAr : ['برامج سياحة مستجلبة', 'رحلات مصر المخصصة'],
  };
}

export function getRegisteredDirectoryAgencies(): AgencyDirectoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_AGENCIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a: any) => a && a.id && a.name)
      .map((a: any) => normalizeDirectoryAgency(a));
  } catch {
    return [];
  }
}

export function registerAgencyInDirectory(
  agency: Partial<AgencyDirectoryItem> & { id: string; name: string }
): AgencyDirectoryItem {
  const normalized = normalizeDirectoryAgency(agency);
  if (typeof localStorage !== 'undefined') {
    try {
      const existing = getRegisteredDirectoryAgencies().filter(
        a => a.id !== normalized.id && a.name.toLowerCase() !== normalized.name.toLowerCase()
      );
      const next = [normalized, ...existing];
      localStorage.setItem(REGISTERED_AGENCIES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }
  return normalized;
}

export function getAllDirectoryAgencies(): AgencyDirectoryItem[] {
  const custom = getRegisteredDirectoryAgencies();
  const seededIds = new Set(EGYPT_TOURISM_AGENCIES.map(a => a.id));
  const uniqueCustom = custom.filter(a => !seededIds.has(a.id));
  return [...uniqueCustom, ...EGYPT_TOURISM_AGENCIES];
}

export function findDirectoryAgencyById(id: string): AgencyDirectoryItem | undefined {
  return getAllDirectoryAgencies().find(a => a.id === id);
}

export async function syncDirectoryAgenciesFromServer(): Promise<AgencyDirectoryItem[]> {
  try {
    const res = await fetch('/api/public/companies');
    if (res.ok) {
      const data = await res.json();
      const companies = Array.isArray(data?.companies) ? data.companies : [];
      const seededServerIds = new Set(['comp_bluenile_01', 'comp_cairo_dmc_02']);
      for (const c of companies) {
        if (!c?.id || !c?.name || seededServerIds.has(c.id)) continue;
        const alreadyStored = getRegisteredDirectoryAgencies().find(a => a.id === c.id);
        registerAgencyInDirectory({
          ...(alreadyStored || {}),
          id: c.id,
          name: c.name,
          arabicName: c.arabicName || c.arabic_name || alreadyStored?.arabicName || c.name,
          slug: c.slug || alreadyStored?.slug,
          contactEmail: '',
          contactPhone: c.whatsappNumber || alreadyStored?.contactPhone || '',
          whatsappNumber: c.whatsappNumber || alreadyStored?.whatsappNumber || '',
          governorates: Array.isArray(c.governorates) && c.governorates.length > 0 ? c.governorates : alreadyStored?.governorates,
          description: c.description || alreadyStored?.description,
          descriptionAr: c.descriptionAr || alreadyStored?.descriptionAr,
          logoUrl: c.logoUrl || alreadyStored?.logoUrl,
          coverImageUrl: c.coverImageUrl || alreadyStored?.coverImageUrl,
          tourismLicenseNumber: c.tourismLicenseNumber || alreadyStored?.tourismLicenseNumber,
          isVerified: c.isVerified ?? true,
          isDemo: false,
        });
      }
    }
  } catch {
    // non-blocking directory sync
  }
  return getAllDirectoryAgencies();
}

