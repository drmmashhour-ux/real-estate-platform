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

export const allPolicyRuleEvaluators: Array<(ctx: PolicyContext) => PolicyRuleEvaluation> = [
  evaluateTargetActive,
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
];
