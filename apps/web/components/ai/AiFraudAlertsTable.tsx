"use client";

import { useState } from "react";
import type { FraudAlertItem } from "@/lib/ai/client";
import { runFraudCheck } from "@/lib/ai/client";
import Link from "next/link";

type AiFraudAlertsTableProps = {
  alerts: FraudAlertItem[];
  onRefresh?: () => void;
};

export function AiFraudAlertsTable({ alerts, onRefresh }: AiFraudAlertsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRerun(listingId: string) {
    setLoadingId(listingId);
    try {
      await runFraudCheck({ listingId });
      onRefresh?.();
    } finally {
      setLoadingId(null);
    }
  }

  if (!Array.isArray(alerts) || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">No fraud alerts. Data may be empty or still loading.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Listing / Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Score / Alert</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Time</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/fraud`}
                    className="font-medium text-slate-900 hover:underline dark:text-slate-200"
                  >
                    {a.listing?.title ?? a.listingId.slice(0, 8)}
                  </Link>
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    {a.type === "alert" ? a.alertType : "score"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.type === "score" ? (
                    <span className={a.riskLevel === "high" ? "text-amber-500 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}>
                      {a.fraudScore} ({a.riskLevel})
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">{a.message?.slice(0, 60) ?? a.alertType}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(a.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {a.listingId && (
                    <button
                      type="button"
                      onClick={() => handleRerun(a.listingId)}
                      disabled={loadingId === a.listingId}
                      className="text-xs font-medium text-amber-600 hover:text-amber-500 disabled:opacity-50 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      {loadingId === a.listingId ? "Running…" : "Re-run check"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
