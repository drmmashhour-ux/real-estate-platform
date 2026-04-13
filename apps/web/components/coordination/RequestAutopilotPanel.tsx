"use client";

import { useState } from "react";

export function RequestAutopilotPanel({
  dealId,
  onRefresh,
  onError,
}: {
  dealId: string;
  onRefresh: () => void;
  onError: (e: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { title: string; summary: string; urgency: string; recommendedAction: string }[]
  >([]);

  async function run() {
    setLoading(true);
    onError(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/requests/autopilot/run`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Autopilot failed");
      setSuggestions(Array.isArray(j.suggestions) ? j.suggestions : []);
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-slate-100">Document-request autopilot</h2>
        <button
          type="button"
          disabled={loading}
          onClick={() => void run()}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? "Running…" : "Run suggestions"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Generates broker-reviewable ideas only — nothing is sent automatically.
      </p>
      {suggestions.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {suggestions.map((s, i) => (
            <li key={i} className="rounded border border-slate-800 bg-slate-950/50 p-2">
              <p className="font-medium text-slate-100">{s.title}</p>
              <p className="text-xs text-slate-500">Urgency: {s.urgency}</p>
              <p className="mt-1 text-slate-400">{s.summary}</p>
              <p className="mt-1 text-xs text-amber-200/80">{s.recommendedAction}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
