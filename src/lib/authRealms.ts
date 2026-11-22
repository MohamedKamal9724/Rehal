/**
 * RIHAL (رحال) — Core Realm & Authorization Model
 * 
 * Strictly separates:
 * A. TRAVELLER EXPERIENCE (B2C)
 * B. COMPANY / OPERATOR EXPERIENCE (B2B DMC Desk)
 * 
 * Rules:
 * - A regular traveller must NEVER access company tools unless the authenticated server session
 *   proves active company membership in company_members.
 * - Changing URL query parameters, hash, or localStorage never grants operator access.
 * - A user with both accounts can intentionally switch between Traveller and Company workspaces.
 * - Traveller users are NEVER assigned to an operator company workspace ID.
 */

import { User, Workspace } from '../types';
import { normalizeEgyptianPhone } from './phone';

export type Realm = 'traveler' | 'operator';

export interface VerifiedMembership {
  companyId: string;
  companyName?: string;
  companyArabicName?: string;
  role: string;
  status?: string;
}

export interface UserSessionProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
  hasCompanyMembership: boolean;
  memberships: VerifiedMembership[];
  activeCompanyId?: string;
  activeCompanyName?: string;
  activeCompanyArabicName?: string;
  companyId?: string;
  companyName?: string;
  companyArabicName?: string;
  isDemo?: boolean;
}

export const TRAVELER_REALM_WORKSPACE_ID = 'traveler-realm';

/**
 * Authoritative check: can this user access the operator/company realm?
 * True ONLY if active company membership is proven by the server session.
 */
export function canAccessOperatorRealm(session: UserSessionProfile | null | undefined): boolean {
  if (!session) return false;
  if (session.role === 'Traveler') return false;
  const effectiveCompanyId = session.activeCompanyId || session.companyId || session.memberships?.[0]?.companyId;
  return Boolean(session.hasCompanyMembership && effectiveCompanyId);
}

/**
 * Resolves the valid realm based on proven credentials.
 * Even if desiredRealm is 'operator', forces 'traveler' if membership is missing.
 */
export function resolveTargetRealm(
  session: UserSessionProfile | null | undefined,
  desiredRealm?: Realm | null
): Realm {
  if (desiredRealm === 'operator') {
    if (canAccessOperatorRealm(session)) {
      return 'operator';
    }
    return 'traveler';
  }
  return 'traveler';
}

/**
 * Creates an authentic, isolated traveler user.
 * Must NEVER inherit an active company's workspace ID.
 */
export function createIsolatedTravelerUser(
  email: string,
  name?: string,
  lang: 'ar' | 'en' = 'ar'
): User {
  return {
    id: `traveler_${Date.now()}`,
    workspaceId: TRAVELER_REALM_WORKSPACE_ID,
    name: name?.trim() || (lang === 'ar' ? 'مسافر زائر' : 'Guest Traveler'),
    email: email.trim().toLowerCase(),
    role: 'Traveler',
    language: lang,
    status: 'active',
  };
}

export interface PublicCompanyDto {
  id: string;
  name: string;
  arabicName: string;
  slug: string;
  city: string;
  governorates: string[];
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  descriptionAr?: string;
  tourismLicenseNumber?: string;
  rating: number;
  reviewCount: number;
  tripCount: number;
  storyHighlights: string[];
  publicContactChannel: 'whatsapp_and_inquiry';
  whatsappNumber?: string;
  isVerified: boolean;
  status: string;
}

/**
 * Public Company DTO sanitizer: strict allow-list mapper for Browse Companies.
 * Strips staff emails, internal costs, margins, quotes, vouchers, and private notes.
 */
export function sanitizePublicCompanyDto(company: any): PublicCompanyDto | null {
  if (!company) return null;
  const name = String(company.name || '').trim();
  const arabicName = String(company.arabic_name || company.arabicName || name).trim();
  const rawPhone = String(company.whatsapp_number || company.whatsappNumber || company.contact_phone || company.contactPhone || '').trim();
  const normalizedPhone = rawPhone ? normalizeEgyptianPhone(rawPhone) : null;
  const safeWhatsApp = normalizedPhone?.isValid ? normalizedPhone.display : (rawPhone || undefined);

  return {
    id: String(company.id || ''),
    name,
    arabicName: arabicName || name,
    slug: String(company.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    city: String(company.city || (Array.isArray(company.governorates) ? company.governorates[0] : '') || 'Cairo'),
    governorates: Array.isArray(company.governorates) && company.governorates.length > 0
      ? company.governorates.map(String)
      : ['Cairo', 'Giza', 'Luxor', 'Aswan'],
    logoUrl: company.logo_url || company.logoUrl || undefined,
    coverImageUrl: company.cover_image_url || company.coverImageUrl || undefined,
    description: company.description || undefined,
    descriptionAr: company.description_ar || company.descriptionAr || company.description || undefined,
    tourismLicenseNumber: company.tourism_license_number || company.tourismLicenseNumber || undefined,
    rating: typeof company.rating === 'number' && company.rating > 0 ? company.rating : 4.9,
    reviewCount: typeof company.reviewCount === 'number' ? company.reviewCount : (typeof company.review_count === 'number' ? company.review_count : 0),
    tripCount: typeof company.tripCount === 'number' ? company.tripCount : (typeof company.trip_count === 'number' ? company.trip_count : 0),
    storyHighlights: Array.isArray(company.storyHighlights)
      ? company.storyHighlights.map(String)
      : Array.isArray(company.specialties)
        ? company.specialties.map(String)
        : [],
    publicContactChannel: 'whatsapp_and_inquiry',
    whatsappNumber: safeWhatsApp,
    isVerified: company.isVerified ?? (company.status === 'approved'),
    status: company.status || 'approved',
  };
}
