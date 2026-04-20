import type { PolicyRuleEvaluation } from "../types/domain.types";
import type { PolicyContext } from "./policy-context";
import { evaluateCertificateLocationPreviewReadiness } from "./rules/certificate-location-preview.rule";
import { evaluateDuplicatePromotion } from "./rules/duplicate-promotion.rule";
import { evaluateHighRiskApproval } from "./rules/high-risk-approval.rule";
import { evaluatePricingGuardrail } from "./rules/pricing-guardrail.rule";
import { evaluateTargetActive } from "./rules/target-active.rule";

/**
 * Preview listing policy — pass / blocked / warning per rule:
 * 1. pricing guardrail
 * 2. listing must be active
 * 3. no duplicate promotions
 * 4. high-risk requires approval
 * 5. certificate-of-location structured readiness (V2 observation facts only)
 */
export const listingPreviewPolicyRuleEvaluators: Array<
  (ctx: PolicyContext) => PolicyRuleEvaluation
> = [
  evaluatePricingGuardrail,
  evaluateTargetActive,
  evaluateDuplicatePromotion,
  evaluateHighRiskApproval,
  evaluateCertificateLocationPreviewReadiness,
];
