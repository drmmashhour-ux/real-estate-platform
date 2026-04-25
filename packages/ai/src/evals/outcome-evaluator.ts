import { prisma } from "@/lib/db";

export async function recordRecommendationOutcome(input: {
  userId?: string | null;
  recommendationId: string;
  outcome: "accepted" | "dismissed" | "expired";
  score?: number;
  payload?: Record<string, unknown>;
}) {
  return prisma.managerAiOutcomeEval.create({
    data: {
      userId: input.userId ?? undefined,
      sourceType: "recommendation",
      sourceId: input.recommendationId,
      outcome: input.outcome,
      score: input.score,
      payload: input.payload as object | undefined,
    },
  });
}
