"use client";

import { useState } from "react";

export type SuggestionRow = {
  id: string;
  listingId: string;
  suggestions: unknown;
  createdAt: string;
  applied: boolean;
};

type Props = {
  suggestions: SuggestionRow[];
  /** Called when the host approves; build `actions` + `ctx` to POST `/api/ai/apply` in your page. */
  onApplyRequest?: (row: SuggestionRow) => void;
  /** If set, also POSTs the same body to /api/ai/apply (host must be signed in). */
  buildApplyRequest?: (row: SuggestionRow) => Promise<{ actions: unknown[]; ctx: Record<string, unknown> } | null>;
};

/**
 * HITL surface: show stored `ListingOptimization` JSON and an explicit “Apply” that never runs unless wired.
 */
export function SuggestionsPanel({ suggestions, onApplyRequest, buildApplyRequest }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApply(row: SuggestionRow) {
    onApplyRequest?.(row);
    if (!buildApplyRequest) return;
    setError(null);
    setLoadingId(row.id);
    try {
      const body = await buildApplyRequest(row);
      if (!body) {
        setError("Nothing to apply (configure buildApplyRequest).");
        return;
      }
      const r = await fetch("/api/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = (await r.json().catch(() => ({}))) as { error?: string };
        setError(t.error ?? `Request failed (${r.status})`);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setLoadingId(null);
    }
  }

  if (!suggestions.length) {
    return (
      <p className="text-sm text-slate-500">
        No AI suggestions stored yet. They appear after the listing optimizer runs (e.g. on booking
        events).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {suggestions.map((s) => (
        <div key={s.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs text-slate-500">
            {new Date(s.createdAt).toLocaleString()} · {s.applied ? "Applied" : "Pending"}
          </p>
          <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-800 dark:text-slate-200">
            {JSON.stringify(s.suggestions, null, 2)}
          </pre>
          <button
            type="button"
            className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            disabled={Boolean(loadingId) || (!buildApplyRequest && !onApplyRequest)}
            onClick={() => void handleApply(s)}
          >
            {loadingId === s.id ? "Applying…" : "Apply"}
          </button>
        </div>
      ))}
    </div>
  );
}
