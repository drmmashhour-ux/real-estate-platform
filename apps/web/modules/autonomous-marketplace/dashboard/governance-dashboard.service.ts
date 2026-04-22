/**
 * Compact dashboard slices + full dashboard view models for admin / investor surfaces.
 * Real-time trends and chart series require external analytics aggregation (see chart placeholders).
 */
import type {
  GovernanceExplainabilityLine,
  GovernanceRuleTrace,
  UnifiedGovernanceDisposition,
  UnifiedGovernanceInput,
  UnifiedGovernanceResult,
} from "../governance/unified-governance.types";

export type GovernanceAdminSummarySlice = {
  disposition: UnifiedGovernanceResult["disposition"];
  blocked: boolean;
  requiresHumanApproval: boolean;
  legalRiskLevel: UnifiedGovernanceResult["legalRisk"]["level"];
  fraudRiskLevel: UnifiedGovernanceResult["fraudRisk"]["level"];
  combinedRiskLevel: UnifiedGovernanceResult["combinedRisk"]["level"];
  revenueImpactEstimate: number;
  topReasons: string[];
  traceCount: number;
  alertSeverity: "none" | "info" | "warning" | "critical";
};

export type GovernanceInvestorSummarySlice = {
  governancePosture: string;
  marketplaceProtectionStatus: string;
  revenueAtRisk: number;
  anomalyLevel: UnifiedGovernanceResult["combinedRisk"]["level"];
  humanOversightStatus: string;
  narrativeSummary: string;
};

/** --- Real-time dashboard (admin): KPI + panel layout --- */

export type GovernanceAdminKpiRow = {
  governanceDisposition: UnifiedGovernanceDisposition;
  combinedRiskLevel: UnifiedGovernanceResult["combinedRisk"]["level"];
  revenueAtRisk: number;
  humanApprovalRequired: boolean;
  regionStatus: "open" | "restricted" | "blocked";
  executionReadiness: "ready" | "approval_required" | "blocked" | "dry_run_only";
};

export type GovernanceAdminRiskCards = {
  legal: {
    score: number;
    level: UnifiedGovernanceResult["legalRisk"]["level"];
    reasons: string[];
  };
  fraud: {
    score: number;
    level: UnifiedGovernanceResult["fraudRisk"]["level"];
    anomalySources: string[];
  };
  combined: {
    score: number;
    level: UnifiedGovernanceResult["combinedRisk"]["level"];
    finalPosture: string;
  };
};

export type GovernanceAdminGovernanceBlock = {
  governanceBlockActive: boolean;
  policyDecision?: string;
  approvalBoundary?: UnifiedGovernanceResult["approvalBoundary"];
  regionRestriction: boolean;
  executionAllowed: boolean;
  previewPosture: "allow" | "caution" | "review" | "block";
};

export type GovernanceAdminRevenueBlock = {
  grossBookingValue30d?: number;
  refunds30d?: number;
  chargebacks30d?: number;
  payoutVolume30d?: number;
  revenueAtRiskEstimate: number;
  topAnomalySources: string[];
};

export type GovernanceAdminExplainabilityBlock = {
  bullets: string[];
  lines: GovernanceExplainabilityLine[];
  ruleTrace: GovernanceRuleTrace[];
  identityScope?: string;
};

export type GovernanceAdminActionBlock = {
  recommendOnly: boolean;
  dryRun: boolean;
  requestApproval: boolean;
  rejectExecution: boolean;
};

export type GovernanceAdminDashboardView = {
  kpis: GovernanceAdminKpiRow;
  riskCards: GovernanceAdminRiskCards;
  governance: GovernanceAdminGovernanceBlock;
  revenue: GovernanceAdminRevenueBlock;
  explainability: GovernanceAdminExplainabilityBlock;
  action: GovernanceAdminActionBlock;
};

export type GovernanceDashboardBuildOptions = {
  /** Original governance input — supplies revenue facts + signal types for revenue / anomaly panels. */
  input?: Pick<UnifiedGovernanceInput, "revenueFacts" | "signals" | "regionCode" | "metadata">;
  /** Explicit preview posture override (else derived from disposition). */
  previewPosture?: GovernanceAdminGovernanceBlock["previewPosture"];
  /** Caller identity scope label for audit UI (optional). */
  identityScope?: string;
};

