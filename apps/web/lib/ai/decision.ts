import "server-only";

import { prisma } from "@/lib/db";

export async function getRecommendedAction(queueItemId: string) {
  const row = await prisma.aiQueueItem.findUnique({ where: { id: queueItemId } });
  if (!row) return null;

  const riskScore = row.riskScore ?? 0;
  const trustScore = typeof row.trustScore === "number" ? row.trustScore : 75;
  const trustLevel = riskScore >= 70 ? "low" : riskScore >= 40 ? "medium" : "high";

  const detailsObj =
    row.details && typeof row.details === "object" && row.details !== null && !Array.isArray(row.details)
      ? (row.details as Record<string, unknown>)
      : {};

  const factors = typeof detailsObj.factors === "object" ? detailsObj.factors : detailsObj;

  return {
    recommendedAction: row.recommendedAction ?? "review",
    riskScore,
    trustScore,
    trustLevel,
    factors,
    fraudAction: detailsObj.fraudAction,
  };
}
