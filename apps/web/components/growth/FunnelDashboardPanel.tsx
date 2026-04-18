"use client";

import * as React from "react";
import Link from "next/link";

import type { LeadFunnelStage, LeadFunnelSummary } from "@/modules/growth/funnel.types";

type SummaryJson = {
  summary: LeadFunnelSummary;
  lostCount: number;
  excludedCount: number;
  suggested: { leadId: string; pipelineStatus: string; actions: string[] }[];
  note?: string;
  error?: string;
};

const STAGE_ORDER: LeadFunnelStage[] = [
  "new",
  "contacted",
  "qualified",
  "showing",
  "offer",
  "closed",
];

export function FunnelDashboardPanel({ locale, country }: { locale: string; country: string }) {
  const [data, setData] = React.useState<SummaryJson | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const leadsHref = `/${locale}/${country}/dashboard/growth/leads`;

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/funnel-system/summary", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as SummaryJson;
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (!cancelled) setData(j);
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
        <p className="text-sm text-zinc-500">Loading lead → deal funnel…</p>
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

  const { summary, lostCount, excludedCount } = data;
  const by = summary.byStage;
  const max = Math.max(1, ...STAGE_ORDER.map((s) => by[s] ?? 0));
  const dropOffs = lostCount + excludedCount;

  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4"
      data-growth-funnel-dashboard-panel-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Lead → deal funnel (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Pipeline & conversion</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Mapped from CRM <code className="text-zinc-400">pipeline_status</code>. Suggested actions are drafts for your team — no automated messages.
          </p>
        </div>
        <Link
          href={leadsHref}
          className="inline-flex shrink-0 items-center rounded-lg bg-amber-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
        >
          Growth leads →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">In funnel (mapped)</p>
          <p className="text-2xl font-semibold text-zinc-100">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">Conversion (closed ÷ mapped)</p>
          <p className="text-2xl font-semibold text-emerald-300">
            {(summary.conversionRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">Drop-offs (lost + unmapped)</p>
          <p className="text-2xl font-semibold text-amber-200/90">{dropOffs}</p>
          <p className="text-[10px] text-zinc-600">
            lost: {lostCount} · unmapped: {excludedCount}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {STAGE_ORDER.map((stage) => {
          const n = by[stage] ?? 0;
          const w = (n / max) * 100;
          return (
            <li key={stage} className="grid gap-1 text-sm">
              <div className="flex justify-between gap-2 text-zinc-400">
                <span className="capitalize text-zinc-300">{stage}</span>
                <span className="tabular-nums text-zinc-500">{n}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-amber-500/80" style={{ width: `${w}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      {data.suggested.length > 0 ? (
        <div className="mt-5 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested actions (new leads)</p>
          <ul className="mt-2 space-y-3 text-sm">
            {data.suggested.map((s) => (
              <li key={s.leadId} className="border-b border-zinc-800/80 pb-2 last:border-0">
                <p className="font-mono text-[11px] text-zinc-500">
                  {s.leadId} · {s.pipelineStatus}
                </p>
                <ul className="mt-1 list-inside list-disc text-zinc-400">
                  {s.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.note ? <p className="mt-3 text-[11px] text-zinc-600">{data.note}</p> : null}
    </section>
  );
}
