"use client";

import * as React from "react";
import type { DailyActionStats } from "@/modules/growth/growth-daily-actions.service";
import type { GrowthTaskItem } from "@/modules/growth/growth-task-engine.service";
import type { RevenueTargetStatus } from "@/modules/growth/revenue-target.service";

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

type Payload = {
  target: RevenueTargetStatus;
  actions: DailyActionStats;
  tasks: GrowthTaskItem[];
  recommendation: { headline: string; detail: string };
};

export function Growth1KPlanPanel() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/1k-plan", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.target && j.actions && j.tasks && j.recommendation) setData(j as Payload);
        else setErr("Invalid response");
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading $1K plan…</p>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err ?? "Unavailable"}</p>
      </div>
    );
  }

  const { target, actions, tasks, recommendation } = data;
  const pct = Math.round(target.progressPercent * 10) / 10;

  return (
    <section
      className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4"
      data-growth-1k-plan-panel-v1
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">$1K / month plan</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Execution tracker</h3>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        Revenue = month-to-date CAD from ledger · Today = UTC · Actions blend CRM signals + optional overlay
      </p>

      <div className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-white">
            {fmtCad(target.currentRevenue)}{" "}
            <span className="text-base font-normal text-zinc-500">/ {fmtCad(target.monthlyTarget)}</span>
          </p>
          <p className="text-sm text-zinc-400">
            Remaining <span className="font-semibold text-violet-200">{fmtCad(target.remaining)}</span>
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">{pct}% of monthly target (calendar month, UTC)</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Today&apos;s checklist</p>
          <ul className="mt-2 space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                  t.done ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-100" : "border-zinc-800 bg-black/20 text-zinc-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    t.done ? "border-emerald-500 bg-emerald-600 text-white" : "border-zinc-600 text-zinc-500"
                  }`}
                  aria-hidden
                >
                  {t.done ? "✓" : ""}
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Activity stats (today, UTC)</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <dt className="text-xs text-zinc-500">Brokers contacted</dt>
              <dd className="font-semibold tabular-nums text-white">{actions.brokersContacted}</dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <dt className="text-xs text-zinc-500">Follow-ups sent</dt>
              <dd className="font-semibold tabular-nums text-white">{actions.followUpsSent}</dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <dt className="text-xs text-zinc-500">New leads (shown)</dt>
              <dd className="font-semibold tabular-nums text-white">{actions.leadsShown}</dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
              <dt className="text-xs text-zinc-500">Lead sales (events)</dt>
              <dd className="font-semibold tabular-nums text-white">{actions.leadsSold}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Recommendation</p>
        <p className="mt-1 text-base font-semibold text-amber-50">{recommendation.headline}</p>
        <p className="mt-1 text-sm text-amber-100/90">{recommendation.detail}</p>
      </div>
    </section>
  );
}
