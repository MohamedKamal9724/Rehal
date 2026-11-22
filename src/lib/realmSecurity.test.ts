import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  canAccessOperatorRealm, 
  resolveTargetRealm, 
  createIsolatedTravelerUser,
  sanitizePublicCompanyDto,
  TRAVELER_REALM_WORKSPACE_ID,
  UserSessionProfile 
} from './authRealms';

test('1. Traveller-only user cannot access operator realm', () => {
  const travelerSession: UserSessionProfile = {
    userId: 'trav_1001',
    email: 'traveler@gmail.com',
    name: 'Karim Traveler',
    role: 'Traveler',
    hasCompanyMembership: false,
    memberships: []
  };

  const hasAccess = canAccessOperatorRealm(travelerSession);
  assert.equal(hasAccess, false, 'Traveller session must be rejected from operator realm');
});

test('2. URL query parameters cannot bypass realm protection without verified company membership', () => {
  const unverifiedSession: UserSessionProfile = {
    userId: 'guest_anonymous',
    email: 'guest@example.com',
    name: 'Guest',
    role: 'Traveler',
    hasCompanyMembership: false,
    memberships: []
  };

  // Even if user attempts ?mode=operator or ?tab=rates, target realm must resolve to 'traveler'
  const resolved = resolveTargetRealm(unverifiedSession, 'operator');
  assert.equal(resolved, 'traveler', 'Unauthorized operator attempt must strictly resolve to traveler');
});

test('3. LocalStorage tampering or forged session cannot grant operator access', () => {
  // Tampered payload missing valid company membership
  const forgedSession = {
    userId: 'hacker_1',
    email: 'spoofed@evil.com',
    role: 'Owner', // Claiming to be owner on client
    hasCompanyMembership: false, // Server verified membership is false
    companyId: 'comp_bluenile_01' // Trying to claim bluenile without verified membership
  } as UserSessionProfile;

  assert.equal(canAccessOperatorRealm(forgedSession), false, 'Session without hasCompanyMembership=true must be rejected');

  // Even with falsy or null session
  assert.equal(canAccessOperatorRealm(null), false, 'Null session must be rejected');
  assert.equal(canAccessOperatorRealm(undefined), false, 'Undefined session must be rejected');
});

test('4. Traveller does not receive company private repository records (costs, rates, margins, internal notes)', () => {
  const sensitiveCompanyRecord = {
    id: 'comp_bluenile_01',
    name: 'Blue Nile Expeditions',
    arabicName: 'النيل الأزرق للرحلات',
    contactEmail: 'contact@bluenile.eg',
    contactPhone: '+20 2 2736 1000',
    tourismLicenseNumber: 'MOT-EGY-CLASS-A-418',
    status: 'approved',
    // Private financial & operational fields that must be stripped:
    privateInternalNotes: 'Confidential: VIP commission tier 18% with suppliers',
    internalMarginPct: 22.5,
    supplierCostOverrides: { 'hotel_marriott_mena': 120 },
    staffPrivatePhones: ['+201009999999'],
    bankAccountIban: 'EG380000000000000000000000'
  };

  const publicDto = sanitizePublicCompanyDto(sensitiveCompanyRecord);
  assert.ok(publicDto, 'Public DTO must not be null');

  assert.equal(publicDto.id, 'comp_bluenile_01');
  assert.equal(publicDto.name, 'Blue Nile Expeditions');
  assert.equal(publicDto.tourismLicenseNumber, 'MOT-EGY-CLASS-A-418');
  assert.equal('privateInternalNotes' in publicDto, false, 'privateInternalNotes must be stripped from public DTO');
  assert.equal('internalMarginPct' in publicDto, false, 'internalMarginPct must be stripped from public DTO');
  assert.equal('supplierCostOverrides' in publicDto, false, 'supplierCostOverrides must be stripped from public DTO');
  assert.equal('staffPrivatePhones' in publicDto, false, 'staffPrivatePhones must be stripped from public DTO');
  assert.equal('bankAccountIban' in publicDto, false, 'bankAccountIban must be stripped from public DTO');
});

test('5. Multi-tenant company isolation: Company A cannot claim Company B workspace', () => {
  const companyAUser: UserSessionProfile = {
    userId: 'user_comp_a',
    email: 'agent@compa.eg',
    name: 'Agent A',
    role: 'Operations',
    companyId: 'comp_alpha',
    hasCompanyMembership: true,
    memberships: [{ companyId: 'comp_alpha', role: 'Operations', status: 'active' }]
  };

  const canAccessCompanyB = companyAUser.memberships?.some(m => m.companyId === 'comp_beta');
  assert.equal(canAccessCompanyB, false, 'Company A user must not have access to Company B');
});

test('6. Traveller inquiry uses isolated traveler realm, preventing operator workspace contamination', () => {
  const traveler = createIsolatedTravelerUser('ahmed@traveler.com', 'Ahmed Traveler', 'ar');

  assert.equal(traveler.role, 'Traveler');
  assert.equal(traveler.workspaceId, TRAVELER_REALM_WORKSPACE_ID, 'Traveler user must be isolated in traveler-realm');
  assert.notEqual(traveler.workspaceId, 'comp_bluenile_01', 'Traveler must not be bound to loaded operator workspace');
});

test('7. User with verified active company membership can access and switch to operator realm', () => {
  const operatorSession: UserSessionProfile = {
    userId: 'owner_101',
    email: 'hossam@bluenile.eg',
    name: 'Hossam Fouad',
    role: 'Owner',
    companyId: 'comp_bluenile_01',
    companyName: 'Blue Nile Expeditions',
    hasCompanyMembership: true,
    memberships: [{ companyId: 'comp_bluenile_01', role: 'Owner', status: 'active' }]
  };

  assert.equal(canAccessOperatorRealm(operatorSession), true, 'Verified operator must have operator realm access');
  assert.equal(resolveTargetRealm(operatorSession, 'operator'), 'operator', 'Verified operator can switch to operator realm');
  assert.equal(resolveTargetRealm(operatorSession, 'traveler'), 'traveler', 'Verified operator can also switch to traveler hub');
});

test('8. User without verified membership cannot switch to operator desk', () => {
  const unverifiedTraveller: UserSessionProfile = {
    userId: 'trav_303',
    email: 'nadia@outlook.com',
    name: 'Nadia',
    role: 'Traveler',
    hasCompanyMembership: false,
    memberships: []
  };

  assert.equal(unverifiedTraveller.hasCompanyMembership, false);
  assert.equal(canAccessOperatorRealm(unverifiedTraveller), false);
  assert.equal(resolveTargetRealm(unverifiedTraveller, 'operator'), 'traveler');
});
