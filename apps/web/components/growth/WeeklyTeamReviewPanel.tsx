"use client";

import * as React from "react";
import type { WeeklyTeamReview } from "@/modules/growth/weekly-team-review.types";

type Payload = {
  review: WeeklyTeamReview;
  insights: string[];
  disclaimer?: string;
};

export function WeeklyTeamReviewPanel() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void fetch("/api/growth/weekly-team-review?windowDays=7", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setData(j);
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (err) {
    return (
      <section className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">Weekly team review</h3>
        <p className="mt-2 text-sm text-amber-200/90">{err}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs text-zinc-500">Loading weekly team review…</p>
      </section>
    );
  }

  const r = data.review;

  return (
    <section
      id="growth-mc-weekly-team-review"
      className="scroll-mt-24 rounded-xl border border-violet-900/45 bg-violet-950/15 p-4"
      data-growth-weekly-team-review-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">Leadership cadence</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Weekly team operating review</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-zinc-500">
            {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)} · confidence{" "}
            <strong className="text-zinc-300">{r.meta.confidence}</strong>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Execution</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>Completed tasks (coordination): {r.execution.tasksCompleted}</li>
            <li>In progress: {r.execution.tasksInProgress}</li>
            <li>Blocked: {r.execution.tasksBlocked}</li>
            <li>Checklist rate: {(r.execution.completionRate * 100).toFixed(0)}%</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Pipeline (CRM)</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>Leads captured: {r.pipeline.leadsCaptured}</li>
            <li>Qualified+: {r.pipeline.leadsQualified}</li>
            <li>Meetings+: {r.pipeline.meetingsBooked}</li>
            <li>Negotiation+: {r.pipeline.dealsProgressed}</li>
            <li>Closed won: {r.pipeline.dealsClosed}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Performance & deals</p>
          <ul className="mt-2 space-y-1 text-[13px] text-zinc-300">
            <li>Top city: {r.performance.topCity ?? "—"}</li>
            <li>Weakest city: {r.performance.weakestCity ?? "—"}</li>
            <li>Stage drop-off: {r.dealInsights.dropOffStage ?? "—"}</li>
            <li>Strongest transition: {r.dealInsights.strongestStage ?? "—"}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
        <p className="text-xs font-semibold text-zinc-400">Team workload</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {r.team.rolePerformance.map((row) => (
            <div key={row.role} className="text-sm text-zinc-300">
              <span className="text-zinc-500">{row.label}:</span> done {row.done} · active {row.inProgress} · blocked{" "}
              {row.blocked}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-emerald-400/90">Top insights</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            {data.insights.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-400">Next priorities</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {r.recommendations.priorities.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Focus: {r.recommendations.focusAreas.slice(0, 2).join(" · ") || "—"}</span>
      </div>

      <ul className="mt-3 space-y-1 text-[11px] text-amber-100/80">
        {r.meta.warnings.map((w) => (
          <li key={w}>⚠ {w}</li>
        ))}
      </ul>

      <p className="mt-2 text-[10px] text-zinc-600">{data.disclaimer}</p>
      <button type="button" className="mt-2 text-xs text-violet-400 hover:underline" onClick={() => load()}>
        Refresh
      </button>
    </section>
  );
}
