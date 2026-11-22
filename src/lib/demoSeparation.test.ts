process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { isDemoTripCode, isDemoCompany, getDemoNotice } from './demoConfig';
import { app } from '../../server';
import { initializeNeonDatabase } from '../db/neonClient';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr: any = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test('Demo Separation: isDemoTripCode accurately flags demo trip codes', () => {
  assert.equal(isDemoTripCode('DALEEL-784'), true);
  assert.equal(isDemoTripCode('daleel-784'), true);
  assert.equal(isDemoTripCode('DEMO-784'), true);
  assert.equal(isDemoTripCode('DEMO-LUXOR'), true);
  assert.equal(isDemoTripCode('REAL-BOOKING-999'), false);
  assert.equal(isDemoTripCode(''), false);
});

test('Demo Separation: isDemoCompany accurately identifies seeded companies', () => {
  assert.equal(isDemoCompany('comp_bluenile_01'), true);
  assert.equal(isDemoCompany('comp_cairo_dmc_02'), true);
  assert.equal(isDemoCompany('comp_live_customer_123'), false);
});

test('Demo Separation: /api/traveler/trip-lookup marks demo queries with isDemo: true', async () => {
  const res = await fetch(`${baseUrl}/api/traveler/trip-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripCode: 'DALEEL-784' }),
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.isDemo, true);
  assert.equal(body.trip.tripCode, 'DALEEL-784');
});

test('Demo Separation: /api/traveler/trip-lookup rejects invalid/fictional codes strictly with 404', async () => {
  const res = await fetch(`${baseUrl}/api/traveler/trip-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripCode: 'NON-EXISTENT-CODE-999' }),
  });

  const body = await res.json();
  assert.equal(res.status, 404);
  assert.equal(body.error, 'TRIP_NOT_FOUND');
  assert.equal(body.trip, undefined, 'Must NEVER fabricate itineraries for unknown codes');
});

test('Demo Separation: getDemoNotice yields clear bilingual advisory', () => {
  const noticeAr = getDemoNotice('dispatch', true);
  const noticeEn = getDemoNotice('dispatch', false);

  assert.ok(noticeAr.includes('وضع تجريبي'));
  assert.ok(noticeEn.includes('Demo Mode'));
});
