import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildItineraryUrl, 
  buildVoucherUrl, 
  buildConciergeUrl, 
  generateQRCodeDataUrl, 
  generateQRCodeSvg 
} from './qrCodeUtility';
import { TripFile, TripPassenger, TripService } from './tripStore';

const sampleTrip: TripFile = {
  id: 'trip-101',
  quoteId: 'quote-555',
  fileNumber: 'EG-2026-VIP',
  tourPasscode: 'EG-9481',
  travelerName: 'Sr. Alejandro Garcia',
  startDate: '2026-11-15',
  durationDays: 4,
  status: 'Confirmed',
  arrival: { flight: 'MS 780', date: '2026-11-15', time: '10:00 AM', airport: 'CAI', meetAndAssist: true },
  departure: { flight: 'MS 781', date: '2026-11-19', time: '04:00 PM', airport: 'CAI' },
  guideName: 'Dr. Tarek Omar',
  guidePhone: '+20 100 123 4567',
  guideLanguage: 'Spanish',
  driverName: 'Captain Ahmed',
  driverPhone: '+20 100 987 6543',
  vehiclePlate: 'ABC-1234',
  vehicleType: 'Mercedes Sprinter VIP',
  emergencyContact: '+20 2 2736 1000',
  services: [
    {
      id: 'svc-hotel-1',
      dayNumber: 1,
      serviceName: 'The Nile Ritz-Carlton Deluxe Suite',
      supplierName: 'The Nile Ritz-Carlton',
      supplierType: 'Hotel',
      city: 'Cairo',
      status: 'Confirmed',
      confirmationNo: 'CONF-NRC-992',
      note: 'High floor guaranteed',
    },
  ],
  passengers: [
    {
      id: 'pax-1',
      name: 'Alejandro Garcia',
      nationality: 'Spain',
      type: 'Adult',
      room: 'Room 101 DBL',
      dietary: 'None',
      personalCode: 'GARCIA-01',
    },
  ],
  checklist: [],
  log: [],
  updatedAt: '2026-10-30T10:00:00Z',
};

test('buildItineraryUrl generates canonical URL for tour master passcode', () => {
  const url = buildItineraryUrl(sampleTrip);
  assert.ok(url.includes('?code=EG-9481'), `Expected url to include ?code=EG-9481, got: ${url}`);
});

test('buildItineraryUrl generates canonical URL for individual passenger passcode', () => {
  const pax = sampleTrip.passengers[0];
  const url = buildItineraryUrl(sampleTrip, pax);
  assert.ok(url.includes('?code=GARCIA-01'), `Expected url to include ?code=GARCIA-01, got: ${url}`);
});

test('buildVoucherUrl generates canonical URL with voucher parameters', () => {
  const svc = sampleTrip.services[0];
  const url = buildVoucherUrl(sampleTrip, svc);
  assert.ok(url.includes('view=voucher'), `Expected url to contain view=voucher, got: ${url}`);
  assert.ok(url.includes('fileNumber=EG-2026-VIP'), `Expected url to contain fileNumber, got: ${url}`);
  assert.ok(url.includes('conf=CONF-NRC-992'), `Expected url to contain conf, got: ${url}`);
});

test('buildConciergeUrl generates deep link to traveler concierge', () => {
  const url = buildConciergeUrl(sampleTrip);
  assert.ok(url.includes('view=concierge'), `Expected url to contain view=concierge, got: ${url}`);
  assert.ok(url.includes('quoteId=quote-555'), `Expected url to contain quoteId, got: ${url}`);
});

test('generateQRCodeDataUrl creates valid base64 PNG data URL', async () => {
  const url = buildItineraryUrl(sampleTrip);
  const dataUrl = await generateQRCodeDataUrl(url, { width: 250 });
  assert.ok(dataUrl.startsWith('data:image/png;base64,'), 'Expected data URL to start with data:image/png;base64,');
  assert.ok(dataUrl.length > 100, 'Expected non-trivial data URL length');
});

test('generateQRCodeSvg creates valid SVG string', async () => {
  const url = buildItineraryUrl(sampleTrip);
  const svg = await generateQRCodeSvg(url, { margin: 2, darkColor: '#44200F' });
  assert.ok(svg.includes('<svg'), 'Expected SVG content to contain <svg');
  assert.ok(svg.includes('</svg>'), 'Expected SVG content to contain </svg>');
  assert.ok(svg.includes('#44200F') || svg.includes('#44200f'), 'Expected SVG to use RIHAL Espresso color');
});
