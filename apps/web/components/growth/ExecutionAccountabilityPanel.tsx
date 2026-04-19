"use client";

import * as React from "react";
import type {
  ExecutionAccountabilityInsight,
  ExecutionAccountabilitySummary,
  ExecutionChecklistEntry,
} from "@/modules/growth/execution-accountability.types";

type Payload = {
  summary: ExecutionAccountabilitySummary;
  insights: ExecutionAccountabilityInsight[];
  recent: ExecutionChecklistEntry[];
  disclaimer?: string;
};

export function ExecutionAccountabilityPanel() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void fetch("/api/growth/execution-accountability", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        setData({
          summary: j.summary,
          insights: j.insights,
          recent: j.recent,
          disclaimer: j.disclaimer,
        });
        setErr(null);
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "Error");
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (err) {
    return (
      <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">Execution accountability</h3>
        <p className="mt-2 text-sm text-amber-200/90">{err}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-sm text-zinc-500">Loading accountability summary…</p>
      </section>
    );
  }

  const { summary, insights, recent } = data;
  const pct = summary.completionRate * 100;

  return (
    <section className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 p-4" data-growth-execution-accountability-v1>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Shared visibility</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Execution accountability</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-zinc-500">
            Read-only aggregates from logged checklist events — no automation. Local browser progress still works when
            shared sync is off.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Rollup completion</p>
          <p className="text-2xl font-semibold text-emerald-300/95">{pct.toFixed(0)}%</p>
          <p className="text-[10px] text-zinc-600">
            {summary.completedItems}/{summary.totalItems} cells (expected slots × active users)
          </p>
        </div>
      </div>

      {summary.lowData ? (
        <p className="mt-3 rounded-lg border border-amber-900/35 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          Low data — treat rates as directional until more operators record completions.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {summary.bySurface.map((s) => (
          <div key={s.surfaceType} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{surfaceLabel(s.surfaceType)}</p>
            <p className="mt-1 text-sm text-zinc-200">
              Done <span className="font-semibold text-emerald-300/90">{s.completedItems}</span>
              <span className="text-zinc-500"> / {s.totalItems}</span>
            </p>
            <p className="text-[11px] text-zinc-600">Skipped slots: {s.skippedItems}</p>
          </div>
        ))}
      </div>

      {summary.byUser.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-400">By operator</p>
          <ul className="mt-2 space-y-1 text-sm">
            {summary.byUser.slice(0, 8).map((u) => (
              <li key={u.userId} className="flex flex-wrap justify-between gap-2 text-zinc-300">
                <span className="font-mono text-xs text-zinc-500">{u.userId.slice(0, 12)}…</span>
                <span>
                  {(u.completionRate * 100).toFixed(0)}% · {u.onTrack ? "on track" : "needs attention"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">No shared completions yet — toggle items with accountability sync on.</p>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold text-zinc-400">Insights</p>
        <ul className="mt-2 space-y-2">
          {insights.map((i) => (
            <li key={i.type + i.label} className="rounded-lg border border-zinc-800/90 bg-black/20 p-2 text-sm">
              <span className="font-medium text-zinc-200">{i.label}</span>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">{i.description}</p>
              <p className="mt-1 text-[11px] text-emerald-400/80">{i.suggestedAction}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-zinc-400">Recent activity</p>
        <ul className="mt-2 max-h-44 space-y-1 overflow-auto text-[11px] text-zinc-400">
          {recent.length === 0 ? <li>No events yet.</li> : null}
          {recent.map((r) => (
            <li key={r.id} className="font-mono">
              {r.surfaceType} {r.itemId} · {r.completed ? "done" : "cleared"}{" "}
              <span className="text-zinc-600">{r.completedAt ?? r.createdAt}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">{data.disclaimer}</p>

      <button
        type="button"
        className="mt-3 text-xs text-emerald-400 hover:underline"
        onClick={() => load()}
      >
        Refresh
      </button>
    </section>
  );
}

function surfaceLabel(s: ExecutionChecklistEntry["surfaceType"]): string {
  switch (s) {
    case "daily_routine":
      return "Daily routine";
    case "city_domination_mtl":
      return "Montréal domination";
    case "pitch_script":
      return "Pitch script usage";
    default:
      return s;
  }
}
