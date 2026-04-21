import type { PortfolioAssetContext } from "./portfolio-access";
import { computePortfolioHealth } from "./portfolio-health.engine";
import type { AssetStrategyType } from "./portfolio.types";
import type { PortfolioPolicy } from "@prisma/client";

export function selectAssetStrategy(input: {
  ctx: PortfolioAssetContext;
  policy: PortfolioPolicy;
}): { strategyType: AssetStrategyType; rationale: string[] } {
  const health = computePortfolioHealth(input.ctx);
  const rationale: string[] = [];

  if (input.ctx.complianceHighSeverityOpen > 0 || input.ctx.complianceOpenCount >= 3) {
    rationale.push("Compliance backlog dominates risk — stabilize legal posture first.");
    return { strategyType: "COMPLIANCE_RECOVERY", rationale };
  }

  if (health.healthBand === "STRONG" || health.healthBand === "STABLE") {
    if (input.policy.primaryObjective === "ESG_ADVANCEMENT" || input.policy.esgPriorityWeight > 1.15) {
      rationale.push("Healthy asset with elevated ESG policy weight — prioritize measurable upgrades.");
      return { strategyType: "ESG_UPGRADE", rationale };
    }
    rationale.push("Preserve performance — avoid drift via monitoring and light-touch fixes.");
    return { strategyType: "YIELD_PROTECTION", rationale };
  }

  if ((input.ctx.esgEvidenceConfidence ?? 0) < 50 && input.ctx.esgOpenCriticalOrHigh > 0) {
    rationale.push("Evidence gap + open ESG actions — upgrade pathway before scaling capex.");
    return { strategyType: "ESG_UPGRADE", rationale };
  }

  if (!input.ctx.revenueInitialized || health.subscores.revenue.score < 62) {
    rationale.push("Revenue surfaces weak — pursue stabilization then growth.");
    return { strategyType: "STABILIZE", rationale };
  }

  if (input.policy.primaryObjective === "CASHFLOW" || input.policy.primaryObjective === "BALANCED") {
    rationale.push("Mixed signals — balanced sequencing across revenue and risk reduction.");
    return { strategyType: "BALANCED", rationale };
  }

  rationale.push("Default stabilization path until blockers clear.");
  return { strategyType: "STABILIZE", rationale };
}
