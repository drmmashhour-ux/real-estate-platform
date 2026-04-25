"use client";

import { useCallback, useEffect, useState } from "react";
import { ReinforcementInsightsPanel } from "@/components/reinforcement/ReinforcementInsightsPanel";
import { TopStrategiesPanel } from "./TopStrategiesPanel";

type Row = { strategyKey: string; domain: string; winRate: number | null; usageCount: number; avgClosingTime?: number | null };

type Insights = { topPerforming: Row[]; underperforming: Row[]; mostUsed: Row[] };

type Props = { className?: string; compact?: boolean };

/**
 * Fetches /api/strategy/insights. Aggregate metrics only; not personal profiling.
 */
export function StrategyInsightsDashboard({ className, compact = false }: Props) {
  const [data, setData] = useState<Insights | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/strategy/insights", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; insights?: Insights };
      if (j.ok && j.insights) setData(j.insights);
      else setErr("Could not load");
    } catch {
      setErr("Could not load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className={className}>
        <p className="text-sm text-rose-300">{err}</p>
        <button type="button" onClick={load} className="mt-1 text-xs text-amber-400">
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className={className}><p className="text-sm text-slate-500">Loading strategy insights…</p></div>;
  }

  return (
    <section
      className={className}
      data-testid="strategy-insights-dashboard"
    >
      {!compact ? (
        <h2 className="text-lg font-medium text-slate-200">Strategy outcome benchmarks</h2>
      ) : null}
      <p className="mt-1 text-xs text-slate-500">
        Probabilistic product metrics only — not guarantees, not personal traits; avoid bias in interpretation.
      </p>
      <div className={`mt-3 space-y-4 ${compact ? "" : "grid gap-4 sm:grid-cols-2"}`}>
        <TopStrategiesPanel top={data.topPerforming} title="Stronger historical lean (no certainty)" />
        <TopStrategiesPanel top={data.underperforming} title="Weaker historical lean (low data possible)" />
        <div className={compact ? "" : "sm:col-span-2"}>
          <TopStrategiesPanel top={data.mostUsed} title="Most often logged" />
        </div>
        <div className={compact ? "mt-6" : "sm:col-span-2 border-t border-slate-800 pt-6"}>
          <ReinforcementInsightsPanel compact={compact} />
        </div>
      </div>
    </section>
  );
}
