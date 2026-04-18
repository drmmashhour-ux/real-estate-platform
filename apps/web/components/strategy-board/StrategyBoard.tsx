import Link from "next/link";
import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";
import type { StrategyBoardPayload } from "@/modules/strategy-board/strategy-board.types";
import { ActionRecommendationPanel } from "./ActionRecommendationPanel";
import { BottleneckBoard } from "./BottleneckBoard";
import { StrategyOpportunityCard } from "./StrategyOpportunityCard";
import { StrategyRiskCard } from "./StrategyRiskCard";
import { StrategyScenarioPanel } from "./StrategyScenarioPanel";
import { StrategyTimelineCard } from "./StrategyTimelineCard";

export function StrategyBoard({
  basePath,
  metrics,
  board,
}: {
  basePath: string;
  metrics: CompanyMetricsSnapshot;
  board: StrategyBoardPayload;
}) {
  const growth = board.insights.filter((i) => i.type === "listing_performance" || i.type === "broker_productivity");
  const risks = board.insights.filter((i) => i.type === "financial_risk" || i.type === "bottleneck");

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Executive</p>
          <h1 className="font-serif text-3xl text-amber-50">Tableau stratégique</h1>
          <p className="mt-1 text-xs text-zinc-500">{metrics.scopeLabel}</p>
        </div>
        <Link href={`${basePath}/brokerage/dashboard`} className="text-xs text-amber-200/90 underline">
          ← Dashboard
        </Link>
      </header>

      <StrategyTimelineCard rangeLabel={metrics.range.label} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-600/90">Opportunités</h2>
          {growth.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun signal d’opportunité dans les seuils actuels.</p>
          ) : (
            growth.map((i) => <StrategyOpportunityCard key={i.title} insight={i} />)
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600/90">Risques / goulots</h2>
          {risks.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun risque structurant détecté au-delà des seuils.</p>
          ) : (
            risks.map((i) => <StrategyRiskCard key={i.title} insight={i} />)
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BottleneckBoard metrics={metrics} />
        <ActionRecommendationPanel insights={board.insights} />
      </div>

      <StrategyScenarioPanel />

      <p className="text-[11px] text-zinc-600">{board.disclaimer}</p>
      <p className="text-[11px] text-zinc-600">{metrics.disclaimer}</p>
    </div>
  );
}
