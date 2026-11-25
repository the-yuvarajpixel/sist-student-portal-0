import { useState } from 'react';
import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { HealthReport } from '../core/types';
import { formatShortDate, portalApi } from '../lib/api';

interface SystemHealthSectionProps {
  health: HealthReport | null;
  loading: boolean;
  onRefreshHealth: () => Promise<void>;
  onForceRefreshAll: () => Promise<void>;
}

export function SystemHealthSection({
  health,
  loading,
  onRefreshHealth,
  onForceRefreshAll,
}: SystemHealthSectionProps) {
  const [toggling, setToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleToggleOutage() {
    if (!health) return;
    setToggling(true);
    setStatusMessage(null);
    try {
      const next = !health.erpOutageSimulated;
      await portalApi.setErpOutageSimulation(next);
      await onRefreshHealth();
      await onForceRefreshAll();
      setStatusMessage(
        next
          ? 'Simulated ERP outage enabled. ERP sections are now serving cached fallback snapshots.'
          : 'Simulated ERP outage disabled. ERP sections refreshed normally.'
      );
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to update resilience setting.');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Stale-While-Error Resilience Test
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Simulate a college ERP timeout to verify that attendance, timetable, and results
              continue displaying their cached snapshot while Moodle LMS deadlines stay live.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={toggling || !health}
              onClick={handleToggleOutage}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                health?.erpOutageSimulated
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              } disabled:opacity-50`}
            >
              {health?.erpOutageSimulated ? (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Restore ERP Connection</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  <span>Simulate ERP Outage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {statusMessage}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Portal Diagnostics
            </h2>
            {health && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mode: {health.mode} · Checked {formatShortDate(health.checkedAt)}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void onRefreshHealth()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-check</span>
          </button>
        </div>

        {!health ? (
          <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading diagnostics…
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {health.checks.map((check) => (
              <div
                key={check.id}
                className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-start"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {check.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {check.summary}
                  </p>
                  {check.action && (
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Action: {check.action}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    check.status === 'ok'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : check.status === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {check.status === 'ok'
                    ? 'Healthy'
                    : check.status === 'warning'
                      ? 'Notice'
                      : 'Degraded'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
