import { Workspace } from '../types';
import { getOperatorScope } from './sessionScope';
import { validateEgyptianPhone } from './phone';

export interface OnboardingTaskItem {
  id: string;
  stepNumber: number;
  category: 'company' | 'team' | 'use_cases' | 'profile';
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  weight: number;
  isRequired: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  quickActionTab?: string;
  quickActionSubTab?: string;
}

export interface OnboardingProgressScore {
  percentage: number;
  totalTasks: number;
  completedTasks: number;
  requiredCompleted: number;
  totalRequired: number;
  optionalCompleted: number;
  totalOptional: number;
  tasks: OnboardingTaskItem[];
  allRequiredDone: boolean;
  missingRequiredCount: number;
  // Separation of Workspace Setup from Platform Approval
  isWorkspaceSetupComplete: boolean;
  isPlatformApproved: boolean;
}

export interface OnboardingDraftData {
  currentStep: number;
  lastSavedAt: string;
  isCompleted?: boolean;
  account?: {
    name: string;
    email: string;
    photoUrl?: string;
    isVerified: boolean;
  };
  company: {
    name: string;
    arabicName: string;
    contactEmail: string;
    contactPhone: string;
    whatsappNumber?: string;
    description?: string;
    city?: string;
    website?: string;
    logoUrl?: string;
    coverImageUrl?: string;
  };
  team: {
    isSolo: boolean;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      phone?: string;
      status: 'invited' | 'active';
    }>;
    isSkipped: boolean;
  };
  businessAreas: string[]; // 'sales', 'trips', 'rates', 'hajj_umrah', 'showcase'
  publicProfile: {
    tagline?: string;
    taglineAr?: string;
    destinations?: string[];
    galleryPhotos?: Array<{
      id: string;
      url: string;
      caption: string;
      category: string;
    }>;
    isSkipped: boolean;
  };
  destinationAction?: 'inquiry' | 'quote' | 'dashboard';
}

export const ONBOARDING_STORAGE_KEY = 'daleel_onboarding_draft';

/**
 * Calculates genuine state-driven workspace setup completion percentage.
 * Strictly separates Workspace Setup from Platform Approval.
 * Arabic company name is optional; English name renders as fallback whenever Arabic name is blank.
 * Never requires or audits government documents (tourism license, commercial registry, tax ID).
 */
