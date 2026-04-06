import { AiDecisionDomain } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logIntelligenceDecision(input: {
  domain: AiDecisionDomain;
  actionType: string;
  listingId?: string | null;
  userId?: string | null;
  hostId?: string | null;
  explanation?: string | null;
  confidenceScore?: number | null;
  inputPayload?: Record<string, unknown> | null;
  outputPayload?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.intelligenceDecisionLog.create({
      data: {
        domain: input.domain,
        actionType: input.actionType,
        listingId: input.listingId ?? undefined,
        userId: input.userId ?? undefined,
        hostId: input.hostId ?? undefined,
        explanation: input.explanation ?? undefined,
        confidenceScore: input.confidenceScore ?? undefined,
        inputPayload: input.inputPayload ? (input.inputPayload as object) : undefined,
        outputPayload: input.outputPayload ? (input.outputPayload as object) : undefined,
      },
    });
  } catch {
    /* non-fatal */
  }
}
