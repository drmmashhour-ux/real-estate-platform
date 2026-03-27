"use client";

import { useState } from "react";
import type { PricingSuggestionItem } from "@/lib/ai/client";
import { refreshPricingSuggestion } from "@/lib/ai/client";

type AiPricingTableProps = {
  suggestions: PricingSuggestionItem[];
  onRefresh?: () => void;
};

export function AiPricingTable({ suggestions, onRefresh }: AiPricingTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRefresh(listingId: string) {
    setLoadingId(listingId);
    try {
      await refreshPricingSuggestion(listingId);
      onRefresh?.();
    } finally {
      setLoadingId(null);
    }
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">No pricing suggestions yet. Data may be empty or still loading.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Listing ID</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Recommended</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Min / Max</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Demand</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Time</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/80">
                <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                  {s.listingId.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                  €{(s.recommendedCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                  {s.minCents != null && s.maxCents != null
                    ? `€${(s.minCents / 100).toFixed(0)} – €${(s.maxCents / 100).toFixed(0)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.demandLevel ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleRefresh(s.listingId)}
                    disabled={loadingId === s.listingId}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-500 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {loadingId === s.listingId ? "Refreshing…" : "Refresh"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
