import { prisma } from "@/lib/db";

type Patch = {
  summary?: string | null;
  suggestedReply?: string | null;
  nextBestAction?: string | null;
  intentScore?: number | null;
  urgencyScore?: number | null;
  confidenceScore?: number | null;
};

export async function appendBrokerCrmAiInsight(leadId: string, threadId: string | null, patch: Patch) {
  const prev = await prisma.lecipmBrokerCrmAiInsight.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
  return prisma.lecipmBrokerCrmAiInsight.create({
    data: {
      leadId,
      threadId,
      summary: patch.summary ?? prev?.summary ?? null,
      suggestedReply: patch.suggestedReply ?? prev?.suggestedReply ?? null,
      nextBestAction: patch.nextBestAction ?? prev?.nextBestAction ?? null,
      intentScore: patch.intentScore ?? prev?.intentScore ?? null,
      urgencyScore: patch.urgencyScore ?? prev?.urgencyScore ?? null,
      confidenceScore: patch.confidenceScore ?? prev?.confidenceScore ?? null,
    },
  });
}
