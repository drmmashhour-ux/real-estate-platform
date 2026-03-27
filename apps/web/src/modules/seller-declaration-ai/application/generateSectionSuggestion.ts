import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { DeclarationActionType } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";
import { createDeclarationAiEvent } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";
import { generateSectionSuggestionInputSafe } from "@/src/modules/seller-declaration-ai/infrastructure/declarationAISuggestionService";

export async function generateSectionSuggestion(args: {
  sectionKey: string;
  currentFacts: Record<string, unknown>;
  listingId: string;
  draftId: string;
  actorUserId: string;
}) {
  const result = generateSectionSuggestionInputSafe({ sectionKey: args.sectionKey, currentFacts: args.currentFacts });
  await createDeclarationAiEvent({
    draftId: args.draftId,
    sectionKey: args.sectionKey,
    actionType: DeclarationActionType.SUGGESTION_REQUESTED,
    promptContext: { listingId: args.listingId, currentFacts: args.currentFacts },
    output: result as unknown as Record<string, unknown>,
  });
  captureServerEvent(args.actorUserId, "declaration_ai_suggestion_requested", { draftId: args.draftId, sectionKey: args.sectionKey });
  return result;
}
