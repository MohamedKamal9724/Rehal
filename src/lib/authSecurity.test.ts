process.env.NODE_ENV = 'test';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server';
import { inMemoryDb, initializeNeonDatabase } from '../db/neonClient';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await initializeNeonDatabase();
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

test('Security Audit: /api/auth/login requires password and rejects empty password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@bluenile-tours.eg' }),
  });

  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error, 'INVALID_INPUT');
});

test('Security Audit: /api/auth/login rejects incorrect password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@bluenile-tours.eg',
      password: 'WrongPassword123!',
    }),
  });

  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.error, 'INVALID_CREDENTIALS');
});

test('Security Audit: /api/auth/login verifies correct PBKDF2 password and returns session', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@bluenile-tours.eg',
      password: 'Demo123456',
    }),
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.token, 'Should issue valid token');
  assert.equal(body.user.email, 'owner@bluenile-tours.eg');
  assert.equal(body.user.role, 'Owner');
});

test('Security Audit: /api/auth/login rejects non-existent email without auto-creating user', async () => {
  const testEmail = `attacker_${Date.now()}@fraud.com`;
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!',
    }),
  });

  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.error, 'INVALID_CREDENTIALS');

  // Verify attacker was NOT created in memory DB
  let found = false;
  for (const u of inMemoryDb.users.values()) {
    if (u.email === testEmail) {
      found = true;
      break;
    }
  }
  assert.equal(found, false, 'User must not be automatically created on failed login');
});

test('Security Audit: /api/auth/latest-neon-user endpoint is completely removed', async () => {
  const res = await fetch(`${baseUrl}/api/auth/latest-neon-user`);
  assert.equal(res.status, 404, 'Endpoint must be 404 removed');
});

test('Security Audit: HMAC session token signature tampering is rejected', async () => {
  // 1. Valid login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@bluenile-tours.eg',
      password: 'Demo123456',
    }),
  });
  const loginBody = await loginRes.json();
  const validToken = loginBody.token;
  assert.ok(validToken);

  // 2. Tamper payload to elevate privileges
  const [b64Data, sig] = validToken.split('.');
  const payload = JSON.parse(Buffer.from(b64Data, 'base64url').toString('utf-8'));
  payload.role = 'SuperAdmin';
  payload.email = 'hacker@victim.com';
  const tamperedData = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const forgedToken = `${tamperedData}.${sig}`;

  // 3. Attempt to access authenticated session with forged token
  const testRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      authorization: `Bearer ${forgedToken}`,
    },
  });

  const testBody = await testRes.json();
  assert.equal(testRes.status, 401);
  assert.equal(testBody.error, 'INVALID_TOKEN');
});