/** --- Investor dashboard (non-technical narrative + headline metrics) --- */

export type GovernanceInvestorNarrativeCard = {
  id: string;
  title: string;
  body: string;
};

/** Static copy aligned with LECIPM positioning — safe for investor-facing UI. */
export const GOVERNANCE_INVESTOR_NARRATIVE_CARDS: readonly GovernanceInvestorNarrativeCard[] = [
  {
    id: "marketplace_protection",
    title: "Marketplace protection",
    body: "High-risk actions are blocked or routed to human review before execution.",
  },
  {
    id: "revenue_defense",
    title: "Revenue defense",
    body: "Refund, chargeback, and payout anomalies are linked directly to governance scoring.",
  },
  {
    id: "regional_compliance",
    title: "Regional compliance",
    body: "Region-aware policies enforce stricter execution controls in higher-risk jurisdictions.",
  },
  {
    id: "explainable_ai",
    title: "Explainable AI",
    body: "ML signals assist prioritization, but final decisions remain rule-governed and auditable.",
  },
];

/** Snippets for deck / memo / one-pager (not rendered by default). */
export const LECIPM_GOVERNANCE_PITCH = {
  short:
    "LECIPM’s governance engine is a real-time control layer for an AI-powered real estate marketplace. It combines policy rules, legal risk, fraud signals, revenue anomaly detection, and region-specific restrictions into one explainable decision before any sensitive action is executed.",
  investor:
    "LECIPM does not rely on “black-box autonomy.” Instead, the platform uses a unified governance engine that evaluates every sensitive marketplace action through multiple safety layers: policy rules and region-specific restrictions; legal/compliance posture for high-risk actions; fraud and revenue anomaly detection tied to financial exposure; approval boundaries for human oversight; and explainability + audit so every decision can be traced and justified.",
  closing:
    "In practice, this turns LECIPM into a self-regulating marketplace: AI-assisted where speed matters, human-governed where trust matters, and fully auditable where risk matters.",
} as const;

export type GovernanceInvestorTopMetrics = {
  protectedRevenueEstimate?: number;
  revenueAtRisk: number;
  fraudAnomalyLevel: UnifiedGovernanceResult["fraudRisk"]["level"];
  humanOversightCoverage: "full" | "partial" | "none";
  autoExecutionLikely: boolean;
  restrictedMarketSafeguardsActive: boolean;
};

/** Chart slots need time-series aggregation — structure only for API/UI wiring. */
export type GovernanceDashboardChartsPlaceholder = {
  riskLevelDistributionOverTime: null;
  revenueAtRiskTrend: null;
  approvalRequiredTrend: null;
  fraudAnomaliesVsRecoveredRevenue: null;
  executionOutcomesByDisposition: null;
};

export const GOVERNANCE_DASHBOARD_CHARTS_PLACEHOLDER: GovernanceDashboardChartsPlaceholder = {
  riskLevelDistributionOverTime: null,
  revenueAtRiskTrend: null,
  approvalRequiredTrend: null,
  fraudAnomaliesVsRecoveredRevenue: null,
  executionOutcomesByDisposition: null,
};

export type GovernanceInvestorDashboardView = {
  topMetrics: GovernanceInvestorTopMetrics;
  narrativeCards: readonly GovernanceInvestorNarrativeCard[];
  charts: GovernanceDashboardChartsPlaceholder;
};

