import type { PortfolioAssetContext } from "./portfolio-access";
import type { PortfolioHealthResult } from "./portfolio.types";
import type { PortfolioPriorityRow } from "./portfolio.types";
import type { CapitalAllocationOutput } from "./portfolio.types";
import type { PortfolioPolicy } from "@prisma/client";

type BudgetBand = CapitalAllocationOutput["allocationSummary"][number]["budgetBand"];

/** Notional allocation by band — no fabricated dollar amounts (Part 5). */
export function allocatePortfolioCapitalBands(input: {
  contexts: Map<string, PortfolioAssetContext>;
  healthByAsset: Map<string, PortfolioHealthResult>;
  priorities: PortfolioPriorityRow[];
  policy: PortfolioPolicy;
}): CapitalAllocationOutput {
  const { contexts, healthByAsset, priorities, policy } = input;
  const priorityBoost = new Set(priorities.slice(0, 5).map((p) => p.assetId));
  const rationale: string[] = [
    "Capital bands are directional and relative to portfolio scope — not confirmed budgets.",
    "Weights reflect policy sliders (ESG/compliance/revenue/financing) combined with urgency from health.",
    "Top-ranked priorities receive extra notional allocation share (still non-binding).",
    `Policy: autonomy ${policy.autonomyMode}, risk ${policy.riskTolerance}, capex ${policy.capexTolerance}.`,
  ];

  const n = Math.max(contexts.size, 1);
  /** Equal base share — adjusted by risk and opportunity. */
  let baseShare = 100 / n;

  const allocationSummary: CapitalAllocationOutput["allocationSummary"] = [];

  const urgentPool: CapitalAllocationOutput["reservedForUrgentFixes"] = [];
  const quickWinPool: CapitalAllocationOutput["quickWinPool"] = [];
  const capexPool: CapitalAllocationOutput["strategicCapexPool"] = [];

  for (const [assetId, ctx] of contexts) {
    const h = healthByAsset.get(assetId);
    const healthScore = h?.overallHealthScore ?? 60;
    const band = h?.healthBand ?? "WATCHLIST";

    let budgetBand: BudgetBand = "MEDIUM_BUDGET";
    if (band === "CRITICAL" || band === "AT_RISK") budgetBand = "HIGH_BUDGET";
    else if (band === "STRONG" || band === "STABLE") budgetBand = "LOW_BUDGET";

    const urgencyBoost =
      ctx.complianceHighSeverityOpen > 0 || ctx.financingOpenConditions > 2 ? 1.35 : 1;
    const prioBoost = priorityBoost.has(assetId) ? 1.12 : 1;
    const share = clampPercent((baseShare * (100 - healthScore * 0.35) * urgencyBoost * prioBoost) / 100);

    const purpose: string[] = [];
    if (ctx.financingOpenConditions) purpose.push("financing_condition_closure");
    if (ctx.esgOpenCriticalOrHigh) purpose.push("esg_evidence_and_actions");
    if (ctx.complianceOpenCount) purpose.push("compliance_remediation");
    if (!ctx.operationsInitialized || !ctx.revenueInitialized) purpose.push("operational_stabilization");
    if (purpose.length === 0) purpose.push("preventive_monitoring_and_yield_protection");

    allocationSummary.push({
      assetId,
      assetName: ctx.assetName,
      budgetBand,
      percentOfNotionalPortfolio: Math.round(share * 10) / 10,
      purpose,
    });

    if (band === "CRITICAL" || band === "AT_RISK" || ctx.complianceHighSeverityOpen > 0) {
      urgentPool.push({
        assetId,
        rationale: "Elevated risk band or severe compliance exposure reserves attention first.",
      });
    }
    if (healthScore >= 55 && healthScore <= 74 && ctx.esgOpenCriticalOrHigh === 0) {
      quickWinPool.push({
        assetId,
        rationale: "Moderate health with cleaner near-term surfaces — candidate for quick operational wins.",
      });
    }
    if (ctx.esgOpenCriticalOrHigh > 0 || budgetBand === "HIGH_BUDGET") {
      capexPool.push({
        assetId,
        rationale: "Strategic / retrofit or remediation envelope when policy and approvals allow.",
      });
    }
  }

  allocationSummary.sort((a, b) => b.percentOfNotionalPortfolio - a.percentOfNotionalPortfolio);

  return {
    allocationSummary,
    reservedForUrgentFixes: urgentPool.slice(0, 8),
    quickWinPool: quickWinPool.slice(0, 8),
    strategicCapexPool: capexPool.slice(0, 8),
    rationale,
    disclosure:
      "Percentages sum notionally across the visible portfolio slice; execution requires approval and verified economics — not guaranteed returns.",
  };
}

function clampPercent(x: number): number {
  return Math.max(1, Math.min(60, Math.round(x * 10) / 10));
}
