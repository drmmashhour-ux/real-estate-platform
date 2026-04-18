import { prisma } from "@/lib/db";

export async function logBnhubEngineDecision(input: {
  listingId?: string;
  hostUserId?: string;
  decisionType: string;
  source: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.bnhubEngineAuditLog.create({
    data: {
      listingId: input.listingId,
      hostUserId: input.hostUserId,
      decisionType: input.decisionType,
      source: input.source,
      payloadJson: (input.payload ?? {}) as object,
    },
  });
}
