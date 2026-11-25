import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react';
import { calculateBunkPlan } from '../core/academics';
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
import { ApiError, formatRelativeTime, portalApi } from '../lib/api';
import { AttendanceSection } from '../components/AttendanceSection';
import {
  DeadlinesSection,
  NotificationsSection,
} from '../components/DeadlinesAndNotifications';
import { ResultsSection } from '../components/ResultsSection';
import { SystemHealthSection } from '../components/SystemHealthSection';
import { getTodayWeekday, TimetableSection } from '../components/TimetableSection';

type TabKey =
  | 'overview'
  | 'attendance'
  | 'timetable'
  | 'results'
  | 'deadlines'
  | 'notifications'
  | 'health';

interface SectionState<T> {
  envelope: SectionEnvelope<T> | null;
  loading: boolean;
  error: string | null;
}

interface DashboardPageProps {
  user: PublicUser;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignedOut: () => void;
  onNavigate: (path: string) => void;
}

const AVATAR_SRC = '/src/assets/images/student_avatar_portrait_1795589995494.jpg';

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'results', label: 'Results & CGPA', icon: GraduationCap },
  { key: 'deadlines', label: 'Deadlines', icon: CheckSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'health', label: 'System Resilience', icon: Activity },
];

export function DashboardPage({
  user,
  theme,
  onToggleTheme,
  onSignedOut,
  onNavigate,
}: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const [profile, setProfile] = useState<SectionState<StudentProfile>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [attendance, setAttendance] = useState<SectionState<AttendanceData>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [timetable, setTimetable] = useState<SectionState<TimetableData>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [results, setResults] = useState<SectionState<ResultsData>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [deadlines, setDeadlines] = useState<SectionState<DeadlineItem[]>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [notifications, setNotifications] = useState<SectionState<NotificationItem[]>>({
    envelope: null,
    loading: true,
    error: null,
  });
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [completedDeadlineIds, setCompletedDeadlineIds] = useState<Set<string>>(() => new Set());
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => new Set());

  const loadSection = useCallback(
    async <T,>(
      fetcher: (force: boolean) => Promise<SectionEnvelope<T>>,
      setter: React.Dispatch<React.SetStateAction<SectionState<T>>>,
      force = false
    ) => {
      setter((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const env = await fetcher(force);
        setter({ envelope: env, loading: false, error: null });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onSignedOut();
          return;
        }
        setter((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unable to load section.',
        }));
      }
    },
    [onSignedOut]
  );

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const report = await portalApi.getHealth(true);
      setHealth(report);
    } catch {
      // Non-blocking diagnostic check
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadAll = useCallback(
    async (force = false) => {
      if (force) setRefreshingAll(true);
      await Promise.all([
        loadSection(portalApi.getProfile, setProfile, force),
        loadSection(portalApi.getAttendance, setAttendance, force),
        loadSection(portalApi.getTimetable, setTimetable, force),
        loadSection(portalApi.getResults, setResults, force),
        loadSection(portalApi.getDeadlines, setDeadlines, force),
        loadSection(portalApi.getNotifications, setNotifications, force),
        loadHealth(),
      ]);
      setRefreshingAll(false);
    },
    [loadSection, loadHealth]
  );

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  async function handleLogout() {
    try {
      await portalApi.logout();
    } finally {
      onSignedOut();
      onNavigate('/');
    }
  }

  const unreadCount = useMemo(() => {
    const list = notifications.envelope?.data ?? [];
    return list.filter((n) => !n.read && !readNotificationIds.has(n.id)).length;
  }, [notifications.envelope, readNotificationIds]);

  const pendingDeadlinesCount = useMemo(() => {
    const list = deadlines.envelope?.data ?? [];
    return list.filter(
      (d) => !completedDeadlineIds.has(d.id) && d.status !== 'submitted'
    ).length;
  }, [deadlines.envelope, completedDeadlineIds]);

  const activeNav = NAV_ITEMS.find((i) => i.key === activeTab) ?? NAV_ITEMS[0]!;
  const todayDay = getTodayWeekday();
  const todaySlots = (timetable.envelope?.data.slots ?? []).filter((s) => s.day === todayDay);

  const attendanceWatchlist = useMemo(() => {
    const courses = attendance.envelope?.data.courses ?? [];
    return courses
      .map((c) => ({ ...c, plan: calculateBunkPlan(c.attended, c.conducted, 75) }))
      .sort((a, b) => a.plan.percentage - b.plan.percentage)
      .slice(0, 4);
  }, [attendance.envelope]);

  const upcomingDeadlines = useMemo(() => {
    const list = deadlines.envelope?.data ?? [];
    return list
      .filter((d) => !completedDeadlineIds.has(d.id) && d.status !== 'submitted')
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 4);
  }, [deadlines.envelope, completedDeadlineIds]);

  const studentInitials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const anyStale = Boolean(
    profile.envelope?.stale ||
      attendance.envelope?.stale ||
      timetable.envelope?.stale ||
      results.envelope?.stale
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap cursor-pointer"
          >
            SIST Student Portal
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Workspace">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            const countText =
              item.key === 'notifications' && unreadCount > 0
                ? String(unreadCount)
                : item.key === 'deadlines' && pendingDeadlinesCount > 0
                  ? String(pendingDeadlinesCount)
                  : null;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {countText && (
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {countText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Student Profile Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {!avatarFailed ? (
              <img
                src={AVATAR_SRC}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-xs font-semibold text-white">
                {studentInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {profile.envelope?.data.name ?? user.name}
              </p>
              <p className="truncate font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {user.registerNumber} · {profile.envelope?.data.section ?? 'CSE'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-white dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <span className="font-display text-base font-bold text-slate-900 dark:text-white">
                SIST Student Portal
              </span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out ({user.registerNumber})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Portal</span>
                <span className="mx-1.5 text-slate-300 dark:text-slate-700">/</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeNav.label}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={refreshingAll}
              onClick={() => void loadAll(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshingAll ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{refreshingAll ? 'Refreshing…' : 'Sync Now'}</span>
            </button>
          </div>
        </header>

        {/* Active Viewport Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {anyStale && activeTab === 'overview' && (
            <div className="mb-6 flex flex-col justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 sm:flex-row sm:items-center">
              <span>
                ERP is currently in simulated outage mode — cached snapshots are being shown.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('health')}
                className="text-xs font-semibold underline cursor-pointer self-start sm:self-auto"
              >
                Manage Resilience
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Student Greeting Header */}
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {profile.envelope?.data.name ?? user.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {profile.envelope?.data.programme ?? 'B.E. Computer Science & Engineering'} ·{' '}
                    Semester {profile.envelope?.data.semester ?? 5} ·{' '}
                    <span className="font-mono">{user.registerNumber}</span>
                  </p>
                </div>
                {profile.envelope && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mentor: {profile.envelope.data.mentor} · Batch {profile.envelope.data.batch}
                  </p>
                )}
              </div>

              {/* 4 KPI Strip */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">Overall Attendance</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                    {attendance.envelope
                      ? `${attendance.envelope.data.overallPercentage.toFixed(1)}%`
                      : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {attendance.envelope
                      ? `${attendance.envelope.data.totalAttended}/${attendance.envelope.data.totalConducted} sessions`
                      : 'Loading…'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative CGPA</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                    {results.envelope ? results.envelope.data.cgpa.toFixed(2) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {results.envelope
                      ? `${results.envelope.data.totalCredits} credits · ${results.envelope.data.activeArrears} arrears`
                      : 'Loading…'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('deadlines')}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">Open Deadlines</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                    {pendingDeadlinesCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    ERP + Moodle LMS combined
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">Unread Alerts</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                    {unreadCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Exam, attendance & Moodle notices
                  </p>
                </button>
              </div>

              {/* 2-Column Operational Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Attendance Watchlist */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      Attendance Watchlist (75% Target)
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      Open Calculator
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {attendanceWatchlist.map((c) => (
                      <div
                        key={c.code}
                        className="flex items-center justify-between gap-4 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{c.code}</span> · {c.attended}/{c.conducted}{' '}
                            classes
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`font-mono text-sm font-semibold tabular-nums ${
                              c.plan.status === 'safe'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : c.plan.status === 'borderline'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {c.plan.percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {c.plan.classesNeeded > 0
                              ? `Attend next ${c.plan.classesNeeded}`
                              : `Safe bunks: ${c.plan.safeBunks}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Classes */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      Today’s Schedule ({todayDay})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('timetable')}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      Full Week
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {todaySlots.map((slot) => (
                      <div key={slot.id} className="px-5 py-3.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {slot.courseName}
                          </p>
                          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.room} · {slot.type}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Deadlines Preview */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Next Upcoming Deadlines
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('deadlines')}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    View All Deadlines
                  </button>
                </div>
                {upcomingDeadlines.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
                    All caught up — no open deadlines remaining.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {upcomingDeadlines.map((dl) => (
                      <div
                        key={dl.id}
                        className="flex flex-col justify-between gap-2 px-5 py-3.5 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {dl.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{dl.courseCode}</span> · {dl.source} ·{' '}
                            {dl.type}
                          </p>
                        </div>
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                            dl.status === 'overdue'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {dl.status === 'overdue' ? 'Overdue' : formatRelativeTime(dl.dueAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <AttendanceSection
              envelope={attendance.envelope}
              loading={attendance.loading}
              error={attendance.error}
              onRetry={() => void loadSection(portalApi.getAttendance, setAttendance, true)}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableSection
              envelope={timetable.envelope}
              loading={timetable.loading}
              error={timetable.error}
              onRetry={() => void loadSection(portalApi.getTimetable, setTimetable, true)}
            />
          )}

          {activeTab === 'results' && (
            <ResultsSection
              envelope={results.envelope}
              loading={results.loading}
              error={results.error}
              onRetry={() => void loadSection(portalApi.getResults, setResults, true)}
            />
          )}

          {activeTab === 'deadlines' && (
            <DeadlinesSection
              envelope={deadlines.envelope}
              loading={deadlines.loading}
              error={deadlines.error}
              completedIds={completedDeadlineIds}
              onToggleComplete={(id) =>
                setCompletedDeadlineIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onRetry={() => void loadSection(portalApi.getDeadlines, setDeadlines, true)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection
              envelope={notifications.envelope}
              loading={notifications.loading}
              error={notifications.error}
              readIds={readNotificationIds}
              onMarkRead={(id) =>
                setReadNotificationIds((prev) => {
                  const next = new Set(prev);
                  next.add(id);
                  return next;
                })
              }
              onMarkAllRead={() => {
                const all = (notifications.envelope?.data ?? []).map((n) => n.id);
                setReadNotificationIds(new Set(all));
              }}
              onJumpToSection={(section) => setActiveTab(section)}
              onRetry={() =>
                void loadSection(portalApi.getNotifications, setNotifications, true)
              }
            />
          )}

          {activeTab === 'health' && (
            <SystemHealthSection
              health={health}
              loading={healthLoading}
              onRefreshHealth={loadHealth}
              onForceRefreshAll={() => loadAll(true)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
