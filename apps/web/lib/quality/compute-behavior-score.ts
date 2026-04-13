import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampInt } from "@/lib/quality/validators";

export type BehaviorScoreResult = { score: number; detail: Prisma.InputJsonValue };

export async function computeBehaviorScoreComponent(listingId: string): Promise<BehaviorScoreResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) {
    return { score: 45, detail: { error: "listing_not_found" } };
  }

  const [hostPerf, bookingStats] = await Promise.all([
    prisma.hostPerformance.findUnique({
      where: { hostId: listing.ownerId },
      select: {
        responseRate: true,
        avgResponseTime: true,
        cancellationRate: true,
        completionRate: true,
        score: true,
      },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { listingId },
      _count: { _all: true },
    }),
  ]);

  const byStatus = new Map(bookingStats.map((r) => [r.status, r._count._all]));
  const total = bookingStats.reduce((acc, r) => acc + r._count._all, 0);
  const completed = byStatus.get(BookingStatus.COMPLETED) ?? 0;
  const cancelled =
    (byStatus.get(BookingStatus.CANCELLED_BY_GUEST) ?? 0) +
    (byStatus.get(BookingStatus.CANCELLED_BY_HOST) ?? 0) +
    (byStatus.get(BookingStatus.CANCELLED) ?? 0);

  let score = 52;
  const detail: Record<string, unknown> = {
    engine: "listing_behavior_v1",
    bookingsTotal: total,
    completed,
    cancelled,
  };

  if (hostPerf) {
    detail.hostPerformanceScore = hostPerf.score;
    detail.responseRate = hostPerf.responseRate;
    detail.avgResponseTimeHours = hostPerf.avgResponseTime;
    detail.cancellationRate = hostPerf.cancellationRate;
    detail.completionRate = hostPerf.completionRate;
    score = clampInt(hostPerf.score * 0.85 + score * 0.15, 0, 100);
    if (hostPerf.avgResponseTime > 48) score = Math.max(0, score - 12);
    else if (hostPerf.avgResponseTime > 24) score = Math.max(0, score - 6);
    if (hostPerf.cancellationRate > 0.12) score = Math.max(0, score - 14);
    else if (hostPerf.cancellationRate > 0.06) score = Math.max(0, score - 7);
  }

  if (total >= 5) {
    const cancelRate = cancelled / total;
    detail.listingCancelRate = cancelRate;
    if (cancelRate > 0.2) score = Math.max(0, score - 18);
    else if (cancelRate > 0.1) score = Math.max(0, score - 10);
    const successRate = completed / total;
    detail.listingCompletionShare = successRate;
    score += clampInt(successRate * 22, 0, 18);
  }

  return {
    score: clampInt(score, 0, 100),
    detail: detail as Prisma.InputJsonValue,
  };
}
