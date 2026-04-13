import { prisma } from "@/lib/db";
import type { PortfolioListingSignals } from "./types";

const LISTING_STATUSES = ["DRAFT", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED"] as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function revenueToHealth(totalCents: number): number {
  if (totalCents <= 0) return 32;
  const dollars = totalCents / 100;
  return clamp(Math.round(28 + 42 * Math.log10(1 + dollars / 800)), 0, 100);
}

function hostBehaviorToHealth(input: {
  responseRate: number;
  cancellationRate: number;
  completionRate: number;
}): number {
  const rr = clamp(input.responseRate, 0, 1);
  const cr = clamp(input.cancellationRate, 0, 1);
  const comp = clamp(input.completionRate, 0, 1);
  const score = rr * 42 + (1 - cr) * 32 + comp * 26;
  return clamp(Math.round(score), 0, 100);
}

function healthBand(score: number): string {
  if (score <= 39) return "poor";
  if (score <= 59) return "needs_improvement";
  if (score <= 79) return "good";
  return "excellent";
}

export type PortfolioHealthComputed = {
  portfolioHealthScore: number;
  revenueHealth: number;
  qualityHealth: number;
  performanceHealth: number;
  behaviorHealth: number;
  trustHealth: number;
  summary: string;
  revenue90dCents: number;
  listingCount: number;
  listings: PortfolioListingSignals[];
};

export async function loadOwnerListingSignals(ownerUserId: string): Promise<PortfolioListingSignals[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      ownerId: ownerUserId,
      listingStatus: { notIn: [...LISTING_STATUSES] },
    },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      listingQualityScore: {
        select: {
          qualityScore: true,
          contentScore: true,
          pricingScore: true,
          performanceScore: true,
          behaviorScore: true,
          trustScore: true,
        },
      },
      listingSearchMetrics: {
        select: {
          views30d: true,
          ctr: true,
          conversionRate: true,
        },
      },
    },
  });

  return rows.map((r) => {
    const q = r.listingQualityScore;
    const m = r.listingSearchMetrics;
    const qualityScore = q?.qualityScore ?? 48;
    const contentScore = q?.contentScore ?? 48;
    const pricingScore = q?.pricingScore ?? 50;
    const performanceScore = q?.performanceScore ?? 50;
    const behaviorScore = q?.behaviorScore ?? 50;
    const trustScore = q?.trustScore ?? 50;
    const views30d = m?.views30d ?? 0;
    const ctr = m?.ctr ?? null;
    const conversionRate = m?.conversionRate ?? null;
    const rankScore =
      qualityScore * 0.28 +
      performanceScore * 0.22 +
      trustScore * 0.18 +
      (conversionRate != null ? conversionRate * 100 * 0.18 : performanceScore * 0.18) +
      Math.min(views30d / 400, 1) * 100 * 0.14;
    return {
      id: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      qualityScore,
      contentScore,
      pricingScore,
      performanceScore,
      behaviorScore,
      trustScore,
      views30d,
      ctr,
      conversionRate,
      rankScore,
    };
  });
}

export async function computePortfolioHealth(ownerUserId: string): Promise<PortfolioHealthComputed> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [listings, revenueAgg, hostPerf] = await Promise.all([
    loadOwnerListingSignals(ownerUserId),
    prisma.booking.aggregate({
      where: {
        listing: { ownerId: ownerUserId },
        status: "COMPLETED",
        createdAt: { gte: since },
      },
      _sum: { totalCents: true },
    }),
    prisma.hostPerformance.findUnique({
      where: { hostId: ownerUserId },
    }),
  ]);

  const revenue90dCents = revenueAgg._sum.totalCents ?? 0;
  const revenueHealth = revenueToHealth(revenue90dCents);

  const n = listings.length;
  const qualityHealth =
    n === 0 ? 0 : Math.round(listings.reduce((s, l) => s + l.qualityScore, 0) / n);
  const performanceHealth =
    n === 0
      ? 0
      : Math.round(listings.reduce((s, l) => s + l.performanceScore, 0) / n);
  const trustHealth =
    n === 0 ? 0 : Math.round(listings.reduce((s, l) => s + l.trustScore, 0) / n);

  const behaviorHealth = hostPerf
    ? hostBehaviorToHealth({
        responseRate: hostPerf.responseRate,
        cancellationRate: hostPerf.cancellationRate,
        completionRate: hostPerf.completionRate,
      })
    : 52;

  const portfolioHealthScore = Math.round(
    revenueHealth * 0.2 +
      qualityHealth * 0.25 +
      performanceHealth * 0.22 +
      behaviorHealth * 0.18 +
      trustHealth * 0.15
  );

  const band = healthBand(portfolioHealthScore);
  const summary = [
    `Portfolio health ${portfolioHealthScore}/100 (${band}).`,
    n === 0
      ? "No active listings in portfolio — publish stays to build revenue and quality signals."
      : `${n} listing(s). Revenue signal (90d): ${Math.round(revenue90dCents / 100)} ${band === "poor" ? "— focus on conversion and trust." : ""}`.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    portfolioHealthScore: clamp(portfolioHealthScore, 0, 100),
    revenueHealth,
    qualityHealth,
    performanceHealth,
    behaviorHealth,
    trustHealth,
    summary,
    revenue90dCents,
    listingCount: n,
    listings,
  };
}

export async function upsertPortfolioHealthRecord(
  ownerUserId: string,
  computed: Omit<PortfolioHealthComputed, "listings" | "revenue90dCents" | "listingCount">
) {
  return prisma.portfolioHealthScore.upsert({
    where: { ownerUserId },
    create: {
      ownerUserId,
      portfolioHealthScore: computed.portfolioHealthScore,
      revenueHealth: computed.revenueHealth,
      qualityHealth: computed.qualityHealth,
      performanceHealth: computed.performanceHealth,
      behaviorHealth: computed.behaviorHealth,
      trustHealth: computed.trustHealth,
      summary: computed.summary,
    },
    update: {
      portfolioHealthScore: computed.portfolioHealthScore,
      revenueHealth: computed.revenueHealth,
      qualityHealth: computed.qualityHealth,
      performanceHealth: computed.performanceHealth,
      behaviorHealth: computed.behaviorHealth,
      trustHealth: computed.trustHealth,
      summary: computed.summary,
    },
  });
}
