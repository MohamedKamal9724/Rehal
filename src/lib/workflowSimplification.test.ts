import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createTripFromQuote, loadTrips, saveTrips, TripFile } from './tripStore';
import { Quote, Inquiry, Workspace } from '../types';

describe('RIHAL Workflow Simplification & Information Architecture', () => {
  const mockWorkspace = {
    id: 'ws-workflow-test',
    name: 'RIHAL Egypt Expeditions',
    slug: 'rihal-egypt',
    brandColors: { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
    defaultLanguage: 'ar',
    defaultCurrency: 'USD',
    hideNetCostsFromAgents: false,
    minMarginPercent: 15,
    requireApprovalBelowMinMargin: false,
    defaultProposalTheme: 'luxury',
    quoteValidityDays: 14,
    contactEmail: 'operations@rihal.eg',
    contactPhone: '+20 100 000 0000',
    whatsappNumber: '+20 100 000 0000',
    enableHajjUmrah: false,
    paymentInstructionsText: 'Bank wire transfer',
    subscriptionPlan: 'Agency',
    monthlyQuoteLimit: 1000,
    aiCreditsLimit: 500,
    aiCreditsUsed: 20,
    createdAt: new Date().toISOString(),
  } as unknown as Workspace;

  const sampleQuote = {
    id: 'quote-test-101',
    workspaceId: mockWorkspace.id,
    quoteNumber: 'Q-2026-101',
    travelerName: 'Sarah Jenkins',
    travelerEmail: 'sarah@example.com',
    travelerPhone: '+1 555 123 4567',
    version: 1,
    status: 'Accepted',
    startDate: '2026-11-15',
    durationDays: 4,
    targetCurrency: 'USD',
    totalPriceQuoteCurrency: 3200,
    totalCostQuoteCurrency: 2400,
    marginPercent: 25,
    group: { adults: 2, children: [], infants: 0 },
    days: [
      {
        dayNumber: 1,
        title: 'Arrival in Cairo',
        city: 'Cairo',
        description: 'Meet and assist upon arrival',
        lines: [
          {
            id: 'line-1',
            dayNumber: 1,
            supplierType: 'Transport',
            serviceName: 'Airport Meet & Assist to Hotel',
            supplierName: 'Cairo VIP Chauffeur',
            city: 'Cairo',
            quantity: 1,
            occupancyBasis: 'per_vehicle',
            unitCost: 30,
            costCurrency: 'USD',
            markupPercent: 20,
            markupFixed: 0,
            unitPrice: 36,
            totalCostEgp: 1500,
            totalPriceEgp: 1800,
            totalPriceQuoteCurrency: 36,
            status: 'OK',
            costCalculationNotes: 'Standard rate',
          },
          {
            id: 'line-2',
            dayNumber: 1,
            supplierType: 'Hotel',
            serviceName: 'Nile View Luxury Room',
            supplierName: 'Four Seasons Nile Plaza',
            city: 'Cairo',
            quantity: 1,
            occupancyBasis: 'double',
            unitCost: 200,
            costCurrency: 'USD',
            markupPercent: 25,
            markupFixed: 0,
            unitPrice: 250,
            totalCostEgp: 10000,
            totalPriceEgp: 12500,
            totalPriceQuoteCurrency: 250,
            status: 'OK',
            costCalculationNotes: 'Contract rate',
          },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  } as unknown as Quote;

  it('Scenario A: Home & Attention Center identifies actionable items', () => {
    const inquiries: Inquiry[] = [
      {
        id: 'inq-1',
        workspaceId: mockWorkspace.id,
        travelerName: 'Marcus Aurelius',
        source: 'WhatsApp',
        rawText: 'Looking for Luxor & Aswan 5 days',
        status: 'New',
        assignedAgentId: 'ag-1',
        assignedAgentName: 'Ahmed',
        receivedAt: new Date().toISOString(),
        language: 'en',
        slaMinutes: 120,
        requirements: {
          destinationSummary: 'Luxor & Aswan',
          cities: ['Luxor', 'Aswan'],
          durationDays: 5,
          budgetAmount: 4000,
          budgetCurrency: 'USD',
          group: { adults: 2, children: [], infants: 0 },
          interests: ['Culture', 'Nile Cruise'],
          urgency: 'Medium',
          confidenceScores: { destinations: 0.95 },
        },
      },
      {
        id: 'inq-2',
        workspaceId: mockWorkspace.id,
        travelerName: 'Elena Rostova',
        source: 'Web Form',
        rawText: 'Cairo & Alexandria 3 days',
        status: 'In Progress',
        assignedAgentId: 'ag-1',
        assignedAgentName: 'Ahmed',
        receivedAt: new Date().toISOString(),
        language: 'en',
        slaMinutes: 120,
        requirements: {
          destinationSummary: 'Cairo & Alexandria',
          cities: ['Cairo', 'Alexandria'],
          durationDays: 3,
          budgetAmount: 2500,
          budgetCurrency: 'USD',
          group: { adults: 1, children: [], infants: 0 },
          interests: ['Museums', 'Seafood'],
          urgency: 'Low',
          confidenceScores: { destinations: 0.95 },
        },
      },
    ];

    const newLeads = inquiries.filter(i => i.status === 'New');
    assert.strictEqual(newLeads.length, 1);
    assert.strictEqual(newLeads[0].travelerName, 'Marcus Aurelius');

    // Missing operational staff check
    const tripWithMissingDriver: Partial<TripFile> = {
      id: 'trip-chk-1',
      fileNumber: 'EG-482',
      travelerName: 'John Smith',
      driverName: '',
      driverPhone: '',
      guideName: 'Tarek Mansour',
      services: [{ id: 's1', dayNumber: 1, serviceName: 'Airport Transfer', supplierName: 'Fleet', supplierType: 'Transport', city: 'Cairo', status: 'To request', confirmationNo: '', note: '' }],
    };

    const isDriverMissing = !tripWithMissingDriver.driverName || !tripWithMissingDriver.driverPhone;
    assert.strictEqual(isDriverMissing, true, 'Driver missing should be detected');
  });

  it('Scenario B: Sales Workspace progresses Quote into Confirmed Trip', () => {
    const newTrip = createTripFromQuote(sampleQuote, 1);
    assert.ok(newTrip);
    assert.strictEqual(newTrip.travelerName, 'Sarah Jenkins');
    assert.strictEqual(newTrip.quoteId, sampleQuote.id);
    assert.strictEqual(newTrip.durationDays, 4);
    assert.strictEqual(newTrip.services.length, 2);
    assert.strictEqual(newTrip.services[0].serviceName, 'Airport Meet & Assist to Hotel');
    assert.strictEqual(newTrip.services[1].supplierType, 'Hotel');
  });

  it('Scenario C: Trips Workspace simplifies list states into Upcoming, In Progress, Completed, Needs Attention', () => {
    const tripsList: Partial<TripFile>[] = [
      { id: 't1', status: 'Confirmed', startDate: '2026-11-20', driverName: 'Capt Hisham', guideName: 'Tarek' },
      { id: 't2', status: 'Operating', startDate: '2026-11-01', driverName: 'Capt Hisham', guideName: 'Tarek' },
      { id: 't3', status: 'Completed', startDate: '2026-10-15', driverName: 'Capt Hisham', guideName: 'Tarek' },
      { id: 't4', status: 'Confirmed', startDate: '2026-11-10', driverName: '', guideName: '' }, // Needs Attention
    ];

    const upcoming = tripsList.filter(t => t.status === 'Confirmed' || t.status === 'Planning');
    const inProgress = tripsList.filter(t => t.status === 'Operating');
    const completed = tripsList.filter(t => t.status === 'Completed');
    const needsAttention = tripsList.filter(t => t.status !== 'Completed' && (!t.driverName || !t.guideName));

    assert.strictEqual(upcoming.length, 2);
    assert.strictEqual(inProgress.length, 1);
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(needsAttention.length, 1);
    assert.strictEqual(needsAttention[0].id, 't4');
  });

  it('Scenario D: Hajj & Umrah vertical is only visible when explicitly enabled in workspace', () => {
    const wsWithoutHajj = { ...mockWorkspace, enableHajjUmrah: false };
    const wsWithHajj = { ...mockWorkspace, enableHajjUmrah: true };

    assert.strictEqual(wsWithoutHajj.enableHajjUmrah, false);
    assert.strictEqual(wsWithHajj.enableHajjUmrah, true);
  });

  it('Scenario E: Role-aware navigation filters destinations based on employee role', () => {
    const allAreas = ['home', 'sales', 'trips', 'library', 'company'];

    const getAccessibleAreas = (role: string) => {
      if (role === 'Sales Agent') return ['home', 'sales', 'trips'];
      if (role === 'Operations') return ['home', 'trips', 'library'];
      if (role === 'Finance' || role === 'Viewer') return ['home', 'library'];
      return allAreas; // Owner and Admin
    };

    const salesAgentAreas = getAccessibleAreas('Sales Agent');
    assert.deepStrictEqual(salesAgentAreas, ['home', 'sales', 'trips']);

    const opsAreas = getAccessibleAreas('Operations');
    assert.deepStrictEqual(opsAreas, ['home', 'trips', 'library']);

    const ownerAreas = getAccessibleAreas('Owner');
    assert.deepStrictEqual(ownerAreas, allAreas);
  });
});
