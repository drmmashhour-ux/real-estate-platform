import type { PrismaClient } from "@prisma/client";
import type { FraudScoreResult } from "../domain/fraud.types";
import {
  aggregateFraudScore,
  computeFraudFamilies,
  fraudRiskLevel,
} from "../infrastructure/fraudSignalsService";
import { findDuplicateImageListingIds } from "../infrastructure/fraudGraphService";
import { computeOwnerListingCluster } from "../infrastructure/suspiciousClusterService";

/**
 * Deterministic fraud score + trust penalty points. Escalates to review, does not auto-ban.
 */
export async function calculateFraudScore(db: PrismaClient, listingId: string): Promise<FraudScoreResult | null> {
  const listing = await db.fsboListing.findUnique({
    where: { id: listingId },
    include: { verification: true },
  });
  if (!listing) return null;

  const images = Array.isArray(listing.images) ? listing.images : [];
  const dupIds = await findDuplicateImageListingIds(db, listingId, images);

  const cluster = await computeOwnerListingCluster(db, {
    ownerId: listing.ownerId,
    city: listing.city,
    excludeListingId: listingId,
  });

  const families = computeFraudFamilies({
    listing,
    duplicateImageListingIds: dupIds,
  });

  const merged = {
    ...families,
    clusterRisk: Math.max(families.clusterRisk, cluster.clusterRisk),
  };

  const fraudScore = aggregateFraudScore(merged);
  const riskLevel = fraudRiskLevel(fraudScore);
  const reviewRecommended = fraudScore >= 40 || merged.trustPenaltyPoints >= 20 || riskLevel === "high" || riskLevel === "critical";

  return {
    fraudScore,
    riskLevel,
    reviewRecommended,
    signals: merged.signals,
    trustPenaltyPoints: Math.min(45, merged.trustPenaltyPoints),
    clusterSummary: cluster.summary,
  };
}
