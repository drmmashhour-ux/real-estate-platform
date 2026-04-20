/**
 * Compact dashboard slices derived from unified governance results.
 */
import type { UnifiedGovernanceResult } from "../governance/unified-governance.types";

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
