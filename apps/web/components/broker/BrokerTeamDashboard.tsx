"use client";

import * as React from "react";
import Link from "next/link";
import type { BrokerTeamDashboardPayload, BrokerTeamRow } from "@/modules/broker/team/broker-team.types";

type Props = {
  /** e.g. `/en/ch` — used for admin + dashboard deep links */
  pathPrefix: string;
};

function bandClass(b: string): string {
  if (b === "elite") return "bg-violet-500/20 text-violet-100 border-violet-500/40";
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "healthy") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "weak") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function riskClass(r: string): string {
  if (r === "high") return "text-amber-200 bg-amber-500/15 border-amber-500/35";
  if (r === "medium") return "text-sky-100 bg-sky-500/10 border-sky-500/30";
  return "text-slate-300 bg-white/5 border-white/10";
}

function formatShort(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function coachingSuggestion(row: BrokerTeamRow): string {
  return [
    `Hi ${row.displayName.split(" ")[0] || "there"},`,
    `I’m checking in as a coaching moment — CRM shows follow-up attention on ${row.followUpsDue} lead(s) and ${row.followUpsOverdue} older thread(s) may need a clear next step.`,
    `One idea: prioritize the longest-idle contacted leads first, and log touches so signals stay fair.`,
    `Strength to build on: ${row.topStrength}. Area we can tighten together: ${row.topWeakness}.`,
    `—`,
  ].join("\n");
}

function BrokerMiniList({
  title,
  rows,
  pathPrefix,
  empty,
}: {
  title: string;
  rows: BrokerTeamRow[];
  pathPrefix: string;
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li
              key={r.brokerId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
            >
              <div>
                <Link
                  href={`${pathPrefix}/admin/broker-team/${r.brokerId}`}
                  className="font-medium text-sky-200 underline-offset-2 hover:underline"
                >
                  {r.displayName}
                </Link>
                <p className="text-[11px] text-slate-500">
                  Coaching lens — strength: {r.topStrength} · focus: {r.topWeakness}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-lg font-semibold text-white">{r.performanceScore}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bandClass(r.band)}`}
                >
                  {r.band.replace(/_/g, " ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BrokerTeamDashboard({ pathPrefix }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BrokerTeamDashboardPayload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/broker-team", { credentials: "same-origin" });
        const json = (await res.json()) as BrokerTeamDashboardPayload & { error?: string };
        if (res.status === 404) {
          if (!cancelled) setErr("Broker team view is disabled (feature flag).");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setErr(json.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setData(json as BrokerTeamDashboardPayload);
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading team coaching snapshot…</p>;
  }
  if (err || !data) {
    return <p className="text-sm text-slate-400">{err ?? "No data"}</p>;
  }

  const { summary } = data;

  return (
    <div className="space-y-8 text-white">
      <p className="text-xs leading-relaxed text-slate-500">{data.disclaimer}</p>

      {/* Summary strip */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Brokers in cohort</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalBrokers}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Active vs quiet</p>
          <p className="mt-1 text-sm text-slate-200">
            <span className="font-semibold text-emerald-200">{summary.activeBrokers}</span> active ·{" "}
            <span className="font-semibold text-slate-300">{summary.inactiveBrokers}</span> quiet (7d+)
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avg score</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.avgPerformanceScore}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avg conversion signal</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {(summary.avgConversionRate * 100).toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">Wins ÷ assigned leads (in-sample)</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Follow-up health</p>
          <p className="mt-1 text-lg font-semibold capitalize text-slate-100">{summary.followUpHealth}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">From overdue load vs volume</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BrokerMiniList
          title="Momentum to recognize"
          rows={data.topPerformers}
          pathPrefix={pathPrefix}
          empty="No sufficient-data rows in this scan."
        />
        <BrokerMiniList
          title="Support priority (signals, not blame)"
          rows={data.supportPriorityBrokers}
          pathPrefix={pathPrefix}
          empty="No elevated risk signals in this cohort."
        />
      </div>

      <BrokerMiniList
        title="Quiet workspaces (no touch 7d+)"
        rows={data.inactiveBrokers}
        pathPrefix={pathPrefix}
        empty="Everyone shows recent CRM touches (or none assigned)."
      />

      {/* Broker table */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Team roster</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Score</th>
                <th className="py-2 pr-3 font-medium">Band</th>
                <th className="py-2 pr-3 font-medium">Active leads</th>
                <th className="py-2 pr-3 font-medium">Overdue F/U</th>
                <th className="py-2 pr-3 font-medium">Last active</th>
                <th className="py-2 font-medium">Support signal</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.brokerId} className="border-b border-white/5">
                  <td className="py-2 pr-3">
                    <Link
                      href={`${pathPrefix}/admin/broker-team/${r.brokerId}`}
                      className="font-medium text-sky-200 underline-offset-2 hover:underline"
                    >
                      {r.displayName}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-slate-200">{r.performanceScore}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bandClass(r.band)}`}
                    >
                      {r.band.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-slate-300">{r.leadsActive}</td>
                  <td className="py-2 pr-3 tabular-nums text-slate-300">{r.followUpsOverdue}</td>
                  <td className="py-2 pr-3 text-slate-400">{formatShort(r.lastActiveAt)}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${riskClass(r.riskLevel)}`}
                    >
                      {r.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Team insights</h2>
        <ul className="mt-4 space-y-4">
          {data.insights.length === 0 ? (
            <li className="text-xs text-slate-500">No cohort-level insights for this scan.</li>
          ) : (
            data.insights.map((ins, idx) => (
              <li key={`${ins.type}-${idx}-${ins.label}`} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs font-semibold text-slate-100">{ins.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{ins.description}</p>
                <p className="mt-2 text-xs text-emerald-100/90">
                  <span className="font-medium text-emerald-200">Suggested manager move:</span> {ins.suggestedManagerAction}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Light actions */}
      <section className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Optional actions</h2>
        <p className="mt-1 text-xs text-slate-500">
          Nothing here runs automatically — links open the broker workspace; guidance stays human-written.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`${pathPrefix}/admin/brokers`}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
          >
            Broker administration roster
          </Link>
          <Link
            href={`${pathPrefix}/dashboard/broker`}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
          >
            Broker workspace (if your login has broker access)
          </Link>
          <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">
            Drill into a teammate via the roster table — deep links carry from there.
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-[11px] font-semibold text-slate-300">Copy coaching snippet (example)</p>
        <p className="mt-2 text-xs text-slate-500">
          Uses the first roster row only as a formatting sample — customize per broker.
        </p>
        {data.rows[0] ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/20"
              onClick={() => void navigator.clipboard.writeText(coachingSuggestion(data.rows[0]))}
            >
              Copy coaching suggestion
            </button>
          </div>
        ) : null}
      </section>

      <p className="text-[10px] text-slate-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
    </div>
  );
}
