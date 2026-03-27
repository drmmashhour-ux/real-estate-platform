"use client";

import { useState } from "react";
import type { AiLogEntry } from "@/lib/ai/client";
import { refreshTrustScore } from "@/lib/ai/client";

type AiTrustTableProps = {
  entries: AiLogEntry[];
  onRefresh?: () => void;
};

export function AiTrustTable({ entries, onRefresh }: AiTrustTableProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleRefresh(entityType: string, entityId: string) {
    const key = `${entityType}:${entityId}`;
    setLoadingKey(key);
    try {
      if (entityType === "user") {
        await refreshTrustScore({ userId: entityId, recompute: true });
      } else {
        await refreshTrustScore({ listingId: entityId });
      }
      onRefresh?.();
    } finally {
      setLoadingKey(null);
    }
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">No trust score entries yet. Data may be empty or still loading.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Entity</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Trust score</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Level</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Time</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const key = `${e.entityType}:${e.entityId}`;
              return (
                <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900 dark:text-slate-200">{e.entityType}</span>
                    <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">{e.entityId.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {e.trustScore != null ? Number(e.trustScore).toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        e.trustLevel === "high"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : e.trustLevel === "low"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400"
                      }
                    >
                      {e.trustLevel ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRefresh(e.entityType, e.entityId)}
                      disabled={loadingKey === key}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-500 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      {loadingKey === key ? "Refreshing…" : "Refresh"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
