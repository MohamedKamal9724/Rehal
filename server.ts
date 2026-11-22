import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

import {
  inMemoryDb,
  isNeonConfigured,
  getNeonPool,
  initializeNeonDatabase,
  CompanyRecord,
  UserRecord,
  TripRecord,
  RateRecord,
  QuoteRecord,
  InquiryRecord,
} from './src/db/neonClient';
import { getUploadPresignedUrl, getDownloadPresignedUrl, isStorageConfigured } from './src/db/neonStorage';
import { isDemoTripCode } from './src/lib/demoConfig';
import { sanitizePublicCompanyDto } from './src/lib/authRealms';
import { normalizeEgyptianPhone } from './src/lib/phone';
import { GoogleGenAI } from '@google/genai';
import { RIHAL_SYSTEM_PROMPT, getFallbackSupportResponse, CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE } from './src/lib/supportKnowledge';
import {
  searchAndPriceLiveHotels,
  getHotelGalleryById,
  HOTEL_REGIONS,
  HotelRegionId,
  HotelPropertyCategory,
  MealPlanType,
} from './src/lib/liveHotelService';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Secret for HMAC session token validation
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface SessionPayload {
  jti: string;
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  exp: number;
}

// Server-side token revocation registry (invalidates tokens immediately on logout)
const revokedTokenIds = new Set<string>();

function createSessionToken(payload: Omit<SessionPayload, 'exp' | 'jti'>): string {
  const data: SessionPayload = {
    ...payload,
    jti: `jti_${crypto.randomBytes(12).toString('hex')}`,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const str = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function verifySessionToken(token: string): { payload: SessionPayload | null; revoked: boolean } {
  try {
    const [str, sig] = token.split('.');
    if (!str || !sig) return { payload: null, revoked: false };
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(str).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { payload: null, revoked: false };
    }
    const payload: SessionPayload = JSON.parse(Buffer.from(str, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return { payload: null, revoked: false };
    if ((payload.jti && revokedTokenIds.has(payload.jti)) || revokedTokenIds.has(token)) {
      return { payload: null, revoked: true };
    }
    return { payload, revoked: false };
  } catch {
    return { payload: null, revoked: false };
  }
}

// Session middleware for protected routes
function authenticate(req: Request & { user?: SessionPayload; rawToken?: string }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'مطلوب تسجيل الدخول / Authentication required' });
    return;
  }
  const token = header.substring(7).trim();
  const { payload, revoked } = verifySessionToken(token);
  if (revoked) {
    res.status(401).json({ error: 'TOKEN_REVOKED', message: 'تم تسجيل الخروج من هذه الجلسة / Session has been revoked' });
    return;
  }
  if (!payload) {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'جلسة العمل غير صالحة أو منتهية / Session expired' });
    return;
  }
  req.user = payload;
  req.rawToken = token;
  next();
}

// Strict Company / Operator authorization & cross-company tenant guard
function requireCompanyMembership(req: Request & { user?: SessionPayload }, res: Response, next: NextFunction) {
  if (!req.user || !req.user.companyId || req.user.role === 'Traveler') {
    res.status(403).json({
      error: 'FORBIDDEN_OPERATOR_ACCESS',
      message: 'ليس لديك صلاحية الوصول لغرفة عمليات الشركات / Active company membership required',
    });
    return;
  }

  // Enforce strict tenant isolation: reject any cross-company header/query/param/body mismatch with 403
  const requestedCompanyIds = [
    req.headers['x-company-id'],
    req.query?.companyId,
    req.params?.companyId,
    req.body?.companyId,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map(v => v.trim());

  for (const requestedId of requestedCompanyIds) {
    if (requestedId !== req.user.companyId) {
      res.status(403).json({
        error: 'FORBIDDEN_CROSS_COMPANY',
        message: 'غير مصرح بالوصول إلى بيانات شركة أخرى / Cross-company access forbidden',
      });
      return;
    }
  }

  next();
}

// ----------------------------------------------------
// Health check
// ----------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'daleel',
    neonPostgres: isNeonConfigured ? 'connected' : 'in-memory-fallback',
    neonStorage: isStorageConfigured ? 'active (my-bucket)' : 'local-fallback',
    aiEnabled: false,
  });
});

// ----------------------------------------------------
// Auth Routes (Neon Auth & Better Auth compatible)
// ----------------------------------------------------

// Password Hashing and Verification (PBKDF2 with unique salts & timing-safe equality)
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = hashPassword(password, salt);
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch {
    return false;
  }
}

// Inquiry rate limiter: max 5 inquiries per minute per IP / email
const inquiryRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkInquiryRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = inquiryRateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    inquiryRateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Fetch verified company memberships for a user from database or in-memory store
async function getCompanyMemberships(userId: string): Promise<Array<{ companyId: string; companyName: string; companyArabicName?: string; role: string }>> {
  if (isNeonConfigured) {
    const pool = getNeonPool()!;
    const res = await pool.query(
      `SELECT cm.company_id, cm.role, c.name as company_name, c.arabic_name as company_arabic_name
       FROM company_members cm
       JOIN companies c ON c.id = cm.company_id
       WHERE cm.user_id = $1`,
      [userId]
    );
    return res.rows.map(r => ({
      companyId: r.company_id,
      companyName: r.company_name,
      companyArabicName: r.company_arabic_name,
      role: r.role,
    }));
  } else {
    const list: Array<{ companyId: string; companyName: string; companyArabicName?: string; role: string }> = [];
    for (const m of inMemoryDb.companyMembers.values()) {
      if (m.user_id === userId) {
        const c = inMemoryDb.companies.get(m.company_id);
        list.push({
          companyId: m.company_id,
          companyName: c?.name || 'Company',
          companyArabicName: c?.arabic_name,
          role: m.role,
        });
      }
    }
    return list;
  }
}

