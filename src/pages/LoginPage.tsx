import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Moon, ShieldCheck, Sun } from 'lucide-react';
import { ApiError, portalApi } from '../lib/api';
import type { PublicUser } from '../core/types';

interface LoginPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAuthenticated: (user: PublicUser) => void;
  onNavigate: (path: string) => void;
}

const SAMPLE_PROFILES = [
  { registerNumber: '42110482', name: 'Karthik Subramanian', label: 'CSE · Sem V' },
  { registerNumber: '42110519', name: 'Ananya Krishnan', label: 'CSE · Sem V' },
  { registerNumber: '42110804', name: 'Pranav Natarajan', label: 'CSE · Sem V' },
];

export function LoginPage({
  theme,
  onToggleTheme,
  onAuthenticated,
  onNavigate,
}: LoginPageProps) {
  const [registerNumber, setRegisterNumber] = useState('42110482');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const result = await portalApi.login(registerNumber.trim(), displayName.trim() || undefined);
      onAuthenticated(result.user);
      onNavigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setFormError('Unable to reach the portal server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Overview</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-12">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-5">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Sample Mode Authentication
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
              Sign in to the SIST Student Portal
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Enter any 6–14 character alphanumeric register number to start an encrypted sample
              session. Dates for attendance, deadlines, and notifications automatically shift to
              today.
            </p>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Quick-Fill Sample Register Numbers
              </p>
              <div className="mt-3 space-y-2">
                {SAMPLE_PROFILES.map((sample) => (
                  <button
                    key={sample.registerNumber}
                    type="button"
                    onClick={() => {
                      setRegisterNumber(sample.registerNumber);
                      setDisplayName(sample.name);
                      setFormError(null);
                      setFieldErrors({});
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{sample.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sample.label}</p>
                    </div>
                    <span className="font-mono text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400">
                      {sample.registerNumber}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="register-number"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Register Number
                  </label>
                  <input
                    id="register-number"
                    type="text"
                    autoComplete="username"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="e.g. 42110482"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                  {fieldErrors.registerNumber ? (
                    <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      {fieldErrors.registerNumber}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      6–14 letters or digits without spaces.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="display-name"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Student Name <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    maxLength={100}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Leave blank to use sample student name"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
                  >
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <span>{submitting ? 'Signing in…' : 'Open Student Dashboard'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2.5 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <p>
                  This build runs strictly in sample data mode. Do not enter real university ERP or
                  Moodle passwords. Your session is stored in an encrypted HttpOnly cookie and
                  cleared immediately upon sign-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
