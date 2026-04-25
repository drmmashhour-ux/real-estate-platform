"use client";

import { Card } from "@/components/ui/Card";
import type { StrategySection } from "@/modules/executive-reporting/executive-report.types";

export function StrategySectionView({ strategy }: { strategy: StrategySection }) {
  return (
    <Card variant="dashboardPanel" className="space-y-3">
      <h3 className="text-base font-semibold text-[#0B0B0B]">Strategy</h3>
      <p className="text-sm text-zinc-700">
        vs prior period — execution events Δ {strategy.vsPreviousPeriod.strategyExecutionEventsDelta ?? "n/a"}, bandit
        decisions Δ {strategy.vsPreviousPeriod.reinforcementDecisionsDelta ?? "n/a"}.
      </p>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Benchmark aggregates (top by wins)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {strategy.benchmarkTop.slice(0, 5).map((r) => (
            <li key={`${r.strategyKey}-${r.domain}`}>
              {r.strategyKey} ({r.domain}) — uses {r.totalUses}, wins {r.wins}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">Reinforcement arms (top avgReward)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {strategy.reinforcementTopArms.slice(0, 5).map((r) => (
            <li key={`${r.strategyKey}-${r.contextBucket}`}>
              {r.strategyKey} / {r.domain} / {r.contextBucket} — pulls {r.pulls}, avgReward{" "}
              {r.avgReward == null ? "n/a" : r.avgReward.toFixed(3)}
            </li>
          ))}
        </ul>
      </div>
      {strategy.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
          {strategy.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
