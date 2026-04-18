import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { InvestorModeView } from "../company-command-center-v5.types";

export function mapInvestorMode(v4: CompanyCommandCenterV4Payload): InvestorModeView {
  const s = v4.v3.shared.systems;
  const meta = v4.v3.shared.meta;

  const topMetrics: Record<string, string> = {};
  for (const k of v4.v3.shared.quickKpis.slice(0, 8)) {
    topMetrics[k.label] = k.value;
  }

  const growthSignals: string[] = [];
  if (s) {
    if (s.growthLoop.lastRunStatus) growthSignals.push(`Growth loop last run: ${s.growthLoop.lastRunStatus}`);
    if (s.ads.pctRunsRisky != null) growthSignals.push(`Ads risky run share (reported): ${s.ads.pctRunsRisky}%`);
    if (s.ranking.totalScore != null && s.ranking.maxScore != null) {
      growthSignals.push(`Ranking score (reported): ${s.ranking.totalScore.toFixed(1)} / ${s.ranking.maxScore}`);
    }
    if (s.cro.healthScore != null) growthSignals.push(`CRO health score (reported): ${s.cro.healthScore}`);
  }

  const stabilitySignals: string[] = [];
  stabilitySignals.push(`Subsystems loaded in aggregate: ${meta.systemsLoadedCount}`);
  stabilitySignals.push(`Overall executive posture: ${v4.v3.shared.overallStatus}`);
  if (meta.partialData) stabilitySignals.push("Partial data: some sources missing (see governance meta).");

  const moatSignals: string[] = [];
  if (meta.systemsLoadedCount > 0) {
    moatSignals.push("Multi-subsystem AI governance aggregate is active (read-only observation).");
  }
  if (s?.fusion.orchestrationActive) moatSignals.push("Fusion orchestration signal is active in snapshot.");

  const strategicRisks = v4.v3.roles.founder.topRisks.slice(0, 5).map((r) => r.label);

  const progressNarrative = v4.changesSinceYesterday.insufficientBaseline
    ? ["Insufficient baseline for trend narrative — enable prior window compare."]
    : v4.changesSinceYesterday.executiveSummary.slice(0, 6);

  const companySummary = [
    `Governance snapshot: ${v4.v3.shared.overallStatus}.`,
    meta.systemsLoadedCount
      ? `${meta.systemsLoadedCount} subsystems represented in this aggregate.`
      : "Limited subsystem coverage in this aggregate.",
  ].join(" ");

  return {
    mode: "investor",
    companySummary,
    growthSignals: growthSignals.slice(0, 8),
    stabilitySignals: stabilitySignals.slice(0, 8),
    moatSignals: moatSignals.slice(0, 6),
    topMetrics,
    strategicRisks: strategicRisks.length ? strategicRisks : ["—"],
    progressNarrative,
  };
}
