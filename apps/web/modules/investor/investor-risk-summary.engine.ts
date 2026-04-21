import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";

export type RiskBuckets = {
  strengths: string[];
  criticalRisks: string[];
  highRisks: string[];
  mediumRisks: string[];
  mitigants: string[];
};

export function buildRiskStructuredSummary(ctx: InvestorListingContext): RiskBuckets {
  const strengths: string[] = [];
  const criticalRisks: string[] = [];
  const highRisks: string[] = [];
  const mediumRisks: string[] = [];
  const mitigants: string[] = [];

  if (ctx.esgProfile?.compositeScore != null && ctx.esgProfile.compositeScore >= 55) {
    strengths.push(
      `Composite ESG score ${ctx.esgProfile.compositeScore.toFixed(0)} (grade ${ctx.esgProfile.grade ?? "—"}) based on platform methodology.`
    );
  }

  if (ctx.evidenceCounts.documents > 0 || ctx.evidenceCounts.evidenceRows > 0) {
    strengths.push(
      `Structured evidence artifacts present (${ctx.evidenceCounts.documents} document(s), ${ctx.evidenceCounts.evidenceRows} evidence row(s)) — improves auditability vs. estimates alone.`
    );
  }

  if (ctx.retrofitPlan?.planName) {
    strengths.push(`Retrofit planner output available (${ctx.retrofitPlan.strategyType}) — phased upgrade path can be reviewed in diligence.`);
  }

  const coverage = ctx.esgProfile?.dataCoveragePercent ?? null;
  const conf = ctx.esgProfile?.evidenceConfidence ?? null;
  if (coverage !== null && coverage < 40) {
    highRisks.push(
      `Data coverage is limited (${coverage.toFixed(0)}% estimated from ingestion) — several metrics may remain **estimated, not verified**.`
    );
  }
  if (conf !== null && conf < 40) {
    highRisks.push(
      `Evidence confidence is low (${conf.toFixed(0)}/100) — conclusions should be treated as provisional.`
    );
  }

  for (const iss of ctx.compliance?.blockingIssues ?? []) {
    if (typeof iss === "string") criticalRisks.push(`Compliance / governance signal: ${iss}`);
    else if (iss && typeof iss === "object" && "message" in iss && typeof (iss as { message: unknown }).message === "string") {
      criticalRisks.push(`Compliance / governance signal: ${(iss as { message: string }).message}`);
    }
  }

  const blocked = ctx.esgActionsOpen.filter((a) => a.status === "BLOCKED");
  for (const b of blocked.slice(0, 5)) {
    criticalRisks.push(`Blocked ESG action (${b.reasonCode}): ${b.title}`);
  }

  const criticalActions = ctx.esgActionsOpen.filter((a) => a.priority === "CRITICAL");
  for (const a of criticalActions.slice(0, 5)) {
    highRisks.push(`Critical open action: ${a.title} (${a.priority})`);
  }

  if (ctx.investmentOpportunity?.riskLevel === "HIGH") {
    highRisks.push(
      `Investment opportunity model tagged risk as HIGH — align with underwriting assumptions (estimated inputs may apply).`
    );
  }

  if (criticalRisks.length === 0 && highRisks.length === 0) {
    mediumRisks.push(
      `Residual execution, market, and regulatory risks always apply — this summary reflects only structured LECIPM signals, not external macro or title risk.`
    );
  }

  mitigants.push(
    `Use LECIPM Action Center + document ingestion to close evidence gaps before final credit / IC sign-off.`
  );
  if (ctx.financingOptions.length > 0) {
    mitigants.push(`Review matched green / retrofit financing options for capital stack compatibility (eligibility requires confirmation).`);
  }

  return { strengths, criticalRisks, highRisks, mediumRisks, mitigants };
}
