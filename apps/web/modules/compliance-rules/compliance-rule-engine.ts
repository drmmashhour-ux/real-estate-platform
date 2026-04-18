import type { ComplianceRuleHit } from "./compliance-rules.types";
import { runClosingRules } from "./closing-rule.service";
import { runCommunicationRules } from "./communication-rule.service";
import { runDisclosureRules } from "./disclosure-rule.service";
import { runDocumentRules } from "./document-rule.service";
import { runPaymentRules } from "./payment-rule.service";
import { runRepresentationRules } from "./representation-rule.service";

/**
 * Aggregates explainable rule families. Each rule returns structured hits only — no silent legal conclusions.
 */
export async function runAllComplianceRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const batches = await Promise.all([
    runDisclosureRules(dealId),
    runRepresentationRules(dealId),
    runDocumentRules(dealId),
    runCommunicationRules(dealId),
    runPaymentRules(dealId),
    runClosingRules(dealId),
  ]);
  return batches.flat();
}

export type { ComplianceRuleHit } from "./compliance-rules.types";
