"use client";

import * as React from "react";
import type {
  GrowthGovernanceFeedbackEntry,
  GrowthGovernanceFeedbackInsight,
  GrowthGovernanceFeedbackSummary,
  GrowthGovernancePolicyReviewQueueItem,
} from "@/modules/growth/growth-governance-feedback.types";

type ApiJson = {
  error?: string;
  summary?: GrowthGovernanceFeedbackSummary | null;
  insights?: GrowthGovernanceFeedbackInsight[];
  reviewQueue?: GrowthGovernancePolicyReviewQueueItem[];
};

function EntryList({ title, items }: { title: string; items: GrowthGovernanceFeedbackEntry[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <ul className="mt-2 space-y-2 text-xs text-zinc-300">
        {items.map((e) => (
          <li key={e.id} className="rounded-lg border border-zinc-800/80 bg-black/20 px-2 py-1.5">
            <span className="font-medium text-zinc-100">{e.title}</span>
            <span className="text-zinc-500"> · {e.target}</span>
            {e.recurrenceCount != null && e.recurrenceCount > 1 ? (
              <span className="ml-1 text-[10px] text-amber-200/90">×{e.recurrenceCount}</span>
            ) : null}
            <p className="mt-0.5 text-[11px] text-zinc-500">{e.rationale.slice(0, 220)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GrowthGovernanceFeedbackPanel() {
  const [data, setData] = React.useState<ApiJson | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/governance-feedback", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as ApiJson;
        if (!r.ok) throw new Error(j.error ?? "Governance feedback unavailable");
        return j;
      })
      .then((j) => {
        if (!cancelled) {
          setData(j);
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

  if (loading) return <p className="text-sm text-zinc-500">Loading governance feedback…</p>;
  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data?.summary) return null;

  const s = data.summary;
  const insights = data.insights ?? [];
  const queue = data.reviewQueue ?? [];

  return (
    <section className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4" aria-label="Governance feedback">
      <h3 className="text-sm font-semibold text-cyan-100">🧠 Governance Feedback</h3>
      <p className="mt-1 text-[11px] text-zinc-500">
        Advisory memory only — does not change policy, unfreeze, or enable execution.
      </p>

      <EntryList title="Useful constraints" items={s.repeatedUsefulConstraints} />
      <EntryList title="Repeated freeze patterns" items={s.repeatedFreezePatterns} />
      <EntryList title="Repeated block patterns" items={s.repeatedBlockedPatterns} />
      <EntryList title="Possible over-conservative" items={s.possibleOverconservativeConstraints} />

      {queue.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Policy review queue (human)</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-300">
            {queue.slice(0, 5).map((q) => (
              <li key={q.title} className="rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5">
                <span className="font-medium text-zinc-100">{q.title}</span>
                <p className="mt-0.5 text-[11px] text-zinc-500">{q.rationale.slice(0, 180)}</p>
                <p className="mt-1 text-[10px] text-cyan-200/80">{q.recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Insights</p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-zinc-400">
            {insights.slice(0, 4).map((i) => (
              <li key={i.title}>
                <span className="text-zinc-300">{i.title}:</span> {i.detail.slice(0, 160)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.notes.length > 0 ? (
        <div className="mt-3 text-[10px] text-zinc-600">
          {s.notes.slice(0, 3).map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
