import type { PolicyRuleEvaluation } from "../types/domain.types";
import type { PolicyContext } from "./policy-context";
import { evaluateAutopilotMode } from "./rules/autopilot-mode.rule";
import { evaluateBudgetScaling } from "./rules/budget-scaling.rule";
import { evaluateComplianceSensitive } from "./rules/compliance-sensitive.rule";
import { evaluateDuplicatePromotion } from "./rules/duplicate-promotion.rule";
import { evaluateHighRiskApproval } from "./rules/high-risk-approval.rule";
import {
  evaluateLegalIntelCrossEntityConflict,
  evaluateLegalIntelDuplicateDocument,
  evaluateLegalIntelResubmissionLoop,
  evaluateLegalIntelReviewBacklog,
  evaluateLegalIntelSubmissionBurst,
} from "./rules/legal-intelligence.rules";
import { evaluateOutreachCadence } from "./rules/outreach-cadence.rule";
import { evaluatePricingGuardrail } from "./rules/pricing-guardrail.rule";
import { evaluatePromotionStatus } from "./rules/promotion-status.rule";
import { evaluateTargetActive } from "./rules/target-active.rule";
import { evaluateLegalHubCompliancePolicy } from "./rules/legal.rules";
import {
  evaluateQuebecCompliancePublishRule,
  evaluateQuebecComplianceReadinessWarningRule,
} from "./rules/quebec-compliance.rules";
import {
  evaluateBlockPublishOnCriticalLegalRisk,
  evaluateBlockPublishOnFailedQuebecChecklist,
  evaluateRankingBoostOnLowRiskHighTrust,
  evaluateRankingDampenOnElevatedLegalRisk,
  evaluateRequireManualReviewOnHighLegalRisk,
} from "./rules/quebec-compliance-ranking.rules";
import { evaluateTrustIntelWarningSurge, evaluateTrustLowCriticalGuard } from "./rules/trust.rules";
import {
  evaluateGrowthIntelHighValueInternalTask,
  evaluateGrowthIntelPublicPublishGuard,
  evaluateGrowthIntelWeakDataAdvisory,
} from "./rules/growth-intelligence.rules";

export const allPolicyRuleEvaluators: Array<(ctx: PolicyContext) => PolicyRuleEvaluation> = [
  evaluateTargetActive,
  evaluateLegalHubCompliancePolicy,
  evaluateBlockPublishOnFailedQuebecChecklist,
  evaluateBlockPublishOnCriticalLegalRisk,
  evaluateRequireManualReviewOnHighLegalRisk,
  evaluateRankingDampenOnElevatedLegalRisk,
  evaluateRankingBoostOnLowRiskHighTrust,
  evaluateQuebecCompliancePublishRule,
  evaluateQuebecComplianceReadinessWarningRule,
  evaluateAutopilotMode,
  evaluatePricingGuardrail,
  evaluatePromotionStatus,
  evaluateDuplicatePromotion,
  evaluateOutreachCadence,
  evaluateHighRiskApproval,
  evaluateBudgetScaling,
  evaluateComplianceSensitive,
  evaluateLegalIntelResubmissionLoop,
  evaluateLegalIntelDuplicateDocument,
  evaluateLegalIntelSubmissionBurst,
  evaluateLegalIntelCrossEntityConflict,
  evaluateLegalIntelReviewBacklog,
  evaluateTrustLowCriticalGuard,
  evaluateTrustIntelWarningSurge,
  evaluateGrowthIntelPublicPublishGuard,
  evaluateGrowthIntelWeakDataAdvisory,
  evaluateGrowthIntelHighValueInternalTask,
];
