"use client";

import * as React from "react";
import type { RevenueAlert, RevenueDashboardSummary } from "@/modules/revenue/revenue-dashboard.types";

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function fmtCad2(n: number): string {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

const SOURCE_LABEL: Record<string, string> = {
  lead_unlock: "Lead unlock",
  booking_fee: "Booking fee",
  boost: "Boost",
  subscription: "Subscription",
  other: "Other",
};

function alertClass(level: RevenueAlert["level"]): string {
  switch (level) {
    case "critical":
      return "border-red-500/50 bg-red-950/50 text-red-100";
    case "warning":
      return "border-amber-500/45 bg-amber-950/35 text-amber-50";
    default:
      return "border-sky-500/35 bg-sky-950/30 text-sky-50";
  }
}

/**
 * Operator revenue dashboard (V1) — read-only money visibility from RevenueEvent + funnel signals.
 */
export function RevenueOverviewPanel() {
  const [data, setData] = React.useState<RevenueDashboardSummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/revenue", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { summary?: RevenueDashboardSummary; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j.summary;
      })
      .then((s) => {
        if (!cancelled && s) setData(s);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
        Revenue overview: {err}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
        Loading revenue dashboard…
      </div>
    );
  }

  const r = data.revenueBySource;

  return (
    <section className="rounded-xl border border-amber-900/45 bg-black/50 p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tracking-tight text-amber-100">💰 Revenue Overview</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Read-only — CAD from <code className="text-zinc-400">revenue_events</code> + funnel signals. Not a full
            ledger.
          </p>
        </div>
        <p className="text-[10px] text-zinc-600">{data.createdAt.slice(0, 19)} UTC</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue today" value={fmtCad2(data.revenueToday)} accent />
        <Kpi label="Revenue this week (7d)" value={fmtCad2(data.revenueWeek)} />
        <Kpi label="Revenue this month" value={fmtCad2(data.revenueMonth)} />
        <Kpi label="Lead unlock rate" value={pct(data.leadUnlockRate)} sub={`${data.leadsUnlocked} / ${data.leadsViewed} views`} />
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">Revenue by source (7d)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(r) as (keyof typeof r)[]).map((k) => (
            <div key={k} className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 px-3 py-2">
              <p className="text-[10px] text-zinc-500">{SOURCE_LABEL[k] ?? k}</p>
              <p className="text-sm font-semibold tabular-nums text-amber-100/95">{fmtCad(r[k])}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Brokers</p>
          <dl className="mt-2 space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between gap-2">
              <dt>Active brokers</dt>
              <dd className="font-mono text-white">{data.activeBrokers}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Paying brokers (30d attr.)</dt>
              <dd className="font-mono text-white">{data.payingBrokers}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Revenue / paying broker (7d)</dt>
              <dd className="font-mono text-amber-200">{fmtCad(data.revenuePerBroker)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Bookings (signals)</p>
          <dl className="mt-2 space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between gap-2">
              <dt>Booking starts (7d)</dt>
              <dd className="font-mono text-white">{data.bookingStarts}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Booking completed (7d)</dt>
              <dd className="font-mono text-white">{data.bookingCompleted}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Completion rate</dt>
              <dd className="font-mono text-emerald-300/90">{pct(data.bookingCompletionRate)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {data.alerts.length > 0 ? (
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Alerts</p>
          <ul className="mt-2 space-y-2">
            {data.alerts.map((a) => (
              <li key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${alertClass(a.level)}`}>
                <span className="font-semibold">{a.title}</span>
                <p className="mt-0.5 text-[12px] opacity-95">{a.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.notes.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-zinc-500">
            {data.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        accent ? "border-amber-700/50 bg-amber-950/25" : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accent ? "text-amber-200" : "text-zinc-100"}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p> : null}
    </div>
  );
}
