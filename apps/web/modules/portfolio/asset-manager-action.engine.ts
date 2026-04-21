import type { PortfolioAssetContext } from "./portfolio-access";
import type { PortfolioHealthResult, AssetStrategyType, AssetManagerActionDraft } from "./portfolio.types";
import type { PortfolioPolicy } from "@prisma/client";

function lowRiskDocumentationEligible(policy: PortfolioPolicy): boolean {
  return policy.autonomyMode === "AUTO_LOW_RISK";
}

export function buildAssetManagerActions(input: {
  ctx: PortfolioAssetContext;
  health: PortfolioHealthResult;
  strategy: AssetStrategyType;
  policy: PortfolioPolicy;
}): AssetManagerActionDraft[] {
  const { ctx, health, strategy, policy } = input;
  const actions: AssetManagerActionDraft[] = [];

  if (!ctx.operationsInitialized) {
    actions.push({
      title: "Complete operations onboarding checklist",
      category: "OPERATIONS",
      priority: "HIGH",
      expectedImpactBand: "MEDIUM",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "OPERATIONS",
      explanation: "Unblocks downstream monitoring and prevents silent drift in revenue/compliance surfaces.",
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  if (!ctx.revenueInitialized) {
    actions.push({
      title: "Initialize revenue / occupancy telemetry",
      category: "REVENUE",
      priority: "HIGH",
      expectedImpactBand: "HIGH",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "SHARED",
      explanation: "Portfolio health relies on observable occupancy and collections signals — estimates are not substitutes.",
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  if (ctx.esgOpenCriticalOrHigh > 0 && ctx.listingId) {
    actions.push({
      title: "Clear critical/high ESG action-center items",
      category: "ESG",
      priority: "CRITICAL",
      expectedImpactBand: "HIGH",
      costBand: "MEDIUM_BUDGET",
      timelineBand: "MEDIUM",
      ownerType: "SHARED",
      explanation: `${ctx.esgOpenCriticalOrHigh} open item(s) — affects ESG band and disclosure readiness.`,
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  if ((ctx.esgEvidenceConfidence ?? 0) < 55 && ctx.listingId) {
    actions.push({
      title: "Upload supporting ESG evidence (energy / envelope / procurement)",
      category: "DOCUMENTATION",
      priority: "MEDIUM",
      expectedImpactBand: "MEDIUM",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "INVESTOR",
      explanation: "Evidence-first steps often unlock confidence gains without capex — bounded learning prioritizes this pattern.",
      approvalRequired: false,
      eligibleForAutoLowRisk: lowRiskDocumentationEligible(policy),
    });
  }

  if (ctx.complianceOpenCount > 0) {
    actions.push({
      title: "Resolve open compliance cases with reviewer",
      category: "COMPLIANCE",
      priority: ctx.complianceHighSeverityOpen > 0 ? "CRITICAL" : "HIGH",
      expectedImpactBand: "HIGH",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "ADMIN",
      explanation: "Compliance backlog directly caps portfolio exit readiness and lender credibility.",
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  if (ctx.financingOpenConditions > 0) {
    actions.push({
      title: "Close outstanding financing conditions with lender package owner",
      category: "FINANCING",
      priority: "HIGH",
      expectedImpactBand: "HIGH",
      costBand: "MEDIUM_BUDGET",
      timelineBand: "MEDIUM",
      ownerType: "SHARED",
      explanation: "Financing conditions left open increase covenant breach drift — no autonomous waiver.",
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  if (ctx.pipelineChecklistOpen > 0) {
    actions.push({
      title: "Clear pipeline closing checklist items",
      category: "DOCUMENTATION",
      priority: "MEDIUM",
      expectedImpactBand: "MEDIUM",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "BROKER",
      explanation: "Outstanding checklist rows indicate execution gaps versus committed lender/investor timeline.",
      approvalRequired: true,
      eligibleForAutoLowRisk: lowRiskDocumentationEligible(policy),
    });
  }

  if (strategy === "GROWTH" || strategy === "YIELD_PROTECTION") {
    actions.push({
      title: "Refresh investor-facing narrative after operational fixes",
      category: "DOCUMENTATION",
      priority: "LOW",
      expectedImpactBand: "LOW",
      costBand: "LOW_BUDGET",
      timelineBand: "SHORT",
      ownerType: "INVESTOR",
      explanation: "Keeps disclosures aligned with verified asset state — conservative wording required.",
      approvalRequired: true,
      eligibleForAutoLowRisk: false,
    });
  }

  actions.sort((a, b) => prioRank(a.priority) - prioRank(b.priority));

  /** Non-negotiable guardrail: capex-heavy claims always require approval in downstream persistence. */
  void health.blockers.length;
  return actions;
}

function prioRank(p: AssetManagerActionDraft["priority"]): number {
  switch (p) {
    case "CRITICAL":
      return 0;
    case "HIGH":
      return 1;
    case "MEDIUM":
      return 2;
    default:
      return 3;
  }
}
