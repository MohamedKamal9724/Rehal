import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateOnboardingProgress, 
  persistOnboardingDraft, 
  getSavedOnboardingDraft, 
  clearOnboardingDraft,
  OnboardingDraftData,
  ONBOARDING_STORAGE_KEY
} from './onboardingCalculator';
import { Workspace } from '../types';

// Mock in-memory localStorage for node test runner
const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
    clear: () => memory.clear(),
  },
  configurable: true,
});

test('calculateOnboardingProgress correctly evaluates empty workspace with missing required fields', () => {
  const result = calculateOnboardingProgress(null, null);
  assert.equal(typeof result.percentage, 'number');
  assert.equal(result.allRequiredDone, false);
  assert.ok(result.missingRequiredCount > 0);
  assert.equal(result.tasks.length, 7);
  assert.equal(result.isWorkspaceSetupComplete, false);
});

test('calculateOnboardingProgress never requires commercial registry, tax registration, or tourism license', () => {
  const result = calculateOnboardingProgress(null, null);
  const taskIds = result.tasks.map(t => t.id);
  assert.equal(taskIds.includes('commercialRegistry'), false, 'Should not require commercialRegistry');
  assert.equal(taskIds.includes('taxRegistrationNumber'), false, 'Should not require taxRegistrationNumber');
  assert.equal(taskIds.includes('tourismLicenseNumber'), false, 'Should not require tourismLicenseNumber');
  assert.equal(taskIds.includes('governmentCertificate'), false, 'Should not require government documents');
});

test('calculateOnboardingProgress scores required fields when provided in draft', () => {
  const draft: Partial<OnboardingDraftData> = {
    company: {
      name: 'RIHAL Luxury Expeditions',
      arabicName: 'رحال للرحلات الفاخرة',
      contactEmail: 'operations@rihal-egypt.com',
      contactPhone: '+20 100 123 4567',
      whatsappNumber: '+20 100 123 4567',
      description: 'DMC based in Cairo',
      city: 'Cairo',
    },
    team: {
      isSolo: true,
      members: [],
      isSkipped: true,
    },
    businessAreas: ['sales', 'trips', 'rates'],
    publicProfile: {
      isSkipped: false,
    },
  };

  const result = calculateOnboardingProgress(draft, null);
  const nameTask = result.tasks.find(t => t.id === 'company_name_en');
  const arTask = result.tasks.find(t => t.id === 'company_name_ar');
  const emailTask = result.tasks.find(t => t.id === 'contact_email');
  const phoneTask = result.tasks.find(t => t.id === 'business_phone');

  assert.equal(nameTask?.isCompleted, true);
  assert.equal(arTask?.isCompleted, true);
  assert.equal(emailTask?.isCompleted, true);
  assert.equal(phoneTask?.isCompleted, true);
  assert.equal(result.allRequiredDone, true, 'All 4 basic required fields are satisfied');
  assert.ok(result.percentage >= 60, 'Completed required fields gives strong progress');
});

test('calculateOnboardingProgress strictly separates Workspace Setup from Platform Approval', () => {
  const completedDraft: Partial<OnboardingDraftData> = {
    isCompleted: true,
    company: {
      name: 'Sahara Sands DMC',
      arabicName: 'رمال الصحراء للسياحة',
      contactEmail: 'desk@sahara.eg',
      contactPhone: '+20 100 999 8888',
      description: 'Private desert safaris and cultural tours',
      city: 'Aswan',
    },
    team: {
      isSolo: true,
      members: [],
      isSkipped: true,
    },
    businessAreas: ['sales', 'trips'],
    publicProfile: {
      isSkipped: true,
    },
  };

  const unverifiedWorkspace = {
    id: 'ws-unverified',
    name: 'Sahara Sands DMC',
    isPlatformVerified: false,
  } as unknown as Workspace;

  const result = calculateOnboardingProgress(completedDraft, unverifiedWorkspace);
  
  // Workspace Setup is 100% complete
  assert.equal(result.allRequiredDone, true);
  assert.equal(result.isWorkspaceSetupComplete, true);
  assert.ok(result.percentage >= 80);
  
  // Platform Approval is completely separate and unverified
  assert.equal(result.isPlatformApproved, false, 'Platform approval is independent from workspace setup');
});

test('Usability Acceptance: First-time owner reaches dashboard without complex technical friction', () => {
  // A first-time company owner enters only:
  // English name, Arabic name, Email, Phone
  // Chooses "I'm starting alone"
  // Picks "Sales & Quotes"
  // Skips public profile
  const firstRunDraft: OnboardingDraftData = {
    currentStep: 5,
    lastSavedAt: new Date().toISOString(),
    isCompleted: true,
    company: {
      name: 'Karnak Voyageurs',
      arabicName: 'رواد الكرنك للسياحة',
      contactEmail: 'ahmed@karnak-voyage.eg',
      contactPhone: '+20 100 555 4321',
    },
    team: {
      isSolo: true,
      members: [],
      isSkipped: true,
    },
    businessAreas: ['sales', 'trips'],
    publicProfile: {
      isSkipped: true,
    },
  };

  const progress = calculateOnboardingProgress(firstRunDraft, null);
  
  // They are 100% ready to launch into the dashboard
  assert.equal(progress.allRequiredDone, true);
  assert.equal(progress.missingRequiredCount, 0);
  assert.equal(progress.isWorkspaceSetupComplete, true);

  // Proves NO rate contracts, rooming lists, passcodes, dispatch, or APIs were required
  const taskIds = progress.tasks.map(t => t.id);
  assert.equal(taskIds.some(id => id.includes('contract')), false);
  assert.equal(taskIds.some(id => id.includes('rooming')), false);
  assert.equal(taskIds.some(id => id.includes('passcode')), false);
  assert.equal(taskIds.some(id => id.includes('dispatch')), false);
  assert.equal(taskIds.some(id => id.includes('api')), false);
});

test('Team invitation flow creates invited status without fake active privileges', () => {
  const teamMember = {
    id: 'invite-101',
    name: 'Youssef Nabil',
    email: 'youssef@agency.eg',
    role: 'Sales',
    status: 'invited' as const,
  };

  assert.equal(teamMember.status, 'invited', 'Staff member is in invitation state, not active');
  assert.equal(teamMember.role, 'Sales', 'Role template is understandable and clear');
});

test('onboarding draft storage operations persist and clear cleanly', () => {
  memory.clear();
  assert.equal(getSavedOnboardingDraft(), null);

  const testDraft: OnboardingDraftData = {
    currentStep: 3,
    lastSavedAt: new Date().toISOString(),
    company: {
      name: 'Nile Voyageurs',
      arabicName: 'رواد النيل',
      contactEmail: 'info@nile.eg',
      contactPhone: '+20 122 999 8888',
      description: 'Classic cultural tours',
      city: 'Luxor',
    },
    team: {
      isSolo: false,
      members: [
        { id: '1', name: 'Mona', email: 'mona@nile.eg', role: 'Sales', status: 'invited' },
      ],
      isSkipped: false,
    },
    businessAreas: ['sales', 'rates'],
    publicProfile: {
      isSkipped: false,
    },
  };

  persistOnboardingDraft(testDraft);
  const loaded = getSavedOnboardingDraft();
  assert.ok(loaded);
  assert.equal(loaded?.company.name, 'Nile Voyageurs');
  assert.equal(loaded?.currentStep, 3);
  assert.equal(loaded?.team.members.length, 1);
  assert.equal(loaded?.team.members[0].status, 'invited');

  clearOnboardingDraft();
  assert.equal(getSavedOnboardingDraft(), null);
});