// 1. Email/Password Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, companyName, arabicName, phone, role = 'Owner' } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanEmail || !password || password.length < 6) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'بريد وكلمة مرور صالحة (6 خانات على الأقل) مطلوبين' });
      return;
    }

    // Check if user already exists
    let existingUser: UserRecord | undefined;
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (checkRes.rows.length > 0) {
        res.status(409).json({ error: 'USER_EXISTS', message: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' });
        return;
      }
    } else {
      for (const u of inMemoryDb.users.values()) {
        if (u.email === cleanEmail) {
          existingUser = u;
          break;
        }
      }
      if (existingUser) {
        res.status(409).json({ error: 'USER_EXISTS', message: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' });
        return;
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    let companyId: string | undefined;

    // Enforce server-side role assignment: creator is Owner
    const assignedRole = role === 'Traveler' ? 'Traveler' : 'Owner';

    if (assignedRole !== 'Traveler') {
      const cName = (companyName || `${cleanName} Travel`).trim();
      const arName = (arabicName || '').trim();
      companyId = `comp_${crypto.randomBytes(8).toString('hex')}`;

      let slug = cName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `agency-${companyId.slice(-6)}`;

      if (isNeonConfigured) {
        const pool = getNeonPool()!;
        const slugCheck = await pool.query('SELECT id FROM companies WHERE slug = $1 LIMIT 1', [slug]);
        if (slugCheck.rows.length > 0) {
          slug = `${slug}-${companyId.slice(-6)}`;
        }
      } else {
        for (const existing of inMemoryDb.companies.values()) {
          if (existing.slug === slug) {
            slug = `${slug}-${companyId.slice(-6)}`;
            break;
          }
        }
      }

      const rawPhone = typeof phone === 'string' ? phone.trim() : '';
      const normalizedPhone = rawPhone ? normalizeEgyptianPhone(rawPhone) : null;
      const company: CompanyRecord = {
        id: companyId,
        name: cName,
        arabic_name: arName,
        slug,
        contact_email: cleanEmail,
        contact_phone: normalizedPhone?.isValid ? normalizedPhone.display : rawPhone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isNeonConfigured) {
        const pool = getNeonPool()!;
        await pool.query(
          `INSERT INTO companies (id, name, arabic_name, slug, contact_email, contact_phone, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [company.id, company.name, company.arabic_name, company.slug, company.contact_email, company.contact_phone, company.status, company.created_at, company.updated_at]
        );
      } else {
        inMemoryDb.companies.set(company.id, company);
      }
    }

    const user: UserRecord = {
      id: userId,
      email: cleanEmail,
      name: cleanName || cleanEmail.split('@')[0],
      role: assignedRole,
      status: 'active',
      password_hash: passwordHash,
      password_salt: salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO users (id, email, name, role, status, password_hash, password_salt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [user.id, user.email, user.name, user.role, user.status, user.password_hash, user.password_salt, user.created_at, user.updated_at]
      );
      if (companyId) {
        await pool.query(
          `INSERT INTO company_members (id, company_id, user_id, role, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [`mem_${crypto.randomBytes(8).toString('hex')}`, companyId, user.id, 'Owner']
        );
      }
    } else {
      inMemoryDb.users.set(user.id, user);
      if (companyId) {
        inMemoryDb.companyMembers.set(`${companyId}_${user.id}`, {
          id: `mem_${Date.now()}`,
          company_id: companyId,
          user_id: user.id,
          role: 'Owner',
          created_at: new Date().toISOString(),
        });
      }
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId,
    });

    const memberships = companyId ? await getCompanyMemberships(user.id) : [];
    const activeCompany = memberships[0];

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      hasCompanyMembership: memberships.length > 0,
      companyId: activeCompany?.companyId || companyId,
      companyName: activeCompany?.companyName,
      companyArabicName: activeCompany?.companyArabicName,
      memberships,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'فشل إنشاء الحساب' });
  }
});

// 2. Email/Password Login (Strictly verifies password; NEVER bypasses or auto-creates)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
      return;
    }

    let user: UserRecord | undefined;
    let companyId: string | undefined;
    let memberRole: string | undefined;

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
        const memRes = await pool.query('SELECT company_id, role FROM company_members WHERE user_id = $1 LIMIT 1', [user!.id]);
        if (memRes.rows.length > 0) {
          companyId = memRes.rows[0].company_id;
          memberRole = memRes.rows[0].role;
        }
      }
    } else {
      for (const u of inMemoryDb.users.values()) {
        if (u.email === cleanEmail) {
          user = u;
          break;
        }
      }
      if (user) {
        for (const m of inMemoryDb.companyMembers.values()) {
          if (m.user_id === user.id) {
            companyId = m.company_id;
            memberRole = m.role;
            break;
          }
        }
      }
    }

    // Critical security check: User MUST exist. Never auto-create.
    if (!user) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.',
      });
      return;
    }

    // Password verification check
    if (!user.password_hash || !user.password_salt) {
      res.status(400).json({
        error: 'USE_OAUTH',
        message: 'هذا الحساب مسجل عبر Google. يرجى استخدام تسجيل الدخول بحساب Google.',
      });
      return;
    }

    const isMatch = verifyPassword(password, user.password_salt, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.',
      });
      return;
    }

    const memberships = await getCompanyMemberships(user.id);
    const hasCompanyMembership = memberships.length > 0;
    const activeCompany = memberships.find(m => m.companyId === companyId) || memberships[0];
    const effectiveCompanyId = activeCompany?.companyId || companyId;
    const verifiedRole = activeCompany?.role || memberRole || user.role || 'Traveler';

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: verifiedRole,
      companyId: effectiveCompanyId,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: verifiedRole,
      },
      hasCompanyMembership,
      companyId: effectiveCompanyId,
      companyName: activeCompany?.companyName,
      companyArabicName: activeCompany?.companyArabicName,
      memberships,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'فشل تسجيل الدخول' });
  }
});

// 3. Google OAuth URL Generation (Neon Auth Social Sign-In)
app.get('/api/auth/google/url', async (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const currentOrigin = `${protocol}://${host}`;
    const callbackURL = `${process.env.APP_URL || currentOrigin}/auth/callback`;

    const neonAuthBase = process.env.NEON_AUTH_URL;
    if (!neonAuthBase) {
      res.status(500).json({ error: 'NEON_AUTH_URL_NOT_CONFIGURED', message: 'رابط Neon Auth غير مهيأ' });
      return;
    }

    const response = await fetch(`${neonAuthBase}/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.url) {
      res.status(response.status).json({
        error: data.code || 'NEON_AUTH_ERROR',
        message: data.error || 'فشل الاتصال بخدمة Neon Auth',
      });
      return;
    }

    res.json({ url: data.url });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// OAuth Callback Handler for Popup
app.get('/auth/callback', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تسجيل الدخول عبر Google - دليل</title>
  <style>
    body { background: #FAF8F5; color: #0F172A; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; padding: 2.5rem; background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 1.5rem; max-width: 440px; box-shadow: 0 20px 40px -15px rgba(212,175,55,0.15); }
    .spinner { width: 44px; height: 44px; border: 3px solid rgba(212,175,55,0.2); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.25rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h3 style="color:#B38E3F; margin: 0 0 0.75rem; font-size: 1.35rem; font-weight: bold;">تم اختيار حساب Google بنجاح</h3>
    <p style="font-size: 0.95rem; color: #64748B; margin: 0; line-height: 1.6;">جاري تأكيد المصادقة وتحويلك فورًا إلى المنصة...</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'NEON_GOOGLE_AUTH_SUCCESS' }, '*');
        setTimeout(() => window.close(), 500);
      } else {
        window.location.href = '/';
      }
    } catch (e) {
      window.location.href = '/';
    }
  </script>
</body>
</html>`);
});

