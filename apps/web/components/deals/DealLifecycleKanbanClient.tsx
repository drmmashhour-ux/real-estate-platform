"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  DEAL_LIFECYCLE_POSITIONING,
  LIFECYCLE_ORDER,
  STAGE_LABEL,
  type LifecycleStage,
} from "@/modules/deal-lifecycle/lifecycle.stages";

type Snapshot = {
  stage: LifecycleStage;
  nextAction: string;
  recommendedSteps: string[];
  delayWarning?: string | null;
  aiSuggestedActions?: string[];
  integrationHints?: string[];
  notificationSuggestions?: string[];
};

type LeadRow = {
  id: string;
  name: string;
  email: string;
  lifecycleStage: LifecycleStage;
  snapshot: Snapshot;
  estimatedValue?: number | null;
  updatedAt: string;
};

export function DealLifecycleKanbanClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<LifecycleStage, LeadRow[]> | null>(null);
  const [metrics, setMetrics] = useState<{
    approxConversionPct: number | null;
    conversionRatePct: number | null;
    dealSuccessRatePct: number | null;
    avgDaysToClose: number | null;
    wonCount: number;
    lostCount: number;
    total: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/broker/deal-pipeline", { credentials: "same-origin" });
      const j = (await res.json()) as {
        columns?: Record<LifecycleStage, LeadRow[]>;
        metrics?: {
          approxConversionPct: number | null;
          conversionRatePct: number | null;
          dealSuccessRatePct: number | null;
          avgDaysToClose: number | null;
          wonCount: number;
          lostCount: number;
          total: number;
        };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Could not load");
      setColumns(j.columns ?? null);
      setMetrics(j.metrics ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setColumns(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function moveLead(leadId: string, stage: LifecycleStage) {
    const res = await fetch(`/api/broker/deal-pipeline/${encodeURIComponent(leadId)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Move failed");
      return;
    }
    void load();
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-[1800px]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Deal lifecycle</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Deal pipeline</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          {DEAL_LIFECYCLE_POSITIONING} Stages map to CRM fields; move cards with the stage menu (introduced leads
          only).
        </p>
        {metrics ? (
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <p>
              Leads in view: {metrics.total}
              {metrics.approxConversionPct != null ? (
                <> · In &quot;Closed&quot; column: {metrics.approxConversionPct}%</>
              ) : null}
            </p>
            {metrics.conversionRatePct != null ? (
              <p>
                Win rate (won ÷ won+lost): {metrics.conversionRatePct}% · Wins: {metrics.wonCount} · Losses:{" "}
                {metrics.lostCount}
              </p>
            ) : (
              <p className="text-slate-600">
                Win rate — set terminal outcomes (<span className="text-slate-500">won</span> /{" "}
                <span className="text-slate-500">lost</span>) on leads to populate conversion metrics.
              </p>
            )}
            {metrics.avgDaysToClose != null ? (
              <p>Avg. time to close (won): {metrics.avgDaysToClose} days</p>
            ) : null}
          </div>
        ) : null}

        {loading ? <p className="mt-8 text-sm text-slate-500">Loading pipeline…</p> : null}
        {err ? <p className="mt-4 text-sm text-rose-400">{err}</p> : null}

        {columns ? (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-6">
            {LIFECYCLE_ORDER.map((stage) => (
              <section
                key={stage}
                className="w-[min(100%,280px)] shrink-0 rounded-2xl border border-white/10 bg-[#121212] p-3"
              >
                <h2 className="text-sm font-semibold text-white">{STAGE_LABEL[stage]}</h2>
                <p className="text-[10px] text-slate-500">{(columns[stage] ?? []).length} leads</p>
                <ul className="mt-3 space-y-2">
                  {(columns[stage] ?? []).map((lead) => (
                    <li
                      key={lead.id}
                      className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs shadow-sm"
                    >
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium text-premium-gold hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[10px] text-slate-400">{lead.snapshot.nextAction}</p>
                      {lead.snapshot.aiSuggestedActions?.[0] ? (
                        <p className="mt-1 line-clamp-2 text-[10px] text-violet-300/90">
                          AI: {lead.snapshot.aiSuggestedActions[0]}
                        </p>
                      ) : null}
                      {lead.snapshot.delayWarning ? (
                        <p className="mt-1 text-[10px] text-amber-300/90">{lead.snapshot.delayWarning}</p>
                      ) : null}
                      <label className="mt-2 block text-[10px] uppercase text-slate-500">Move to</label>
                      <select
                        className="mt-1 w-full rounded border border-white/10 bg-black/50 px-1 py-1 text-[10px] text-slate-100"
                        value={stage}
                        onChange={(e) => void moveLead(lead.id, e.target.value as LifecycleStage)}
                      >
                        {LIFECYCLE_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
