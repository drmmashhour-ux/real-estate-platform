import { generateClientSummary } from "@/src/modules/client-trust-experience/application/generateClientSummary";
import { generateRiskHighlights } from "@/src/modules/client-trust-experience/application/generateRiskHighlights";
import { getClientDocumentStatus } from "@/src/modules/client-trust-experience/application/getClientDocumentStatus";
import { buildSectionValuePreview } from "@/src/modules/client-trust-experience/infrastructure/clientSummaryService";
import type { ClientTrustExperienceBundle } from "@/src/modules/client-trust-experience/domain/clientExperience.types";
import { sellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

function sectionHasRisk(sectionKey: string, validation: DeclarationValidationResult): { hasRisk: boolean; riskNote?: string } {
  const status = validation.sectionStatuses.find((s) => s.sectionKey === sectionKey);
  if (status && !status.ready) {
    return { hasRisk: true, riskNote: "Some answers in this section are missing." };
  }
  const missingHere = validation.missingFields.filter((k) =>
    sellerDeclarationSections.find((s) => s.key === sectionKey)?.fields.some((f) => f.key === k),
  );
  if (missingHere.length) return { hasRisk: true, riskNote: "Missing answers in this section." };
  return { hasRisk: false };
}

export function composeClientTrustExperience(
  payload: Record<string, unknown>,
  validation: DeclarationValidationResult,
  aiSummary?: Record<string, unknown> | null,
): ClientTrustExperienceBundle {
  const summary = generateClientSummary(payload, aiSummary);
  const risks = generateRiskHighlights(validation);
  const trustState = getClientDocumentStatus(validation);

  const sections = sellerDeclarationSections.map((sec) => {
    const { hasRisk, riskNote } = sectionHasRisk(sec.key, validation);
    return {
      sectionKey: sec.key,
      title: sec.label,
      valuePreview: buildSectionValuePreview(sec.key, payload),
      hasRisk,
      riskNote,
    };
  });

  return { summary, risks, trustState, sections };
}
