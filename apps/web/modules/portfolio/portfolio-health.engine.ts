import type { ConfidenceLevel, HealthBand, PortfolioHealthResult } from "./portfolio.types";
import type { PortfolioAssetContext } from "./portfolio-access";

const W = {
  revenue: 0.25,
  esg: 0.22,
  compliance: 0.2,
  financing: 0.15,
  operations: 0.18,
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function scoreToBand(score: number): HealthBand {
  if (score >= 85) return "STRONG";
  if (score >= 70) return "STABLE";
  if (score >= 55) return "WATCHLIST";
  if (score >= 40) return "AT_RISK";
  return "CRITICAL";
}

export function deriveConfidence(ctx: PortfolioAssetContext): ConfidenceLevel {
  const evidence = ctx.esgEvidenceConfidence ?? ctx.esgDataCoveragePercent ?? 0;
  const coreSignals =
    (ctx.listingId ? 1 : 0) +
    (ctx.pipelineDealId ? 1 : 0) +
    (ctx.revenueInitialized ? 1 : 0) +
    (ctx.operationsInitialized ? 1 : 0);
  if (evidence >= 70 && coreSignals >= 3) return "HIGH";
  if (evidence >= 40 || coreSignals >= 2) return "MEDIUM";
  return "LOW";
}

/** Deterministic revenue / occupancy proxy — conservative when operational signals absent. */
function computeRevenueHealth(ctx: PortfolioAssetContext): PortfolioHealthResult["subscores"]["revenue"] {
  let score = 74;
  const factors: PortfolioHealthResult["subscores"]["revenue"]["factors"] = [];

  if (!ctx.revenueInitialized) {
    score -= 12;
    factors.push({
      key: "revenue_signals_uninitialized",
      contribution: -12,
      detail: "Revenue tracking not initialized — occupancy and collections signals unavailable.",
    });
  } else {
    factors.push({
      key: "revenue_initialized",
      contribution: 6,
      detail: "Basic revenue initialization flag present.",
    });
    score += 6;
  }

  const metaOccupancy = typeof ctx.onboardingMetadata.expectedOccupancy === "number";
  if (metaOccupancy) {
    factors.push({
      key: "onboarding_occupancy_hint",
      contribution: 4,
      detail: "Onboarding metadata references occupancy guidance.",
    });
    score += 4;
  }

  score = clamp(score, 35, 96);

  return {
    score,
    factors,
  };
}

function computeEsgHealth(ctx: PortfolioAssetContext): PortfolioHealthResult["subscores"]["esg"] {
  let score = 68;
  const factors: PortfolioHealthResult["subscores"]["esg"]["factors"] = [];

  const composite = ctx.esgComposite;
  if (composite != null && composite > 0) {
    const mapped = clamp(composite, 40, 98);
    score = mapped * 0.85 + 15;
    factors.push({
      key: "esg_composite",
      contribution: mapped * 0.85,
      detail: `ESG composite score observed at ${composite.toFixed(1)} (mapped conservatively).`,
    });
  } else {
    factors.push({
      key: "esg_composite_missing",
      contribution: -8,
      detail: "No published ESG composite — using neutral baseline (not verified).",
    });
    score -= 8;
  }

  const conf = ctx.esgEvidenceConfidence ?? ctx.esgDataCoveragePercent ?? 0;
  if (conf < 45) {
    score -= 10;
    factors.push({
      key: "evidence_confidence_low",
      contribution: -10,
      detail: `Evidence confidence/coverage low (${conf.toFixed(0)}%).`,
    });
  }

  if (ctx.esgOpenCriticalOrHigh > 0) {
    const pen = Math.min(22, ctx.esgOpenCriticalOrHigh * 7);
    score -= pen;
    factors.push({
      key: "open_esg_actions",
      contribution: -pen,
      detail: `${ctx.esgOpenCriticalOrHigh} open high/critical ESG action(s) in action center.`,
    });
  }

  if (ctx.esgHighCarbonMaterials) {
    score -= 6;
    factors.push({
      key: "high_carbon_materials_flag",
      contribution: -6,
      detail: "High-carbon materials flag reduces ESG health until evidence improves.",
    });
  }

  score = clamp(score, 30, 98);
  return { score, factors };
}

function computeComplianceHealth(ctx: PortfolioAssetContext): PortfolioHealthResult["subscores"]["compliance"] {
  let score = 88;
  const factors: PortfolioHealthResult["subscores"]["compliance"]["factors"] = [];

  if (ctx.complianceOpenCount > 0) {
    const pen = Math.min(35, ctx.complianceOpenCount * 8 + ctx.complianceHighSeverityOpen * 6);
    score -= pen;
    factors.push({
      key: "open_compliance_cases",
      contribution: -pen,
      detail: `${ctx.complianceOpenCount} open compliance case(s); ${ctx.complianceHighSeverityOpen} high/critical severity.`,
    });
  } else {
    factors.push({
      key: "no_open_compliance_cases",
      contribution: 5,
      detail: "No open compliance cases tied to this asset’s deal/listing scope.",
    });
    score += 5;
  }

  score = clamp(score, 25, 99);
  return { score, factors };
}

function computeFinancingHealth(ctx: PortfolioAssetContext): PortfolioHealthResult["subscores"]["financing"] {
  let score = ctx.pipelineDealId ? 78 : 72;
  const factors: PortfolioHealthResult["subscores"]["financing"]["factors"] = [];

  if (!ctx.pipelineDealId) {
    factors.push({
      key: "no_linked_pipeline_deal",
      contribution: -6,
      detail: "No investment-pipeline deal linked by listing — covenant/condition signals limited.",
    });
    score -= 6;
  }

  if (ctx.financingOpenConditions > 0) {
    const pen = Math.min(28, ctx.financingOpenConditions * 9);
    score -= pen;
    factors.push({
      key: "open_financing_conditions",
      contribution: -pen,
      detail: `${ctx.financingOpenConditions} open financing condition(s) on pipeline deal.`,
    });
  }

  if (ctx.activeCovenants > 0) {
    factors.push({
      key: "active_covenants_monitoring_load",
      contribution: -Math.min(12, ctx.activeCovenants * 3),
      detail: `${ctx.activeCovenants} active covenant record(s) require monitoring cadence.`,
    });
    score -= Math.min(12, ctx.activeCovenants * 3);
  }

  score = clamp(score, 28, 96);
  return { score, factors };
}

function computeOperationsHealth(ctx: PortfolioAssetContext): PortfolioHealthResult["subscores"]["operations"] {
  let score = 76;
  const factors: PortfolioHealthResult["subscores"]["operations"]["factors"] = [];

  if (!ctx.operationsInitialized) {
    score -= 14;
    factors.push({
      key: "operations_not_initialized",
      contribution: -14,
      detail: "Operations onboarding incomplete — backlog risk elevated.",
    });
  } else {
    score += 6;
    factors.push({
      key: "operations_initialized",
      contribution: 6,
      detail: "Operations initialization flag present.",
    });
  }

  if (ctx.pipelineChecklistOpen > 0) {
    const pen = Math.min(24, ctx.pipelineChecklistOpen * 6);
    score -= pen;
    factors.push({
      key: "pipeline_closing_checklist_open",
      contribution: -pen,
      detail: `${ctx.pipelineChecklistOpen} open closing checklist item(s).`,
    });
  }

  score = clamp(score, 30, 96);
  return { score, factors };
}

export function computePortfolioHealth(ctx: PortfolioAssetContext): PortfolioHealthResult {
  const revenue = computeRevenueHealth(ctx);
  const esg = computeEsgHealth(ctx);
  const compliance = computeComplianceHealth(ctx);
  const financing = computeFinancingHealth(ctx);
  const operations = computeOperationsHealth(ctx);

  const rawOverall =
    W.revenue * revenue.score +
    W.esg * esg.score +
    W.compliance * compliance.score +
    W.financing * financing.score +
    W.operations * operations.score;

  const confidence = deriveConfidence(ctx);
  const cappedOverall =
    confidence === "LOW"
      ? clamp(rawOverall - 5, 0, 100)
      : confidence === "MEDIUM"
        ? clamp(rawOverall - 2, 0, 100)
        : rawOverall;

  const band = scoreToBand(cappedOverall);

  const blockers: PortfolioHealthResult["blockers"] = [];
  if (!ctx.operationsInitialized)
    blockers.push({
      code: "OPS_INIT",
      severity: "HIGH",
      description: "Operations onboarding incomplete.",
    });
  if (!ctx.revenueInitialized)
    blockers.push({
      code: "REV_INIT",
      severity: "MEDIUM",
      description: "Revenue signals not initialized — occupancy/arrears visibility reduced.",
    });
  if (ctx.esgOpenCriticalOrHigh > 0)
    blockers.push({
      code: "ESG_ACTION_BACKLOG",
      severity: "HIGH",
      description: "Open critical/high ESG actions remain in action center.",
    });
  if (ctx.complianceHighSeverityOpen > 0)
    blockers.push({
      code: "COMPLIANCE_SEVERE",
      severity: "CRITICAL",
      description: "High/critical compliance cases require human review.",
    });
  if (ctx.financingOpenConditions > 0)
    blockers.push({
      code: "FIN_CONDITIONS",
      severity: "HIGH",
      description: "Outstanding financing conditions on linked pipeline package.",
    });

  const opportunities: PortfolioHealthResult["opportunities"] = [];
  if ((ctx.esgEvidenceConfidence ?? 0) < 60 && ctx.listingId)
    opportunities.push({
      code: "ESG_EVIDENCE",
      upside: "MEDIUM",
      description: "Evidence uploads could unlock higher confidence and improved ESG health.",
    });
  if (ctx.pipelineDealId && ctx.financingOpenConditions === 0 && ctx.activeCovenants > 0)
    opportunities.push({
      code: "COVENANT_MONITORING",
      upside: "LOW",
      description: "Formalize covenant monitoring cadence while conditions are clean.",
    });

  const explanation = [
    `Overall health ${cappedOverall.toFixed(1)} (${band}) using weighted dimensions`,
    `(revenue ${W.revenue}, ESG ${W.esg}, compliance ${W.compliance}, financing ${W.financing}, operations ${W.operations}).`,
    `Confidence ${confidence}: evidence and initialization gates applied (conservative when sparse).`,
  ].join(" ");

  return {
    overallHealthScore: Math.round(cappedOverall * 10) / 10,
    healthBand: band,
    subscores: { revenue, esg, compliance, financing, operations },
    blockers,
    opportunities,
    explanation,
  };
}

export function effectiveConfidenceLabel(
  mathConfidence: ConfidenceLevel,
  ctx: PortfolioAssetContext,
): ConfidenceLevel {
  if (mathConfidence === "HIGH" && ((ctx.esgEvidenceConfidence ?? 0) < 45 || !ctx.listingId)) {
    return "MEDIUM";
  }
  return mathConfidence;
}
