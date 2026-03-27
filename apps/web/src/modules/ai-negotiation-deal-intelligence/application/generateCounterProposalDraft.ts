import type { CounterProposalDraftOutput, GenerateCounterProposalInput } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import { buildCounterProposalDraftOutput } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftingService";
import { buildGroundedNegotiationDraftContext } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationPromptContextBuilder";

export async function generateCounterProposalDraft(input: GenerateCounterProposalInput): Promise<CounterProposalDraftOutput | null> {
  const ctx = await buildGroundedNegotiationDraftContext({
    propertyId: input.propertyId,
    documentId: input.documentId,
    negotiationPlan: input.negotiationPlan,
    desiredChanges: input.desiredChanges,
    userContext: input.userContext,
  });
  if (!ctx) return null;
  return buildCounterProposalDraftOutput(ctx);
}
