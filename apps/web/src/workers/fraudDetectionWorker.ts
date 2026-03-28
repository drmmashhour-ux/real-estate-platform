import { prisma } from "@/lib/db";
import { isCityFeatureEnabled } from "@/src/modules/cities/cityConfigService";
import { isMultiCityOperationsEnabled } from "@/src/modules/cities/cityEnv";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";
import { isFraudDetectionEnabled, isFraudReviewHoldEnabled } from "@/src/modules/fraud/fraudEnv";
import { createOrUpdateFraudFlags } from "@/src/modules/fraud/flaggingEngine";
import { computeFraudRiskScore, saveFraudRiskScore } from "@/src/modules/fraud/riskScoringEngine";
import type { FraudEntityType } from "@/src/modules/fraud/types";

export async function runFullFraudPipeline(
  entityType: FraudEntityType,
  entityId: string
): Promise<void> {
  if (!isFraudDetectionEnabled()) return;
  if (isMultiCityOperationsEnabled() && entityType === "listing") {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: entityId },
      select: { city: true },
    });
    const c = row?.city?.trim();
    if (c) {
      const ck = normalizeCityKey(c);
      if (ck !== "unknown" && !(await isCityFeatureEnabled(ck, "fraudDetectionEnabled"))) return;
    }
  }
  const result = await computeFraudRiskScore(entityType, entityId);
  if (!result) return;
  await saveFraudRiskScore(result);
  await createOrUpdateFraudFlags(entityType, entityId, result);

  if (entityType === "review" && isFraudReviewHoldEnabled() && result.riskScore >= 0.5) {
    await prisma.review.update({
      where: { id: entityId },
      data: { moderationHeld: true },
    });
  }
}

export function scheduleFraudRecheck(entityType: FraudEntityType, entityId: string): void {
  if (!isFraudDetectionEnabled()) return;
  void runFullFraudPipeline(entityType, entityId).catch(() => {});
}

export async function processListingFraudQueue(limit = 30): Promise<number> {
  if (!isFraudDetectionEnabled()) return 0;
  const rows = await prisma.shortTermListing.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true },
  });
  let n = 0;
  for (const r of rows) {
    await runFullFraudPipeline("listing", r.id);
    n++;
  }
  return n;
}

export async function processReviewFraudQueue(limit = 40): Promise<number> {
  if (!isFraudDetectionEnabled()) return 0;
  const rows = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true },
  });
  let n = 0;
  for (const r of rows) {
    await runFullFraudPipeline("review", r.id);
    n++;
  }
  return n;
}

/**
 * Refresh stored scores for entities that already have a fraud_risk_scores row.
 */
export async function recomputeFraudScores(limit = 100): Promise<number> {
  if (!isFraudDetectionEnabled()) return 0;
  const rows = await prisma.fraudRiskScore.findMany({
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { entityType: true, entityId: true },
  });
  let n = 0;
  for (const r of rows) {
    const t = r.entityType as FraudEntityType;
    await runFullFraudPipeline(t, r.entityId);
    n++;
  }
  return n;
}
