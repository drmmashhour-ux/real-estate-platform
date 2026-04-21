import type { PortfolioAssetContext } from "./portfolio-access";
import { computePortfolioHealth, effectiveConfidenceLabel, deriveConfidence } from "./portfolio-health.engine";
import type { PortfolioHealthResult, PortfolioPriorityRow, PriorityCategory } from "./portfolio.types";
import type { PortfolioPolicy } from "@prisma/client";

type HealthMap = Map<string, PortfolioHealthResult>;

function policyWeights(p: PortfolioPolicy) {
  return {
    esg: p.esgPriorityWeight,
    rev: p.revenuePriorityWeight,
    comp: p.compliancePriorityWeight,
    fin: p.financingPriorityWeight,
  };
}

/**
 * Rank assets for the portfolio board. Deterministic; uses health + context + policy weights.
 * priorityType values follow Prisma `PortfolioPriority.priorityType` (Part 2).
 */
export function buildPortfolioPriorities(
  contexts: Map<string, PortfolioAssetContext>,
  healthByAsset: HealthMap,
  policy: PortfolioPolicy,
): PortfolioPriorityRow[] {
  const w = policyWeights(policy);
  const rows: Array<PortfolioPriorityRow & { _sort: number }> = [];

  for (const [assetId, ctx] of contexts) {
    const h = healthByAsset.get(assetId) ?? computePortfolioHealth(ctx);
    const band = h.healthBand;
    const conf = effectiveConfidenceLabel(deriveConfidence(ctx), ctx);
    const confPenalty = conf === "LOW" ? 0.25 : conf === "MEDIUM" ? 0.1 : 0;

    const urgency =
      band === "CRITICAL" || band === "AT_RISK" ? 1 : band === "WATCHLIST" ? 0.7 : band === "STABLE" ? 0.4 : 0.2;
    const expectedImprovement = 1 - h.overallHealthScore / 100;
    const compliancePenalty = 1 + (ctx.complianceOpenCount + ctx.complianceHighSeverityOpen * 2) * 0.05;
    const covenantRisk = 1 + ctx.financingOpenConditions * 0.08 + ctx.activeCovenants * 0.03;

    let strategicImportance =
      w.rev * (ctx.revenueInitialized ? 0.9 : 1.1) +
      w.esg * (ctx.esgOpenCriticalOrHigh > 0 ? 1.2 : 1) +
      w.comp * (ctx.complianceOpenCount > 0 ? 1.25 : 1) +
      w.fin * (ctx.financingOpenConditions > 0 ? 1.15 : 1);

    strategicImportance /= 4;

    const costPenalty =
      ctx.esgOpenCriticalOrHigh > 2 ? 0.08 : ctx.pipelineChecklistOpen > 3 ? 0.06 : 0;

    const rawScore =
      urgency *
      (0.45 + expectedImprovement * 0.55) *
      strategicImportance *
      compliancePenalty *
      covenantRisk -
      costPenalty -
      confPenalty;

    const score = Math.max(0, Math.round(rawScore * 1000) / 1000);

    let priorityType: PriorityCategory = "QUICK_WIN";
    if (ctx.complianceHighSeverityOpen > 0 || ctx.financingOpenConditions > 3) priorityType = "URGENT_FIX";
    else if (ctx.complianceOpenCount > 0) priorityType = "COMPLIANCE";
    else if (ctx.esgOpenCriticalOrHigh > 0) priorityType = "ESG";
    else if (ctx.financingOpenConditions > 0 || ctx.activeCovenants > 4) priorityType = "FINANCING";
    else if (band === "WATCHLIST" || band === "AT_RISK") priorityType = "REVENUE";
    else if (expectedImprovement > 0.35 && urgency < 0.9) priorityType = "CAPITAL_PROJECT";

    rows.push({
      assetId,
      assetName: ctx.assetName,
      priorityType,
      rank: 0,
      priorityScore: score,
      title: `${ctx.assetName}: ${priorityType.replace(/_/g, " ")} focus`,
      explanation: [
        `Health band ${band} (${h.overallHealthScore.toFixed(1)}).`,
        `Confidence ${conf} (penalty applied in ranking if evidence is weak).`,
        ctx.complianceOpenCount || ctx.esgOpenCriticalOrHigh || ctx.financingOpenConditions
          ? `Signals: compliance ${ctx.complianceOpenCount}, ESG backlog ${ctx.esgOpenCriticalOrHigh}, financing conditions ${ctx.financingOpenConditions}.`
          : "Signals show no major open financing/compliance backlog for this asset.",
      ].join(" "),
      actionHint: { priorityType, healthBand: band },
      _sort: score,
    });
  }

  rows.sort((a, b) => b._sort - a._sort);
  const out: PortfolioPriorityRow[] = rows.map((r, i) => {
    const { _sort: _ignored, ...rest } = r;
    return { ...rest, rank: i + 1 };
  });
  return out;
}

export function pickWatchlistFromHealth(
  healthByAsset: HealthMap,
): Array<{ assetId: string; healthBand: PortfolioHealthResult["healthBand"]; reason: string }> {
  const out: Array<{ assetId: string; healthBand: PortfolioHealthResult["healthBand"]; reason: string }> = [];
  for (const [id, h] of healthByAsset) {
    if (h.healthBand === "WATCHLIST" || h.healthBand === "AT_RISK" || h.healthBand === "CRITICAL") {
      out.push({
        assetId: id,
        healthBand: h.healthBand,
        reason: `Band ${h.healthBand} — ${h.blockers.length ? h.blockers.map((b) => b.code).join(", ") : "monitor drift"}`,
      });
    }
  }
  return out;
}