function dedupeReasons(reasons: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of reasons) {
    if (seen.has(r)) continue;
    seen.add(r);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

export function buildGovernanceAdminSummarySlice(result: UnifiedGovernanceResult): GovernanceAdminSummarySlice {
  const mergedReasons = [...result.legalRisk.reasons, ...result.fraudRisk.reasons];
  let alertSeverity: GovernanceAdminSummarySlice["alertSeverity"] = "none";
  if (result.blocked || result.disposition === "REJECTED" || result.disposition === "BLOCKED_FOR_REGION") {
    alertSeverity = "critical";
  } else if (
    result.combinedRisk.level === "HIGH" ||
    result.combinedRisk.level === "CRITICAL" ||
    result.legalRisk.level === "CRITICAL" ||
    result.fraudRisk.level === "CRITICAL"
  ) {
    alertSeverity = "warning";
  } else if (result.combinedRisk.level === "MEDIUM") {
    alertSeverity = "info";
  }

  return {
    disposition: result.disposition,
    blocked: result.blocked,
    requiresHumanApproval: result.requiresHumanApproval,
    legalRiskLevel: result.legalRisk.level,
    fraudRiskLevel: result.fraudRisk.level,
    combinedRiskLevel: result.combinedRisk.level,
    revenueImpactEstimate: result.fraudRisk.revenueImpactEstimate,
    topReasons: dedupeReasons(mergedReasons, 5),
    traceCount: result.trace.length,
    alertSeverity,
  };
}

export function buildGovernanceInvestorSummarySlice(result: UnifiedGovernanceResult): GovernanceInvestorSummarySlice {
  const protection =
    result.blocked || result.disposition === "REJECTED"
      ? "elevated_controls"
      : result.combinedRisk.level === "LOW"
        ? "stable"
        : "monitored";

  const oversight =
    result.requiresHumanApproval || result.disposition === "REQUIRE_APPROVAL"
      ? "required"
      : result.disposition === "AUTO_EXECUTE"
        ? "automated_low_risk"
        : "advisory";

  return {
    governancePosture: result.disposition,
    marketplaceProtectionStatus: protection,
    revenueAtRisk: result.fraudRisk.revenueImpactEstimate,
    anomalyLevel: result.combinedRisk.level,
    humanOversightStatus: oversight,
    narrativeSummary: buildInvestorNarrative(result),
  };
}

function buildInvestorNarrative(result: UnifiedGovernanceResult): string {
  const risk = result.combinedRisk.level;
  const fraud = result.fraudRisk.level;
  if (result.blocked) {
    return `Marketplace safeguards indicate this activity path is restricted (${risk} composite risk).`;
  }
  if (risk === "LOW" && fraud === "LOW") {
    return "Governance posture is steady with routine marketplace protections active.";
  }
  return `Protections are elevated — composite risk ${risk}, fraud stress ${fraud}; oversight ${result.requiresHumanApproval ? "remains in the loop" : "is advisory only for this posture"}.`;
}

function inferRegionStatus(
  result: UnifiedGovernanceResult,
  regionCode?: string,
): GovernanceAdminKpiRow["regionStatus"] {
  if (result.disposition === "BLOCKED_FOR_REGION" || result.blocked) return "blocked";
  const rc = String(regionCode ?? "")
    .trim()
    .toLowerCase();
  if (rc === "sy" || rc === "syria") return "restricted";
  if (result.approvalBoundary?.liveExecutionBlocked) return "restricted";
  return "open";
}

function inferExecutionReadiness(result: UnifiedGovernanceResult): GovernanceAdminKpiRow["executionReadiness"] {
  if (
    result.blocked ||
    result.disposition === "REJECTED" ||
    result.disposition === "BLOCKED_FOR_REGION"
  ) {
    return "blocked";
  }
  if (result.disposition === "DRY_RUN") return "dry_run_only";
  if (result.requiresHumanApproval || result.disposition === "REQUIRE_APPROVAL") return "approval_required";
  if (result.allowExecution && result.disposition === "AUTO_EXECUTE") return "ready";
  return "approval_required";
}

function inferPreviewPosture(
  result: UnifiedGovernanceResult,
  override?: GovernanceAdminGovernanceBlock["previewPosture"],
): GovernanceAdminGovernanceBlock["previewPosture"] {
  if (override) return override;
  switch (result.disposition) {
    case "ALLOW_PREVIEW":
      return "allow";
    case "CAUTION_PREVIEW":
      return "caution";
    case "REQUIRE_APPROVAL":
    case "REQUIRES_LOCAL_APPROVAL":
      return "review";
    case "REJECTED":
    case "BLOCKED_FOR_REGION":
      return "block";
    default:
      return result.blocked ? "block" : "caution";
  }
}

function collectAnomalySources(
  result: UnifiedGovernanceResult,
  input?: GovernanceDashboardBuildOptions["input"],
): string[] {
  const fromFraud = dedupeReasons(result.fraudRisk.reasons, 8);
  const fromSignals = (input?.signals ?? [])
    .filter((s) => (s.severity === "warning" || s.severity === "critical") && s.type)
    .map((s) => s.type);
  return dedupeReasons([...fromFraud, ...fromSignals], 8);
}

/**
 * Full admin dashboard view — operators, compliance, fraud, reviewers.
 */
export function buildGovernanceAdminDashboardView(
  result: UnifiedGovernanceResult,
  options?: GovernanceDashboardBuildOptions,
): GovernanceAdminDashboardView {
  const rf = options?.input?.revenueFacts;
  const regionCode = options?.input?.regionCode;
  const revenueAtRisk = result.fraudRisk.revenueImpactEstimate;

  return {
    kpis: {
      governanceDisposition: result.disposition,
      combinedRiskLevel: result.combinedRisk.level,
      revenueAtRisk,
      humanApprovalRequired: result.requiresHumanApproval || result.disposition === "REQUIRE_APPROVAL",
      regionStatus: inferRegionStatus(result, regionCode),
      executionReadiness: inferExecutionReadiness(result),
    },
    riskCards: {
      legal: {
        score: result.legalRisk.score,
        level: result.legalRisk.level,
        reasons: [...result.legalRisk.reasons],
      },
      fraud: {
        score: result.fraudRisk.score,
        level: result.fraudRisk.level,
        anomalySources: collectAnomalySources(result, options?.input),
      },
      combined: {
        score: result.combinedRisk.score,
        level: result.combinedRisk.level,
        finalPosture: result.explainability.summary,
      },
    },
    governance: {
      governanceBlockActive: result.blocked || result.disposition === "REJECTED",
      policyDecision: result.policyDecision,
      approvalBoundary: result.approvalBoundary,
      regionRestriction:
        result.disposition === "BLOCKED_FOR_REGION" || inferRegionStatus(result, regionCode) !== "open",
      executionAllowed: result.allowExecution && !result.blocked,
      previewPosture: inferPreviewPosture(result, options?.previewPosture),
    },
    revenue: {
      grossBookingValue30d: rf?.grossBookingValue30d,
      refunds30d: rf?.refunds30d,
      chargebacks30d: rf?.chargebacks30d,
      payoutVolume30d: rf?.payoutVolume30d,
      revenueAtRiskEstimate: revenueAtRisk,
      topAnomalySources: collectAnomalySources(result, options?.input),
    },
    explainability: {
      bullets: [...result.explainability.bullets],
      lines: [...result.explainability.lines],
      ruleTrace: [...result.trace],
      identityScope: options?.identityScope,
    },
    action: {
      recommendOnly: result.disposition === "RECOMMEND_ONLY",
      dryRun: result.disposition === "DRY_RUN",
      requestApproval: result.requiresHumanApproval || result.disposition === "REQUIRE_APPROVAL",
      rejectExecution: result.disposition === "REJECTED" || result.blocked,
    },
  };
}

/**
 * Investor-facing dashboard — control, resilience, monetization protection (headline metrics + static narratives).
 */
export function buildGovernanceInvestorDashboardView(
  result: UnifiedGovernanceResult,
  options?: GovernanceDashboardBuildOptions,
): GovernanceInvestorDashboardView {
  const rf = options?.input?.revenueFacts;
  const gross = rf?.grossBookingValue30d;
  const atRisk = result.fraudRisk.revenueImpactEstimate;
  let protectedEstimate: number | undefined;
  if (typeof gross === "number" && Number.isFinite(gross) && gross > 0) {
    protectedEstimate = Math.max(0, gross - atRisk);
  }

  let oversight: GovernanceInvestorTopMetrics["humanOversightCoverage"] = "partial";
  if (result.requiresHumanApproval || result.disposition === "REQUIRE_APPROVAL") oversight = "full";
  else if (result.disposition === "AUTO_EXECUTE" && result.allowExecution) oversight = "none";

  return {
    topMetrics: {
      protectedRevenueEstimate: protectedEstimate,
      revenueAtRisk: atRisk,
      fraudAnomalyLevel: result.fraudRisk.level,
      humanOversightCoverage: oversight,
      autoExecutionLikely: result.disposition === "AUTO_EXECUTE" && result.allowExecution && !result.blocked,
      restrictedMarketSafeguardsActive:
        result.disposition === "BLOCKED_FOR_REGION" ||
        inferRegionStatus(result, options?.input?.regionCode) !== "open",
    },
    narrativeCards: GOVERNANCE_INVESTOR_NARRATIVE_CARDS,
    charts: GOVERNANCE_DASHBOARD_CHARTS_PLACEHOLDER,
  };
}
