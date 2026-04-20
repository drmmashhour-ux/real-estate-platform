/**
 * Québec compliance + legal/trust ranking policy descriptors — deterministic; no writes.
 */

import { complianceFlags, engineFlags } from "@/config/feature-flags";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const RULE_BLOCK_PUBLISH_FAILED_CHECKLIST = "block_publish_on_failed_quebec_checklist";
export const RULE_BLOCK_PUBLISH_CRITICAL_LEGAL_RISK = "block_publish_on_critical_legal_risk";
export const RULE_REQUIRE_MANUAL_REVIEW_HIGH_LEGAL_RISK = "require_manual_review_on_high_legal_risk";
export const RULE_RANKING_DAMPEN_ELEVATED_LEGAL_RISK = "ranking_dampen_on_elevated_legal_risk";
export const RULE_RANKING_BOOST_LOW_RISK_HIGH_TRUST = "ranking_boost_on_low_risk_high_trust";

export function evaluateBlockPublishOnFailedQuebecChecklist(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!complianceFlags.quebecComplianceV1) {
      return { ruleCode: RULE_BLOCK_PUBLISH_FAILED_CHECKLIST, result: "passed" };
    }
    const qc = ctx.quebecCompliance;
    if (!qc || qc.allowed) {
      return { ruleCode: RULE_BLOCK_PUBLISH_FAILED_CHECKLIST, result: "passed" };
    }
    return {
      ruleCode: RULE_BLOCK_PUBLISH_FAILED_CHECKLIST,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Listing cannot be published due to missing or invalid required compliance items.",
      metadata: {
        domain: "legal_compliance",
        severity: "critical",
        action: "block_publish",
        effect: "blocking",
        readinessScore: qc.readinessScore,
        blockingIssueIds: qc.blockingIssueIds,
      },
    };
  } catch {
    return { ruleCode: RULE_BLOCK_PUBLISH_FAILED_CHECKLIST, result: "passed" };
  }
}

export function evaluateBlockPublishOnCriticalLegalRisk(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!complianceFlags.quebecComplianceV1 || !complianceFlags.propertyLegalRiskScoreV1) {
      return { ruleCode: RULE_BLOCK_PUBLISH_CRITICAL_LEGAL_RISK, result: "passed" };
    }
    const plr = ctx.propertyLegalRisk;
    if (!plr || (!plr.blocking && plr.score < 80)) {
      return { ruleCode: RULE_BLOCK_PUBLISH_CRITICAL_LEGAL_RISK, result: "passed" };
    }
    return {
      ruleCode: RULE_BLOCK_PUBLISH_CRITICAL_LEGAL_RISK,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Critical legal risk index blocks publish under platform policy.",
      metadata: {
        domain: "legal_compliance",
        severity: "critical",
        action: "block_publish",
        effect: "blocking",
        legalRiskScore: plr.score,
        level: plr.level,
      },
    };
  } catch {
    return { ruleCode: RULE_BLOCK_PUBLISH_CRITICAL_LEGAL_RISK, result: "passed" };
  }
}

export function evaluateRequireManualReviewOnHighLegalRisk(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!complianceFlags.propertyLegalRiskScoreV1) {
      return { ruleCode: RULE_REQUIRE_MANUAL_REVIEW_HIGH_LEGAL_RISK, result: "passed" };
    }
    const plr = ctx.propertyLegalRisk;
    if (!plr || plr.score < 60 || plr.score >= 80) {
      return { ruleCode: RULE_REQUIRE_MANUAL_REVIEW_HIGH_LEGAL_RISK, result: "passed" };
    }
    return {
      ruleCode: RULE_REQUIRE_MANUAL_REVIEW_HIGH_LEGAL_RISK,
      result: "warning",
      dispositionHint: "ADVISORY_ONLY",
      reason: "Elevated legal risk — manual review recommended before broad publication actions.",
      metadata: {
        domain: "legal_compliance",
        severity: "warning",
        action: "require_manual_review",
        effect: "advisory",
        legalRiskScore: plr.score,
      },
    };
  } catch {
    return { ruleCode: RULE_REQUIRE_MANUAL_REVIEW_HIGH_LEGAL_RISK, result: "passed" };
  }
}

export function evaluateRankingDampenOnElevatedLegalRisk(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!engineFlags.legalTrustRankingV1) {
      return { ruleCode: RULE_RANKING_DAMPEN_ELEVATED_LEGAL_RISK, result: "passed" };
    }
    const plr = ctx.propertyLegalRisk;
    if (!plr || plr.score < 45) {
      return { ruleCode: RULE_RANKING_DAMPEN_ELEVATED_LEGAL_RISK, result: "passed" };
    }
    return {
      ruleCode: RULE_RANKING_DAMPEN_ELEVATED_LEGAL_RISK,
      result: "warning",
      dispositionHint: "ADVISORY_ONLY",
      reason: "Elevated legal risk — marketplace ranking dampening may apply.",
      metadata: {
        domain: "trust_ranking",
        severity: "warning",
        action: "ranking_dampen",
        effect: "advisory",
        legalRiskScore: plr.score,
      },
    };
  } catch {
    return { ruleCode: RULE_RANKING_DAMPEN_ELEVATED_LEGAL_RISK, result: "passed" };
  }
}

export function evaluateRankingBoostOnLowRiskHighTrust(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!engineFlags.legalTrustRankingV1 || !complianceFlags.quebecComplianceV1) {
      return { ruleCode: RULE_RANKING_BOOST_LOW_RISK_HIGH_TRUST, result: "passed" };
    }
    const plr = ctx.propertyLegalRisk;
    const ts = ctx.trustScore?.score ?? 0;
    if (!plr || plr.score > 35 || ts < 72) {
      return { ruleCode: RULE_RANKING_BOOST_LOW_RISK_HIGH_TRUST, result: "passed" };
    }
    return {
      ruleCode: RULE_RANKING_BOOST_LOW_RISK_HIGH_TRUST,
      result: "passed",
      reason: "Low legal friction with strong trust — bounded ranking boost may apply.",
      metadata: {
        domain: "trust_ranking",
        severity: "info",
        action: "ranking_boost",
        effect: "advisory",
        trustScore: ts,
        legalRiskScore: plr.score,
      },
    };
  } catch {
    return { ruleCode: RULE_RANKING_BOOST_LOW_RISK_HIGH_TRUST, result: "passed" };
  }
}
