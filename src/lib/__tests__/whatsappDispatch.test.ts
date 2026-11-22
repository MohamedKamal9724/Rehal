import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  formatTripDispatchMessage, 
  buildWhatsAppTripDispatchLink,
  buildTripPortalUrl
} from '../whatsappDispatch';
import { TripFile } from '../tripStore';
import { Workspace } from '../../types';

describe('1-Click WhatsApp Trip Code Dispatch Engine', () => {
  const mockWorkspace: Workspace = {
    id: 'ws-test',
    name: 'Nile Jewels Travel',
    arabicName: 'جواهر النيل للسياحة',
    createdAt: '2026-01-01',
    contactEmail: 'info@nilejewels.eg',
    contactPhone: '+20 100 123 4567',
    whatsappNumber: '+20 100 123 4567',
  } as unknown as Workspace;

  const mockTrip: TripFile = {
    id: 'trip-101',
    quoteId: 'q-101',
    fileNumber: 'EG-CAI-7491',
    tourPasscode: 'EG-CAI-7491',
    travelerName: 'Alexander Wright',
    startDate: '2026-11-20',
    durationDays: 7,
    status: 'Operating',
    arrival: { flight: 'MS777', date: '2026-11-20', time: '14:00', airport: 'CAI', meetAndAssist: true },
    departure: { flight: 'MS778', date: '2026-11-27', time: '10:00', airport: 'CAI' },
    guideName: 'Tamer Hosny',
    guidePhone: '+20 100 555 1234',
    guideLanguage: 'English',
    driverName: 'Mahmoud Hassan',
    driverPhone: '+20 101 222 3333',
    vehiclePlate: 'ط ر ج 7842',
    vehicleType: 'Toyota HiAce VIP',
    emergencyContact: '+20 100 123 4567',
    services: [],
    passengers: [
      { id: 'pax-1', name: 'Alexander Wright', nationality: 'British', type: 'Adult', room: '101', dietary: 'None', personalCode: 'WRIGHT-01' },
      { id: 'pax-2', name: 'Eleanor Wright', nationality: 'British', type: 'Adult', room: '101', dietary: 'Vegetarian', personalCode: 'WRIGHT-02' },
    ],
    checklist: [],
    log: [],
    updatedAt: new Date().toISOString(),
  };

  it('builds a valid trip portal URL with code param', () => {
    const url = buildTripPortalUrl('EG-CAI-7491');
    assert.ok(url.includes('code=EG-CAI-7491'));
  });

  it('formats hospitality-grade Arabic dispatch message with guest and guide details', () => {
    const msg = formatTripDispatchMessage({
      trip: mockTrip,
      workspace: mockWorkspace,
      uiLang: 'ar',
    });

    assert.ok(msg.includes('جواهر النيل للسياحة'));
    assert.ok(msg.includes('Alexander Wright'));
    assert.ok(msg.includes('EG-CAI-7491'));
    assert.ok(msg.includes('Tamer Hosny'));
    assert.ok(msg.includes('Mahmoud Hassan'));
    assert.ok(msg.includes('code=EG-CAI-7491'));
  });

  it('formats hospitality-grade English dispatch message for specific passenger', () => {
    const msg = formatTripDispatchMessage({
      trip: mockTrip,
      passenger: mockTrip.passengers[1],
      workspace: mockWorkspace,
      uiLang: 'en',
    });

    assert.ok(msg.includes('Eleanor Wright'));
    assert.ok(msg.includes('WRIGHT-02'));
    assert.ok(msg.includes('Nile Jewels Travel'));
    assert.ok(msg.includes('code=WRIGHT-02'));
  });

  it('generates a valid wa.me link with encoded text message', () => {
    const link = buildWhatsAppTripDispatchLink({
      trip: mockTrip,
      workspace: mockWorkspace,
      uiLang: 'ar',
      customPhoneNumber: '+20 100 999 8888',
    });

    assert.ok(link.startsWith('https://wa.me/201009998888?text='));
    assert.ok(link.includes(encodeURIComponent('EG-CAI-7491')));
  });
});
