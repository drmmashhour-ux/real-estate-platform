import { getDeclarationReviewData } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";

export async function generateDeclarationReviewSummary(draftId: string) {
  const draft = await getDeclarationReviewData(draftId);
  if (!draft) return null;

  const payload = (draft.draftPayload ?? {}) as Record<string, unknown>;
  const validation = runDeclarationValidationDeterministic(payload);

  const completedSections = validation.sectionStatuses.filter((s) => s.ready).map((s) => s.sectionKey);
  const missingSections = validation.sectionStatuses.filter((s) => !s.ready).map((s) => s.sectionKey);

  const nextActions: string[] = [];
  if (validation.missingFields.length) nextActions.push("Complete required missing fields.");
  if (validation.contradictionFlags.length) nextActions.push("Resolve contradiction flags before review.");
  if (!nextActions.length) nextActions.push("Ready for admin legal review and final sign-off.");

  return {
    draftId,
    completionPercent: validation.completenessPercent,
    completedSections,
    missingSections,
    contradictions: validation.contradictionFlags,
    adminWarnings: validation.warningFlags,
    aiConciseSummary: `Declaration is ${validation.completenessPercent}% complete with ${validation.contradictionFlags.length} contradiction flag(s).`,
    recommendedNextActions: nextActions,
  };
}
