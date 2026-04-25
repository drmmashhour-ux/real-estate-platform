import type { ExecutiveNarrativeBlock, ExecutiveReportView } from "./executive-report.types";

export type ExecutiveReportForNarrative = Omit<ExecutiveReportView, "narrative">;

function fmt(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "n/a";
  return digits ? n.toFixed(digits) : String(Math.round(n));
}

/**
 * Template-only narrative: every sentence is derived from `report` fields.
 * Does not invent metrics or external facts.
 */
export function generateExecutiveNarrative(report: ExecutiveReportForNarrative): ExecutiveNarrativeBlock {
  const assumptions: string[] = [...report.kpi.assumptions, ...report.strategy.assumptions];

  const k = report.kpi;
  const s = report.strategy;
  const p = report.portfolio;
  const i = report.investor;
  const a = report.autonomy;

  const keyInsights: string[] = [];

  if (k.leadsCreated.value != null) {
    keyInsights.push(`Leads created in period (trace: ${k.leadsCreated.trace.tables.join(", ")}): ${fmt(k.leadsCreated.value)}.`);
  }
  if (k.pipelineDealsCreated.value != null && k.pipelineDealsClosedInPeriod.value != null) {
    keyInsights.push(
      `IC pipeline deals opened: ${fmt(k.pipelineDealsCreated.value)}; closed in period: ${fmt(k.pipelineDealsClosedInPeriod.value)}.`
    );
  }
  if (k.committeeFavorableRate.value != null) {
    keyInsights.push(
      `Committee favorable ratio (operational definition): ${fmt(k.committeeFavorableRate.value * 100, 1)}%. ${k.committeeFavorableRate.trace.partialDataNote ?? ""}`.trim()
    );
  }
  if (k.pipelineCapitalRequiredSum.value != null) {
    keyInsights.push(
      `Summed capital required targets on active pipeline stacks: ${fmt(k.pipelineCapitalRequiredSum.value, 2)} (engineering inputs, not market pricing).`
    );
  }
  if (i.opportunityCountInPeriod.value != null && i.meanExpectedRoiPercent.value != null) {
    keyInsights.push(
      `Investment opportunity snapshots in period: ${fmt(i.opportunityCountInPeriod.value)}; mean stored expectedROI: ${fmt(i.meanExpectedRoiPercent.value, 2)}%.`
    );
  }

  if (s.benchmarkTop[0]) {
    const t = s.benchmarkTop[0];
    keyInsights.push(
      `Top benchmarked strategy by wins in aggregates: ${t.strategyKey} (${t.domain}), wins=${fmt(t.wins)}, uses=${fmt(t.totalUses)}.`
    );
  }
  if (s.reinforcementTopArms[0]) {
    const r = s.reinforcementTopArms[0];
    keyInsights.push(
      `Top reinforcement arm by avgReward (pulls=${fmt(r.pulls)}): ${r.strategyKey} / ${r.domain} / bucket ${r.contextBucket}.`
    );
  }

  const changesVsPreviousPeriod: string[] = [];
  if (s.vsPreviousPeriod.strategyExecutionEventsDelta != null) {
    changesVsPreviousPeriod.push(
      `Strategy execution events vs prior period: ${s.vsPreviousPeriod.strategyExecutionEventsDelta >= 0 ? "+" : ""}${fmt(s.vsPreviousPeriod.strategyExecutionEventsDelta)}.`
    );
  }
  if (s.vsPreviousPeriod.reinforcementDecisionsDelta != null) {
    changesVsPreviousPeriod.push(
      `Reinforcement decisions vs prior period: ${s.vsPreviousPeriod.reinforcementDecisionsDelta >= 0 ? "+" : ""}${fmt(s.vsPreviousPeriod.reinforcementDecisionsDelta)}.`
    );
  }
  if (changesVsPreviousPeriod.length === 0) {
    changesVsPreviousPeriod.push("Period-over-period strategy deltas were not available or were zero.");
  }

  const topRisks: string[] = [];
  for (const d of p.highRiskDeals.slice(0, 3)) {
    topRisks.push(
      `Pipeline ${d.dealId.slice(0, 8)}… "${d.title}" — stage ${d.pipelineStage}, label ${d.underwritingLabel ?? "n/a"}, recommendation ${d.underwritingRecommendation ?? "n/a"}.`
    );
  }
  if (i.riskLevelCounts.HIGH && i.riskLevelCounts.HIGH > (i.riskLevelCounts.LOW ?? 0)) {
    topRisks.push(
      `Opportunity snapshots: HIGH risk count (${fmt(i.riskLevelCounts.HIGH)}) exceeds LOW (${fmt(i.riskLevelCounts.LOW ?? 0)}).`
    );
  }
  if (a.blockedOrRejected.value != null && a.approvals.value != null && a.blockedOrRejected.value > a.approvals.value) {
    topRisks.push(
      `Autonomy actions: rejected/skipped/blocked count (${fmt(a.blockedOrRejected.value)}) exceeds executed/approved/success count (${fmt(a.approvals.value)}).`
    );
  }
  if (topRisks.length === 0) {
    topRisks.push("No pipeline deals matched the high-risk underwriting filters in this export.");
  }

  const topOpportunities: string[] = [];
  for (const d of p.highOpportunityDeals.slice(0, 3)) {
    topOpportunities.push(
      `Pipeline ${d.dealId.slice(0, 8)}… "${d.title}" — stage ${d.pipelineStage}, label ${d.underwritingLabel ?? "n/a"}, recommendation ${d.underwritingRecommendation ?? "n/a"}.`
    );
  }
  for (const n of i.expansionNotes.slice(0, 2)) {
    if (topOpportunities.length >= 3) break;
    topOpportunities.push(n);
  }
  if (topOpportunities.length === 0) {
    topOpportunities.push("No pipeline deals matched the high-opportunity underwriting filters in this export.");
  }

  const recommendedActions: string[] = [...report.recommendations.items];
  if (recommendedActions.length === 0) {
    recommendedActions.push("Review source tables cited in each section before acting; this export is informational.");
  }

  const summaryParts = [
    `Period ${report.periodKey} (UTC window ${k.range.startUtc} → ${k.range.endUtcExclusive}).`,
    `Leads created: ${fmt(k.leadsCreated.value)}; pipeline deals opened: ${fmt(k.pipelineDealsCreated.value)}; pipeline deals closed: ${fmt(k.pipelineDealsClosedInPeriod.value)}.`,
    `Autonomy actions logged: ${fmt(a.actionsCreatedInPeriod.value)}.`,
  ];
  const summaryText = summaryParts.join(" ");

  return {
    summaryText,
    keyInsights,
    changesVsPreviousPeriod,
    topRisks: topRisks.slice(0, 3),
    topOpportunities: topOpportunities.slice(0, 3),
    recommendedActions: recommendedActions.slice(0, 8),
    assumptions,
  };
}
