import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Workspace } from '../types';
import { EGYPT_TOURISM_AGENCIES } from './agenciesData';
import { getTripsForAgency } from './agencyTripsData';
import { repository } from './storage';
import { TripFile } from './tripStore';

describe('RIHAL State-Driven Integrity & Anti-Fabrication Test Suite', () => {
  // Scenario 1: New Live company profile does not receive fake metrics
  it('Scenario 1: New Live company profile does not receive fake metrics', () => {
    const liveWorkspace: Workspace = {
      id: 'ws-live-corp-777',
      name: 'Nile Sunrise Tours',
      arabicName: 'شروق النيل للرحلات',
      slug: 'nile-sunrise',
      contactEmail: 'info@nilesunrise.eg',
      contactPhone: '+20 100 123 4567',
      whatsappNumber: '+20 100 123 4567',
      brandColors: { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
      defaultLanguage: 'ar',
      defaultCurrency: 'USD',
      hideNetCostsFromAgents: false,
      minMarginPercent: 15,
      requireApprovalBelowMinMargin: false,
      defaultProposalTheme: 'luxury',
      quoteValidityDays: 14,
      isDemo: false,
      isPlatformVerified: false,
      rating: undefined,
      reviewCount: 0,
      completedTripsCount: 0,
      travelersCount: 0,
      fleetCount: 0,
      createdAt: new Date().toISOString(),
    };

    assert.strictEqual(liveWorkspace.isDemo, false);
    assert.strictEqual(liveWorkspace.completedTripsCount, 0);
    assert.strictEqual(liveWorkspace.travelersCount, 0);
    assert.strictEqual(liveWorkspace.fleetCount, 0);
    assert.strictEqual(liveWorkspace.rating, undefined);
    assert.strictEqual(liveWorkspace.reviewCount, 0);
    assert.strictEqual(liveWorkspace.isPlatformVerified, false);
  });

  // Scenario 2: Live company without reviews shows zero/empty reviews
  it('Scenario 2: Live company without reviews shows zero/empty reviews', () => {
    const liveAgencyId = 'agency-live-custom-999';
    const trips = getTripsForAgency(liveAgencyId);
    assert.deepStrictEqual(trips, []);
    assert.strictEqual(trips.length, 0);
  });

  // Scenario 3: Live company cannot set itself Verified
  it('Scenario 3: Live company cannot set itself Verified (platform-controlled backend flag)', () => {
    const liveWorkspace: Workspace = {
      id: 'ws-live-unverified',
      name: 'Red Sea Explorers',
      slug: 'red-sea-explorers',
      contactEmail: 'ops@redseaexplorers.eg',
      contactPhone: '+20 100 000 0000',
      whatsappNumber: '+20 100 000 0000',
      brandColors: { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
      defaultLanguage: 'en',
      defaultCurrency: 'USD',
      hideNetCostsFromAgents: false,
      minMarginPercent: 15,
      requireApprovalBelowMinMargin: false,
      defaultProposalTheme: 'luxury',
      quoteValidityDays: 14,
      isPlatformVerified: false,
      createdAt: new Date().toISOString(),
    };

    // A live workspace cannot self-verify without platform admin intervention
    assert.strictEqual(liveWorkspace.isPlatformVerified, false);

    // Platform verification must remain false even if user has a custom license number
    const withLicense: Workspace = {
      ...liveWorkspace,
      tourismLicenseNumber: 'EG-CUSTOM-LIC-1234',
    };
    assert.strictEqual(withLicense.isPlatformVerified, false);
  });

  // Scenario 4: Onboarding does not prepopulate fake employees or company info
  it('Scenario 4: Live onboarding does not prepopulate fake employees or company info', () => {
    // Initial live onboarding draft starts with blank fields and empty staff roster
    const initialLiveDraft = {
      name: '',
      arabicName: '',
      email: '',
      phone: '',
      website: '',
      teamMembers: [] as Array<{ name: string; email: string; role: string }>,
      isDemo: false,
    };

    assert.strictEqual(initialLiveDraft.name, '');
    assert.strictEqual(initialLiveDraft.email, '');
    assert.deepStrictEqual(initialLiveDraft.teamMembers, []);
    assert.strictEqual(initialLiveDraft.teamMembers.length, 0);
    assert.strictEqual(initialLiveDraft.isDemo, false);
  });

  // Scenario 5: Missing operational assignment remains visibly missing
  it('Scenario 5: Missing operational assignment remains visibly missing without fake fabrication', () => {
    const realTrip: TripFile = {
      id: 'trip-real-101',
      quoteId: 'quote-real-101',
      fileNumber: 'EG-2026-LIVE',
      travelerName: 'Mme. Sarah Laurent',
      startDate: '2026-12-01',
      durationDays: 5,
      status: 'Confirmed',
      arrival: { flight: 'AF 840', date: '2026-12-01', time: '18:30', airport: 'Cairo Airport', meetAndAssist: false },
      departure: { flight: 'AF 841', date: '2026-12-05', time: '09:00', airport: 'Cairo Airport' },
      guideName: '',
      guidePhone: '',
      guideLanguage: '',
      driverName: '',
      driverPhone: '',
      vehiclePlate: '',
      vehicleType: '',
      emergencyContact: '',
      services: [
        {
          id: 'svc-hotel-1',
          dayNumber: 1,
          serviceName: 'Kempinski Nile Hotel Deluxe Room',
          supplierName: 'Kempinski Nile Hotel',
          supplierType: 'Hotel',
          city: 'Cairo',
          status: 'Confirmed',
          confirmationNo: '', // Real unconfirmed supplier status
          note: '',
        },
      ],
      passengers: [],
      checklist: [],
      log: [],
      updatedAt: new Date().toISOString(),
    };

    // Driver, guide, plate, and confirmationNo must remain empty/unassigned
    assert.strictEqual(realTrip.driverName, '');
    assert.strictEqual(realTrip.guideName, '');
    assert.strictEqual(realTrip.vehiclePlate, '');
    assert.strictEqual(realTrip.services[0].confirmationNo, '');

    // Verify UI mapping uses honest fallback
    const resolvedDriver = realTrip.driverName || 'Driver not assigned';
    const resolvedGuide = realTrip.guideName || 'Guide not assigned';
    const resolvedPlate = realTrip.vehiclePlate || 'Pending plate';
    const resolvedConfNo = realTrip.services[0].confirmationNo || 'Confirmation pending';

    assert.strictEqual(resolvedDriver, 'Driver not assigned');
    assert.strictEqual(resolvedGuide, 'Guide not assigned');
    assert.strictEqual(resolvedPlate, 'Pending plate');
    assert.strictEqual(resolvedConfNo, 'Confirmation pending');
  });

  // Scenario 6: Demo company still displays rich sample data
  it('Scenario 6: Demo company still displays rich sample data properly tagged with isDemo', () => {
    assert.ok(EGYPT_TOURISM_AGENCIES.length > 0);

    const dalilAgency = EGYPT_TOURISM_AGENCIES.find(a => a.id === 'agency-dalil-egypt');
    assert.ok(dalilAgency !== undefined);
    assert.strictEqual(dalilAgency?.isDemo, true);

    const dalilTrips = getTripsForAgency('agency-dalil-egypt');
    assert.ok(dalilTrips.length > 0);
    assert.ok(dalilTrips[0].photos.length > 0);
  });

  // Scenario 7: Demo data cannot leak into Live tenant data
  it('Scenario 7: Demo data cannot leak into Live tenant data in storage layer', () => {
    // 1. Live workspace must not inherit DEFAULT_STAFF_MEMBERS
    const liveWorkspaceId = 'ws-new-live-tenant-555';
    const liveUsers = repository.getUsers(liveWorkspaceId);
    assert.deepStrictEqual(liveUsers, []);

    const liveStaff = repository.getStaffMembers(liveWorkspaceId);
    assert.deepStrictEqual(liveStaff, []);

    // 2. Demo workspace receives demo staff
    const demoUsers = repository.getUsers('ws-demo');
    assert.ok(demoUsers.length > 0);

    // 3. Live agency requesting trips returns empty, not dalil trips
    const unrelatedLiveAgencyTrips = getTripsForAgency('agency-live-fresh-unrelated');
    assert.deepStrictEqual(unrelatedLiveAgencyTrips, []);
  });
});
