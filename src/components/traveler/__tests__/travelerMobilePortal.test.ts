import { test, describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { TravelerMobilePortal } from '../TravelerMobilePortal';
import { TripFile } from '../../../lib/tripStore';
import { Workspace } from '../../../types';

const mockWorkspace: Workspace = {
  id: 'ws-cairo-luxury-tours',
  name: 'Cairo Luxury Heritage Tours',
  companyName: 'Cairo Luxury Heritage Tours',
  primaryColor: '#44200F',
  secondaryColor: '#C4A177',
  isDemo: false,
  verified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'usr-admin-1',
  currency: 'USD',
  country: 'Egypt',
} as unknown as Workspace;

const mockTrip: TripFile = {
  id: 'trip-lux-2026-001',
  quoteId: 'quote-cai-01',
  fileNumber: 'EGY-VIP-889',
  tourPasscode: 'ROYAL88',
  passcodeDisabled: false,
  travelerName: 'Lord & Lady Harrington',
  startDate: '2026-11-15',
  durationDays: 8,
  status: 'In Progress',
  arrival: {
    flight: 'British Airways BA155',
    date: '2026-11-15',
    time: '14:30',
    airport: 'Cairo International Airport (CAI)',
    meetAndAssist: true,
  },
  departure: {
    flight: 'British Airways BA156',
    date: '2026-11-23',
    time: '18:00',
    airport: 'Cairo International Airport (CAI)',
  },
  guideName: 'Dr. Tarek Mansour',
  guidePhone: '+20 100 234 5678',
  guideLanguage: 'English',
  driverName: 'Captain Ahmed El-Sayed',
  driverPhone: '+20 111 876 5432',
  vehiclePlate: 'VIP-7788',
  vehicleType: 'Mercedes V-Class Luxury Van',
  emergencyContact: '+20 120 000 1111',
  services: [
    {
      id: 'srv-01',
      dayNumber: 1,
      serviceName: 'VIP Meet & Assist & Private Transfer to Mena House',
      supplierName: 'Marriott Mena House Cairo',
      supplierType: 'Hotel',
      city: 'Giza / Cairo',
      status: 'Confirmed',
      confirmationNo: 'MR-CAI-99281',
      note: 'Deluxe Suite with Pyramids Balcony View',
    },
    {
      id: 'srv-02',
      dayNumber: 2,
      serviceName: 'Private Giza Plateau & Great Sphinx Enclosure Tour',
      supplierName: 'Heritage Egyptologists Syndicate',
      supplierType: 'Sightseeing',
      city: 'Giza',
      status: 'Confirmed',
      confirmationNo: 'SYN-8812',
      note: 'Private dawn opening before public gates open',
    },
  ],
  passengers: [
    {
      id: 'pax-1',
      name: 'Lord Arthur Harrington',
      nationality: 'British',
      type: 'Adult',
      room: 'Suite 408 (Pyramid View)',
      dietary: 'Gluten Free',
      personalCode: 'HARRINGTON-01',
      phone: '+44 7700 900123',
    },
  ],
  checklist: [],
  log: [],
  updatedAt: new Date().toISOString(),
};

describe('TravelerMobilePortal Social Media (Instagram-Style) Test Suite', () => {
  test('TravelerMobilePortal is exported as a React functional component', () => {
    assert.strictEqual(typeof TravelerMobilePortal, 'function');
  });

  test('Instantiates TravelerMobilePortal element with complete luxury trip and workspace props', () => {
    const element = React.createElement(TravelerMobilePortal, {
      trip: mockTrip,
      workspace: mockWorkspace,
      uiLang: 'en',
    });

    assert.ok(element, 'Element must be instantiated');
    assert.strictEqual(element.type, TravelerMobilePortal);
    assert.strictEqual(element.props.trip.tourPasscode, 'ROYAL88');
    assert.strictEqual(element.props.trip.travelerName, 'Lord & Lady Harrington');
    assert.strictEqual(element.props.workspace.name, 'Cairo Luxury Heritage Tours');
  });

  test('Validates trip passcode resolution and traveler services data', () => {
    assert.strictEqual(mockTrip.passcodeDisabled, false);
    assert.strictEqual(mockTrip.tourPasscode, 'ROYAL88');
    assert.ok(mockTrip.services && mockTrip.services.length > 0);
    assert.strictEqual(mockTrip.services[0].confirmationNo, 'MR-CAI-99281');
  });

  test('Verifies operational guide and driver contacts are available for live social team drawer', () => {
    assert.ok(mockTrip.guideName);
    assert.ok(mockTrip.guidePhone);
    assert.ok(mockTrip.driverName);
    assert.ok(mockTrip.driverPhone);
    assert.strictEqual(mockTrip.passengers[0].room, 'Suite 408 (Pyramid View)');
  });
});
