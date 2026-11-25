import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  calculateRequiredSgpa,
  calculateSemesterSgpa,
  GRADE_POINTS,
  projectCgpa,
  type PlannedCourse,
} from '../core/academics';
import type { GradeLetter, ResultsData, SectionEnvelope } from '../core/types';
import { formatRelativeTime } from '../lib/api';

interface ResultsSectionProps {
  envelope: SectionEnvelope<ResultsData> | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const GRADE_OPTIONS: GradeLetter[] = ['O', 'A+', 'A', 'B+', 'B', 'C'];

const DEFAULT_PLANNED_COURSES: PlannedCourse[] = [
  { code: 'SCSA1501', name: 'Operating Systems', credits: 4, grade: 'A+' },
  { code: 'SCSA1502', name: 'Computer Networks', credits: 4, grade: 'A' },
  { code: 'SCSA1503', name: 'Database Management Systems', credits: 4, grade: 'O' },
  { code: 'SCSA1504', name: 'Compiler Design', credits: 3, grade: 'A' },
  { code: 'SITA1505', name: 'Machine Learning Essentials', credits: 3, grade: 'A+' },
  { code: 'SCSA2501', name: 'Operating Systems Lab', credits: 2, grade: 'O' },
  { code: 'SCSA2502', name: 'Computer Networks Lab', credits: 2, grade: 'A+' },
];

export function ResultsSection({ envelope, loading, error, onRetry }: ResultsSectionProps) {
  const [selectedSem, setSelectedSem] = useState<number>(4);
  const [targetCgpa, setTargetCgpa] = useState<number>(8.8);
  const [remainingCredits, setRemainingCredits] = useState<number>(22);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>(DEFAULT_PLANNED_COURSES);

  const data = envelope?.data ?? null;

  const activeSemester = useMemo(() => {
    if (!data) return null;
    return (
      data.semesters.find((s) => s.semester === selectedSem) ??
      data.semesters[data.semesters.length - 1] ??
      null
    );
  }, [data, selectedSem]);

  const plannedSummary = useMemo(
    () => calculateSemesterSgpa(plannedCourses),
    [plannedCourses]
  );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Results data unavailable
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

  const targetPlan = calculateRequiredSgpa(
    data.cgpa,
    data.totalCredits,
    targetCgpa,
    remainingCredits
  );

  const forecastedCgpa = projectCgpa(
    data.cgpa,
    data.totalCredits,
    plannedSummary.sgpa,
    plannedSummary.totalCredits
  );

  const trendData = [
    ...data.semesters.map((s) => ({
      label: `Sem ${s.semester}`,
      sgpa: s.sgpa,
    })),
    {
      label: 'Sem 5 (Plan)',
      sgpa: plannedSummary.sgpa,
    },
  ];

  function updateCourseGrade(code: string, grade: GradeLetter) {
    setPlannedCourses((prev) =>
      prev.map((course) => (course.code === code ? { ...course, grade } : course))
    );
  }

  return (
    <div className="space-y-6">
      {envelope?.stale && envelope.warning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {envelope.warning} Last synced {formatRelativeTime(envelope.fetchedAt)}.
        </div>
      )}

      {/* Top Academic Summary */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current CGPA</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {data.cgpa.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Projected CGPA (Sem V)</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {forecastedCgpa.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Credits Completed</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {data.totalCredits}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Arrears</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {data.activeArrears}
          </p>
        </div>
      </div>

      {/* SGPA Trend + Target CGPA Calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            SGPA Progression & Semester V Projection
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Historical semesters from ERP combined with your live Semester V grade plan.
          </p>

          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="sgpaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[7, 10]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid rgba(148,163,184,0.3)',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sgpa"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#sgpaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Target CGPA Calculator
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Find the exact SGPA required over upcoming credits to hit your goal.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="target-cgpa"
                    className="font-medium text-slate-600 dark:text-slate-400"
                  >
                    Target Cumulative CGPA
                  </label>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {targetCgpa.toFixed(2)}
                  </span>
                </div>
                <input
                  id="target-cgpa"
                  type="range"
                  min={7.0}
                  max={9.5}
                  step={0.05}
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="remaining-credits"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Upcoming Credits Considered
                </label>
                <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {[22, 44, 68].map((credits) => (
                    <button
                      key={credits}
                      type="button"
                      onClick={() => setRemainingCredits(credits)}
                      className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                        remainingCredits === credits
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {credits} cr
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Required SGPA</span>
              <span
                className={`font-mono text-2xl font-semibold tabular-nums ${
                  targetPlan.achievable
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {targetPlan.requiredSgpa.toFixed(2)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {targetPlan.achievable
                ? `Achievable across ${remainingCredits} credits. Maximum possible CGPA is ${targetPlan.maxPossibleCgpa.toFixed(2)}.`
                : `Exceeds 10.00 scale over ${remainingCredits} credits. Maximum possible is ${targetPlan.maxPossibleCgpa.toFixed(2)}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Semester V Interactive Grade Simulator */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Semester V Grade Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick expected grades to forecast this semester’s SGPA and cumulative CGPA.
            </p>
          </div>
          <div className="font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
            Planned SGPA:{' '}
            <strong className="text-blue-600 dark:text-blue-400">
              {plannedSummary.sgpa.toFixed(2)}
            </strong>{' '}
            · New CGPA: <strong className="text-slate-900 dark:text-white">{forecastedCgpa.toFixed(2)}</strong>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {plannedCourses.map((course) => (
            <div
              key={course.code}
              className="flex flex-col justify-between gap-3 px-5 py-3 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{course.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{course.code}</span> · {course.credits} credits ·{' '}
                  {GRADE_POINTS[course.grade]} pts
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                {GRADE_OPTIONS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => updateCourseGrade(course.code, grade)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors cursor-pointer ${
                      course.grade === grade
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Semester Transcript Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Published Semester Grade Sheet
            </h2>
            {activeSemester && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeSemester.term} · SGPA {activeSemester.sgpa.toFixed(2)} ·{' '}
                {activeSemester.credits} credits
              </p>
            )}
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {data.semesters.map((sem) => (
              <button
                key={sem.semester}
                type="button"
                onClick={() => setSelectedSem(sem.semester)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSemester?.semester === sem.semester
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sem {sem.semester}
              </button>
            ))}
          </div>
        </div>

        {activeSemester && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                  <th className="px-4 py-3 text-right">Internal</th>
                  <th className="px-4 py-3 text-right">External</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Grade</th>
                  <th className="px-5 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeSemester.subjects.map((sub) => (
                  <tr
                    key={sub.code}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{sub.name}</p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {sub.code}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {sub.credits}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {sub.internalMarks}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {sub.externalMarks}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {sub.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {sub.grade}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {sub.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
