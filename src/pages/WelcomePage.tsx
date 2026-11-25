import { useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, GraduationCap, Moon, ShieldCheck, Sun } from 'lucide-react';
import { calculateBunkPlan } from '../core/academics';
import type { PublicUser } from '../core/types';

interface WelcomePageProps {
  user: PublicUser | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

const HERO_IMAGE_SRC = '/src/assets/images/campus_study_hero_1795589995140.jpg';

export function WelcomePage({ user, theme, onToggleTheme, onNavigate }: WelcomePageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [previewAttended, setPreviewAttended] = useState(29);
  const [previewConducted, setPreviewConducted] = useState(37);
  const [previewTarget, setPreviewTarget] = useState(75);

  const previewPlan = calculateBunkPlan(previewAttended, previewConducted, previewTarget);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            SIST Student Portal
          </button>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#calculator"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Attendance
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#architecture"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Resilience
            </a>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Demo Sign In
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(user ? '/dashboard' : '/login')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>{user ? 'Open Dashboard' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section: Balanced 2-Column Split */}
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-10 lg:pt-16 lg:pb-14">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Sathyabama CSE Workspace · Sample Data Edition · Zero Credentials Stored
                </p>
                <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl [text-wrap:balance] leading-[1.12]">
                  Every attendance margin, deadline, and grade in one calm workspace.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Stop jumping between college ERP tabs and Moodle course pages. Track exact safe
                  bunk margins, forecast your CGPA before finals, and inspect unified assignment
                  deadlines with resilient stale-while-error caching.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(user ? '/dashboard' : '/login')}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <span>{user ? `Continue as ${user.registerNumber}` : 'Try Sample Portal'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Try Bunk Calculator
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-900 lg:h-full lg:min-h-[340px]">
                {!heroImgFailed ? (
                  <img
                    src={HERO_IMAGE_SRC}
                    alt="Sunlit engineering campus library and glass atrium in Chennai"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-8 text-center dark:from-slate-900 dark:to-slate-800">
                    <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    <p className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">
                      SIST Student Portal
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Unified academic telemetry for Semester V
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-5">
                  <p className="text-xs font-medium text-slate-200">
                    Academic Term · Semester V · ERP + Moodle Unified View
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Quantitative Strip */}
          <div className="mt-10 grid grid-cols-2 gap-6 border-y border-slate-200 py-6 dark:border-slate-800 md:grid-cols-4">
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                7 Courses
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Per-subject attendance & recovery math
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                75% – 85%
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Configurable attendance thresholds
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                5-Min TTL
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Two-tier cache with stale fallback
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                AES-256-GCM
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Encrypted HttpOnly session cookies
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Bunk Calculator Preview */}
        <section id="calculator" className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-12 lg:p-8">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Interactive Preview
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
                Test the attendance bunk & recovery calculator right now.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Adjust classes attended, total classes conducted, and your target percentage. Inside
                the portal, this runs automatically across every enrolled theory and lab course.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <label
                      htmlFor="preview-attended"
                      className="font-medium text-slate-700 dark:text-slate-300"
                    >
                      Classes Attended
                    </label>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {previewAttended}
                    </span>
                  </div>
                  <input
                    id="preview-attended"
                    type="range"
                    min={0}
                    max={previewConducted}
                    value={previewAttended}
                    onChange={(e) => setPreviewAttended(Number(e.target.value))}
                    className="mt-2 w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm">
                    <label
                      htmlFor="preview-conducted"
                      className="font-medium text-slate-700 dark:text-slate-300"
                    >
                      Classes Conducted
                    </label>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {previewConducted}
                    </span>
                  </div>
                  <input
                    id="preview-conducted"
                    type="range"
                    min={1}
                    max={60}
                    value={previewConducted}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setPreviewConducted(next);
                      if (previewAttended > next) setPreviewAttended(next);
                    }}
                    className="mt-2 w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Target Threshold
                  </span>
                  <div className="mt-2 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    {[75, 80, 85].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPreviewTarget(pct)}
                        className={`rounded-md px-3.5 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          previewTarget === pct
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
            </div>

            <div className="flex flex-col justify-between border-t border-slate-200 pt-6 dark:border-slate-800 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Current Standing</p>
                    <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {previewPlan.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Eligibility Status</p>
                    <p
                      className={`mt-1 text-base font-semibold ${
                        previewPlan.status === 'safe'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : previewPlan.status === 'borderline'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {previewPlan.status === 'safe'
                        ? 'Safe Margin'
                        : previewPlan.status === 'borderline'
                          ? 'Borderline — Watch Closely'
                          : 'Below Threshold — Shortage'}
                    </p>
                  </div>
                </div>

                {/* Progress bar with threshold marker */}
                <div className="mt-6">
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all duration-200 ${
                        previewPlan.status === 'safe'
                          ? 'bg-emerald-600'
                          : previewPlan.status === 'borderline'
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, previewPlan.percentage)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white"
                      style={{ left: `${previewTarget}%` }}
                      title={`${previewTarget}% requirement`}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    <span>0%</span>
                    <span>Target {previewTarget}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
                {previewPlan.classesNeeded > 0 ? (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    Attend the next{' '}
                    <span className="font-mono font-semibold tabular-nums text-red-600 dark:text-red-400">
                      {previewPlan.classesNeeded} consecutive class
                      {previewPlan.classesNeeded === 1 ? '' : 'es'}
                    </span>{' '}
                    without absence to recover to {previewTarget}%.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    You can skip up to{' '}
                    <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {previewPlan.safeBunks} upcoming class{previewPlan.safeBunks === 1 ? '' : 'es'}
                    </span>{' '}
                    and stay at or above {previewTarget}%.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section id="capabilities" className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl [text-wrap:balance]">
              Built for the real weekly rhythm of an engineering semester.
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Every module solves a recurring academic question with live, client-side simulation
              and clean tabular layouts.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                01. Attendance & What-If Bunk Math
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Inspect every theory and lab course against 75%, 80%, or 85% thresholds and simulate
                skipping or attending upcoming sessions before deciding.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                02. Results & CGPA Target Planner
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Review semester-by-semester SGPA trends, calculate the exact SGPA required to hit a
                target CGPA, and test Semester V grade combinations.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                03. Unified ERP + LMS Deadlines
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Combine Moodle quizzes, lab records, CAE exam confirmations, and fee windows into a
                single filterable timeline with weekly timetable context.
              </p>
            </div>
          </div>
        </section>

        {/* Resilience & Architecture Section */}
        <section id="architecture" className="mx-auto max-w-6xl px-6 pt-6 pb-16">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Resilient by Architecture</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
                  Still readable when the college ERP slows down before exams.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Each portal section loads through an independent API endpoint backed by a per-user
                  cache. Inside the dashboard’s System Health view, you can toggle a simulated ERP
                  outage and verify that attendance and timetable fall back to cached snapshots
                  while Moodle LMS deadlines keep refreshing.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Independent section endpoints prevent one slow source from blocking the app.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Sign-out immediately purges your user-scoped cache and clears the cookie.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Sample-data-only build — never enter real college ERP passwords.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
          <p>SIST Student Portal · Independent student dashboard demo using sample data.</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate(user ? '/dashboard' : '/login')}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              {user ? 'Open Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
