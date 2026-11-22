import { Pool, neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Neon PostgreSQL Client & Storage Layer
 * Project: RIHAL | Branch: production
 * Connects to Neon Serverless Postgres with automatic schema initialization
 * and fallback in-memory datastore for dev/test when DATABASE_URL is not set.
 */

export interface CompanyRecord {
  id: string;
  name: string;
  arabic_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'Traveler' | 'Owner' | 'Admin' | 'Operations' | 'Sales Agent' | 'Viewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  password_hash?: string;
  password_salt?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMemberRecord {
  id: string;
  company_id: string;
  user_id: string;
  role: 'Owner' | 'Admin' | 'Operations' | 'Sales Agent' | 'Viewer';
  created_at: string;
}

export interface TripRecord {
  id: string;
  company_id: string;
  file_number: string;
  traveler_name: string;
  traveler_email?: string;
  traveler_phone?: string;
  trip_code: string;
  status: string;
  start_date?: string;
  duration_days: number;
  itinerary_json: any;
  vouchers_json: any;
  created_at: string;
  updated_at: string;
}

export interface RateRecord {
  id: string;
  company_id: string;
  supplier_id?: string;
  name: string;
  city: string;
  supplier_type: string;
  currency: string;
  cost_price: number;
  selling_price: number;
  valid_from?: string;
  valid_to?: string;
  metadata_json?: any;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteRecord {
  id: string;
  company_id: string;
  quote_number: string;
  traveler_name: string;
  traveler_email?: string;
  traveler_phone?: string;
  status: string;
  currency: string;
  total_price: number;
  margin_percent: number;
  version: number;
  days_json: any;
  created_at: string;
  updated_at: string;
}

export interface InquiryRecord {
  id: string;
  company_id: string;
  traveler_name: string;
  traveler_email?: string;
  traveler_phone?: string;
  raw_text?: string;
  status: string;
  requirements_json: any;
  created_at: string;
  updated_at: string;
}

// In-Memory resilient datastore for local preview / fallback when DATABASE_URL is not set
class InMemoryStore {
  companies = new Map<string, CompanyRecord>();
  users = new Map<string, UserRecord>();
  companyMembers = new Map<string, CompanyMemberRecord>();
  trips = new Map<string, TripRecord>();
  rates = new Map<string, RateRecord>();
  quotes = new Map<string, QuoteRecord>();
  inquiries = new Map<string, InquiryRecord>();
  auditLogs = new Map<string, any>();
  onboardingDrafts = new Map<string, any>();
  followUps = new Map<string, any>();
  teamInvites = new Map<string, any>();

  constructor() {
    this.seedApprovedCompanies();
  }

  seedApprovedCompanies() {
    // Seed verified, approved local companies for discovery
    const c1: CompanyRecord = {
      id: 'comp_bluenile_01',
      name: 'Blue Nile Expeditions SAE',
      arabic_name: 'النيل الأزرق للسياحة والرحلات ش.م.م',
      slug: 'blue-nile-expeditions',
      contact_email: 'info@bluenile-tours.eg',
      contact_phone: '+20 2 2736 1234',
      description: 'شركة سياحية مرخصة متخصصة في رحلات نايل كروز والأقصر وأسوان والجيزة مع مرشدين معتمدين.',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const c2: CompanyRecord = {
      id: 'comp_cairo_dmc_02',
      name: 'Cairo Heritage DMC',
      arabic_name: 'دي إم سي القاهرة للتراث المصري',
      slug: 'cairo-heritage-dmc',
      contact_email: 'operations@cairoheritage.com',
      contact_phone: '+20 10 9876 5432',
      description: 'خدمات سياحية متكاملة في القاهرة الكبرى والإسكندرية وسياحة الحج والعمرة والرحلات الثقافية.',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.companies.set(c1.id, c1);
    this.companies.set(c2.id, c2);

    // Seed a valid trip with code for verification test
    const testTrip: TripRecord = {
      id: 'trip_demo_1001',
      company_id: c1.id,
      file_number: 'EGY-2026-784',
      traveler_name: 'Ahmed & Family',
      traveler_email: 'traveler@example.com',
      traveler_phone: '+20 100 123 4567',
      trip_code: 'DALEEL-784',
      status: 'Confirmed',
      start_date: '2026-11-15',
      duration_days: 7,
      itinerary_json: [
        {
          dayNumber: 1,
          title: 'الوصول إلى القاهرة والاستقبال',
          date: '2026-11-15',
          activities: ['الاستقبال في مطار القاهرة الدولي بسيارة سياحية خاصة', 'تسجيل الدخول في فندق فورسيزونز نايل بلازا'],
          hotel: 'Four Seasons Hotel Cairo at Nile Plaza',
          transfer: 'مرسيدس فيتو خاصة من المطار إلى الفندق',
          guide: 'ممثل المطار المعتمد'
        },
        {
          dayNumber: 2,
          title: 'أهرامات الجيزة والمتحف المصري الكبير',
          date: '2026-11-16',
          activities: ['زيارة أهرامات الجيزة وأبو الهول', 'غداء بإطلالة بانورامية', 'جولة المتحف المصري الكبير (GEM)'],
          hotel: 'Four Seasons Hotel Cairo at Nile Plaza',
          transfer: 'سيارة ليموزين سياحية طوال اليوم',
          guide: 'أ/ محمود سامي - مرشد أثري مرخص لغات'
        }
      ],
      vouchers_json: [
        { voucherNumber: 'V-1001', serviceName: 'Four Seasons Cairo - 3 Nights River View', status: 'Issued' },
        { voucherNumber: 'V-1002', serviceName: 'Private Airport Meet & Assist', status: 'Issued' }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.trips.set(testTrip.id, testTrip);

    const royalTrip: TripRecord = {
      id: 'trip-royal-nile-104',
      company_id: c1.id,
      file_number: 'TRIP-2026-0104',
      traveler_name: 'Al-Futtaim Royal Delegation (وفد الفطيم الملكي)',
      traveler_email: 'protocol@alfuttaim-royal.ae',
      traveler_phone: '+971 50 441 9000',
      trip_code: 'EG-CAI-7491',
      status: 'Operating',
      start_date: '2026-11-20',
      duration_days: 7,
      itinerary_json: [
        { dayNumber: 1, title: 'VIP Arrival at Cairo & Four Seasons Nile Plaza', date: '2026-11-20', activities: ['VIP Lounge Meet & Assist (EK 927)', 'Check-in Four Seasons Hotel Cairo at Nile Plaza'], hotel: 'Four Seasons Hotel Cairo at Nile Plaza', transfer: 'Mercedes-Benz V-Class VIP (2026)', guide: 'Kareem El-Shenawy' },
        { dayNumber: 2, title: 'Giza Plateau, Great Sphinx & GEM Royal Wing', date: '2026-11-21', activities: ['Private Giza Plateau & Sphinx', 'Grand Egyptian Museum VIP Access'], hotel: 'Four Seasons Hotel Cairo at Nile Plaza', transfer: 'Mercedes-Benz V-Class VIP (2026)', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' },
        { dayNumber: 3, title: 'Flight to Luxor, Sofitel Winter Palace & Karnak Temple', date: '2026-11-22', activities: ['EgyptAir MS 062 to Luxor', 'Karnak & Illuminated Luxor Temple'], hotel: 'Sofitel Winter Palace Luxor', transfer: 'Toyota Coaster VIP Saloon', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' },
        { dayNumber: 4, title: 'Luxor West Bank & Sanctuary Sun Boat IV Embarkation', date: '2026-11-23', activities: ['Valley of the Kings & Hatshepsut Temple', 'Board Sanctuary Sun Boat IV'], hotel: 'Sanctuary Sun Boat IV', transfer: 'Toyota Coaster VIP Saloon', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' },
        { dayNumber: 5, title: 'Nile Sailing to Edfu & Kom Ombo', date: '2026-11-24', activities: ['Edfu Temple of Horus', 'Kom Ombo Double Temple'], hotel: 'Sanctuary Sun Boat IV', transfer: 'Nile Sailing', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' },
        { dayNumber: 6, title: 'Aswan: Abu Simbel, Philae Island & Sunset Felucca', date: '2026-11-25', activities: ['Abu Simbel Charter', 'Philae Temple & Sunset Felucca'], hotel: 'Sanctuary Sun Boat IV', transfer: 'Mercedes-Benz V-Class VIP', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' },
        { dayNumber: 7, title: 'Disembarkation in Aswan & Departure via Cairo', date: '2026-11-26', activities: ['Sanctuary Sun Boat IV Disembarkation', 'MS 085 Flight to Cairo & EK 924 Lounge'], hotel: 'Departure', transfer: 'Mercedes-Benz V-Class VIP', guide: 'Sherif Al-Muniri (أ. شريف المنيري)' }
      ],
      vouchers_json: [
        { voucherNumber: 'FS-CAI-88412', serviceName: 'Four Seasons Hotel Cairo at Nile Plaza', status: 'Confirmed' },
        { voucherNumber: 'CAI-VIP-302', serviceName: 'Cairo Airport VIP Lounge & Transfer', status: 'Confirmed' },
        { voucherNumber: 'GEM-VIP-114', serviceName: 'Giza Plateau & Grand Egyptian Museum Royal Wing', status: 'Reconfirmed' },
        { voucherNumber: 'SWP-LXR-55109', serviceName: 'Sofitel Winter Palace Luxor', status: 'Confirmed' },
        { voucherNumber: 'LXR-KRK-409', serviceName: 'Luxor East Bank: Karnak & Luxor Temple', status: 'Confirmed' },
        { voucherNumber: 'SSB-NILE-4402', serviceName: 'Sanctuary Sun Boat IV Embarkation & West Bank', status: 'Confirmed' },
        { voucherNumber: 'SSB-SAIL-5503', serviceName: 'Sanctuary Sun Boat IV Edfu & Kom Ombo', status: 'Confirmed' },
        { voucherNumber: 'ASW-VIP-6604', serviceName: 'Abu Simbel, Philae & Sunset Felucca', status: 'Confirmed' },
        { voucherNumber: 'CAI-DEP-7705', serviceName: 'Aswan Disembarkation & Cairo Departure', status: 'Confirmed' }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.trips.set(royalTrip.id, royalTrip);

    // Seed verified demo operator user with securely hashed password ('Demo123456')
    const demoSalt = 'rihal_demo_salt_2026';
    const demoHash = crypto.pbkdf2Sync('Demo123456', demoSalt, 100000, 64, 'sha512').toString('hex');
    const demoUser: UserRecord = {
      id: 'usr_demo_bluenile_owner',
      email: 'owner@bluenile-tours.eg',
      name: 'م/ حسام الدين فؤاد (Blue Nile Tours)',
      role: 'Owner',
      status: 'active',
      password_hash: demoHash,
      password_salt: demoSalt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);
    this.companyMembers.set(`${c1.id}_${demoUser.id}`, {
      id: 'mem_demo_owner_01',
      company_id: c1.id,
      user_id: demoUser.id,
      role: 'Owner',
      created_at: new Date().toISOString(),
    });
  }
}

export const inMemoryDb = new InMemoryStore();

const databaseUrl = process.env.DATABASE_URL;
export const isNeonConfigured = Boolean(databaseUrl && databaseUrl.startsWith('postgres'));

let poolInstance: Pool | null = null;
export function getNeonPool(): Pool | null {
  if (!isNeonConfigured) return null;
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: databaseUrl });
  }
  return poolInstance;
}

/**
 * Initializes schema on the Neon Postgres database if configured.
 */
export async function initializeNeonDatabase(): Promise<boolean> {
  if (!isNeonConfigured) {
    console.log('[Neon DB] DATABASE_URL not set; using resilient in-memory datastore.');
    return true;
  }

  try {
    const pool = getNeonPool();
    if (!pool) return false;
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sqlContent);
      console.log('[Neon DB] Schema successfully verified & initialized on Neon PostgreSQL.');
    }

    // Ensure neon_auth.project_config trusted_origins has current URLs
    try {
      const appUrl = process.env.APP_URL;
      const origins = JSON.stringify([
        "http://localhost:3000",
        "http://localhost:5173",
        appUrl || "https://ais-dev-xjpzqtxceer2m65343mots-72629179903.europe-west2.run.app",
        "https://ais-pre-xjpzqtxceer2m65343mots-72629179903.europe-west2.run.app"
      ]);
      await pool.query(
        "UPDATE neon_auth.project_config SET trusted_origins = $1::jsonb, updated_at = NOW();",
        [origins]
      );
      console.log('[Neon Auth] trusted_origins successfully synchronized.');
    } catch (err) {
      console.warn('[Neon Auth] Note on trusted_origins sync:', err);
    }

    // Seed approved companies into Neon DB if empty
    try {
      const countRes = await pool.query("SELECT COUNT(*) FROM companies;");
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        for (const c of inMemoryDb.companies.values()) {
          await pool.query(
            `INSERT INTO companies (id, name, arabic_name, slug, contact_email, contact_phone, description, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING;`,
            [c.id, c.name, c.arabic_name, c.slug, c.contact_email, c.contact_phone, c.description, c.status, c.created_at, c.updated_at]
          );
        }
        for (const t of inMemoryDb.trips.values()) {
          await pool.query(
            `INSERT INTO trips (id, company_id, file_number, traveler_name, traveler_email, traveler_phone, trip_code, status, start_date, duration_days, itinerary_json, vouchers_json, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`,
            [t.id, t.company_id, t.file_number, t.traveler_name, t.traveler_email, t.traveler_phone, t.trip_code, t.status, t.start_date, t.duration_days, JSON.stringify(t.itinerary_json), JSON.stringify(t.vouchers_json)]
          );
        }
        console.log('[Neon DB] Seeded approved companies and trips successfully.');
      }

      // Ensure verified demo operator company & user exist in Neon database
      await pool.query(
        `INSERT INTO companies (id, name, arabic_name, slug, contact_email, contact_phone, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        ['comp_bluenile_01', 'Blue Nile Expeditions SAE', 'النيل الأزرق للسياحة والرحلات ش.م.م', 'blue-nile-expeditions', 'info@bluenile-tours.eg', '+20 2 2736 1234', 'شركة سياحية مرخصة متخصصة في رحلات نايل كروز والأقصر وأسوان والجيزة مع مرشدين معتمدين.', 'approved']
      );

      const demoSalt = 'rihal_demo_salt_2026';
      const demoHash = crypto.pbkdf2Sync('Demo123456', demoSalt, 100000, 64, 'sha512').toString('hex');
      await pool.query(
        `INSERT INTO users (id, email, name, role, status, password_hash, password_salt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET password_hash = $6, password_salt = $7;`,
        ['usr_demo_bluenile_owner', 'owner@bluenile-tours.eg', 'م/ حسام الدين فؤاد (Blue Nile Tours)', 'Owner', 'active', demoHash, demoSalt]
      );
      await pool.query(
        `INSERT INTO company_members (id, company_id, user_id, role, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (company_id, user_id) DO NOTHING;`,
        ['mem_demo_owner_01', 'comp_bluenile_01', 'usr_demo_bluenile_owner', 'Owner']
      );
    } catch (err) {
      console.warn('[Neon DB] Seeding warning:', err);
    }

    return true;
  } catch (err) {
    console.error('[Neon DB] Schema initialization error:', err);
  }
  return false;
}

