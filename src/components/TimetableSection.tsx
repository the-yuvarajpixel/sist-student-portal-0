import { useMemo, useState } from 'react';
import type { SectionEnvelope, TimetableData, Weekday } from '../core/types';
import { formatRelativeTime } from '../lib/api';

interface TimetableSectionProps {
  envelope: SectionEnvelope<TimetableData> | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

export function getTodayWeekday(): Weekday {
  const day = new Date().getDay();
  if (day === 2) return 'Tue';
  if (day === 3) return 'Wed';
  if (day === 4) return 'Thu';
  if (day === 5) return 'Fri';
  return 'Mon';
}

export function TimetableSection({
  envelope,
  loading,
  error,
  onRetry,
}: TimetableSectionProps) {
  const today = getTodayWeekday();
  const [selectedDay, setSelectedDay] = useState<Weekday | 'All'>(today);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Lecture' | 'Lab' | 'Tutorial'>('All');

  const data = envelope?.data ?? null;

  const filteredSlots = useMemo(() => {
    if (!data) return [];
    return data.slots.filter((slot) => {
      if (selectedDay !== 'All' && slot.day !== selectedDay) return false;
      if (typeFilter !== 'All' && slot.type !== typeFilter) return false;
      return true;
    });
  }, [data, selectedDay, typeFilter]);

  if (loading && !data) {
    return (
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Timetable unavailable
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

  if (!data) return null;

  const groupedDays: Weekday[] = selectedDay === 'All' ? WEEKDAYS : [selectedDay];

  return (
    <div className="space-y-6">
      {envelope?.stale && envelope.warning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {envelope.warning} Last synced {formatRelativeTime(envelope.fetchedAt)}.
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setSelectedDay('All')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedDay === 'All'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Full Week
          </button>
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedDay === day
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {day}
              {day === today ? ' (Today)' : ''}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800 self-start lg:self-auto">
          {(['All', 'Lecture', 'Lab', 'Tutorial'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                typeFilter === type
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Day Schedule Tables */}
      <div className="space-y-5">
        {groupedDays.map((day) => {
          const slots = filteredSlots.filter((s) => s.day === day);
          return (
            <div
              key={day}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  {DAY_LABELS[day]}
                  {day === today && (
                    <span className="ml-2 font-sans text-xs font-medium text-blue-600 dark:text-blue-400">
                      · Today
                    </span>
                  )}
                </h2>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {slots.length} session{slots.length === 1 ? '' : 's'}
                </span>
              </div>

              {slots.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
                  No matching sessions scheduled for {DAY_LABELS[day]}.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-12 sm:items-center"
                    >
                      <div className="font-mono text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300 sm:col-span-3">
                        {slot.startTime} – {slot.endTime}
                      </div>
                      <div className="sm:col-span-5">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {slot.courseName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{slot.code}</span> · {slot.type}
                        </p>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 sm:col-span-4 sm:text-right">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {slot.room}
                        </p>
                        <p>{slot.faculty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
