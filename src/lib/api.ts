import type {
  AttendanceData,
  DeadlineItem,
  HealthReport,
  NotificationItem,
  PublicUser,
  ResultsData,
  SectionEnvelope,
  StudentProfile,
  TimetableData,
} from '../core/types';

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${res.status}`;
    const fieldErrors =
      payload.fieldErrors && typeof payload.fieldErrors === 'object'
        ? (payload.fieldErrors as Record<string, string>)
        : undefined;
    throw new ApiError(message, res.status, fieldErrors);
  }

  return payload as T;
}

export const portalApi = {
  getSession: () =>
    requestJson<{ authenticated: boolean; user: PublicUser | null }>('/api/session'),

  login: (registerNumber: string, name?: string) =>
    requestJson<{ authenticated: boolean; user: PublicUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ registerNumber, name, mode: 'mock' }),
    }),

  logout: () =>
    requestJson<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  getProfile: (refresh = false) =>
    requestJson<SectionEnvelope<StudentProfile>>(
      `/api/portal/profile${refresh ? '?refresh=1' : ''}`
    ),

  getAttendance: (refresh = false) =>
    requestJson<SectionEnvelope<AttendanceData>>(
      `/api/portal/attendance${refresh ? '?refresh=1' : ''}`
    ),

  getTimetable: (refresh = false) =>
    requestJson<SectionEnvelope<TimetableData>>(
      `/api/portal/timetable${refresh ? '?refresh=1' : ''}`
    ),

  getResults: (refresh = false) =>
    requestJson<SectionEnvelope<ResultsData>>(
      `/api/portal/results${refresh ? '?refresh=1' : ''}`
    ),

  getDeadlines: (refresh = false) =>
    requestJson<SectionEnvelope<DeadlineItem[]>>(
      `/api/portal/deadlines${refresh ? '?refresh=1' : ''}`
    ),

  getNotifications: (refresh = false) =>
    requestJson<SectionEnvelope<NotificationItem[]>>(
      `/api/portal/notifications${refresh ? '?refresh=1' : ''}`
    ),

  getHealth: (deep = false) =>
    requestJson<HealthReport>(`/api/health${deep ? '?deep=1' : ''}`),

  setErpOutageSimulation: (simulateErpOutage: boolean) =>
    requestJson<{ erpOutageSimulated: boolean }>('/api/portal/resilience', {
      method: 'POST',
      body: JSON.stringify({ simulateErpOutage }),
    }),
};

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const absMins = Math.round(Math.abs(diffMs) / 60_000);
  const future = diffMs < 0;

  if (absMins < 1) return 'Just now';
  if (absMins < 60) return future ? `In ${absMins}m` : `${absMins}m ago`;
  const absHours = Math.round(absMins / 60);
  if (absHours < 24) return future ? `In ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return future
    ? `In ${absDays} day${absDays === 1 ? '' : 's'}`
    : `${absDays} day${absDays === 1 ? '' : 's'} ago`;
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
