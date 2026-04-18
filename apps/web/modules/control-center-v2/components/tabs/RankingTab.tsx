"use client";

import { RankingV8GovernanceBlock } from "@/modules/ranking/components/RankingV8GovernanceBlock";
import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { SystemSummaryCard } from "../shared/SystemSummaryCard";
import { MetricTile } from "../shared/MetricTile";

export function RankingTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const r = data.v1.systems.ranking;
  return (
    <div className="space-y-6">
      <SystemSummaryCard title="Ranking V8 (summary)" status={r.status} summary={r.summary} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Score" value={r.totalScore != null && r.maxScore != null ? `${r.totalScore.toFixed(1)}/${r.maxScore}` : "—"} />
        <MetricTile label="Recommendation" value={r.recommendation ?? "—"} />
        <MetricTile label="Top-5 overlap" value={r.top5Overlap != null ? `${(r.top5Overlap * 100).toFixed(1)}%` : "—"} />
        <MetricTile label="Rollback signals" value={r.rollbackAny ? "yes" : "no"} />
      </div>
      {data.ranking.governanceDashboardFlag ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Governance detail</h3>
          <RankingV8GovernanceBlock />
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          Full Ranking V8 governance block requires <code className="rounded bg-zinc-900 px-1">FEATURE_RANKING_V8_GOVERNANCE_DASHBOARD_V1</code>.
          Use the summary above or enable the flag for scorecard, gates, and history.
        </p>
      )}
    </div>
  );
}
