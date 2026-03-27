import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { DeclarationActionType } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";
import { createDeclarationAiEvent } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";
import { generateFollowUpQuestionsSafe } from "@/src/modules/seller-declaration-ai/infrastructure/declarationAISuggestionService";

export async function generateFollowUpQuestions(args: {
  sectionKey: string;
  currentAnswer: string;
  currentDraft: Record<string, unknown>;
  draftId: string;
  actorUserId: string;
}) {
  const result = generateFollowUpQuestionsSafe({
    sectionKey: args.sectionKey,
    currentAnswer: args.currentAnswer,
    currentDraft: args.currentDraft,
  });

  await createDeclarationAiEvent({
    draftId: args.draftId,
    sectionKey: args.sectionKey,
    actionType: DeclarationActionType.FOLLOWUP_GENERATED,
    promptContext: { currentAnswer: args.currentAnswer },
    output: result as unknown as Record<string, unknown>,
  });
  captureServerEvent(args.actorUserId, "declaration_followup_generated", { draftId: args.draftId, sectionKey: args.sectionKey });
  return result;
}
