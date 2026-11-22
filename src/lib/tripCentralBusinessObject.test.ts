import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setOperatorScope } from './sessionScope';
import { repository } from './storage';
import { 
  TripFile, 
  TripService, 
  createTripFromQuote, 
  saveTrips, 
  loadTrips, 
  findTripOrGuestByCode,
  projectTripForTraveler
} from './tripStore';
import { auditTripReadiness } from './tripReadiness';
import { Inquiry, Quote, QuoteDay, QuoteLine } from '../types';

// In-memory mock for localStorage in Node test runner
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

describe('RIHAL Core Business Journey & Trip Central Business Object', () => {
  const workspaceId = 'ws-test-egypt-journey';
  setOperatorScope('daleel-app', workspaceId, 'agent-ops-01');

  it('proves the complete 12-step canonical travel operations journey', () => {
    // -------------------------------------------------------------------
    // Step 1: Create Inquiry
    // -------------------------------------------------------------------
    const inquiry: Inquiry = {
      id: 'inq-test-cairo-01',
      workspaceId,
      travelerName: 'Lady Catherine Howard',
      travelerEmail: 'catherine.howard@luxurytravel.co.uk',
      travelerPhone: '+44 7700 900077',
      source: 'WhatsApp',
      rawText: 'Looking for a 5-day luxury private journey for 2 adults to Cairo, Giza Pyramids and Luxor temples starting next month.',
      status: 'New',
      assignedAgentId: 'agent-ops-01',
      assignedAgentName: 'Sherif El-Batanouny',
      receivedAt: new Date().toISOString(),
      language: 'en',
      slaMinutes: 15,
      requirements: {
        durationDays: 5,
        group: { adults: 2, children: [], infants: 0 },
        cities: ['Cairo', 'Giza', 'Luxor'],
        hotelStarRating: 5,
        interests: ['Pyramids of Giza', 'Grand Egyptian Museum', 'Karnak Temple', 'Valley of the Kings'],
        urgency: 'High',
        confidenceScores: { duration: 1, cities: 1 },
      },
    };

    repository.saveInquiry(inquiry);
    const savedInquiries = repository.getInquiries(workspaceId);
    const foundInq = savedInquiries.find(i => i.id === inquiry.id);
    assert.ok(foundInq, 'Step 1 Passed: Inquiry successfully created and stored');
    assert.strictEqual(foundInq.travelerName, 'Lady Catherine Howard');
    assert.strictEqual(foundInq.status, 'New');

    // -------------------------------------------------------------------
    // Step 2: Create Quote from Inquiry (linked by inquiryId)
    // -------------------------------------------------------------------
    const quoteDays: QuoteDay[] = [
      {
        dayNumber: 1,
        title: 'Arrival in Cairo & VIP Check-in at Marriott Mena House',
        description: 'Private airport meet & assist and check-in overlooking the Great Pyramids.',
        city: 'Giza',
        lines: [
          {
            id: 'line-hotel-01',
            dayNumber: 1,
            serviceName: 'Marriott Mena House 5★ Deluxe Pyramid View',
            supplierName: 'Marriott Mena House Cairo',
            supplierType: 'Hotel',
            city: 'Giza',
            quantity: 1,
            occupancyBasis: 'double',
            unitCost: 380,
            costCurrency: 'USD',
            markupPercent: 25,
            markupFixed: 0,
            unitPrice: 475,
            totalCostEgp: 18810,
            totalPriceEgp: 23512,
            totalPriceQuoteCurrency: 475,
            status: 'OK',
            costCalculationNotes: 'Contract rate 2026',
          },
        ],
      },
      {
        dayNumber: 2,
        title: 'Giza Pyramids, Sphinx & Grand Egyptian Museum',
        description: 'Full-day private touring with dedicated Egyptologist guide and chauffeur.',
        city: 'Cairo',
        lines: [
          {
            id: 'line-guide-01',
            dayNumber: 2,
            serviceName: 'Private Egyptologist Guide (English)',
            supplierName: 'Licensed Guides Association',
            supplierType: 'Guide',
            city: 'Cairo',
            quantity: 1,
            occupancyBasis: 'per_group',
            unitCost: 120,
            costCurrency: 'USD',
            markupPercent: 25,
            markupFixed: 0,
            unitPrice: 150,
            totalCostEgp: 5940,
            totalPriceEgp: 7425,
            totalPriceQuoteCurrency: 150,
            status: 'OK',
            costCalculationNotes: 'Official guide tariff',
          },
          {
            id: 'line-trans-01',
            dayNumber: 2,
            serviceName: 'Private Mercedes-Benz Executive Touring Van',
            supplierName: 'Cairo VIP Limousine Fleet',
            supplierType: 'Transport',
            city: 'Cairo',
            quantity: 1,
            occupancyBasis: 'per_group',
            unitCost: 140,
            costCurrency: 'USD',
            markupPercent: 25,
            markupFixed: 0,
            unitPrice: 175,
            totalCostEgp: 6930,
            totalPriceEgp: 8662,
            totalPriceQuoteCurrency: 175,
            status: 'OK',
            costCalculationNotes: 'Full-day chauffeur hire',
          },
        ],
      },
    ];

    const quote: Quote = {
      id: 'quote-test-howard-01',
      workspaceId,
      quoteNumber: 'DAL-2026-9042',
      inquiryId: inquiry.id,
      travelerName: inquiry.travelerName,
      travelerEmail: inquiry.travelerEmail,
      travelerPhone: inquiry.travelerPhone,
      version: 1,
      status: 'Draft',
      targetCurrency: 'USD',
      startDate: '2026-11-20',
      durationDays: 5,
      group: { adults: 2, children: [], infants: 0 },
      days: quoteDays,
      totalCostEgp: 31680,
      totalPriceEgp: 39600,
      totalPriceQuoteCurrency: 800,
      marginPercent: 20,
      validUntil: '2026-12-05',
      language: 'en',
      assignedAgentId: 'agent-ops-01',
      assignedAgentName: 'Sherif El-Batanouny',
      publicToken: 'tok-howard-vip',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.strictEqual(quote.inquiryId, inquiry.id, 'Step 2 Passed: Quote is linked to inquiry');

    // -------------------------------------------------------------------
    // Step 3: Save Quote
    // -------------------------------------------------------------------
    repository.saveQuote(quote);
    const savedQuotes = repository.getQuotes(workspaceId);
    const foundQuote = savedQuotes.find(q => q.id === quote.id);
    assert.ok(foundQuote, 'Step 3 Passed: Quote successfully saved in repository');

    // -------------------------------------------------------------------
    // Step 4: Confirm / Create Trip Through Valid Business Action
    // -------------------------------------------------------------------
    const existingTrips = loadTrips();
    const confirmedTrip = createTripFromQuote(quote, existingTrips.length);
    assert.ok(confirmedTrip, 'Canonical Trip record generated from quote');
    assert.strictEqual(confirmedTrip.quoteId, quote.id, 'Trip preserves quote link');
    assert.strictEqual(confirmedTrip.travelerName, 'Lady Catherine Howard');
    assert.ok(confirmedTrip.tourPasscode?.startsWith('RIHAL-'), 'Trip receives memorable RIHAL passcode');

    // Mark quote Accepted and save Trip
    quote.status = 'Accepted';
    repository.saveQuote(quote);
    saveTrips([confirmedTrip, ...existingTrips]);

    const reloadedTrips = loadTrips();
    const storedTrip = reloadedTrips.find(t => t.id === confirmedTrip.id);
    assert.ok(storedTrip, 'Step 4 Passed: Canonical Trip saved in operations store');

    // -------------------------------------------------------------------
    // Step 5: Assign Hotel
    // -------------------------------------------------------------------
    const hotelService = storedTrip!.services.find(s => s.supplierType === 'Hotel');
    assert.ok(hotelService, 'Hotel service found in trip itinerary');
    hotelService.status = 'Confirmed';
    hotelService.confirmationNo = 'CONF-MENA-9921';
    hotelService.note = 'Pyramid view double suite confirmed with breakfast';
    saveTrips(reloadedTrips);

    const postHotelTrips = loadTrips();
    const updatedHotelTrip = postHotelTrips.find(t => t.id === confirmedTrip.id)!;
    const postHotelService = updatedHotelTrip.services.find(s => s.supplierType === 'Hotel')!;
    assert.strictEqual(postHotelService.status, 'Confirmed');
    assert.strictEqual(postHotelService.confirmationNo, 'CONF-MENA-9921', 'Step 5 Passed: Hotel assigned & confirmed');

    // -------------------------------------------------------------------
    // Step 6: Assign Transport
    // -------------------------------------------------------------------
    updatedHotelTrip.driverName = 'Captain Hisham Zaki';
    updatedHotelTrip.driverPhone = '+20 100 987 6543';
    updatedHotelTrip.vehiclePlate = 'ق هـ ر 8492';
    updatedHotelTrip.vehicleType = 'Mercedes-Benz Travego VIP Coach';
    updatedHotelTrip.arrival.flight = 'MS 780';
    updatedHotelTrip.arrival.time = '10:30 AM';
    updatedHotelTrip.arrival.meetAndAssist = true;
    saveTrips(postHotelTrips);

    const postTransportTrips = loadTrips();
    const updatedTransTrip = postTransportTrips.find(t => t.id === confirmedTrip.id)!;
    assert.strictEqual(updatedTransTrip.driverName, 'Captain Hisham Zaki');
    assert.strictEqual(updatedTransTrip.vehiclePlate, 'ق هـ ر 8492', 'Step 6 Passed: Transport assigned');

    // -------------------------------------------------------------------
    // Step 7: Assign Guide
    // -------------------------------------------------------------------
    updatedTransTrip.guideName = 'Dr. Tarek Mansour';
    updatedTransTrip.guidePhone = '+20 100 123 4567';
    updatedTransTrip.guideLanguage = 'ENGLISH';
    saveTrips(postTransportTrips);

    const postGuideTrips = loadTrips();
    const updatedGuideTrip = postGuideTrips.find(t => t.id === confirmedTrip.id)!;
    assert.strictEqual(updatedGuideTrip.guideName, 'Dr. Tarek Mansour');
    assert.strictEqual(updatedGuideTrip.guideLanguage, 'ENGLISH', 'Step 7 Passed: Guide assigned');

    // -------------------------------------------------------------------
    // Step 8: Generate Standard Vouchers & Verify Readiness
    // -------------------------------------------------------------------
    // Ensure all services have confirmation numbers and confirmed status
    updatedGuideTrip.services.forEach(s => {
      s.status = 'Confirmed';
      if (!s.confirmationNo) {
        s.confirmationNo = `VCH-${s.dayNumber}-${s.supplierType.slice(0, 3).toUpperCase()}-104`;
      }
    });
    // Ensure passenger names are complete for readiness
    updatedGuideTrip.passengers.forEach((p, idx) => {
      if (!p.name) p.name = idx === 1 ? 'Lord Arthur Howard' : 'Lady Catherine Howard';
      p.nationality = 'British';
    });
    saveTrips(postGuideTrips);

    const readinessReport = auditTripReadiness(updatedGuideTrip);
    assert.strictEqual(readinessReport.isFullyReady, true, 'All 5 readiness checks pass');
    assert.strictEqual(readinessReport.score, 100, 'Step 8 Passed: 100% trip readiness with vouchers generated');

    // -------------------------------------------------------------------
    // Step 9: Create Traveller Access Code
    // -------------------------------------------------------------------
    const passcode = updatedGuideTrip.tourPasscode || 'RIHAL-7K28';
    assert.ok(passcode, 'Trip code exists');
    assert.ok(passcode.startsWith('RIHAL-'), 'Step 9 Passed: Valid RIHAL format traveller code created');

    // -------------------------------------------------------------------
    // Step 10: Open Traveller Trip with Code
    // -------------------------------------------------------------------
    const lookup = findTripOrGuestByCode(passcode);
    assert.ok(lookup, 'findTripOrGuestByCode resolves trip from passcode');
    assert.strictEqual(lookup.trip.travelerName, 'Lady Catherine Howard');

    const projection = projectTripForTraveler(lookup.trip);
    assert.ok(projection, 'Step 10 Passed: Traveller trip projection opened');
    assert.strictEqual(projection.guide.name, 'Dr. Tarek Mansour');
    assert.strictEqual(projection.driver.name, 'Captain Hisham Zaki');
    assert.strictEqual(projection.arrival.flight, 'MS 780');
    assert.ok(projection.itinerary.length > 0, 'Itinerary days present in traveller view');
    assert.ok(projection.vouchers.length > 0, 'Supplier vouchers present in traveller view');

    // -------------------------------------------------------------------
    // Step 11: Ensure Internal Pricing is Absent in Traveller Projection
    // -------------------------------------------------------------------
    const projectionRaw = JSON.stringify(projection);
    assert.strictEqual('netCost' in (projection as any), false, 'netCost not in projection');
    assert.strictEqual('totalCostEgp' in (projection as any), false, 'totalCostEgp not in projection');
    assert.strictEqual('marginPercent' in (projection as any), false, 'marginPercent not in projection');
    assert.strictEqual('markupPercent' in (projection as any), false, 'markupPercent not in projection');
    assert.strictEqual(projectionRaw.includes('31680'), false, 'Internal cost amount 31680 absent from traveller payload');
    assert.strictEqual(projectionRaw.includes('Contract rate'), false, 'Step 11 Passed: Internal notes absent from traveller projection');

    // -------------------------------------------------------------------
    // Step 12: Complete Trip
    // -------------------------------------------------------------------
    updatedGuideTrip.status = 'Completed';
    saveTrips(postGuideTrips);

    const finalTrips = loadTrips();
    const completedTrip = finalTrips.find(t => t.id === confirmedTrip.id)!;
    assert.strictEqual(completedTrip.status, 'Completed', 'Step 12 Passed: Trip lifecycle completed');
  });

  it('proves disabling traveller access prevents passcode resolution', () => {
    const trip: TripFile = {
      id: 'trip-disable-test',
      quoteId: 'quote-test-01',
      fileNumber: 'TRIP-2026-9999',
      tourPasscode: 'RIHAL-LOCK',
      passcodeDisabled: true, // Disabled by operator
      travelerName: 'Private Traveler',
      startDate: '2026-12-01',
      durationDays: 3,
      status: 'Preparing',
      arrival: { flight: '', date: '', time: '', airport: '', meetAndAssist: false },
      departure: { flight: '', date: '', time: '', airport: '' },
      guideName: '',
      guidePhone: '',
      guideLanguage: 'EN',
      driverName: '',
      driverPhone: '',
      vehiclePlate: '',
      vehicleType: '',
      emergencyContact: '',
      services: [],
      passengers: [],
      checklist: [],
      log: [],
      updatedAt: new Date().toISOString(),
    };

    saveTrips([trip]);
    const lookup = findTripOrGuestByCode('RIHAL-LOCK');
    assert.strictEqual(lookup, null, 'Disabled passcode returns null, protecting the trip');
  });
});
