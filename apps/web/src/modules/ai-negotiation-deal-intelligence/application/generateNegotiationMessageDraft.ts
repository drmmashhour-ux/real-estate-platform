import type {
  GenerateNegotiationMessageInput,
  NegotiationMessageDraftOutput,
} from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import { buildNegotiationMessageDraftOutput } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftingService";
import { buildGroundedNegotiationDraftContext } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationPromptContextBuilder";

export async function generateNegotiationMessageDraft(
  input: GenerateNegotiationMessageInput,
): Promise<NegotiationMessageDraftOutput | null> {
  const ctx = await buildGroundedNegotiationDraftContext({
    propertyId: input.propertyId,
    documentId: input.documentId,
    negotiationPlan: input.negotiationPlan,
    desiredChanges: input.desiredChanges,
    userContext: input.userContext,
  });
  if (!ctx) return null;
  return buildNegotiationMessageDraftOutput(input.draftType, ctx);
}
