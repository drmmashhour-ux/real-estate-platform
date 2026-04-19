"use client";

import * as React from "react";
import Link from "next/link";
import { brokerServiceProfileFlags } from "@/config/feature-flags";
import { BrokerServiceProfileAdminPanel } from "@/components/broker/BrokerServiceProfileAdminPanel";
import type { BrokerTeamManagerBrokerDetail } from "@/modules/broker/team/broker-team.types";

type Props = {
  brokerId: string;
  pathPrefix: string;
};

function bandClass(b: string): string {
  if (b === "elite") return "bg-violet-500/20 text-violet-100 border-violet-500/40";
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "healthy") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "weak") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export function BrokerTeamBrokerDetail({ brokerId, pathPrefix }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BrokerTeamManagerBrokerDetail | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/broker-team/${brokerId}`, { credentials: "same-origin" });
        const json = (await res.json()) as BrokerTeamManagerBrokerDetail & { error?: string };
        if (res.status === 404) {
          if (!cancelled) setErr(json.error === "Not found" ? "Broker not found or view disabled." : "Not found.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setErr(json.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setData(json as BrokerTeamManagerBrokerDetail);
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brokerId]);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading broker coaching snapshot…</p>;
  }
  if (err || !data) {
    return <p className="text-sm text-slate-400">{err ?? "No data"}</p>;
  }

  const perf = data.performance?.metrics;

  const coachingBlob =
    data.performance?.insights
      .filter((i) => i.type === "weakness" || i.type === "data_quality")
      .slice(0, 2)
      .map((i) => `${i.label}: ${i.suggestion ?? i.description}`)
      .join("\n") ?? "";

  return (
    <div className="space-y-8 text-white">
      <p className="text-xs text-slate-500">
        Read-only coaching view — does not change assignments, messaging, or payouts.
      </p>

      {perf ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Overall score</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{perf.overallScore}</p>
            <span
              className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${bandClass(perf.executionBand)}`}
            >
              {perf.executionBand.replace(/_/g, " ")}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Activity</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{perf.activityScore}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Conversion mechanics</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{perf.conversionScore}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Discipline</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{perf.disciplineScore}</p>
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-500">No performance snapshot available.</p>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Pipeline snapshot</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.pipelineStages.map((p) => (
            <li
              key={p.stage}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
            >
              <span className="capitalize text-slate-300">{p.stage.replace(/_/g, " ")}</span>
              <span className="tabular-nums font-semibold text-white">{p.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Follow-up discipline</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-slate-500">Attention needed (48h+)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">{data.followUpDiscipline.followUpsDue}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-slate-500">Older threads (72h+)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
              {data.followUpDiscipline.followUpsOverdue}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-slate-500">Touches logged</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
              {data.followUpDiscipline.followUpsCompleted}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-slate-500">Active pipeline rows</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">{data.followUpDiscipline.leadsActive}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">AI assist alignment</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{data.aiAssistNote}</p>
      </section>

      {data.incentives ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="text-sm font-semibold text-white">Incentives & streaks</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2 text-xs">
            <div>
              <p className="font-medium text-slate-300">Streaks</p>
              <ul className="mt-2 space-y-1 text-slate-400">
                {data.incentives.streaks.map((s) => (
                  <li key={s.type}>
                    {s.type}: current {s.currentCount} · best {s.bestCount}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-300">Highlights</p>
              <ul className="mt-2 space-y-1 text-slate-400">
                {data.incentives.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {brokerServiceProfileFlags.brokerServiceProfileV1 ||
      brokerServiceProfileFlags.brokerServiceProfilePanelV1 ||
      brokerServiceProfileFlags.brokerSpecializationRoutingV1 ? (
        <BrokerServiceProfileAdminPanel brokerId={brokerId} />
      ) : null}

      {data.performance?.insights?.length ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="text-sm font-semibold text-white">Coaching signals (CRM-derived)</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            {data.performance.insights.slice(0, 6).map((i) => (
              <li key={i.label} className="rounded-lg border border-white/5 bg-black/25 px-3 py-2">
                <span className="font-medium text-slate-200">{i.label}</span> — {i.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-wrap gap-2">
        <Link
          href={`${pathPrefix}/dashboard/broker/pipeline`}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
          title="Visible when your account carries broker tooling"
        >
          Pipeline UI (broker-capable sessions)
        </Link>
        <Link
          href={`${pathPrefix}/dashboard/broker`}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
        >
          Broker console (broker-capable sessions)
        </Link>
        <Link
          href={`${pathPrefix}/admin/brokers`}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10"
        >
          Broker admin roster
        </Link>
        {coachingBlob ? (
          <button
            type="button"
            className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/20"
            onClick={() => void navigator.clipboard.writeText(coachingBlob)}
          >
            Copy coaching suggestion
          </button>
        ) : null}
      </section>

      <section className="rounded-xl border border-dashed border-white/15 p-4">
        <p className="text-[11px] font-medium text-slate-400">Draft guidance message (manual send)</p>
        <textarea
          readOnly
          className="mt-2 h-28 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300"
          value={
            coachingBlob ||
            "Add a short, private note here when you meet — this box is local copy only; nothing sends automatically."
          }
        />
      </section>
    </div>
  );
}
