"use client";

import * as React from "react";
import type { WeeklyReviewSummary } from "@/modules/growth/weekly-review.types";

export function WeeklyOperatorReviewPanel() {
  const [data, setData] = React.useState<WeeklyReviewSummary | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const params = new URLSearchParams({ windowDays: "7" });
      const res = await fetch(`/api/growth/weekly-review/summary?${params}`, { credentials: "same-origin" });
      if (cancel) return;
      if (!res.ok) {
        setData("err");
        return;
      }
      const j = (await res.json()) as { summary: WeeklyReviewSummary; disclaimer?: string };
      setData(j.summary);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (data === "loading") {
    return (
      <section className="rounded-xl border border-sky-900/40 bg-sky-950/10 p-4" data-growth-weekly-review>
        <p className="text-xs text-zinc-500">Loading weekly review…</p>
      </section>
    );
  }
  if (data === "err" || !data) {
    return (
      <section className="rounded-xl border border-sky-900/40 bg-sky-950/10 p-4" data-growth-weekly-review>
        <p className="text-sm text-amber-200/90">Weekly review unavailable — enable weekly review flag and sign in.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-sky-800/45 bg-sky-950/15 p-4" data-growth-weekly-review>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300/90">Weekly</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Operator review (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">{disclaimer}</p>
      </div>

      <p className="mt-3 text-[11px] text-zinc-500">
        Period {new Date(data.periodStart).toLocaleDateString()} → {new Date(data.periodEnd).toLocaleDateString()} ·
        Confidence: <span className="capitalize text-zinc-300">{data.meta.confidence}</span>
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Execution (logged)</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>Leads captured: {data.execution.leadsCaptured}</li>
            <li>Broker sourcing events: {data.execution.brokersSourced}</li>
            <li>Playbooks completed: {data.execution.playbooksCompleted}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Performance snapshot</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>Top city (bundle): {data.performance.topCity ?? "—"}</li>
            <li>Weakest city (bundle): {data.performance.weakestCity ?? "—"}</li>
          </ul>
          <ul className="mt-2 list-inside list-disc text-[11px] text-zinc-500">
            {data.performance.majorChanges.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Signals</p>
          <p className="mt-1 text-[10px] uppercase text-emerald-500/90">Positive</p>
          <ul className="text-xs text-zinc-400">
            {data.outcomes.positiveSignals.map((s) => (
              <li key={s}>+ {s}</li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] uppercase text-rose-400/90">Negative</p>
          <ul className="text-xs text-zinc-400">
            {data.outcomes.negativeSignals.map((s) => (
              <li key={s}>− {s}</li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] uppercase text-amber-400/90">Insufficient / thin</p>
          <ul className="text-xs text-zinc-500">
            {data.outcomes.insufficientSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-400">Next actions (manual)</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
            {data.recommendations.nextActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-400">Priority focus</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
            {data.recommendations.priorityFocus.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-900/25 bg-black/30 p-3 text-[11px] text-zinc-500">
        <p className="font-semibold text-red-300/90">Warnings</p>
        <ul className="mt-2 list-inside list-disc">
          {data.meta.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
