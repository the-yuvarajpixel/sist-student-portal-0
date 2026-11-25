import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { TwoTierCache } from './src/core/cache';
import {
  validateAttendance,
  validateDeadlines,
  validateNotifications,
  validateProfile,
  validateResults,
  validateTimetable,
} from './src/core/schemas';
import type { DataSourceMode, HealthCheckItem, HealthReport, SectionEnvelope } from './src/core/types';
import {
  buildMockAttendance,
  buildMockDeadlines,
  buildMockNotifications,
  buildMockProfile,
  buildMockResults,
  buildMockTimetable,
} from './src/server/mockData';
import {
  checkLoginRateLimit,
  clearSessionCookie,
  isSameOriginPost,
  isSessionSecretConfigured,
  readSession,
  toPublicUser,
  writeSessionCookie,
  type StoredSession,
} from './src/server/session';

if (process.argv.includes('--production')) process.env.NODE_ENV = 'production';

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_MODE: DataSourceMode = process.env.DATA_SOURCE === 'live' ? 'live' : 'mock';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new TwoTierCache();

// Per-user simulated ERP outage toggle so users can verify stale-while-error resilience live.
const simulatedErpOutage = new Set<string>();

// Cache key per user (not per session) so logout clears every cached entry for that user.
function userKeyFor(session: StoredSession): string {
  return TwoTierCache.hashUserKey(JSON.stringify([session.registerNumber, session.name]));
}

// Limit forced cache refreshes (?refresh=1) per user+section so they can't hammer a real ERP.
const REFRESH_COOLDOWN_MS = 30 * 1000;
const lastForcedRefresh = new Map<string, number>();
function allowForcedRefresh(userHash: string, sectionKey: string): boolean {
  const key = `${userHash}:${sectionKey}`;
  const now = Date.now();
  const last = lastForcedRefresh.get(key) ?? 0;
  if (now - last < REFRESH_COOLDOWN_MS) return false;
  if (lastForcedRefresh.size >= 4096) lastForcedRefresh.delete(lastForcedRefresh.keys().next().value!);
  lastForcedRefresh.set(key, now);
  return true;
}

function resolveActiveSession(req: express.Request): StoredSession | null {
  const { session } = readSession(req);
  return session && session.mode === 'mock' && DEFAULT_MODE === 'mock' ? session : null;
}

