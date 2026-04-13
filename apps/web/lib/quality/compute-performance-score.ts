import type { Prisma } from "@prisma/client";
import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampInt } from "@/lib/quality/validators";

export type PerformanceScoreResult = { score: number; detail: Prisma.InputJsonValue };

export async function computePerformanceScoreComponent(listingId: string): Promise<PerformanceScoreResult> {
  const [metrics, learning, analytics] = await Promise.all([
    prisma.listingSearchMetrics.findUnique({ where: { listingId } }),
    prisma.listingLearningStats.findUnique({ where: { listingId } }),
    prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: ListingAnalyticsKind.BNHUB, listingId } },
    }),
  ]);

  let score = 48;
  const detail: Record<string, unknown> = { engine: "listing_performance_v1" };

  if (metrics?.ctr != null) {
    detail.ctr = metrics.ctr;
    score += clampInt(metrics.ctr * 120, 0, 28);
  }
  if (metrics?.conversionRate != null) {
    detail.conversionRate = metrics.conversionRate;
    score += clampInt(metrics.conversionRate * 100, 0, 28);
  }
  if (metrics?.views30d != null) {
    detail.views30d = metrics.views30d;
    if (metrics.views30d >= 200) score += 8;
    else if (metrics.views30d >= 80) score += 5;
  }

  if (learning?.clickThroughRate != null) {
    detail.learningCtr = learning.clickThroughRate;
    score += clampInt(learning.clickThroughRate * 80, 0, 14);
  }
  if (learning?.saveRate != null) {
    detail.saveRate = learning.saveRate;
    score += clampInt(learning.saveRate * 90, 0, 14);
  }
  if (learning?.bookingSuccessRate != null) {
    detail.bookingSuccessRate = learning.bookingSuccessRate;
    score += clampInt(learning.bookingSuccessRate * 70, 0, 12);
  }
  if (learning?.finalLearningScore != null) {
    detail.finalLearningScore = learning.finalLearningScore;
    score += clampInt((learning.finalLearningScore - 0.5) * 40, -10, 10);
  }

  if (analytics) {
    detail.analyticsViews = analytics.viewsTotal;
    detail.analyticsSaves = analytics.saves;
    const views = Math.max(1, analytics.viewsTotal);
    const saveRate = analytics.saves / views;
    detail.impliedSaveRate = saveRate;
    score += clampInt(saveRate * 200, 0, 12);
    const bookRate = analytics.bookings / views;
    detail.impliedBookingRate = bookRate;
    score += clampInt(bookRate * 400, 0, 14);
  }

  return {
    score: clampInt(score, 0, 100),
    detail: detail as Prisma.InputJsonValue,
  };
}
