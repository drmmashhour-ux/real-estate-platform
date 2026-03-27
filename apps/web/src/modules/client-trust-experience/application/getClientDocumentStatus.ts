import { TrustBadgeVariant } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";
import type { ClientDocumentTrustState } from "@/src/modules/client-trust-experience/domain/clientExperience.types";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

/**
 * Trust badge from completeness, validation, contradictions, and rule blocks.
 * "Approvals" are reflected indirectly when validation is clean and workflow allows signing.
 */
export function computeTrustBadge(validation: DeclarationValidationResult): TrustBadgeVariant {
  const blocked =
    validation.knowledgeRuleBlocks.length > 0 ||
    validation.missingFields.length > 0 ||
    validation.contradictionFlags.length > 0;

  if (blocked) return TrustBadgeVariant.NotReady;

  const needsAttention = validation.warningFlags.length > 0 || validation.knowledgeRuleWarnings.length > 0;

  if (needsAttention) return TrustBadgeVariant.AttentionNeeded;

  return TrustBadgeVariant.Verified;
}

export function getClientDocumentStatus(validation: DeclarationValidationResult): ClientDocumentTrustState {
  const trustBadge = computeTrustBadge(validation);

  const documentComplete = validation.missingFields.length === 0;
  const noBlockers =
    validation.knowledgeRuleBlocks.length === 0 && validation.contradictionFlags.length === 0;
  const sectionsReviewable = true;

  const readyToSign = validation.isValid;

  return {
    trustBadge,
    signingChecklist: {
      documentComplete,
      noBlockers,
      sectionsReviewable,
    },
    readyToSign,
  };
}