export function createApp() {
  if (process.env.NODE_ENV === 'production' && !isSessionSecretConfigured()) throw new Error('Set SESSION_SECRET before production startup');
  const app = express();
  // Set TRUST_PROXY=1 when behind exactly one reverse proxy so req.ip (rate limiting) is the real client.
  const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : process.env.VERCEL ? 1 : 0;
  app.set('trust proxy', Number.isInteger(trustProxy) && trustProxy > 0 ? trustProxy : false);
  app.disable('x-powered-by');
  

  // Baseline security headers (iframe-compatible for AI Studio preview)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    next();
  });

  // Enforce same-origin on mutating API routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'POST' && !isSameOriginPost(req)) {
      res.status(403).json({ error: 'Cross-origin POST request rejected.' });
      return;
    }
    next();
  });

  app.use('/api', express.json({ limit: '64kb' }));

  // Health endpoint (no sign-in required, no secrets exposed)
  app.get('/api/health', async (req, res) => {
    const deep = req.query.deep === '1';
    const { session } = readSession(req);
    if (!session) {
      // Anonymous callers get liveness only; configuration details require sign-in.
      res.json({ status: 'ok', checkedAt: new Date().toISOString() });
      return;
    }
    const userHash = userKeyFor(session);
    const outageOn = userHash ? simulatedErpOutage.has(userHash) : false;
    const secretConfigured = isSessionSecretConfigured();
    const cacheInfo = cache.stats();

    const checks: HealthCheckItem[] = [
      {
        id: 'data-source',
        label: 'Data source mode',
        status: DEFAULT_MODE === 'live' ? 'error' : 'ok',
        summary:
          DEFAULT_MODE === 'mock'
            ? 'Running in sample data mode (dates shifted to today). Any valid register number signs in.'
            : 'Live mode is not implemented in this source distribution.',
      },
      {
        id: 'session-secret',
        label: 'Session cookie encryption (AES-256-GCM)',
        status: secretConfigured ? 'ok' : 'warning',
        summary: secretConfigured
          ? 'Custom 32+ character SESSION_SECRET is active for HttpOnly cookies.'
          : 'Using a random per-process development key. Set a 32+ character SESSION_SECRET before deploying online.',
        action: secretConfigured ? undefined : 'Set SESSION_SECRET in your environment variables.',
      },
      {
        id: 'erp-adapter',
        label: 'College ERP adapter',
        status: outageOn || DEFAULT_MODE === 'live' ? 'error' : 'warning',
        summary: outageOn
          ? 'Simulated ERP outage is active — ERP sections fall back to last cached copy (stale-while-error).'
          : 'ERP uses sample data; upstream connectivity is not tested.',
        action: outageOn ? 'Disable simulated ERP outage below to restore live refresh.' : undefined,
      },
      {
        id: 'lms-adapter',
        label: 'Moodle LMS web-services adapter',
        status: DEFAULT_MODE === 'live' ? 'error' : 'warning',
        summary: 'LMS uses sample data; upstream connectivity is not tested.',
      },
      {
        id: 'cache',
        label: 'Two-tier per-user cache',
        status: 'ok',
        summary: `${cacheInfo.entries} cached section${cacheInfo.entries === 1 ? '' : 's'} active (${cacheInfo.diskBacked ? 'memory + JSON file' : 'memory only'}).`,
      },
    ];

    const report: HealthReport = {
      status: checks.some(check => check.status !== 'ok') ? 'degraded' : 'ok',
      mode: DEFAULT_MODE,
      checkedAt: new Date().toISOString(),
      deep,
      erpOutageSimulated: outageOn,
      checks,
    };
    res.json(report);
  });

  // Session inspection
  app.get('/api/session', (req, res) => {
    const session = resolveActiveSession(req);
    if (!session) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user: toPublicUser(session) });
  });

  // Sign in (never stores passwords; accepts mock register number OR live ERP/LMS tokens)
  app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || 'local';
    if (!checkLoginRateLimit(ip)) {
      res.status(429).json({ error: 'Too many sign-in attempts. Please wait a minute and try again.' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const registerNumber = typeof body.registerNumber === 'string' ? body.registerNumber.trim() : '';
    const displayName = typeof body.name === 'string' ? body.name.trim() : '';
    if (displayName.length > 100) { res.status(400).json({ error: 'Display name must be at most 100 characters.' }); return; }
    const mode: DataSourceMode = body.mode === 'live' ? 'live' : 'mock';

    const fieldErrors: Record<string, string> = {};
    if (!registerNumber) {
      fieldErrors.registerNumber = 'Enter your Sathyabama register number (e.g. 42110482).';
    } else if (!/^[A-Za-z0-9]{6,14}$/.test(registerNumber)) {
      fieldErrors.registerNumber = 'Register number must be 6–14 letters or digits without spaces.';
    }

    if (mode === 'live' || DEFAULT_MODE === 'live') {
      res.status(503).json({ error: 'Live ERP/LMS integration is not implemented. Use sample mode.' });
      return;
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors });
      return;
    }

    const profile = buildMockProfile(registerNumber, displayName || undefined);
    const stored = writeSessionCookie(req, res, {
      registerNumber: profile.registerNumber,
      name: profile.name,
      mode,
      erpToken: 'mock-erp-session',
      lmsToken: 'mock-lms-token',
    });

    res.json({ authenticated: true, user: toPublicUser(stored) });
  });

  // Sign out (clears cookie + per-user cache)
  app.post('/api/auth/logout', (req, res) => {
    const { session } = readSession(req);
    if (session) {
      const userHash = userKeyFor(session);
      cache.clearUser(userHash);
      simulatedErpOutage.delete(userHash);
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Resilience toggle: simulate ERP outage so user can verify stale-while-error fallback
  app.post('/api/portal/resilience', (req, res) => {
    const session = resolveActiveSession(req);
    if (!session) {
      res.status(401).json({ error: 'Sign in required.' });
      return;
    }
    const userHash = userKeyFor(session);
    const enabled = req.body?.simulateErpOutage;
    if (typeof enabled !== 'boolean') { res.status(400).json({ error: 'Expected a boolean simulateErpOutage.' }); return; }
    if (enabled) {
      if (simulatedErpOutage.size >= 2048 && !simulatedErpOutage.has(userHash)) simulatedErpOutage.delete(simulatedErpOutage.values().next().value!);
      simulatedErpOutage.add(userHash);
    }
    else simulatedErpOutage.delete(userHash);
    res.json({ erpOutageSimulated: enabled });
  });

  // Helper to serve each section independently with validation + two-tier cache
  function registerSection<T>(
    routePath: string,
    sectionKey: string,
    source: 'ERP' | 'LMS' | 'ERP + LMS',
    usesErp: boolean,
    loader: (session: StoredSession) => T,
    validator: (raw: unknown) => T
  ) {
    app.get(routePath, async (req, res) => {
      const session = resolveActiveSession(req);
      if (!session) {
        res.status(401).json({ error: 'Session expired. Please sign in again.' });
        return;
      }
      const userHash = userKeyFor(session);
      const forceRefresh = req.query.refresh === '1' && allowForcedRefresh(userHash, sectionKey);

      try {
        const result = await cache.getOrFetch(
          userHash,
          sectionKey,
          CACHE_TTL_MS,
          async () => {
            if (usesErp && simulatedErpOutage.has(userHash)) {
              throw new Error('ERP portal did not respond within 5s');
            }
            const raw = loader(session);
            return validator(raw);
          },
          { forceRefresh }
        );

        const envelope: SectionEnvelope<T> = {
          data: result.data,
          stale: result.stale,
          fetchedAt: result.fetchedAt,
          source,
          mode: session.mode,
          warning: result.warning,
        };
        res.json(envelope);
      } catch (err) {
        console.error(`[${sectionKey}] fetch failed:`, err);
        res.status(503).json({ error: 'Unable to fetch section data right now. Please try again shortly.', section: sectionKey, source });
      }
    });
  }

  registerSection('/api/portal/profile', 'profile', 'ERP', true, (s) => buildMockProfile(s.registerNumber, s.name), validateProfile);
  registerSection('/api/portal/attendance', 'attendance', 'ERP', true, () => buildMockAttendance(), validateAttendance);
  registerSection('/api/portal/timetable', 'timetable', 'ERP', true, () => buildMockTimetable(), validateTimetable);
  registerSection('/api/portal/results', 'results', 'ERP', true, () => buildMockResults(), validateResults);
  registerSection(
    '/api/portal/deadlines',
    'deadlines',
    'ERP + LMS',
    false,
    () => buildMockDeadlines().items,
    validateDeadlines
  );
  registerSection(
    '/api/portal/notifications',
    'notifications',
    'ERP + LMS',
    false,
    () => buildMockNotifications(),
    validateNotifications
  );

  // Unknown API routes return clean JSON 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err: {status?: number}, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.status !== 413 && err.status !== 400) console.error('Unhandled error:', err);
    const status = err.status === 413 ? 413 : err.status === 400 ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'Request too large.' : status === 400 ? 'Invalid JSON request.' : 'Internal server error.' });
  });
  return app;
}

async function startServer() {
  const app = createApp();
  if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIST Student Portal running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