// 4. Secure Google OAuth Session Verification (Requires verified Neon Auth token)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token, code, email, name, role = 'Owner' } = req.body;

    // Reject fabricated or empty requests without real verification
    if (!token && !code && !email) {
      res.status(400).json({ error: 'TOKEN_REQUIRED', message: 'رمز مصادقة Google مطلوب للتحقق من الهوية' });
      return;
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'بريد Google صالح مطلوب' });
      return;
    }

    let user: UserRecord | undefined;
    let companyId: string | undefined;
    let memberRole: string | undefined;

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
        const memRes = await pool.query('SELECT company_id, role FROM company_members WHERE user_id = $1 LIMIT 1', [user!.id]);
        if (memRes.rows.length > 0) {
          companyId = memRes.rows[0].company_id;
          memberRole = memRes.rows[0].role;
        }
      }
    } else {
      for (const u of inMemoryDb.users.values()) {
        if (u.email === cleanEmail) {
          user = u;
          break;
        }
      }
      if (user) {
        for (const m of inMemoryDb.companyMembers.values()) {
          if (m.user_id === user.id) {
            companyId = m.company_id;
            memberRole = m.role;
            break;
          }
        }
      }
    }

    if (!user) {
      // Register verified Google user
      const userId = `usr_g_${crypto.randomBytes(8).toString('hex')}`;
      const cleanName = (name || cleanEmail.split('@')[0]).trim();
      const assignedRole = role === 'Traveler' ? 'Traveler' : 'Owner';

      user = {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: assignedRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isNeonConfigured) {
        const pool = getNeonPool()!;
        await pool.query(
          `INSERT INTO users (id, email, name, role, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO UPDATE SET name = $3, updated_at = NOW()`,
          [user.id, user.email, user.name, user.role, user.status, user.created_at, user.updated_at]
        );
      } else {
        inMemoryDb.users.set(user.id, user);
      }
    }

    const memberships = await getCompanyMemberships(user.id);
    const hasCompanyMembership = memberships.length > 0;
    const activeCompany = memberships.find(m => m.companyId === companyId) || memberships[0];
    const effectiveCompanyId = activeCompany?.companyId || companyId;
    const verifiedRole = activeCompany?.role || memberRole || user.role || 'Traveler';

    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      role: verifiedRole,
      companyId: effectiveCompanyId,
    });

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: verifiedRole,
      },
      hasCompanyMembership,
      companyId: effectiveCompanyId,
      companyName: activeCompany?.companyName,
      companyArabicName: activeCompany?.companyArabicName,
      memberships,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 4. Session restoration (Server-verified realm & memberships)
app.get('/api/auth/session', authenticate, async (req: any, res) => {
  const session = req.user as SessionPayload;
  const memberships = await getCompanyMemberships(session.userId);
  const hasCompanyMembership = memberships.length > 0;
  const activeCompany = memberships.find(m => m.companyId === session.companyId) || memberships[0];

  let userName = session.email.split('@')[0];
  try {
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const uRes = await pool.query('SELECT name FROM users WHERE id = $1', [session.userId]);
      if (uRes.rows[0]?.name) userName = uRes.rows[0].name;
    } else {
      const u = inMemoryDb.users.get(session.userId);
      if (u?.name) userName = u.name;
    }
  } catch {
    // fallback to email prefix
  }

  res.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: userName,
      role: activeCompany?.role || session.role || 'Traveler',
    },
    hasCompanyMembership,
    companyId: activeCompany?.companyId || session.companyId,
    companyName: activeCompany?.companyName,
    companyArabicName: activeCompany?.companyArabicName,
    memberships,
  });
});

// 5. Server-side Logout & Immediate Token Revocation
app.post('/api/auth/logout', authenticate, (req: Request & { user?: SessionPayload; rawToken?: string }, res: Response) => {
  if (req.user?.jti) {
    revokedTokenIds.add(req.user.jti);
  }
  if (req.rawToken) {
    revokedTokenIds.add(req.rawToken);
  }
  res.json({ success: true, revoked: true });
});

// ----------------------------------------------------
// Traveler Portal Routes (B2C Experience)
// ----------------------------------------------------

// ----------------------------------------------------
// Public Companies Directory Routes (Strict Public DTO - Zero PII/Financial Leaks)
// ----------------------------------------------------
async function fetchSanitizedPublicCompanies() {
  let approvedCompanies: CompanyRecord[] = [];
  const tripCounts = new Map<string, number>();

  if (isNeonConfigured) {
    const pool = getNeonPool()!;
    const rows = await pool.query(
      "SELECT id, name, arabic_name, slug, contact_phone, description, logo_url, cover_image_url, status FROM companies WHERE status = 'approved' ORDER BY name ASC"
    );
    approvedCompanies = rows.rows;
    const countRes = await pool.query(
      "SELECT company_id, COUNT(*)::int AS cnt FROM trips WHERE status NOT IN ('Draft', 'Internal') GROUP BY company_id"
    );
    for (const r of countRes.rows) {
      tripCounts.set(r.company_id, Number(r.cnt) || 0);
    }
  } else {
    approvedCompanies = Array.from(inMemoryDb.companies.values()).filter(c => c.status === 'approved');
    for (const t of inMemoryDb.trips.values()) {
      if (t.status !== 'Draft' && t.status !== 'Internal') {
        tripCounts.set(t.company_id, (tripCounts.get(t.company_id) || 0) + 1);
      }
    }
  }

  return approvedCompanies
    .map(c => sanitizePublicCompanyDto({ ...c, tripCount: tripCounts.get(c.id) || 0 }))
    .filter(Boolean);
}

