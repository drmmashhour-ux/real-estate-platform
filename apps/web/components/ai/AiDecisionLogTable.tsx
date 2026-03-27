"use client";

import { useState } from "react";
import type { AiLogEntry } from "@/lib/ai/client";
import { runEvaluation } from "@/lib/ai/client";

type AiDecisionLogTableProps = {
  logs: AiLogEntry[];
  onRefresh?: () => void;
};

export function AiDecisionLogTable({ logs, onRefresh }: AiDecisionLogTableProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleRerunEvaluation(entityType: string, entityId: string) {
    const key = `${entityType}:${entityId}`;
    setLoadingKey(key);
    try {
      await runEvaluation(entityType, entityId);
      onRefresh?.();
    } finally {
      setLoadingKey(null);
    }
  }

  if (!Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">No AI decisions logged yet. Data may be empty or still loading.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Action</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Entity</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Risk</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Trust</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Time</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Re-run</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const key = `${l.entityType}:${l.entityId}`;
              const canRerun = l.action === "evaluate";
              return (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{l.action}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700 dark:text-slate-300">{l.entityType}</span>
                    <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">{l.entityId.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.riskScore != null ? (
                      <span className={l.riskScore >= 70 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}>
                        {l.riskScore}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{l.trustLevel ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canRerun && (
                      <button
                        type="button"
                        onClick={() => handleRerunEvaluation(l.entityType, l.entityId)}
                        disabled={loadingKey === key}
                        className="text-xs font-medium text-amber-600 hover:text-amber-500 disabled:opacity-50 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        {loadingKey === key ? "Running…" : "Re-run"}
                      </button>
                    )}
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
