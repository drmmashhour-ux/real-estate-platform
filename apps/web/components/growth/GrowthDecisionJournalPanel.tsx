"use client";

import * as React from "react";
import type { GrowthDecisionJournalSummary } from "@/modules/growth/growth-decision-journal.types";

function decisionBadgeClass(d: string): string {
  switch (d) {
    case "executed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
    case "approved":
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    case "rejected":
      return "border-rose-500/35 bg-rose-500/10 text-rose-100";
    case "deferred":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "review_required":
      return "border-violet-500/40 bg-violet-500/10 text-violet-100";
    default:
      return "border-zinc-600/50 bg-zinc-800/40 text-zinc-200";
  }
}

function outcomeBadgeClass(o: string): string {
  switch (o) {
    case "positive":
      return "text-emerald-300";
    case "negative":
      return "text-rose-300";
    case "neutral":
      return "text-zinc-300";
    default:
      return "text-zinc-500";
  }
}

export function GrowthDecisionJournalPanel() {
  const [data, setData] = React.useState<{
    summary: GrowthDecisionJournalSummary;
    insights?: string[];
  } | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/decision-journal", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; summary?: GrowthDecisionJournalSummary; insights?: string[] };
        if (!r.ok) throw new Error(j.error ?? "Decision journal unavailable");
        if (!j.summary) throw new Error("empty");
        return { summary: j.summary, insights: j.insights };
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
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
    return <p className="text-sm text-zinc-500">Loading decision journal…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return null;
  }

  const { summary, insights } = data;
  const s = summary.stats;
  const recent = summary.entries.slice(0, 8);
  const refl = summary.reflections.slice(0, 5);

  return (
    <section className="rounded-xl border border-sky-900/45 bg-sky-950/15 p-4" aria-label="Growth decision journal">
      <h3 className="text-sm font-semibold text-sky-100">📘 Growth Decision Journal</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Snapshot of recommendations, human posture, and conservative outcome hints — advisory only; not persisted in v1.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <span>
          Recommended: <strong className="text-zinc-200">{s.recommendedCount}</strong>
        </span>
        <span>
          Approved: <strong className="text-zinc-200">{s.approvedCount}</strong>
        </span>
        <span>
          Rejected: <strong className="text-zinc-200">{s.rejectedCount}</strong>
        </span>
        <span>
          Executed: <strong className="text-zinc-200">{s.executedCount}</strong>
        </span>
        <span>
          + outcomes: <strong className="text-emerald-300/90">{s.positiveOutcomeCount}</strong> /{" "}
          <strong className="text-rose-300/90">{s.negativeOutcomeCount}</strong>
        </span>
      </div>

      {insights && insights.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 rounded-lg border border-sky-800/40 bg-sky-950/25 p-3 text-xs text-sky-100/95">
          {insights.slice(0, 4).map((line, i) => (
            <li key={`dj-insight-${i}`}>{line}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Recent entries</p>
        <ul className="mt-2 space-y-2">
          {recent.map((e) => (
            <li key={e.id} className="rounded-lg border border-zinc-800/60 bg-black/20 p-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-100">{e.title}</span>
                <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">{e.source}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] capitalize ${decisionBadgeClass(e.decision)}`}
                >
                  {e.decision.replace(/_/g, " ")}
                </span>
              </div>
              {e.why ? <p className="mt-1 text-[11px] text-zinc-500">{e.why}</p> : null}
              <p className="mt-0.5 text-[10px] text-zinc-600">{e.createdAt}</p>
            </li>
          ))}
        </ul>
      </div>

      {refl.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Reflections / outcomes</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {refl.map((r) => (
              <li key={r.entryId} className="rounded border border-zinc-800/50 p-2">
                <span className={`font-medium ${outcomeBadgeClass(r.outcome)}`}>{r.outcome.replace(/_/g, " ")}</span>
                <p className="mt-1 text-zinc-500">{r.rationale}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
