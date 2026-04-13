import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { median } from "@/lib/bnhub/stay-evaluation-ai";
import { recomputeRankingForListing } from "@/src/modules/ranking/rankingService";
import { RANKING_LISTING_TYPE_BNHUB } from "@/src/modules/ranking/dataMap";

const TOP_N = 5;
/** Extra weight on BNHUB search review signal for winning hosts (clamped in signal engine). */
export const HOST_LISTING_REPUTATION_BOOST = 0.1;

function ymBounds(periodYearMonth: string): { start: Date; end: Date } {
  const [y, m] = periodYearMonth.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error("periodYearMonth must be YYYY-MM");
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { start, end };
}

function scoreFromReview(r: { aiCompositeScore: number | null; propertyRating: number }): number {
  if (r.aiCompositeScore != null && Number.isFinite(r.aiCompositeScore)) {
    return r.aiCompositeScore;
  }
  return Math.max(0, Math.min(100, r.propertyRating * 20));
}

function scoreFromHostReview(r: {
  aiCompositeScore: number | null;
  guestRespectRating: number;
}): number {
  if (r.aiCompositeScore != null && Number.isFinite(r.aiCompositeScore)) {
    return r.aiCompositeScore;
  }
  return Math.max(0, Math.min(100, r.guestRespectRating * 20));
}

/**
 * Close a calendar month: persist median scores, mark top performers, apply listing boost to top hosts' stays.
 * Idempotent per period: deletes existing snapshots for that period (same role+city key) before insert.
 */
export async function runMonthlyReputationClose(periodYearMonth: string): Promise<{
  guestSnapshots: number;
  hostSnapshots: number;
  boostedListingCount: number;
}> {
  const { start, end } = ymBounds(periodYearMonth);

  await prisma.bnhubMonthlyReputationSnapshot.deleteMany({
    where: { periodYearMonth, city: "" },
  });

  await prisma.shortTermListing.updateMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    data: { reputationRankBoost: 0 },
  });

  const reviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      moderationHeld: false,
    },
    select: {
      listingId: true,
      aiCompositeScore: true,
      propertyRating: true,
      listing: { select: { ownerId: true, city: true } },
    },
  });

  const hostScores = new Map<string, number[]>();
  for (const r of reviews) {
    const oid = r.listing.ownerId;
    if (!hostScores.has(oid)) hostScores.set(oid, []);
    hostScores.get(oid)!.push(scoreFromReview(r));
  }

  const hostRows: Prisma.BnhubMonthlyReputationSnapshotCreateManyInput[] = [];
  const hostMedians: { userId: string; med: number; n: number }[] = [];
  for (const [userId, scores] of hostScores) {
    const med = median(scores);
    if (med == null || scores.length === 0) continue;
    hostMedians.push({ userId, med, n: scores.length });
  }
  hostMedians.sort((a, b) => b.med - a.med);
  let rank = 1;
  for (const row of hostMedians) {
    const top = rank <= TOP_N && row.n >= 1;
    hostRows.push({
      userId: row.userId,
      periodYearMonth,
      role: "HOST",
      city: "",
      medianScore: row.med,
      sampleCount: row.n,
      rankInScope: rank,
      topPerformer: top,
      perksJson: top
        ? {
            listingBoost: HOST_LISTING_REPUTATION_BOOST,
            label: `Top host (${TOP_N}) — ${periodYearMonth}`,
          }
        : undefined,
    });
    rank += 1;
  }
  if (hostRows.length) {
    await prisma.bnhubMonthlyReputationSnapshot.createMany({ data: hostRows });
  }

  const winners = hostMedians.slice(0, TOP_N).map((h) => h.userId);
  let boostedListingCount = 0;
  if (winners.length) {
    const res = await prisma.shortTermListing.updateMany({
      where: { ownerId: { in: winners }, listingStatus: ListingStatus.PUBLISHED },
      data: { reputationRankBoost: HOST_LISTING_REPUTATION_BOOST },
    });
    boostedListingCount = res.count;
  }

  const hostReviews = await prisma.bnhubHostReviewOfGuest.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: {
      guestId: true,
      aiCompositeScore: true,
      guestRespectRating: true,
    },
  });

  const guestScores = new Map<string, number[]>();
  for (const r of hostReviews) {
    if (!guestScores.has(r.guestId)) guestScores.set(r.guestId, []);
    guestScores.get(r.guestId)!.push(scoreFromHostReview(r));
  }

  const guestRows: Prisma.BnhubMonthlyReputationSnapshotCreateManyInput[] = [];
  const guestMedians: { userId: string; med: number; n: number }[] = [];
  for (const [userId, scores] of guestScores) {
    const med = median(scores);
    if (med == null || scores.length === 0) continue;
    guestMedians.push({ userId, med, n: scores.length });
  }
  guestMedians.sort((a, b) => b.med - a.med);
  rank = 1;
  for (const row of guestMedians) {
    const top = rank <= TOP_N && row.n >= 1;
    guestRows.push({
      userId: row.userId,
      periodYearMonth,
      role: "GUEST",
      city: "",
      medianScore: row.med,
      sampleCount: row.n,
      rankInScope: rank,
      topPerformer: top,
      perksJson: top
        ? {
            note: `Top guest (${TOP_N}) — ${periodYearMonth}`,
            suggestion: "Eligible for platform perks when configured.",
          }
        : undefined,
    });
    rank += 1;
  }
  if (guestRows.length) {
    await prisma.bnhubMonthlyReputationSnapshot.createMany({ data: guestRows });
  }

  const listingsToRank = await prisma.shortTermListing.findMany({
    where: { ownerId: { in: winners } },
    select: { id: true },
    take: 500,
  });
  for (const l of listingsToRank) {
    void recomputeRankingForListing(RANKING_LISTING_TYPE_BNHUB, l.id).catch(() => {});
  }

  return {
    guestSnapshots: guestRows.length,
    hostSnapshots: hostRows.length,
    boostedListingCount,
  };
}

export async function listSnapshotsForUser(userId: string, limit = 24) {
  return prisma.bnhubMonthlyReputationSnapshot.findMany({
    where: { userId },
    orderBy: { periodYearMonth: "desc" },
    take: limit,
  });
}
