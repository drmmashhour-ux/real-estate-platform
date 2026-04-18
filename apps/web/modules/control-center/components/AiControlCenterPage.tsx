"use client";

import { AiExecutiveSummaryBlock } from "./AiExecutiveSummaryBlock";
import { AiRolloutSummaryBlock } from "./AiRolloutSummaryBlock";
import { AiSystemStatusCard } from "./AiSystemStatusCard";
import { useAiControlCenter } from "../hooks/useAiControlCenter";
import type { AiControlCenterPayload } from "../ai-control-center.types";

function pct01(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

function num2(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  return x.toFixed(2);
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-zinc-100">{value}</p>
    </div>
  );
}

function systemCardsFromPayload(p: AiControlCenterPayload) {
  const s = p.systems;
  return [
    <AiSystemStatusCard
      key="brain"
      title="Brain V8"
      status={s.brain.status}
      summary={s.brain.summary}
      metrics={[
        { label: "Fallback %", value: s.brain.fallbackRatePct != null ? `${s.brain.fallbackRatePct.toFixed(1)}%` : "—" },
        { label: "Overlap", value: pct01(s.brain.avgOverlapRate) },
        { label: "Cmp runs", value: s.brain.comparisonRuns != null ? String(s.brain.comparisonRuns) : "—" },
        { label: "Warns", value: String(s.brain.warningCount) },
      ]}
      warningsCount={s.brain.warningCount}
      topLine={s.brain.topIssue ?? s.brain.topRecommendation}
      href={s.brain.detailsHref}
    />,
    <AiSystemStatusCard
      key="ads"
      title="Ads V8"
      status={s.ads.status}
      summary={s.ads.summary}
      metrics={[
        { label: "Cmp runs", value: s.ads.comparisonRuns != null ? String(s.ads.comparisonRuns) : "—" },
        { label: "Avg overlap", value: pct01(s.ads.avgOverlapRate) },
        { label: "Risky %", value: s.ads.pctRunsRisky != null ? `${s.ads.pctRunsRisky.toFixed(0)}%` : "—" },
        { label: "Primary", value: s.ads.primaryEnabled ? "on" : "off" },
      ]}
      topLine={s.ads.anomalyNote ?? s.ads.topRecommendation}
      href={s.ads.detailsHref}
    />,
    <AiSystemStatusCard
      key="cro"
      title="CRO V8"
      status={s.cro.status}
      summary={s.cro.summary}
      metrics={[
        { label: "Health", value: s.cro.healthScore != null ? String(s.cro.healthScore) : "—" },
        { label: "Recs", value: s.cro.recommendationCount != null ? String(s.cro.recommendationCount) : "—" },
        { label: "Analysis", value: s.cro.analysisEnabled ? "on" : "off" },
        { label: "Bottleneck", value: s.cro.topBottleneck ?? "—" },
      ]}
      topLine={s.cro.warningSummary ?? s.cro.readinessNote}
      href={s.cro.detailsHref}
    />,
    <AiSystemStatusCard
      key="ranking"
      title="Ranking V8"
      status={s.ranking.status}
      summary={s.ranking.summary}
      metrics={[
        { label: "Score", value: s.ranking.totalScore != null && s.ranking.maxScore != null ? `${s.ranking.totalScore.toFixed(1)}/${s.ranking.maxScore}` : "—" },
        { label: "Top-5 ov", value: pct01(s.ranking.top5Overlap) },
        { label: "Shift", value: num2(s.ranking.avgRankShift) },
        { label: "Rollback", value: s.ranking.rollbackAny ? "yes" : "no" },
      ]}
      warningsCount={s.ranking.warningsCount}
      topLine={s.ranking.recommendation ?? undefined}
      href={s.ranking.detailsHref}
    />,
    <AiSystemStatusCard
      key="operator"
      title="Operator V2"
      status={s.operator.status}
      summary={s.operator.summary}
      metrics={[
        { label: "Plan", value: s.operator.executionPlanFlag ? "on" : "off" },
        { label: "Sim", value: s.operator.simulationFlag ? "on" : "off" },
        { label: "Conflicts", value: s.operator.conflictEngineFlag ? "on" : "off" },
        { label: "Priority", value: s.operator.priorityScoringFlag ? "on" : "off" },
      ]}
      topLine={s.operator.topRecommendation}
      href={s.operator.detailsHref}
    />,
    <AiSystemStatusCard
      key="platform"
      title="Platform Core V2"
      status={s.platformCore.status}
      summary={s.platformCore.summary}
      metrics={[
        { label: "Pending", value: s.platformCore.pendingDecisions != null ? String(s.platformCore.pendingDecisions) : "—" },
        { label: "Blocked", value: s.platformCore.blockedDecisions != null ? String(s.platformCore.blockedDecisions) : "—" },
        { label: "Overdue", value: s.platformCore.overdueSchedules != null ? String(s.platformCore.overdueSchedules) : "—" },
        { label: "Blk deps", value: s.platformCore.blockedDependencyEdges != null ? String(s.platformCore.blockedDependencyEdges) : "—" },
      ]}
      topLine={s.platformCore.healthWarnings[0]}
      href={s.platformCore.detailsHref}
    />,
    <AiSystemStatusCard
      key="fusion"
      title="Fusion"
      status={s.fusion.status}
      summary={s.fusion.summary}
      metrics={[
        { label: "Active", value: s.fusion.orchestrationActive ? "yes" : "no" },
        { label: "Conflicts", value: s.fusion.conflictCount != null ? String(s.fusion.conflictCount) : "—" },
        { label: "Recs", value: s.fusion.recommendationCount != null ? String(s.fusion.recommendationCount) : "—" },
        { label: "Primary", value: s.fusion.primaryEnabled ? "on" : "off" },
      ]}
      topLine={s.fusion.topRecommendation ?? s.fusion.agreementHint}
      href={s.fusion.detailsHref}
    />,
    <AiSystemStatusCard
      key="growth"
      title="Global AI Growth Loop"
      status={s.growthLoop.status}
      summary={s.growthLoop.summary}
      metrics={[
        { label: "System", value: s.growthLoop.systemEnabled ? "on" : "off" },
        { label: "Exec", value: s.growthLoop.executionEnabled ? "on" : "off" },
        { label: "Proposed", value: s.growthLoop.actionsProposed != null ? String(s.growthLoop.actionsProposed) : "—" },
        { label: "Exec cnt", value: s.growthLoop.actionsExecuted != null ? String(s.growthLoop.actionsExecuted) : "—" },
      ]}
      topLine={s.growthLoop.lastRunStatus ? `Last: ${s.growthLoop.lastRunStatus}` : null}
      href={s.growthLoop.detailsHref}
    />,
    <AiSystemStatusCard
      key="swarm"
      title="Swarm"
      status={s.swarm.status}
      summary={s.swarm.summary}
      metrics={[
        { label: "Enabled", value: s.swarm.enabled ? "yes" : "no" },
        { label: "Agents", value: String(s.swarm.agentSlots) },
        { label: "Negotiate", value: s.swarm.negotiationEnabled ? "on" : "off" },
        { label: "Primary", value: s.swarm.primaryEnabled ? "on" : "off" },
      ]}
      topLine={s.swarm.negotiationNote}
      href={s.swarm.detailsHref}
    />,
  ];
}

