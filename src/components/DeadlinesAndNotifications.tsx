import { useMemo, useState } from 'react';
import { Check, CheckCheck, Search } from 'lucide-react';
import type { DeadlineItem, NotificationItem, SectionEnvelope } from '../core/types';
import { formatRelativeTime, formatShortDate } from '../lib/api';

interface DeadlinesSectionProps {
  envelope: SectionEnvelope<DeadlineItem[]> | null;
  loading: boolean;
  error: string | null;
  completedIds: Set<string>;
  onToggleComplete: (id: string) => void;
  onRetry: () => void;
}

export function DeadlinesSection({
  envelope,
  loading,
  error,
  completedIds,
  onToggleComplete,
  onRetry,
}: DeadlinesSectionProps) {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'ERP' | 'LMS'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'overdue' | 'submitted'>(
    'All'
  );

  const items = useMemo(() => {
    const raw = envelope?.data ?? [];
    return raw.map((item) => ({
      ...item,
      effectiveStatus: completedIds.has(item.id) ? ('submitted' as const) : item.status,
    }));
  }, [envelope, completedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (sourceFilter !== 'All' && item.source !== sourceFilter) return false;
        if (statusFilter !== 'All' && item.effectiveStatus !== statusFilter) return false;
        if (
          q &&
          !item.title.toLowerCase().includes(q) &&
          !item.courseCode.toLowerCase().includes(q) &&
          !item.courseName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [items, query, sourceFilter, statusFilter]);

  if (loading && !envelope) {
    return (
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (error && !envelope) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Deadlines unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course or title…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(['All', 'ERP', 'LMS'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sourceFilter === src
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                ['All', 'All'],
                ['pending', 'Pending'],
                ['overdue', 'Overdue'],
                ['submitted', 'Submitted'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === val
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deadlines List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              No deadlines match your current filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSourceFilter('All');
                setStatusFilter('All');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((item) => {
              const isSubmitted = item.effectiveStatus === 'submitted';
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-start"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(item.id)}
                      aria-label={
                        isSubmitted
                          ? `Mark ${item.title} as pending`
                          : `Mark ${item.title} as submitted`
                      }
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                        isSubmitted
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:border-blue-600 dark:border-slate-600 dark:bg-slate-950'
                      }`}
                    >
                      {isSubmitted && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isSubmitted
                            ? 'text-slate-400 line-through dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{item.courseCode}</span> · {item.courseName} ·{' '}
                        {item.source} · {item.type}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-8 text-left sm:pl-0 sm:text-right">
                    <p
                      className={`text-xs font-semibold ${
                        item.effectiveStatus === 'submitted'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.effectiveStatus === 'overdue'
                            ? 'text-red-600 dark:text-red-400'
                            : item.priority === 'high'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.effectiveStatus === 'submitted'
                        ? 'Submitted'
                        : item.effectiveStatus === 'overdue'
                          ? 'Overdue'
                          : formatRelativeTime(item.dueAt)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {formatShortDate(item.dueAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface NotificationsSectionProps {
  envelope: SectionEnvelope<NotificationItem[]> | null;
  loading: boolean;
  error: string | null;
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onJumpToSection: (section: 'attendance' | 'deadlines') => void;
  onRetry: () => void;
}

export function NotificationsSection({
  envelope,
  loading,
  error,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onJumpToSection,
  onRetry,
}: NotificationsSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const items = useMemo(() => {
    const raw = envelope?.data ?? [];
    return raw.map((n) => ({
      ...n,
      isRead: n.read || readIds.has(n.id),
    }));
  }, [envelope, readIds]);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const filtered =
    categoryFilter === 'All'
      ? items
      : items.filter((n) => n.category === categoryFilter);

  if (loading && !envelope) {
    return (
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (error && !envelope) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Notifications unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {['All', 'Attendance', 'Exam', 'LMS', 'Academic', 'Campus'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Mark all read ({unreadCount})</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No notifications in this category.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`px-5 py-4 transition-colors ${
                  item.isRead ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.source} · {item.category} · {item.isRead ? 'Read' : 'Unread'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(item.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                      Mark as read
                    </button>
                  )}
                  {item.actionLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRead(item.id);
                        onJumpToSection(
                          item.category === 'Attendance' ? 'attendance' : 'deadlines'
                        );
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
