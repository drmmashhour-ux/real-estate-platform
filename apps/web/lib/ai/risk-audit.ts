import { prisma } from "@/lib/db";

export async function recordRiskEvent(input: {
  listingId: string | null;
  userId: string | null;
  score: number;
  decision: string;
}): Promise<void> {
  await prisma.riskEvent.create({
    data: {
      listingId: input.listingId,
      userId: input.userId,
      score: Math.max(0, Math.min(100, Math.floor(input.score))),
      decision: input.decision.slice(0, 32),
    },
  });
}
