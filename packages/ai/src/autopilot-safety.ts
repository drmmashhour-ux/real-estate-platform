import type { AiAutopilotProposal } from "@prisma/client";

export function assertAiProposalHumanReviewed(proposal: Pick<AiAutopilotProposal, "reviewed" | "approved">): void {
  if (!proposal.reviewed || !proposal.approved) {
    throw new Error("AI_PROPOSAL_REQUIRES_HUMAN_REVIEW");
  }
}

export function assertNotFinalizingRegulatedActionFromAi(input: {
  initiatedByAi: boolean;
  humanApproved: boolean;
}): void {
  if (input.initiatedByAi && !input.humanApproved) {
    throw new Error("AI_CANNOT_FINALIZE_REGULATED_ACTION");
  }
}

export function assertProposalGeneratedByAiRequiresApproval(
  proposal: Pick<AiAutopilotProposal, "requiresReview" | "reviewed" | "approved">,
): void {
  if (proposal.requiresReview && (!proposal.reviewed || !proposal.approved)) {
    throw new Error("AI_PROPOSAL_REQUIRES_HUMAN_REVIEW");
  }
}
