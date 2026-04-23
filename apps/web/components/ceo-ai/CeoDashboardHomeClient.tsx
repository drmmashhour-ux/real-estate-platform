"use client";

import { useCallback, useEffect, useState } from "react";
import { CeoLongTermGoalsPanel } from "./CeoLongTermGoalsPanel";
import { CeoStrategyMemoryPanel } from "./CeoStrategyMemoryPanel";
import { CeoDecisionOutcomeTable } from "./CeoDecisionOutcomeTable";

type Summary = {
  signals: Record<string, number | null>;
  policy: { autonomyMode: string; maxDailyChanges: number; allowAutoOutreach: boolean };
  preview: {
    topProblems: { title: string; detail: string; severityOrLift: number }[];
    topOpportunities: { title: string; detail: string; severityOrLift: number }[];
    proposedDecisions: { domain: string; title: string; confidence: number | null; requiresApproval: boolean }[];
  };
  snapshot?: {
    longTermGoals: any[];
    topStrategyPatterns: any[];
    riskyStrategyPatterns: any[];
    recentStrategicMemory: any[];
  };
  pendingDecisionsToday: number;
  generatedAt: string;
};

export function CeoDashboardHomeClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [runBusy, setRunBusy] = useState(false);
  const [runLog, setRunLog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/ceo-ai/summary", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; error?: string } & Partial<Summary>;
      if (!j.ok) {
        setErr(j.error ?? "load_failed");
        return;
      }
      setData({
        signals: j.signals!,
        policy: j.policy!,
        preview: j.preview!,
        snapshot: j.snapshot,
        pendingDecisionsToday: j.pendingDecisionsToday!,
        generatedAt: j.generatedAt!,
      });
    } catch {
      setErr("load_failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runNow() {
    setRunBusy(true);
    setRunLog(null);
    try {
      const res = await fetch("/api/ceo-ai/run?mode=manual", {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; persistedIds?: string[]; error?: string };
      if (j.ok) setRunLog(`Created ${j.persistedIds?.length ?? 0} decision(s).`);
      else setRunLog(j.error ?? "run_failed");
      await load();
    } finally {
      setRunBusy(false);
    }
  }

  if (err) {
    return <p className="text-sm text-rose-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading executive summary…</p>;
  }

  const s = data.signals;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Refreshed {new Date(data.generatedAt).toLocaleString()}</p>
        <button
          type="button"
          disabled={runBusy}
          onClick={() => void runNow()}
          className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-950/50 disabled:opacity-40"
        >
          Run CEO cycle (manual)
        </button>
      </div>
      {runLog ? <p className="text-xs text-cyan-200/90">{runLog}</p> : null}

      {data.snapshot?.longTermGoals && (
        <CeoLongTermGoalsPanel goals={data.snapshot.longTermGoals} />
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-slate-200">Revenue & demand</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>Revenue trend (30d proxy): {((s.revenueTrend30dProxy as number) * 100).toFixed(1)}%</li>
            <li>Demand index: {s.demandIndex != null ? (s.demandIndex as number).toFixed(2) : "—"}</li>
            <li>Leads 30d: {s.leadsLast30d as number}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-slate-200">Risks & flow</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>Conversion 30d: {((s.seniorConversionRate30d as number) * 100).toFixed(1)}%</li>
            <li>Inactive brokers (approx): {s.churnInactiveBrokersApprox as number}</li>
            <li>Operators stale leads (approx): {s.inactiveOperatorsApprox as number}</li>
            <li>Pending decisions today: {data.pendingDecisionsToday}</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
        <h3 className="text-sm font-semibold text-amber-100">Policy</h3>
        <p className="mt-1 text-xs text-slate-400">
          Mode <strong className="text-slate-200">{data.policy.autonomyMode}</strong> · Max daily proposals{" "}
          {data.policy.maxDailyChanges} · Bulk outreach auto{" "}
          <strong className="text-slate-200">{data.policy.allowAutoOutreach ? "on" : "off"}</strong>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
          <h3 className="text-sm font-semibold text-rose-100">Top constraints</h3>
          <ul className="mt-2 space-y-2">
            {data.preview.topProblems.map((p, i) => (
              <li key={i} className="text-xs text-slate-400">
                <span className="font-medium text-slate-200">{p.title}</span>
                <br />
                {p.detail}
              </li>
            ))}
            {data.preview.topProblems.length === 0 ?
              <li className="text-xs text-slate-500">No critical flags in this snapshot.</li>
            : null}
          </ul>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <h3 className="text-sm font-semibold text-emerald-100">Top opportunities</h3>
          <ul className="mt-2 space-y-2">
            {data.preview.topOpportunities.map((p, i) => (
              <li key={i} className="text-xs text-slate-400">
                <span className="font-medium text-slate-200">{p.title}</span>
                <br />
                {p.detail}
              </li>
            ))}
            {data.preview.topOpportunities.length === 0 ?
              <li className="text-xs text-slate-500">No standout upside signals.</li>
            : null}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Live preview queue (no persist)</h3>
        <ul className="mt-2 divide-y divide-white/5">
          {data.preview.proposedDecisions.slice(0, 8).map((d, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 py-2 text-xs">
              <span className="text-slate-300">
                <span className="text-slate-500">{d.domain}</span> · {d.title}
              </span>
              <span className="text-slate-500">
                conf {d.confidence != null ? d.confidence.toFixed(2) : "—"} ·{" "}
                {d.requiresApproval ? "needs approval" : "draft OK"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-slate-600">
          Use <strong className="text-slate-400">Run CEO cycle</strong> to persist proposals into the decisions queue.
        </p>
      </section>

      {data.snapshot && (
        <>
          <h2 className="text-lg font-bold text-white pt-4">Strategic Learning & Memory</h2>
          <CeoStrategyMemoryPanel 
            topPatterns={data.snapshot.topStrategyPatterns} 
            riskyPatterns={data.snapshot.riskyStrategyPatterns} 
          />
          <CeoDecisionOutcomeTable memories={data.snapshot.recentStrategicMemory} />
        </>
      )}
    </div>
  );
}