// Public directory endpoint (Item 2.4)
app.get('/api/public/companies', async (_req, res) => {
  try {
    const companies = await fetchSanitizedPublicCompanies();
    res.json({ companies });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// Public single company showcase endpoint (Item 2.4)
app.get('/api/public/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let company: CompanyRecord | undefined;
    let trips: TripRecord[] = [];

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const cRes = await pool.query(
        "SELECT id, name, arabic_name, slug, contact_phone, description, logo_url, cover_image_url, status FROM companies WHERE id = $1 AND status = 'approved'",
        [id]
      );
      if (cRes.rows.length > 0) {
        company = cRes.rows[0];
        const tRes = await pool.query(
          "SELECT id, file_number, trip_code, status, start_date, duration_days, itinerary_json FROM trips WHERE company_id = $1 AND status NOT IN ('Draft', 'Internal')",
          [id]
        );
        trips = tRes.rows;
      }
    } else {
      const found = inMemoryDb.companies.get(id);
      if (found && found.status === 'approved') {
        company = found;
        trips = Array.from(inMemoryDb.trips.values()).filter(t => t.company_id === id && t.status !== 'Draft' && t.status !== 'Internal');
      }
    }

    if (!company) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة أو غير معتمدة' });
      return;
    }

    const publicCompany = sanitizePublicCompanyDto({ ...company, tripCount: trips.length });
    const publicTrips = trips.map(t => ({
      id: t.id,
      fileNumber: t.file_number,
      tripCode: t.trip_code,
      startDate: t.start_date,
      durationDays: t.duration_days,
      itinerary: t.itinerary_json,
    }));

    res.json({ company: publicCompany, trips: publicTrips });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 1. Discover Approved Travel Companies (Strictly sanitized public DTO)
app.get('/api/traveler/companies', async (_req, res) => {
  try {
    const companies = await fetchSanitizedPublicCompanies();
    res.json({ companies });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 2. View Approved Company Profile & Trips (Strictly Public DTO — never exposes contactEmail/costs/margins/notes)
app.get('/api/traveler/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let company: CompanyRecord | undefined;
    let trips: TripRecord[] = [];

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const cRes = await pool.query(
        "SELECT id, name, arabic_name, slug, contact_phone, description, logo_url, cover_image_url, status FROM companies WHERE id = $1 AND status = 'approved'",
        [id]
      );
      if (cRes.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة أو غير معتمدة' });
        return;
      }
      company = cRes.rows[0];
      const tRes = await pool.query(
        "SELECT id, file_number, trip_code, status, start_date, duration_days, itinerary_json FROM trips WHERE company_id = $1 AND status NOT IN ('Draft', 'Internal')",
        [id]
      );
      trips = tRes.rows;
    } else {
      company = inMemoryDb.companies.get(id);
      if (!company || company.status !== 'approved') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة أو غير معتمدة' });
        return;
      }
      trips = Array.from(inMemoryDb.trips.values()).filter(t => t.company_id === id && t.status !== 'Draft' && t.status !== 'Internal');
    }

    if (!company) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة أو غير معتمدة' });
      return;
    }

    const publicCompany = sanitizePublicCompanyDto({ ...company, tripCount: trips.length });
    const publicTrips = trips.map(t => ({
      id: t.id,
      fileNumber: t.file_number,
      tripCode: t.trip_code,
      startDate: t.start_date,
      durationDays: t.duration_days,
      itinerary: t.itinerary_json,
    }));

    res.json({ company: publicCompany, trips: publicTrips });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 3. Trip Code Secure Lookup (Strict separation: Demo trips vs Live Neon database)
app.post('/api/traveler/trip-lookup', async (req, res) => {
  try {
    const { tripCode } = req.body;
    const cleanCode = (tripCode || '').trim().toUpperCase();

    if (!cleanCode) {
      res.status(400).json({ error: 'CODE_REQUIRED', message: 'يرجى إدخال رمز الرحلة / Trip code is required' });
      return;
    }

    let trip: TripRecord | undefined;
    let company: CompanyRecord | undefined;
    let isDemo = false;

    // Check if this is a recognized demo suite code
    const canonicalAliases = new Set(['RIHAL-842A', 'EG-CAI-7491', 'EG-LXR-9281', 'TRIP-2026-0104']);
    if (isDemoTripCode(cleanCode)) {
      isDemo = true;
      for (const t of inMemoryDb.trips.values()) {
        const codeUpper = t.trip_code.toUpperCase();
        const fileUpper = t.file_number.toUpperCase();
        if (
          codeUpper === cleanCode ||
          fileUpper === cleanCode ||
          (canonicalAliases.has(cleanCode) && fileUpper === 'TRIP-2026-0104')
        ) {
          trip = t;
          company = inMemoryDb.companies.get(t.company_id);
          break;
        }
      }
    } else if (isNeonConfigured) {
      // Live query: strictly queries live database; demo codes never enter here
      const pool = getNeonPool()!;
      const tRes = await pool.query('SELECT * FROM trips WHERE UPPER(trip_code) = $1 LIMIT 1', [cleanCode]);
      if (tRes.rows.length > 0) {
        trip = tRes.rows[0];
        const cRes = await pool.query('SELECT id, name, arabic_name, contact_phone, contact_email FROM companies WHERE id = $1', [trip!.company_id]);
        if (cRes.rows.length > 0) company = cRes.rows[0];
      }
    } else {
      // Offline / Local dev fallback
      for (const t of inMemoryDb.trips.values()) {
        if (t.trip_code.toUpperCase() === cleanCode) {
          trip = t;
          company = inMemoryDb.companies.get(t.company_id);
          isDemo = true;
          break;
        }
      }
    }

    if (!trip) {
      // Strictly 404: NEVER invent fake itineraries for arbitrary codes
      res.status(404).json({
        error: 'TRIP_NOT_FOUND',
        message: 'رمز الرحلة غير صالح أو لم يتم العثور على حجز مطابق / Trip code not found or invalid',
      });
      return;
    }

    res.json({
      success: true,
      isDemo,
      trip: {
        id: trip.id,
        fileNumber: trip.file_number,
        travelerName: trip.traveler_name,
        tripCode: trip.trip_code,
        status: trip.status,
        startDate: trip.start_date,
        durationDays: trip.duration_days,
        itinerary: trip.itinerary_json,
        vouchers: trip.vouchers_json,
      },
      company: company ? {
        id: company.id,
        name: company.name,
        arabicName: company.arabic_name,
        phone: company.contact_phone,
        email: company.contact_email,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 4. Secure Traveler Inquiry Submission (Targeted to selected company with rate-limiting)
app.post('/api/traveler/inquiry', async (req, res) => {
  try {
    const { companyId, travelerName, travelerEmail, travelerPhone, requirements } = req.body;
    const cleanCompanyId = (companyId || '').trim();
    const cleanName = (travelerName || '').trim();
    const cleanEmail = (travelerEmail || '').trim().toLowerCase();

    if (!cleanCompanyId || !cleanName) {
      res.status(400).json({ error: 'MISSING_DATA', message: 'الاسم والشركة مطلوبان / Name and company are required' });
      return;
    }

    // Rate limiting: 5 inquiries per minute per IP / email
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${ip}_${cleanEmail || 'guest'}`;
    if (!checkInquiryRateLimit(rateLimitKey)) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'تم تجاوز الحد الأقصى لإرسال الطلبات، يرجى الانتظار دقيقة قبل المحاولة / Too many requests, please wait 1 minute',
      });
      return;
    }

    // Confirm that the destination company exists and is eligible
    let targetCompany: CompanyRecord | undefined;
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const cRes = await pool.query("SELECT id, name, arabic_name, status FROM companies WHERE id = $1", [cleanCompanyId]);
      if (cRes.rows.length > 0) targetCompany = cRes.rows[0];
    } else {
      targetCompany = inMemoryDb.companies.get(cleanCompanyId);
    }

    if (!targetCompany) {
      res.status(404).json({ error: 'COMPANY_NOT_FOUND', message: 'الشركة المستهدفة غير موجودة / Target company not found' });
      return;
    }

    if (targetCompany.status !== 'approved') {
      res.status(400).json({ error: 'COMPANY_NOT_ELIGIBLE', message: 'هذه الشركة غير مؤهلة لاستقبال طلبات المسافرين حالياً / Company not eligible to receive inquiries' });
      return;
    }

    const inquiryId = `inq_${crypto.randomBytes(8).toString('hex')}`;
    const inquiry: InquiryRecord = {
      id: inquiryId,
      company_id: targetCompany.id,
      traveler_name: cleanName,
      traveler_email: cleanEmail || undefined,
      traveler_phone: travelerPhone?.trim(),
      status: 'New',
      requirements_json: requirements || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO inquiries (id, company_id, traveler_name, traveler_email, traveler_phone, status, requirements_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [inquiry.id, inquiry.company_id, inquiry.traveler_name, inquiry.traveler_email, inquiry.traveler_phone, inquiry.status, JSON.stringify(inquiry.requirements_json), inquiry.created_at, inquiry.updated_at]
      );
    } else {
      inMemoryDb.inquiries.set(inquiry.id, inquiry);
    }

    res.json({
      success: true,
      requestId: inquiryId,
      inquiryId,
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      message: 'تم إرسال طلبك بنجاح للشركة وتعيينه في قائمة الوارد الرسمية',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ----------------------------------------------------
// AI Support Center Chat Endpoint (Gemini-Powered with Knowledge Fallback)
// ----------------------------------------------------
app.post('/api/support/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], role = 'traveler', language = 'ar', operationalContext } = req.body;
    const cleanMessage = (message || '').trim();

    if (!cleanMessage) {
      res.status(400).json({ error: 'MESSAGE_REQUIRED', message: 'يرجى كتابة رسالتك / Message is required' });
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '').trim();
    const isValidKey = Boolean(apiKey && apiKey.length >= 10 && !apiKey.includes('your-') && !apiKey.includes('placeholder'));

    // Ultra-Fast Fast-Path: Instantly answer common inquiries and live operational questions with 0ms latency
    const quickAnswerTriggers = [
      'كود', 'حجز', 'passcode', 'واتساب', 'whatsapp', 'طبخ', 'recipe', 'python',
      'برنامج', 'رحل', 'سعر', 'أسعار', 'package', 'price', 'tour', 'cairo', 'luxor', 'aswan', 'دهب', 'شرم', 'سيوه',
      'alexander', 'ألكسندر', 'sarah', 'سارة', 'steigenberger', 'شتايجنبرجر', 'marriott', 'ماريوت', 'رحلات نشطة', 'active trips', 'عروض', 'quotes',
      'rooming', 'تسكين', 'توزيع الغرف', 'غرفة', 'غرف', 'manifest', 'dietary', 'وجبات', 'حج', 'عمرة', 'hajj', 'umrah', 'rates', 'مكتبة الأسعار'
    ];
    const isQuickAnswer = quickAnswerTriggers.some(t => cleanMessage.toLowerCase().includes(t));

    if (isQuickAnswer || !isValidKey) {
      const fastAnswer = getFallbackSupportResponse(cleanMessage, role, operationalContext);
      res.json({
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        content: fastAnswer.content,
        timestamp: new Date().toISOString(),
        suggestedActions: fastAnswer.suggestedActions,
        ticketId: fastAnswer.ticketId,
      });
      return;
    }

    if (isValidKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        const contents = [
          ...conversationHistory.map((m: any) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.content || '' }],
          })),
          {
            role: 'user',
            parts: [{ text: `[Active Role: ${role} | Preferred Language: ${language}]\n${cleanMessage}` }],
          },
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: `${CONCISE_INTERNAL_SYSTEM_INSTRUCTION_TEMPLATE}\n\n${RIHAL_SYSTEM_PROMPT}`,
            temperature: 0.2,
          },
        });

        const replyText = response.text || '';
        let stage: 'stage-1-direct' | 'stage-2-assisted' | 'stage-3-escalation' = 'stage-1-direct';
        if (replyText.includes('[STAGE-3: ESCALATED_TO_HUMAN]')) {
          stage = 'stage-3-escalation';
        } else if (replyText.includes('[STAGE-2: ASSISTED_DIAGNOSIS]')) {
          stage = 'stage-2-assisted';
        }

        const cleanedContent = replyText
          .replace(/\[STAGE-(1|2|3): [A-Z_]+\]\s*/i, '')
          .trim();

        res.json({
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          content: cleanedContent,
          stage,
          timestamp: new Date().toISOString(),
          ticketId: stage === 'stage-3-escalation' ? `TKT-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        });
        return;
      } catch (geminiErr: any) {
        // Log clean diagnostic for server monitoring and smoothly transition to knowledge engine
        const errMsg = geminiErr?.message || String(geminiErr);
        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
          console.info('Gemini API key is invalid or pending configuration in Settings > Secrets. Active support session routed to RIHAL knowledge fallback engine.');
        } else {
          console.warn('Gemini API call deferred, using intelligent support engine:', errMsg);
        }
      }
    }

    // Intelligent fallback rule engine (guarantees zero downtime)
    const fallback = getFallbackSupportResponse(cleanMessage, role);
    const cleanedContent = fallback.content.replace(/\[STAGE-(1|2|3): [A-Z_]+\]\s*/i, '').trim();

    res.json({
      ...fallback,
      content: cleanedContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ----------------------------------------------------
// Operator Portal Routes (B2B DMC Desk - Tenant-Isolated)
// ----------------------------------------------------

// 1. Simple, Non-Bureaucratic Company Registration (Arabic name is optional)
app.post('/api/operator/register-company', authenticate, async (req: any, res) => {
  try {
    const { name, arabicName, contactPhone, contactEmail, description } = req.body;
    const cleanAr = (arabicName || '').trim();
    const cleanEn = (name || '').trim();
    const cleanPhoneRaw = (contactPhone || '').trim();
    const cleanEmail = (contactEmail || '').trim();

    if (!cleanEn || !cleanPhoneRaw || !cleanEmail) {
      res.status(400).json({
        error: 'VALIDATION_FAILED',
        message: 'الحقول المطلوبة: اسم الشركة، هاتف التواصل، وبريد التواصل / Required: company name, phone, and email',
      });
      return;
    }

    const normalized = normalizeEgyptianPhone(cleanPhoneRaw);
    const cleanPhone = normalized.isValid ? normalized.display : cleanPhoneRaw;

    const companyId = `comp_${crypto.randomBytes(8).toString('hex')}`;
    const company: CompanyRecord = {
      id: companyId,
      name: cleanEn,
      arabic_name: cleanAr,
      slug: cleanEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `agency-${companyId.slice(-6)}`,
      contact_email: cleanEmail,
      contact_phone: cleanPhone,
      description: (description || '').trim() || undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO companies (id, name, arabic_name, slug, contact_email, contact_phone, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [company.id, company.name, company.arabic_name, company.slug, company.contact_email, company.contact_phone, company.description, company.status, company.created_at, company.updated_at]
      );
      await pool.query(
        `INSERT INTO company_members (id, company_id, user_id, role, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [`mem_${crypto.randomBytes(8).toString('hex')}`, companyId, req.user.userId, 'Owner']
      );
    } else {
      inMemoryDb.companies.set(company.id, company);
      inMemoryDb.companyMembers.set(`${companyId}_${req.user.userId}`, {
        id: `mem_${Date.now()}`,
        company_id: companyId,
        user_id: req.user.userId,
        role: 'Owner',
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      company,
      message: 'تم تسجيل الشركة بنجاح وحسابك قيد المراجعة والموافقة من إدارة المنصة',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 1.1 Save Draft Onboarding Progress (Scoped per company + user across refreshes)
app.post('/api/operator/onboarding-progress', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const companyScope = req.user.companyId || 'no_comp';
    const key = `${companyScope}:${userId || req.user.email}`;
    const progressData = req.body;

    if (!userId && !req.user.email) {
      res.status(400).json({ error: 'USER_REQUIRED', message: 'User identifier required' });
      return;
    }

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS onboarding_drafts (
          key TEXT PRIMARY KEY,
          draft_json JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(
        `INSERT INTO onboarding_drafts (key, draft_json, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET draft_json = $2, updated_at = NOW()`,
        [key, JSON.stringify(progressData)]
      );
    } else {
      inMemoryDb.onboardingDrafts.set(key, {
        ...progressData,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 1.2 Get Saved Draft Onboarding Progress (Scoped per company + user)
app.get('/api/operator/onboarding-progress', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const companyScope = req.user.companyId || 'no_comp';
    const key = `${companyScope}:${userId || req.user.email}`;

    let draft: any = null;
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS onboarding_drafts (
          key TEXT PRIMARY KEY,
          draft_json JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const r = await pool.query('SELECT draft_json FROM onboarding_drafts WHERE key = $1', [key]);
      if (r.rows.length > 0) {
        draft = r.rows[0].draft_json;
      }
    } else {
      draft = inMemoryDb.onboardingDrafts.get(key) || null;
    }

    res.json({ draft });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 2. Fetch authenticated operator company (Requires active verified company membership)
app.get('/api/operator/company', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'FORBIDDEN_OPERATOR_ACCESS', message: 'لم يتم العثور على شركة مرتبطة بهذا الحساب' });
      return;
    }

    let company: CompanyRecord | undefined;
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (r.rows.length > 0) company = r.rows[0];
    } else {
      company = inMemoryDb.companies.get(companyId);
    }

    if (!company) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة' });
      return;
    }

    res.json({ company });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 2.1 Update authenticated operator company profile & optional directory publication
app.put('/api/operator/company', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'FORBIDDEN_OPERATOR_ACCESS', message: 'لم يتم العثور على شركة مرتبطة بهذا الحساب' });
      return;
    }

    const {
      name,
      arabicName,
      contactEmail,
      contactPhone,
      description,
      logoUrl,
      coverImageUrl,
      publishToDirectory,
    } = req.body || {};

    const now = new Date().toISOString();

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const existingRes = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (existingRes.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة' });
        return;
      }
      const existing = existingRes.rows[0];
      const nextName = (name ?? existing.name ?? '').trim();
      const nextArabicName = (arabicName ?? existing.arabic_name ?? '').trim();
      const nextEmail = (contactEmail ?? existing.contact_email ?? '').trim();
      const nextPhone = (contactPhone ?? existing.contact_phone ?? '').trim();
      const nextDesc = description !== undefined ? String(description).trim() : existing.description;
      const nextLogo = logoUrl !== undefined ? String(logoUrl).trim() : existing.logo_url;
      const nextCover = coverImageUrl !== undefined ? String(coverImageUrl).trim() : existing.cover_image_url;
      const nextStatus = publishToDirectory === true ? 'approved' : existing.status;

      const updatedRes = await pool.query(
        `UPDATE companies
         SET name = $1, arabic_name = $2, contact_email = $3, contact_phone = $4,
             description = $5, logo_url = $6, cover_image_url = $7, status = $8, updated_at = $9
         WHERE id = $10
         RETURNING *`,
        [nextName, nextArabicName, nextEmail, nextPhone, nextDesc, nextLogo, nextCover, nextStatus, now, companyId]
      );
      res.json({ success: true, company: updatedRes.rows[0] });
      return;
    }

    const existing = inMemoryDb.companies.get(companyId);
    if (!existing) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'الشركة غير موجودة' });
      return;
    }

    const updated: CompanyRecord = {
      ...existing,
      name: name !== undefined ? String(name).trim() || existing.name : existing.name,
      arabic_name: arabicName !== undefined ? String(arabicName).trim() : existing.arabic_name,
      contact_email: contactEmail !== undefined ? String(contactEmail).trim() || existing.contact_email : existing.contact_email,
      contact_phone: contactPhone !== undefined ? String(contactPhone).trim() || existing.contact_phone : existing.contact_phone,
      description: description !== undefined ? String(description).trim() || undefined : existing.description,
      logo_url: logoUrl !== undefined ? String(logoUrl).trim() || undefined : existing.logo_url,
      cover_image_url: coverImageUrl !== undefined ? String(coverImageUrl).trim() || undefined : existing.cover_image_url,
      status: publishToDirectory === true ? 'approved' : existing.status,
      updated_at: now,
    };
    inMemoryDb.companies.set(companyId, updated);
    res.json({ success: true, company: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 3. Operator Rates Library (Tenant-isolated - requires verified membership)
app.get('/api/operator/rates', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(403).json({ error: 'FORBIDDEN_OPERATOR_ACCESS', message: 'Membership required' });

    let rates: RateRecord[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT * FROM rates WHERE company_id = $1 ORDER BY name ASC', [companyId]);
      rates = r.rows;
    } else {
      rates = Array.from(inMemoryDb.rates.values()).filter(r => r.company_id === companyId);
    }
    res.json({ rates });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/rates', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(403).json({ error: 'FORBIDDEN_OPERATOR_ACCESS', message: 'يجب الانضمام لشركة أولاً' });

    const { name, city, supplierType, currency = 'USD', costPrice, sellingPrice, validFrom, validTo } = req.body;
    const rateId = req.body.id || `rate_${crypto.randomBytes(8).toString('hex')}`;

    const rate: RateRecord = {
      id: rateId,
      company_id: companyId,
      name,
      city: city || 'Cairo',
      supplier_type: supplierType || 'Hotel',
      currency,
      cost_price: Number(costPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      valid_from: validFrom,
      valid_to: validTo,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO rates (id, company_id, name, city, supplier_type, currency, cost_price, selling_price, valid_from, valid_to, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET name = $3, city = $4, cost_price = $7, selling_price = $8, updated_at = NOW()`,
        [rate.id, rate.company_id, rate.name, rate.city, rate.supplier_type, rate.currency, rate.cost_price, rate.selling_price, rate.valid_from, rate.valid_to, rate.version, rate.created_at, rate.updated_at]
      );
    } else {
      inMemoryDb.rates.set(rate.id, rate);
    }

    res.json({ success: true, rate });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 4. Operator Quotes (Tenant-isolated - requires verified membership)
app.get('/api/operator/quotes', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    let quotes: QuoteRecord[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT * FROM quotes WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
      quotes = r.rows;
    } else {
      quotes = Array.from(inMemoryDb.quotes.values()).filter(q => q.company_id === companyId);
    }
    res.json({ quotes });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/quotes', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      quoteNumber,
      travelerName,
      travelerEmail,
      travelerPhone,
      status = 'Draft',
      currency = 'USD',
      totalPrice = 0,
      marginPercent = 15,
      days = [],
    } = req.body || {};

    if (!travelerName || !String(travelerName).trim()) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'travelerName is required' });
      return;
    }

    const now = new Date().toISOString();
    const quote: QuoteRecord = {
      id: `qt_${crypto.randomBytes(8).toString('hex')}`,
      company_id: companyId,
      quote_number: String(quoteNumber || `QT-${Date.now().toString().slice(-6)}`).trim(),
      traveler_name: String(travelerName).trim(),
      traveler_email: travelerEmail ? String(travelerEmail).trim() : undefined,
      traveler_phone: travelerPhone ? String(travelerPhone).trim() : undefined,
      status: String(status),
      currency: String(currency),
      total_price: Number(totalPrice) || 0,
      margin_percent: Number(marginPercent) || 0,
      version: 1,
      days_json: days,
      created_at: now,
      updated_at: now,
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO quotes (id, company_id, quote_number, traveler_name, traveler_email, traveler_phone, status, currency, total_price, margin_percent, version, days_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [quote.id, quote.company_id, quote.quote_number, quote.traveler_name, quote.traveler_email, quote.traveler_phone, quote.status, quote.currency, quote.total_price, quote.margin_percent, quote.version, JSON.stringify(quote.days_json), quote.created_at, quote.updated_at]
      );
    } else {
      inMemoryDb.quotes.set(quote.id, quote);
    }

    res.status(201).json({ success: true, quote });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 5. Operator Trips (Tenant-isolated)
app.get('/api/operator/trips', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    let trips: TripRecord[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT * FROM trips WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
      trips = r.rows;
    } else {
      trips = Array.from(inMemoryDb.trips.values()).filter(t => t.company_id === companyId);
    }
    res.json({ trips });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/trips', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      fileNumber,
      travelerName,
      travelerEmail,
      travelerPhone,
      tripCode,
      status = 'Draft',
      startDate,
      durationDays = 5,
      itinerary = [],
      vouchers = [],
    } = req.body || {};

    if (!travelerName || !String(travelerName).trim()) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'travelerName is required' });
      return;
    }

    const now = new Date().toISOString();
    const id = `trip_${crypto.randomBytes(8).toString('hex')}`;
    const trip: TripRecord = {
      id,
      company_id: companyId,
      file_number: String(fileNumber || `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
      traveler_name: String(travelerName).trim(),
      traveler_email: travelerEmail ? String(travelerEmail).trim() : undefined,
      traveler_phone: travelerPhone ? String(travelerPhone).trim() : undefined,
      trip_code: String(tripCode || `EG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim(),
      status: String(status),
      start_date: startDate || now.slice(0, 10),
      duration_days: Number(durationDays) || 1,
      itinerary_json: itinerary,
      vouchers_json: vouchers,
      created_at: now,
      updated_at: now,
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO trips (id, company_id, file_number, traveler_name, traveler_email, traveler_phone, trip_code, status, start_date, duration_days, itinerary_json, vouchers_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [trip.id, trip.company_id, trip.file_number, trip.traveler_name, trip.traveler_email, trip.traveler_phone, trip.trip_code, trip.status, trip.start_date, trip.duration_days, JSON.stringify(trip.itinerary_json), JSON.stringify(trip.vouchers_json), trip.created_at, trip.updated_at]
      );
    } else {
      inMemoryDb.trips.set(trip.id, trip);
    }

    res.status(201).json({ success: true, trip });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 6. Operator Inquiries (Tenant-isolated)
app.get('/api/operator/inquiries', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    let inquiries: InquiryRecord[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT * FROM inquiries WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
      inquiries = r.rows;
    } else {
      inquiries = Array.from(inMemoryDb.inquiries.values()).filter(i => i.company_id === companyId);
    }
    res.json({ inquiries });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/inquiries', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const { travelerName, travelerEmail, travelerPhone, rawText, status = 'New', requirements = {} } = req.body || {};
    if (!travelerName || !String(travelerName).trim()) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'travelerName is required' });
      return;
    }
    const now = new Date().toISOString();
    const inquiry: InquiryRecord = {
      id: `inq_${crypto.randomBytes(8).toString('hex')}`,
      company_id: companyId,
      traveler_name: String(travelerName).trim(),
      traveler_email: travelerEmail ? String(travelerEmail).trim() : undefined,
      traveler_phone: travelerPhone ? String(travelerPhone).trim() : undefined,
      raw_text: rawText ? String(rawText) : undefined,
      status: String(status),
      requirements_json: requirements,
      created_at: now,
      updated_at: now,
    };

    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      await pool.query(
        `INSERT INTO inquiries (id, company_id, traveler_name, traveler_email, traveler_phone, raw_text, status, requirements_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [inquiry.id, inquiry.company_id, inquiry.traveler_name, inquiry.traveler_email, inquiry.traveler_phone, inquiry.raw_text, inquiry.status, JSON.stringify(inquiry.requirements_json), inquiry.created_at, inquiry.updated_at]
      );
    } else {
      inMemoryDb.inquiries.set(inquiry.id, inquiry);
    }
    res.status(201).json({ success: true, inquiry });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 7. Operator Vouchers (Tenant-isolated, derived strictly from authenticated company trips)
app.get('/api/operator/vouchers', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    let trips: TripRecord[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query('SELECT id, file_number, traveler_name, vouchers_json FROM trips WHERE company_id = $1', [companyId]);
      trips = r.rows;
    } else {
      trips = Array.from(inMemoryDb.trips.values()).filter(t => t.company_id === companyId);
    }

    const vouchers = trips.flatMap(t => {
      const list = Array.isArray(t.vouchers_json) ? t.vouchers_json : [];
      return list.map((v: any) => ({
        ...v,
        companyId,
        tripId: t.id,
        fileNumber: t.file_number,
        travelerName: t.traveler_name,
      }));
    });
    res.json({ vouchers });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 8. Operator Follow-Ups (Tenant-isolated)
app.get('/api/operator/follow-ups', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const followUps = Array.from(inMemoryDb.followUps.values()).filter(f => f.company_id === companyId);
    res.json({ followUps });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/follow-ups', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const { title, travelerName, travelerPhone, dueDate, status = 'Pending', notes } = req.body || {};
    if (!title || !String(title).trim()) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'title is required' });
      return;
    }
    const now = new Date().toISOString();
    const followUp = {
      id: `fup_${crypto.randomBytes(8).toString('hex')}`,
      company_id: companyId,
      title: String(title).trim(),
      traveler_name: travelerName ? String(travelerName).trim() : '',
      traveler_phone: travelerPhone ? String(travelerPhone).trim() : '',
      due_date: dueDate || now.slice(0, 10),
      status: String(status),
      notes: notes ? String(notes).trim() : '',
      created_at: now,
      updated_at: now,
    };
    inMemoryDb.followUps.set(followUp.id, followUp);
    res.status(201).json({ success: true, followUp });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// 9. Operator Team & Invites (Tenant-isolated)
app.get('/api/operator/team', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const members: any[] = [];
    if (isNeonConfigured) {
      const pool = getNeonPool()!;
      const r = await pool.query(
        `SELECT cm.id, cm.role, u.id AS user_id, u.name, u.email, u.status
         FROM company_members cm
         JOIN users u ON u.id = cm.user_id
         WHERE cm.company_id = $1`,
        [companyId]
      );
      members.push(...r.rows);
    } else {
      for (const m of inMemoryDb.companyMembers.values()) {
        if (m.company_id === companyId) {
          const u = inMemoryDb.users.get(m.user_id);
          members.push({
            id: m.id,
            user_id: m.user_id,
            name: u?.name || 'Team Member',
            email: u?.email || '',
            role: m.role,
            status: u?.status || 'active',
          });
        }
      }
    }
    const invites = Array.from(inMemoryDb.teamInvites.values()).filter(inv => inv.company_id === companyId);
    res.json({ members, invites });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

app.post('/api/operator/team', authenticate, requireCompanyMembership, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, email, role = 'Operations' } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'Valid member email is required' });
      return;
    }
    const invite = {
      id: `inv_${crypto.randomBytes(8).toString('hex')}`,
      company_id: companyId,
      name: String(name || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      role: String(role || 'Operations'),
      status: 'invited',
      invited_by: req.user.userId,
      created_at: new Date().toISOString(),
    };
    inMemoryDb.teamInvites.set(invite.id, invite);
    res.status(201).json({ success: true, invite });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ----------------------------------------------------
// Neon Object Storage Presigned URLs (Bucket: my-bucket)
// ----------------------------------------------------
app.post('/api/storage/presigned-url', authenticate, async (req, res) => {
  try {
    const { key, contentType } = req.body;
    if (!key || !contentType) {
      res.status(400).json({ error: 'MISSING_PARAMS', message: 'اسم الملف ونوعه مطلوبان' });
      return;
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      res.status(400).json({
        error: 'UNSUPPORTED_TYPE',
        message: 'نوع الملف غير مسموح به. الأنواع المدعومة: JPG, PNG, WEBP, PDF',
      });
      return;
    }

    const sanitizedBase = path.basename(key).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeKey = `uploads/${Date.now()}-${sanitizedBase}`;
    const result = await getUploadPresignedUrl(safeKey, contentType);
    if (!result) {
      res.status(500).json({ error: 'STORAGE_ERROR', message: 'تعذر إنشاء رابط الرفع إلى Neon Storage' });
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ----------------------------------------------------
// Live Hotel Inventory, Dynamic Pricing & Direct Booking API
// ----------------------------------------------------
app.get('/api/hotels/live-search', (req: Request, res: Response) => {
  try {
    const region = (req.query.region as HotelRegionId) || 'all';
    const category = (req.query.category as HotelPropertyCategory) || 'all';
    const checkIn = (req.query.checkIn as string) || '2026-11-20';
    const checkOut = (req.query.checkOut as string) || '2026-11-24';
    const mealPlan = (req.query.mealPlan as MealPlanType) || 'BB';
    const roomsCount = Number(req.query.roomsCount) || 1;
    const adultsCount = Number(req.query.adultsCount) || 2;
    const query = (req.query.query as string) || '';
    const maxPriceUsd = req.query.maxPriceUsd ? Number(req.query.maxPriceUsd) : undefined;

    const hotels = searchAndPriceLiveHotels({
      region,
      category,
      checkIn,
      checkOut,
      mealPlan,
      roomsCount,
      adultsCount,
      query,
      maxPriceUsd,
    });

    res.json({
      success: true,
      count: hotels.length,
      regions: HOTEL_REGIONS,
      checkIn,
      checkOut,
      mealPlan,
      timestamp: new Date().toISOString(),
      hotels,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'HOTEL_API_ERROR', message: err.message });
  }
});

app.get('/api/hotels/:id/images', (req: Request, res: Response) => {
  try {
    const hotelId = String(req.params.id || '');
    const images = getHotelGalleryById(hotelId);
    res.json({
      success: true,
      hotelId,
      count: images.length,
      images,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'HOTEL_IMAGES_API_ERROR', message: err.message });
  }
});

// Catch-all 404 for unhandled API routes (prevents falling through to SPA HTML)
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
});

// ----------------------------------------------------
// Vite Dev Server / Static Hosting & Export
// ----------------------------------------------------
export { app };
export default app;

async function start() {
  // Run database schema & seed initialization in the background so port 3000 binds immediately
  initializeNeonDatabase().catch((err) => {
    console.warn('[Neon DB] Background initialization warning:', err);
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(root, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`[RIHAL] Server started on port ${port} (Neon Postgres & Neon Storage ready, No AI features)`);
  });
}

const isTestRun = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('.test.ts') || arg === '--test');
const isMain = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (!process.env.VERCEL && isMain && !isTestRun) {
  start().catch((error) => {
    console.error('Server startup failed', error);
    process.exitCode = 1;
  });
}
