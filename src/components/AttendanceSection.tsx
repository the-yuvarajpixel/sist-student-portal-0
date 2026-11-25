import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { calculateBunkPlan, simulateAttendance } from '../core/academics';
import type { AttendanceData, SectionEnvelope } from '../core/types';
import { formatRelativeTime } from '../lib/api';

interface AttendanceSectionProps {
  envelope: SectionEnvelope<AttendanceData> | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AttendanceSection({
  envelope,
  loading,
  error,
  onRetry,
}: AttendanceSectionProps) {
  const [targetPct, setTargetPct] = useState(75);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [attendNext, setAttendNext] = useState(0);
  const [skipNext, setSkipNext] = useState(0);

  const data = envelope?.data ?? null;

  const coursesWithPlan = useMemo(() => {
    if (!data) return [];
    return data.courses.map((course) => ({
      ...course,
      plan: calculateBunkPlan(course.attended, course.conducted, targetPct),
    }));
  }, [data, targetPct]);

  const activeCourse = useMemo(() => {
    if (coursesWithPlan.length === 0) return null;
    return (
      coursesWithPlan.find((c) => c.code === selectedCode) ??
      coursesWithPlan.find((c) => c.plan.status === 'shortage') ??
      coursesWithPlan[0] ??
      null
    );
  }, [coursesWithPlan, selectedCode]);

  const simulated = useMemo(() => {
    if (!activeCourse) return null;
    return simulateAttendance(
      activeCourse.attended,
      activeCourse.conducted,
      attendNext,
      skipNext,
      targetPct
    );
  }, [activeCourse, attendNext, skipNext, targetPct]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Attendance data unavailable
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

  if (!envelope || !data) return null;

  const overallPlan = calculateBunkPlan(data.totalAttended, data.totalConducted, targetPct);
  const shortageCount = coursesWithPlan.filter((c) => c.plan.status === 'shortage').length;

  const chartData = coursesWithPlan.map((c) => ({
    code: c.code,
    name: c.name,
    percentage: c.plan.percentage,
    status: c.plan.status,
  }));

  return (
    <div className="space-y-6">
      {envelope?.stale && envelope.warning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {envelope.warning} Last synced {formatRelativeTime(envelope.fetchedAt)}.
        </div>
      )}

      {/* Top Controls & Summary Strip */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall Attendance</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {overallPlan.percentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Sessions</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {data.totalAttended} / {data.totalConducted}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Courses Below {targetPct}%</p>
            <p
              className={`mt-0.5 font-mono text-2xl font-semibold tabular-nums ${
                shortageCount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {shortageCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Target Threshold
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {[75, 80, 85].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTargetPct(pct)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  targetPct === pct
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + What-If Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Course Attendance vs. {targetPct}% Target
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any course row below to run a what-if simulation.
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Source: {envelope?.source}
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid rgba(148,163,184,0.3)',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [`${value}%`, 'Attendance']}
                />
                <ReferenceLine y={targetPct} stroke="#2563eb" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.code}
                      fill={
                        entry.status === 'safe'
                          ? '#16a34a'
                          : entry.status === 'borderline'
                            ? '#d97706'
                            : '#dc2626'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive What-If Bunk / Recovery Simulator */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          {activeCourse && simulated && (
            <>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      What-If Simulator
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Forecast how upcoming classes affect eligibility.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttendNext(0);
                      setSkipNext(0);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="sim-course"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Course
                  </label>
                  <select
                    id="sim-course"
                    value={activeCourse.code}
                    onChange={(e) => {
                      setSelectedCode(e.target.value);
                      setAttendNext(0);
                      setSkipNext(0);
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {coursesWithPlan.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.plan.percentage.toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Attend Next</p>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        aria-label="Decrease upcoming classes attended"
                        onClick={() => setAttendNext((v) => Math.max(0, v - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                        {attendNext}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase upcoming classes attended"
                        onClick={() => setAttendNext((v) => Math.min(25, v + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Skip Next</p>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        aria-label="Decrease upcoming classes skipped"
                        onClick={() => setSkipNext((v) => Math.max(0, v - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                        {skipNext}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase upcoming classes skipped"
                        onClick={() => setSkipNext((v) => Math.min(25, v + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Projected Percentage
                  </span>
                  <span
                    className={`font-mono text-2xl font-semibold tabular-nums ${
                      simulated.status === 'safe'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : simulated.status === 'borderline'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {simulated.percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {simulated.classesNeeded > 0
                    ? `Needs ${simulated.classesNeeded} more consecutive class${simulated.classesNeeded === 1 ? '' : 'es'} to reach ${targetPct}%.`
                    : `Leaves a margin of ${simulated.safeBunks} additional skip${simulated.safeBunks === 1 ? '' : 's'} at ${targetPct}%.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Course-by-Course High-Density Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Subject-Wise Breakdown
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Synced {formatRelativeTime(envelope.fetchedAt)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3">Course</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Attended</th>
                <th className="px-4 py-3 text-right">Percentage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actionable Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {coursesWithPlan.map((course) => {
                const isSelected = activeCourse?.code === course.code;
                return (
                  <tr
                    key={course.code}
                    onClick={() => {
                      setSelectedCode(course.code);
                      setAttendNext(0);
                      setSkipNext(0);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{course.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{course.code}</span> · {course.faculty}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {course.category} · {course.credits} cr
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {course.attended} / {course.conducted}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {course.plan.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold">
                      <span
                        className={
                          course.plan.status === 'safe'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : course.plan.status === 'borderline'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {course.plan.status === 'safe'
                          ? 'Safe'
                          : course.plan.status === 'borderline'
                            ? 'Borderline'
                            : 'Shortage'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                      {course.plan.classesNeeded > 0 ? (
                        <span className="font-mono text-red-600 dark:text-red-400">
                          Attend next {course.plan.classesNeeded}
                        </span>
                      ) : (
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">
                          Can skip {course.plan.safeBunks}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