export function calculateOnboardingProgress(
  data: Partial<OnboardingDraftData> | null,
  workspace?: Workspace | null
): OnboardingProgressScore {
  const company = data?.company || {
    name: workspace?.name && workspace.name !== 'unconfigured' ? workspace.name : '',
    arabicName: workspace?.arabicName || '',
    contactEmail: workspace?.contactEmail || '',
    contactPhone: workspace?.contactPhone || '',
    whatsappNumber: workspace?.whatsappNumber || '',
    description: workspace?.description || '',
    city: workspace?.coveredDestinations?.[0] || 'Cairo',
    website: '',
    logoUrl: workspace?.logoUrl || '',
    coverImageUrl: workspace?.coverImageUrl || '',
  };

  const teamMembers = data?.team?.members || [];
  const isSolo = data?.team?.isSolo ?? true;
  const isTeamSkipped = data?.team?.isSkipped ?? false;
  const businessAreas = data?.businessAreas || ['sales', 'trips'];
  const publicProfile = data?.publicProfile || { isSkipped: false };

  const primaryPhone = (company.contactPhone || company.whatsappNumber || '').trim();
  const isPhoneValid = primaryPhone.length > 0 && validateEgyptianPhone(primaryPhone).valid;

  const tasks: OnboardingTaskItem[] = [
    // Step 1: Your Company
    {
      id: 'company_name_en',
      stepNumber: 1,
      category: 'company',
      labelEn: 'Company Name in English',
      labelAr: 'اسم الشركة بالإنجليزية',
      descriptionEn: 'Official trading name for quotes, vouchers and partner correspondence.',
      descriptionAr: 'الاسم التجاري للشركة المطبوع على عروض الأسعار وقسائم التشغيل.',
      weight: 20,
      isRequired: true,
      isCompleted: Boolean(company.name && company.name.trim() && company.name !== 'unconfigured'),
      isSkipped: false,
      quickActionTab: 'settings',
      quickActionSubTab: 'agency',
    },
    {
      id: 'company_name_ar',
      stepNumber: 1,
      category: 'company',
      labelEn: 'Company Name in Arabic (Optional)',
      labelAr: 'اسم الشركة بالعربية (اختياري)',
      descriptionEn: 'Optional Arabic brand name; English name is used automatically if left blank.',
      descriptionAr: 'اسم عربي اختياري للشركة؛ يتم استخدام الاسم الإنجليزي تلقائياً عند تركه فارغاً.',
      weight: 10,
      isRequired: false,
      isCompleted: Boolean(company.arabicName && company.arabicName.trim()),
      isSkipped: false,
      quickActionTab: 'settings',
      quickActionSubTab: 'agency',
    },
    {
      id: 'contact_email',
      stepNumber: 1,
      category: 'company',
      labelEn: 'Contact Email',
      labelAr: 'البريد الإلكتروني للعمليات',
      descriptionEn: 'Operations email address for partner communications and bookings.',
      descriptionAr: 'البريد الرسمي للتواصل واستقبال الطلبات وتأكيدات الحجز.',
      weight: 20,
      isRequired: true,
      isCompleted: Boolean(company.contactEmail && company.contactEmail.includes('@') && !company.contactEmail.includes('placeholder')),
      isSkipped: false,
      quickActionTab: 'settings',
      quickActionSubTab: 'agency',
    },
    {
      id: 'business_phone',
      stepNumber: 1,
      category: 'company',
      labelEn: 'Contact Phone / WhatsApp',
      labelAr: 'رقم الهاتف والواتساب',
      descriptionEn: 'Direct Egyptian phone or WhatsApp for partner and traveler coordination.',
      descriptionAr: 'رقم الاتصال أو الواتساب المصري المباشر لإدارة العمليات والتواصل.',
      weight: 20,
      isRequired: true,
      isCompleted: isPhoneValid,
      isSkipped: false,
      quickActionTab: 'settings',
      quickActionSubTab: 'agency',
    },

    // Step 2: Team (Solo or Invites)
    {
      id: 'team_decision',
      stepNumber: 2,
      category: 'team',
      labelEn: 'Team Structure Defined',
      labelAr: 'تحديد هيكل فريق العمل',
      descriptionEn: 'Work alone or invite sales, operations and finance colleagues.',
      descriptionAr: 'البدء بمفردك أو دعوة فريق المبيعات والتشغيل والمالية.',
      weight: 10,
      isRequired: false,
      isCompleted: isSolo || teamMembers.length > 0 || isTeamSkipped,
      isSkipped: isTeamSkipped,
      quickActionTab: 'team',
    },

    // Step 3: Business Workflows
    {
      id: 'business_focus',
      stepNumber: 3,
      category: 'use_cases',
      labelEn: 'Primary Business Workflows Selected',
      labelAr: 'تحديد مجالات العمل الأساسية',
      descriptionEn: 'Personalize navigation and shortcuts (Sales, Trips, Rates, Hajj & Umrah, Showcase).',
      descriptionAr: 'تخصيص مساحة العمل واختصارات التنقل حسب نشاط الشركة.',
      weight: 10,
      isRequired: false,
      isCompleted: businessAreas.length > 0,
      isSkipped: false,
      quickActionTab: 'dashboard',
    },

    // Step 4: Public Profile (Optional / Skippable)
    {
      id: 'public_profile',
      stepNumber: 4,
      category: 'profile',
      labelEn: 'Public Agency Profile & Visuals',
      labelAr: 'الملف التعريفي العام والهوية',
      descriptionEn: 'Logo, cover image, public overview and destinations.',
      descriptionAr: 'شعار الشركة، صورة الغلاف، النبذة التعريفية والمدن المغطاة.',
      weight: 10,
      isRequired: false,
      isCompleted: Boolean(company.logoUrl || company.coverImageUrl || company.description || publicProfile.isSkipped),
      isSkipped: Boolean(publicProfile.isSkipped),
      quickActionTab: 'agency_showcase',
    },
  ];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const requiredTasks = tasks.filter(t => t.isRequired);
  const requiredCompleted = requiredTasks.filter(t => t.isCompleted).length;
  const optionalTasks = tasks.filter(t => !t.isRequired);
  const optionalCompleted = optionalTasks.filter(t => t.isCompleted).length;

  const earnedWeight = tasks.reduce((sum, t) => sum + (t.isCompleted ? t.weight : 0), 0);
  const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0); // 100

  const percentage = Math.min(100, Math.max(0, Math.round((earnedWeight / totalWeight) * 100)));
  const allRequiredDone = requiredCompleted === requiredTasks.length;

  // Separation of Workspace Setup from Platform Approval:
  const isWorkspaceSetupComplete = allRequiredDone && (percentage >= 70 || Boolean(data?.isCompleted));
  const isPlatformApproved = Boolean(workspace?.isPlatformVerified);

  return {
    percentage,
    totalTasks,
    completedTasks,
    requiredCompleted,
    totalRequired: requiredTasks.length,
    optionalCompleted,
    totalOptional: optionalTasks.length,
    tasks,
    allRequiredDone,
    missingRequiredCount: requiredTasks.length - requiredCompleted,
    isWorkspaceSetupComplete,
    isPlatformApproved,
  };
}

function getScopedDraftKey(): string {
  const scope = getOperatorScope();
  return scope ? `${ONBOARDING_STORAGE_KEY}::${scope}` : ONBOARDING_STORAGE_KEY;
}

/**
 * Loads draft onboarding state from scoped local storage.
 */
export function getSavedOnboardingDraft(): OnboardingDraftData | null {
  try {
    const raw = localStorage.getItem(getScopedDraftKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Fetches server-persisted onboarding progress for exact step resume across reloads/devices.
 */
export async function fetchOnboardingDraftFromServer(token?: string | null): Promise<OnboardingDraftData | null> {
  if (!token) return null;
  try {
    const res = await fetch('/api/operator/onboarding-progress', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.draft && typeof data.draft === 'object') {
      try {
        localStorage.setItem(getScopedDraftKey(), JSON.stringify(data.draft));
      } catch {}
      return data.draft as OnboardingDraftData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves draft onboarding state to scoped local storage and syncs with backend.
 */
export async function persistOnboardingDraft(draft: OnboardingDraftData, token?: string | null): Promise<boolean> {
  try {
    localStorage.setItem(getScopedDraftKey(), JSON.stringify(draft));
  } catch {
    // Ignore local storage errors
  }

  if (!token) return false;
  try {
    const res = await fetch('/api/operator/onboarding-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(draft),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Clears saved onboarding draft upon full completion.
 */
export function clearOnboardingDraft(): void {
  try {
    localStorage.removeItem(getScopedDraftKey());
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {}
}
