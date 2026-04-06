import { prisma } from "@/lib/db";
import { syncListingBnhubTrustSnapshot } from "@/lib/bnhub/two-sided-trust-sync";
import { syncHostBadgesFromPerformance } from "@/src/modules/reviews/badgeService";
import { computeAndUpsertHostQuality } from "@/lib/bnhub/host-quality";
import { scheduleFraudRecheck } from "@/src/workers/fraudDetectionWorker";
import { computeHostReputation } from "@/lib/ai/reputation/reputation-engine";
import { loadHostReputationSignals } from "@/lib/ai/reputation/reputation-signals";

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** @deprecated Use `computeHostReputation` from `@/lib/ai/reputation/reputation-engine` — kept for scripts/tests. */
export function normalizeHostScore(linear: number): number {
  const min = -20;
  const max = 60;
  const clamped = Math.min(max, Math.max(min, linear));
  const n = ((clamped - min) / (max - min)) * 100;
  return Math.round(n * 10) / 10;
}

/**
 * Recompute denormalized averages for a BNHub listing from public (non-held) guest reviews.
 */
export async function updatePropertyRating(listingId: string) {
  const reviews = await prisma.review.findMany({
    where: { listingId, moderationHeld: false },
    select: {
      propertyRating: true,
      cleanlinessRating: true,
      accuracyRating: true,
      communicationRating: true,
      locationRating: true,
      valueRating: true,
      checkinRating: true,
    },
  });

  const n = reviews.length;
  if (n === 0) {
    await prisma.propertyRatingAggregate.upsert({
      where: { listingId },
      create: {
        listingId,
        avgRating: 0,
        totalReviews: 0,
        cleanlinessAvg: 0,
        accuracyAvg: 0,
        communicationAvg: 0,
        locationAvg: 0,
        valueAvg: 0,
        checkinAvg: 0,
      },
      update: {
        avgRating: 0,
        totalReviews: 0,
        cleanlinessAvg: 0,
        accuracyAvg: 0,
        communicationAvg: 0,
        locationAvg: 0,
        valueAvg: 0,
        checkinAvg: 0,
      },
    });
    await syncListingBnhubTrustSnapshot(listingId).catch(() => {});
    return prisma.propertyRatingAggregate.findUnique({ where: { listingId } });
  }

  const overall = mean(reviews.map((r) => r.propertyRating));
  const cleanlinessAvg = mean(
    reviews.map((r) => r.cleanlinessRating ?? r.propertyRating)
  );
  const accuracyAvg = mean(reviews.map((r) => r.accuracyRating ?? r.propertyRating));
  const communicationAvg = mean(
    reviews.map((r) => r.communicationRating ?? r.propertyRating)
  );
  const locationAvg = mean(reviews.map((r) => r.locationRating ?? r.propertyRating));
  const valueAvg = mean(reviews.map((r) => r.valueRating ?? r.propertyRating));
  const checkinAvg = mean(reviews.map((r) => r.checkinRating ?? r.propertyRating));

  await prisma.propertyRatingAggregate.upsert({
    where: { listingId },
    create: {
      listingId,
      avgRating: overall,
      totalReviews: n,
      cleanlinessAvg,
      accuracyAvg,
      communicationAvg,
      locationAvg,
      valueAvg,
      checkinAvg,
    },
    update: {
      avgRating: overall,
      totalReviews: n,
      cleanlinessAvg,
      accuracyAvg,
      communicationAvg,
      locationAvg,
      valueAvg,
      checkinAvg,
    },
  });
  await syncListingBnhubTrustSnapshot(listingId).catch(() => {});
  return prisma.propertyRatingAggregate.findUnique({ where: { listingId } });
}

/**
 * Host operational metrics + 0–100 reputation score (LECIPM weighted model: reliability, responsiveness, satisfaction, consistency, disputes).
 */
export async function updateHostPerformance(hostId: string) {
  const raw = await loadHostReputationSignals(prisma, hostId);
  const rep = computeHostReputation(raw);
  const score = rep.score;
  const responseRate = raw.responseRate;
  const avgResponseTimeHours = raw.avgResponseTimeHours;
  const completionRate = raw.completionRate;
  const cancellationRate = raw.cancellationRate;
  const disputeRate = raw.disputeRate;

  const row = await prisma.hostPerformance.upsert({
    where: { hostId },
    create: {
      hostId,
      responseRate,
      avgResponseTime: avgResponseTimeHours,
      cancellationRate,
      completionRate,
      disputeRate,
      score,
    },
    update: {
      responseRate,
      avgResponseTime: avgResponseTimeHours,
      cancellationRate,
      completionRate,
      disputeRate,
      score,
    },
  });

  await syncHostBadgesFromPerformance(hostId, {
    score: row.score,
    responseRate: row.responseRate,
    cancellationRate: row.cancellationRate,
  });
  void computeAndUpsertHostQuality(hostId);

  scheduleFraudRecheck("host", hostId);

  return row;
}
