"use client";

import * as React from "react";
import type { GrowthMemoryEntry, GrowthMemorySummary } from "@/modules/growth/growth-memory.types";

function listSection(title: string, items: GrowthMemoryEntry[], empty: string) {
  if (!items.length) {
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
        <p className="mt-1 text-xs text-zinc-600">{empty}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
        {items.map((e) => (
          <li key={e.id}>
            <span className="text-zinc-500">{(e.confidence * 100).toFixed(0)}%</span> {e.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GrowthMemoryPanel() {
  const [summary, setSummary] = React.useState<GrowthMemorySummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/memory", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; summary?: GrowthMemorySummary };
        if (!r.ok) throw new Error(j.error ?? "Memory unavailable");
        return j.summary ?? null;
      })
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading growth memory…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!summary) {
    return null;
  }

  return (
    <section className="rounded-xl border border-cyan-900/45 bg-cyan-950/15 p-4" aria-label="Growth memory">
      <h3 className="text-sm font-semibold text-cyan-100">🧠 Growth Memory</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Advisory recall from current signals — bounded, non-authoritative, rebuilt on demand (no v1 persistence).
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {listSection("Recurring blockers", summary.recurringBlockers.slice(0, 3), "None surfaced")}
        {listSection("Winning patterns", summary.winningPatterns.slice(0, 3), "None surfaced")}
        {listSection("Campaign lessons", summary.campaignLessons.slice(0, 4), "None surfaced")}
        {listSection("Follow-up lessons", summary.followupLessons.slice(0, 4), "None surfaced")}
        {listSection("Governance lessons", summary.governanceLessons.slice(0, 4), "None surfaced")}
      </div>

      {summary.operatorPreferences.length > 0 ? (
        <div className="mt-4">
          {listSection("Operator preferences", summary.operatorPreferences, "")}
        </div>
      ) : null}

      {summary.notes.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {summary.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
