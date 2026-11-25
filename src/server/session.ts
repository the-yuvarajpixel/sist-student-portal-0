import crypto from 'node:crypto';
import type express from 'express';
import type { DataSourceMode, PublicUser } from '../core/types';

export interface StoredSession {
  registerNumber: string;
  name: string;
  mode: DataSourceMode;
  erpToken: string;
  lmsToken: string;
  signedInAt: string;
  exp: number;
}

const COOKIE_NAME = 'sist_portal_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 20;

// Ephemeral per-process fallback key used only when SESSION_SECRET is unset in development.
const fallbackKey = crypto.randomBytes(32);

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) {
    return crypto.createHash('sha256').update(secret).digest();
  }
  return fallbackKey;
}

export function isSessionSecretConfigured(): boolean {
  const secret = process.env.SESSION_SECRET?.trim();
  return Boolean(secret && secret.length >= 32);
}

export function encryptSession(session: StoredSession): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(session), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSession(token: string): StoredSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, dataB64] = parts;
    if (!ivB64 || !tagB64 || !dataB64) return null;

    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const ciphertext = Buffer.from(dataB64, 'base64url');
    if (iv.length !== 12 || tag.length !== 16) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted) as Partial<StoredSession>;

    if (
      typeof parsed.registerNumber !== 'string' ||
      typeof parsed.name !== 'string' ||
      (parsed.mode !== 'mock' && parsed.mode !== 'live') ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return null;
    }

    return {
      registerNumber: parsed.registerNumber,
      name: parsed.name,
      mode: parsed.mode,
      erpToken: typeof parsed.erpToken === 'string' ? parsed.erpToken : '',
      lmsToken: typeof parsed.lmsToken === 'string' ? parsed.lmsToken : '',
      signedInAt:
        typeof parsed.signedInAt === 'string' ? parsed.signedInAt : new Date().toISOString(),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(val);
      } catch {
        cookies[name] = val;
      }
    }
  }
  return cookies;
}

function isSecureRequest(req: express.Request): boolean {
  if (req.secure) return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string' && forwardedProto.split(',')[0]?.trim() === 'https') {
    return true;
  }
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.startsWith('https://')) {
    return true;
  }
  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.startsWith('https://')) {
    return true;
  }
  return process.env.NODE_ENV === 'production';
}

function formatCookieHeader(value: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) {
    // SameSite=None + Partitioned ensures cookies persist inside HTTPS iframe previews.
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  return parts.join('; ');
}

export function writeSessionCookie(
  req: express.Request,
  res: express.Response,
  payload: Omit<StoredSession, 'signedInAt' | 'exp'>
): StoredSession {
  const session: StoredSession = {
    ...payload,
    signedInAt: new Date().toISOString(),
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const token = encryptSession(session);
  res.setHeader('Set-Cookie', formatCookieHeader(token, SESSION_TTL_SECONDS, isSecureRequest(req)));
  return session;
}

export function clearSessionCookie(req: express.Request, res: express.Response): void {
  res.setHeader('Set-Cookie', formatCookieHeader('', 0, isSecureRequest(req)));
}

export function readSession(req: express.Request): { session: StoredSession | null } {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return { session: null };
  return { session: decryptSession(raw) };
}

export function toPublicUser(session: StoredSession): PublicUser {
  return {
    registerNumber: session.registerNumber,
    name: session.name,
    mode: session.mode,
    signedInAt: session.signedInAt,
  };
}

function extractHost(urlString: string): string | null {
  try {
    return new URL(urlString).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isSameOriginPost(req: express.Request): boolean {
  const forwardedHost = req.headers['x-forwarded-host'];
  const expectedHost = (
    typeof forwardedHost === 'string'
      ? forwardedHost.split(',')[0]?.trim()
      : req.headers.host
  )?.toLowerCase();

  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.length > 0) {
    const originHost = extractHost(origin);
    return Boolean(originHost && expectedHost && originHost === expectedHost);
  }

  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.length > 0) {
    const refererHost = extractHost(referer);
    return Boolean(refererHost && expectedHost && refererHost === expectedHost);
  }

  const fetchSite = req.headers['sec-fetch-site'];
  if (typeof fetchSite === 'string' && fetchSite === 'cross-site') {
    return false;
  }

  // Allow non-browser same-host API calls (e.g. curl/tests without Origin) when not cross-site.
  return true;
}

const loginAttempts = new Map<string, number[]>();

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (loginAttempts.get(ip) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    loginAttempts.set(ip, recent);
    return false;
  }

  if (loginAttempts.size >= 4096 && !loginAttempts.has(ip)) {
    const oldest = loginAttempts.keys().next().value;
    if (oldest !== undefined) loginAttempts.delete(oldest);
  }
  recent.push(now);
  loginAttempts.set(ip, recent);
  return true;
}

export function resetLoginRateLimitForTests(): void {
  loginAttempts.clear();
}
