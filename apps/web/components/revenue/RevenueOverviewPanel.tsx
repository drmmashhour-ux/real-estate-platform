"use client";

import * as React from "react";
import type { RevenueAlert, RevenueDashboardSummary, RevenueSource } from "@/modules/revenue/revenue-dashboard.types";
import {
  interpretGrowthRevenueJson,
  type RevenueFlagsBlockedPayload,
} from "@/modules/revenue/revenue-dashboard-response";

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
  lead_unlock: "Leads",
  booking_fee: "Bookings",
  boost: "Featured / boost",
  subscription: "Subscriptions",
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
  const [flagsBlocked, setFlagsBlocked] = React.useState<RevenueFlagsBlockedPayload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/revenue", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        const parsed = interpretGrowthRevenueJson(r.status, j);
        if (cancelled) return;
        if (parsed.kind === "flags_disabled") {
          setFlagsBlocked(parsed.payload);
          setErr(null);
          setData(null);
          return;
        }
        if (parsed.kind === "error") throw new Error(parsed.message);
        setFlagsBlocked(null);
        setData(parsed.summary);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (flagsBlocked) {
    return (
      <section className="rounded-xl border border-zinc-700 bg-zinc-950/90 p-4 shadow-[0_0_0_1px_rgba(63,63,70,0.35)]">
        <p className="text-sm font-semibold tracking-tight text-zinc-100">Revenue dashboard disabled (flags)</p>
        <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
          This view is gated for internal operators. Turn on{" "}
          <strong className="text-zinc-200">at least one</strong> of the flags below — the API returns 403 until then
          (by design, not a bug).
        </p>
        <ul className="mt-3 space-y-2.5 text-[11px] text-zinc-500">
          {(flagsBlocked.requiredFlags ?? []).length === 0 ? (
            <li className="text-zinc-500">
              Set <code className="text-amber-200/90">FEATURE_REVENUE_DASHBOARD_V1=1</code> or{" "}
              <code className="text-amber-200/90">FEATURE_GROWTH_REVENUE_PANEL_V1=1</code>, then reload.
            </li>
          ) : (
            flagsBlocked.requiredFlags!.map((f) => (
              <li key={f.env} className="rounded-md border border-zinc-800/90 bg-black/40 px-2.5 py-2">
                <code className="text-amber-200/90">{f.env}</code>
                <span className="mt-1 block text-zinc-500">{f.hint}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    );
  }

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
  const detail = data.revenueBySourceDetail;
  const targetPct = data.pctToDailyTarget != null ? Math.round(data.pctToDailyTarget * 1000) / 10 : null;

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

      {data.sparseDisplay.messages.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-800/45 bg-amber-950/25 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/85">Signals</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] text-amber-100/80">
            {data.sparseDisplay.messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/55 px-3 py-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Daily target (UTC)</p>
          <p className="mt-0.5 text-sm text-zinc-200">
            Today <span className="font-mono text-amber-200">{fmtCad2(data.revenueToday)}</span>
            <span className="text-zinc-600"> · </span>
            Goal <span className="font-mono text-zinc-300">{fmtCad2(data.dailyTargetCad)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Progress</p>
          <p className="font-mono text-lg font-semibold tabular-nums text-amber-200">
            {targetPct != null ? `${targetPct}%` : "—"}
          </p>
          <p className="text-[10px] text-zinc-600">Env default · REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Revenue today"
          value={fmtCad2(data.revenueToday)}
          accent
          sub={
            data.sparseDisplay.tier === "empty" && data.revenueToday === 0
              ? "No revenue events yet (UTC day)"
              : undefined
          }
        />
        <Kpi label="Revenue this week (7d)" value={fmtCad2(data.revenueWeek)} />
        <Kpi label="Revenue this month" value={fmtCad2(data.revenueMonth)} />
        <Kpi
          label="Lead unlock rate"
          value={pct(data.leadUnlockRate)}
          sub={
            data.leadsViewed + data.leadsUnlocked < 4
              ? `${data.leadsUnlocked} / ${data.leadsViewed} views · conversion signals sparse`
              : `${data.leadsUnlocked} / ${data.leadsViewed} views`
          }
        />
      </div>

      {data.operatorRecommendations.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/70">Operator actions</p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-emerald-100/85">
            {data.operatorRecommendations.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-500">→</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">
          Revenue by source (7d · drill-down)
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(r) as RevenueSource[]).map((k) => (
            <div key={k} className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 px-3 py-2">
              <p className="text-[10px] text-zinc-500">{SOURCE_LABEL[k] ?? k}</p>
              <p className="text-sm font-semibold tabular-nums text-amber-100/95">{fmtCad(r[k])}</p>
              <p className="mt-1 text-[10px] text-zinc-600">
                {detail[k].eventCount} events · avg{" "}
                {detail[k].avgAmount != null ? fmtCad2(detail[k].avgAmount!) : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-3 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Brokers</p>
          <dl className="mt-2 space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between gap-2">
              <dt>Active brokers</dt>
              <dd className="font-mono text-white">{data.activeBrokers}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Generating revenue (30d attr.)</dt>
              <dd className="font-mono text-white">{data.brokersGeneratingRevenue}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Unlocked leads (7d)</dt>
              <dd className="font-mono text-white">{data.unlockedLeadsWeek}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Avg revenue / paying broker (7d)</dt>
              <dd className="font-mono text-amber-200">{fmtCad(data.revenuePerBroker)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Avg revenue / active broker (7d)</dt>
              <dd className="font-mono text-zinc-200">{fmtCad(data.avgRevenuePerActiveBroker7d)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-3 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">BNHub bookings (revenue)</p>
          <dl className="mt-2 space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between gap-2">
              <dt>Booking fee revenue (7d)</dt>
              <dd className="font-mono text-amber-200">{fmtCad(data.bnhub.weekBookingFeeRevenue)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Booking fee events (7d)</dt>
              <dd className="font-mono text-white">{data.bnhub.bookingFeeEventsWeek}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Funnel · starts / done (7d)</dt>
              <dd className="font-mono text-white">
                {data.bookingStarts} / {data.bookingCompleted}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Completion rate</dt>
              <dd className="font-mono text-emerald-300/90">{pct(data.bookingCompletionRate)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Avg per booking fee event</dt>
              <dd className="font-mono text-zinc-200">
                {data.bnhub.avgBookingFee != null ? fmtCad2(data.bnhub.avgBookingFee) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[10px] text-zinc-600">Read-only · from RevenueEvent booking_fee rows</p>
        </div>
        <div className="rounded-lg border border-amber-900/35 bg-amber-950/15 px-3 py-3 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">Today&apos;s focus</p>
          <p className="mt-2 text-[13px] font-medium text-amber-50">{data.operatorChecklist.todayFocus}</p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Top 3 actions</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] text-zinc-300">
            {data.operatorChecklist.topActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </div>
      </div>

      {data.alerts.length > 0 ? (
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Alerts (prioritized)</p>
          <ul className="mt-2 space-y-2">
            {data.alerts.map((a, idx) => (
              <li key={a.id} className={`rounded-lg border px-3 py-2 text-sm ${alertClass(a.level)}`}>
                {idx === 0 ? (
                  <span className="mb-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    Primary today
                  </span>
                ) : null}
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
