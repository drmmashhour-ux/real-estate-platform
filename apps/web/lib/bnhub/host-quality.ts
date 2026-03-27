import { prisma } from "@/lib/db";

/** Compute host quality score (0-5) and whether they qualify as Super Host. */
export async function computeAndUpsertHostQuality(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { listing: { ownerId: userId } },
    select: { propertyRating: true, hostRating: true },
  });
  const hostRatings = reviews
    .map((r) => r.hostRating ?? r.propertyRating)
    .filter((r): r is number => r != null);
  const avgRating =
    hostRatings.length > 0
      ? hostRatings.reduce((a, b) => a + b, 0) / hostRatings.length
      : null;

  const bookingsAsHost = await prisma.booking.findMany({
    where: { listing: { ownerId: userId } },
    select: { status: true },
  });
  const total = bookingsAsHost.length;
  const cancelled = bookingsAsHost.filter((b) => b.status === "CANCELLED").length;
  const cancellationRate = total > 0 ? cancelled / total : 0;

  // Quality score: average rating (or 0 if no reviews), penalized by cancellation
  const qualityScore =
    avgRating != null
      ? Math.max(0, Math.min(5, avgRating - cancellationRate * 2))
      : 0;

  // Super Host: score >= 4.8, at least 3 reviews, cancellation rate <= 1%
  const isSuperHost =
    (avgRating ?? 0) >= 4.8 &&
    reviews.length >= 3 &&
    cancellationRate <= 0.01;

  const hq = await prisma.hostQuality.upsert({
    where: { userId },
    create: {
      userId,
      qualityScore,
      isSuperHost,
      cancellationRate: total > 0 ? cancellationRate : null,
    },
    update: {
      qualityScore,
      isSuperHost,
      cancellationRate: total > 0 ? cancellationRate : null,
    },
  });

  // Audit trail: append to host quality history
  await prisma.hostQualityHistory.create({
    data: {
      userId,
      qualityScore,
      isSuperHost,
      cancellationRate: total > 0 ? cancellationRate : null,
    },
  }).catch(() => {}); // non-fatal if table missing or constraint

  return { qualityScore, isSuperHost, cancellationRate, reviewCount: reviews.length };
}

export async function getHostQuality(userId: string) {
  return prisma.hostQuality.findUnique({
    where: { userId },
  });
}

export async function getHostQualityOrCompute(userId: string) {
  let hq = await getHostQuality(userId);
  if (!hq) {
    await computeAndUpsertHostQuality(userId);
    hq = await getHostQuality(userId);
  }
  return hq;
}
