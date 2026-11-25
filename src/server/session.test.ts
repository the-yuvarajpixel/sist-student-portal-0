import test from 'node:test';
import assert from 'node:assert/strict';
import type express from 'express';
import {
  checkLoginRateLimit,
  decryptSession,
  encryptSession,
  isSameOriginPost,
  resetLoginRateLimitForTests,
  toPublicUser,
  type StoredSession,
} from './session';

test('encryptSession and decryptSession round-trip and detect tampering', () => {
  const session: StoredSession = {
    registerNumber: '42110482',
    name: 'Karthik Subramanian',
    mode: 'mock',
    erpToken: 'mock-erp',
    lmsToken: 'mock-lms',
    signedInAt: new Date().toISOString(),
    exp: Date.now() + 60_000,
  };

  const token = encryptSession(session);
  const restored = decryptSession(token);
  assert.ok(restored);
  assert.equal(restored.registerNumber, '42110482');
  assert.equal(restored.name, 'Karthik Subramanian');

  const tampered = `${token.slice(0, -2)}aa`;
  assert.equal(decryptSession(tampered), null);

  const pub = toPublicUser(restored);
  assert.equal('erpToken' in pub, false);
  assert.equal('lmsToken' in pub, false);
});

test('decryptSession rejects expired tokens', () => {
  const expired: StoredSession = {
    registerNumber: '42110482',
    name: 'Expired User',
    mode: 'mock',
    erpToken: 'mock-erp',
    lmsToken: 'mock-lms',
    signedInAt: new Date().toISOString(),
    exp: Date.now() - 1000,
  };
  const token = encryptSession(expired);
  assert.equal(decryptSession(token), null);
});

test('isSameOriginPost allows same-origin and blocks cross-origin POSTs', () => {
  const sameOriginReq = {
    headers: {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
    },
  } as unknown as express.Request;
  assert.equal(isSameOriginPost(sameOriginReq), true);

  const crossOriginReq = {
    headers: {
      host: 'localhost:3000',
      origin: 'https://evil.example.com',
    },
  } as unknown as express.Request;
  assert.equal(isSameOriginPost(crossOriginReq), false);
});

test('checkLoginRateLimit enforces per-IP attempt threshold', () => {
  resetLoginRateLimitForTests();
  for (let i = 0; i < 20; i += 1) {
    assert.equal(checkLoginRateLimit('198.51.100.10'), true);
  }
  assert.equal(checkLoginRateLimit('198.51.100.10'), false);
  assert.equal(checkLoginRateLimit('198.51.100.11'), true);
});
