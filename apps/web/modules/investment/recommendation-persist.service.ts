import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateListingRecommendation } from "@/modules/investment/recommendation-engine.service";

export async function generateAndStoreListingRecommendation(listingId: string) {
  const result = await generateListingRecommendation(listingId);

  await prisma.investmentRecommendation.updateMany({
    where: {
      scopeType: "listing",
      scopeId: listingId,
      status: "active",
    },
    data: { status: "archived" },
  });

  const row = await prisma.investmentRecommendation.create({
    data: {
      scopeType: "listing",
      scopeId: listingId,
      recommendation: result.recommendation,
      confidenceScore: result.confidenceScore,
      score: result.score,
      reasonsJson: result.reasons as unknown as Prisma.InputJsonValue,
      risksJson: result.risks as unknown as Prisma.InputJsonValue,
      actionsJson: result.actions as unknown as Prisma.InputJsonValue,
      metricsJson: result.metrics as unknown as Prisma.InputJsonValue,
      status: "active",
    },
  });

  await prisma.investmentRecommendationLog.create({
    data: {
      recommendationId: row.id,
      actionType: "generated",
      message: "Recommendation generated from BNHub listing metrics.",
      meta: {
        recommendation: result.recommendation,
        score: result.score,
        confidenceScore: result.confidenceScore,
      } as Prisma.InputJsonValue,
    },
  });

  return row;
}
