"use client";

import { useState } from "react";
import {
  type OptimizationSuggestionRow,
  actionsFromOptimizationSuggestion,
} from "@/lib/ai/optimizationSuggestionActions";
import { canAutoApply } from "@/lib/ai/autoApplyPolicy";
import type { AutonomousAction } from "@/lib/ai/executor";

export type SuggestionListItem = OptimizationSuggestionRow & {
  runId: string;
  status?: string;
  riskLevel?: string;
  confidenceScore?: number;
  autoApplyAllowed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  listingId: string;
  suggestions: SuggestionListItem[];
  /** Optional override; default maps optimization rows to executor actions. */
  buildActions?: (s: OptimizationSuggestionRow) => AutonomousAction[];
};

export function SuggestionsPanel({ listingId, suggestions, buildActions }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = async (row: OptimizationSuggestionRow) => {
    setError(null);
    setLoadingId(row.id);
    try {
      const actions = (buildActions ?? actionsFromOptimizationSuggestion)(row);
      const res = await fetch("/api/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions,
          ctx: {
            shortTermListingId: listingId,
          },
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? res.statusText);
        return;
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (!suggestions.length) {
    return <p className="text-sm text-zinc-500">No pending optimization suggestions.</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {suggestions.map((s) => {
        const row = s;
        const auto = (buildActions ?? actionsFromOptimizationSuggestion)(row).every((a) =>
          canAutoApply(a)
        );
        return (
          <div key={row.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500">{row.fieldType}</span>
              {row.status ? <span className="text-xs text-zinc-400">{row.status}</span> : null}
            </div>
            <pre className="max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-950">
              {JSON.stringify(
                { ...row, autoApplyEligible: auto },
                null,
                2
              )}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                disabled={loadingId === row.id}
                onClick={() => void apply(row)}
              >
                {loadingId === row.id ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
