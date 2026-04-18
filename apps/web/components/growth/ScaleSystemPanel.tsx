"use client";

import * as React from "react";

import type { ScaleMetric, ScalePlan } from "@/modules/growth/scale-system.types";

type Payload = {
  plan: ScalePlan;
  metrics: ScaleMetric[];
  gaps?: { leadsVsTarget: number; brokersVsTarget: number };
  error?: string;
};

export function ScaleSystemPanel() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/scale-system", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload;
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setData(j);
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
        <p className="text-sm text-zinc-500">Loading $100K scale system…</p>
      </div>
    );
  }
  if (err || !data?.plan) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err ?? "Unavailable"}</p>
      </div>
    );
  }

  const { plan, metrics, gaps } = data;

  return (
    <section
      className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-4"
      data-growth-scale-system-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">$100K scale system (V2)</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Targets & gaps</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Planning math only — no auto-billing. Aligns with assistive execution and broker competition signals.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-[11px] uppercase text-zinc-500">Revenue target</p>
          <p className="text-xl font-semibold text-emerald-200">${(plan.revenueTarget / 1000).toFixed(0)}K/mo CAD</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-[11px] uppercase text-zinc-500">Avg lead price</p>
          <p className="text-xl font-semibold text-zinc-100">${plan.avgPrice} CAD</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-[11px] uppercase text-zinc-500">Required leads / mo</p>
          <p className="text-xl font-semibold text-zinc-100">{plan.requiredLeads}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-[11px] uppercase text-zinc-500">Brokers (plan)</p>
          <p className="text-xl font-semibold text-zinc-100">30–50 active</p>
          <p className="text-[10px] text-zinc-600">Midpoint model: {plan.brokerCount}</p>
        </div>
      </div>

      {gaps ? (
        <div className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-100/90">
          <p className="font-semibold text-amber-200">Gaps (30d snapshot)</p>
          <p className="mt-1">
            Leads short of target: ~{gaps.leadsVsTarget} · Brokers below 30 target: ~{gaps.brokersVsTarget}
          </p>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {metrics.map((m) => {
          const pct = m.target > 0 ? Math.min(100, (m.value / m.target) * 100) : 0;
          return (
            <li key={m.name} className="rounded-md border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
              <div className="flex justify-between gap-2 text-sm text-zinc-300">
                <span>{m.name}</span>
                <span className="tabular-nums text-zinc-500">
                  {m.value} / {m.target}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
