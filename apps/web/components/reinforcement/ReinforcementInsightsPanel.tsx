"use client";

import { useCallback, useEffect, useState } from "react";
import { ExplorationPolicyCard } from "./ExplorationPolicyCard";
import { ReinforcementDecisionTrace } from "./ReinforcementDecisionTrace";
import { StrategyArmTable, type ArmRow } from "./StrategyArmTable";

type Dashboard = {
  policies: { id: string; domain: string; policyType: string; explorationRate: number; isActive: boolean }[];
  topArms: ArmRow[];
  weakArms: ArmRow[];
  recentDecisions: {
    id: string;
    domain: string;
    strategyKey: string;
    selectionMode: string;
    contextBucket: string;
    createdAt: string;
  }[];
  exploreCount: number;
  exploitCount: number;
};

type Props = { className?: string; compact?: boolean };

/**
 * Fetches `/api/reinforcement/insights` — broker/admin; aggregate product metrics only.
 */
export function ReinforcementInsightsPanel({ className, compact = false }: Props) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/reinforcement/insights", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; dashboard?: Dashboard; error?: string };
      if (j.ok && j.dashboard) setData(j.dashboard);
      else setErr(j.error ?? "Could not load");
    } catch {
      setErr("Could not load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className={className} data-testid="reinforcement-insights-panel">
        <p className="text-sm text-rose-300">{err}</p>
        <button type="button" onClick={load} className="mt-1 text-xs text-amber-400">
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={className} data-testid="reinforcement-insights-panel">
        <p className="text-sm text-slate-500">Loading reinforcement insights…</p>
      </div>
    );
  }

  return (
    <section className={className} data-testid="reinforcement-insights-panel">
      {!compact ? (
        <h2 className="text-lg font-medium text-slate-200">Contextual bandit (ranking only)</h2>
      ) : null}
      <p className="mt-1 text-xs text-slate-500">
        Soft strategy selection across negotiation / closer / offer engines. Explores within allowed candidates; never auto-executes
        offers or messages.
      </p>
      <div className={`mt-3 space-y-6 ${compact ? "" : "grid gap-4 lg:grid-cols-2"}`}>
        <ExplorationPolicyCard
          policies={data.policies}
          exploreCount={data.exploreCount}
          exploitCount={data.exploitCount}
          className={compact ? "" : "lg:col-span-1"}
        />
        <ReinforcementDecisionTrace recent={data.recentDecisions} className={compact ? "" : "lg:col-span-1"} />
        <StrategyArmTable
          title="Stronger arms by avg reward (low data: interpret cautiously)"
          arms={data.topArms}
          className={compact ? "" : "lg:col-span-2"}
        />
        {data.weakArms.length > 0 ? (
          <StrategyArmTable
            title="Weaker arms (min 2 outcome samples)"
            arms={data.weakArms}
            className={compact ? "" : "lg:col-span-2"}
          />
        ) : null}
      </div>
    </section>
  );
}