export function AiControlCenterPage() {
  const { data, loading, error, refetch } = useAiControlCenter();

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 text-center text-sm text-zinc-400">
        Loading AI Control Center…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <p className="text-sm text-amber-200">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border border-zinc-600 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">No data.</p>;
  }

  const p = data;
  const s = p.systems;

  return (
    <div className="space-y-8">
      <AiExecutiveSummaryBlock payload={p} />
      <AiRolloutSummaryBlock payload={p} />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick metrics</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <QuickMetric label="Ranking score" value={s.ranking.totalScore != null ? s.ranking.totalScore.toFixed(1) : "—"} />
          <QuickMetric label="Brain fallback %" value={s.brain.fallbackRatePct != null ? `${s.brain.fallbackRatePct.toFixed(1)}%` : "—"} />
          <QuickMetric label="Ads risky runs %" value={s.ads.pctRunsRisky != null ? `${s.ads.pctRunsRisky.toFixed(0)}%` : "—"} />
          <QuickMetric label="CRO bottleneck" value={s.cro.topBottleneck ?? "—"} />
          <QuickMetric label="Platform overdue" value={s.platformCore.overdueSchedules != null ? String(s.platformCore.overdueSchedules) : "—"} />
          <QuickMetric label="Fusion conflicts" value={s.fusion.conflictCount != null ? String(s.fusion.conflictCount) : "—"} />
          <QuickMetric label="Growth last status" value={s.growthLoop.lastRunStatus ?? "—"} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Systems</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{systemCardsFromPayload(p)}</div>
      </section>

      {p.unifiedWarnings.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Cross-system warnings</h2>
          <ul className="mt-3 max-h-40 overflow-y-auto text-xs text-zinc-400">
            {p.unifiedWarnings.map((w) => (
              <li key={w} className="border-b border-zinc-800/50 py-1">
                {w}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {p.history.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Recent activity</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[11px] text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-1 pr-2">Time</th>
                  <th className="py-1 pr-2">System</th>
                  <th className="py-1 pr-2">Event</th>
                  <th className="py-1">Note</th>
                </tr>
              </thead>
              <tbody>
                {p.history.map((h, i) => (
                  <tr key={`${h.ts}-${i}`} className="border-b border-zinc-800/40">
                    <td className="py-1 pr-2 font-mono text-zinc-500">{new Date(h.ts).toLocaleString()}</td>
                    <td className="py-1 pr-2">{h.system}</td>
                    <td className="py-1 pr-2">{h.event}</td>
                    <td className="py-1">{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="text-[10px] text-zinc-600">
        Freshness ~{Math.round(p.meta.dataFreshnessMs / 1000)}s · Sources: {p.meta.sourcesUsed.length} · Missing:{" "}
        {p.meta.missingSources.length}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}
