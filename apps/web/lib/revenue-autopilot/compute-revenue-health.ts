import { subDays } from "date-fns";
import type { RevenueAutopilotScopeType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { RevenueListingContext } from "./types";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function trendToScore(curCents: number, prevCents: number): number {
  if (curCents <= 0 && prevCents <= 0) return 42;
  if (prevCents <= 0) return clamp(55 + Math.round(25 * Math.log10(1 + curCents / 50_000)), 0, 100);
  const ratio = curCents / prevCents;
  return clamp(Math.round(48 + 32 * (ratio - 1)), 0, 100);
}

function hhiToMixScore(shares: number[]): number {
  if (shares.length === 0) return 50;
  const hhi = shares.reduce((s, p) => s + p * p, 0);
  return clamp(Math.round((1 - hhi) * 100), 0, 100);
}

export type RevenueHealthComputed = {
  scopeType: RevenueAutopilotScopeType;
  scopeId: string;
  revenueScore: number;
  trendScore: number;
  conversionScore: number;
  pricingEfficiencyScore: number;
  portfolioMixScore: number;
  summary: string;
  totalRevenueCents90: number;
  totalRevenueCentsPrev90: number;
  listings: RevenueListingContext[];
};

async function loadListingsForOwner(ownerId: string): Promise<RevenueListingContext[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      ownerId: ownerId,
      listingStatus: { notIn: ["DRAFT", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED"] },
    },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      listingQualityScore: {
        select: { qualityScore: true, pricingScore: true },
      },
      listingSearchMetrics: {
        select: { views30d: true, ctr: true, conversionRate: true },
      },
    },
  });

  const since = subDays(new Date(), 90);
  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: since },
      listing: { ownerId },
    },
    select: { listingId: true, totalCents: true },
  });
  const revByListing = new Map<string, number>();
  for (const b of bookings) {
    revByListing.set(b.listingId, (revByListing.get(b.listingId) ?? 0) + b.totalCents);
  }

  return rows.map((r) => {
    const q = r.listingQualityScore;
    const m = r.listingSearchMetrics;
    return {
      listingId: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      revenue90dCents: revByListing.get(r.id) ?? 0,
      views30d: m?.views30d ?? 0,
      ctr: m?.ctr ?? null,
      conversionRate: m?.conversionRate ?? null,
      pricingScore: q?.pricingScore ?? 52,
      qualityScore: q?.qualityScore ?? 50,
      nightPriceCents: r.nightPriceCents,
    };
  });
}

async function loadListingsPlatform(): Promise<RevenueListingContext[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: { in: ["PUBLISHED", "APPROVED", "UNLISTED"] },
    },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      listingQualityScore: {
        select: { qualityScore: true, pricingScore: true },
      },
      listingSearchMetrics: {
        select: { views30d: true, ctr: true, conversionRate: true },
      },
    },
    take: 2000,
  });

  const since = subDays(new Date(), 90);
  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    select: { listingId: true, totalCents: true },
  });
  const revByListing = new Map<string, number>();
  for (const b of bookings) {
    revByListing.set(b.listingId, (revByListing.get(b.listingId) ?? 0) + b.totalCents);
  }

  return rows.map((r) => {
    const q = r.listingQualityScore;
    const m = r.listingSearchMetrics;
    return {
      listingId: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      revenue90dCents: revByListing.get(r.id) ?? 0,
      views30d: m?.views30d ?? 0,
      ctr: m?.ctr ?? null,
      conversionRate: m?.conversionRate ?? null,
      pricingScore: q?.pricingScore ?? 52,
      qualityScore: q?.qualityScore ?? 50,
      nightPriceCents: r.nightPriceCents,
    };
  });
}

export async function computeRevenueHealth(input: {
  scopeType: RevenueAutopilotScopeType;
  scopeId: string;
}): Promise<RevenueHealthComputed> {
  const now = new Date();
  const d90 = subDays(now, 90);
  const d180 = subDays(now, 180);

  const bookingWhereOwner =
    input.scopeType === "owner"
      ? { listing: { ownerId: input.scopeId } }
      : {};

  const [curBookings, prevBookings, listings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: d90 },
        ...bookingWhereOwner,
      },
      select: { totalCents: true, listingId: true },
    }),
    prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: d180, lt: d90 },
        ...bookingWhereOwner,
      },
      select: { totalCents: true, listingId: true },
    }),
    input.scopeType === "owner"
      ? loadListingsForOwner(input.scopeId)
      : loadListingsPlatform(),
  ]);

  const totalCur = curBookings.reduce((s, b) => s + b.totalCents, 0);
  const totalPrev = prevBookings.reduce((s, b) => s + b.totalCents, 0);
  const trendScore = trendToScore(totalCur, totalPrev);

  const byListing = new Map<string, number>();
  for (const b of curBookings) {
    byListing.set(b.listingId, (byListing.get(b.listingId) ?? 0) + b.totalCents);
  }
  const totalRev = Math.max(1, totalCur);
  const shares = [...byListing.values()].map((c) => c / totalRev);
  const portfolioMixScore = shares.length <= 1 ? 38 : hhiToMixScore(shares);

  let convNum = 0;
  let convDen = 0;
  for (const l of listings) {
    const w = Math.max(1, l.views30d);
    const c = l.conversionRate != null ? clamp(l.conversionRate * 100, 0, 100) : l.qualityScore * 0.6;
    convNum += c * w;
    convDen += w;
  }
  const conversionScore = convDen <= 0 ? 48 : Math.round(convNum / convDen);

  const nL = listings.length;
  const pricingEfficiencyScore =
    nL === 0 ? 45 : Math.round(listings.reduce((s, l) => s + l.pricingScore, 0) / nL);

  const revenueScore = Math.round(
    trendScore * 0.32 +
      conversionScore * 0.26 +
      pricingEfficiencyScore * 0.22 +
      portfolioMixScore * 0.2
  );

  const summary = [
    `Revenue health ${clamp(revenueScore, 0, 100)}/100.`,
    `Last 90d gross booking total (completed): ${Math.round(totalCur / 100)} (minor units); prior 90d: ${Math.round(totalPrev / 100)}.`,
    totalCur < totalPrev * 0.85 ? "Trend soft vs prior quarter — check conversion and pricing." : null,
    conversionScore < 52 ? "Conversion efficiency is below target for weighted traffic." : null,
    pricingEfficiencyScore < 55 ? "Pricing competitiveness may be leaving bookings on the table." : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    revenueScore: clamp(revenueScore, 0, 100),
    trendScore: clamp(trendScore, 0, 100),
    conversionScore: clamp(conversionScore, 0, 100),
    pricingEfficiencyScore: clamp(pricingEfficiencyScore, 0, 100),
    portfolioMixScore: clamp(portfolioMixScore, 0, 100),
    summary,
    totalRevenueCents90: totalCur,
    totalRevenueCentsPrev90: totalPrev,
    listings,
  };
}

export async function upsertRevenueHealthRecord(
  computed: Omit<RevenueHealthComputed, "listings" | "totalRevenueCents90" | "totalRevenueCentsPrev90">
) {
  return prisma.revenueHealthScore.upsert({
    where: {
      scopeType_scopeId: { scopeType: computed.scopeType, scopeId: computed.scopeId },
    },
    create: {
      scopeType: computed.scopeType,
      scopeId: computed.scopeId,
      revenueScore: computed.revenueScore,
      trendScore: computed.trendScore,
      conversionScore: computed.conversionScore,
      pricingEfficiencyScore: computed.pricingEfficiencyScore,
      portfolioMixScore: computed.portfolioMixScore,
      summary: computed.summary,
    },
    update: {
      revenueScore: computed.revenueScore,
      trendScore: computed.trendScore,
      conversionScore: computed.conversionScore,
      pricingEfficiencyScore: computed.pricingEfficiencyScore,
      portfolioMixScore: computed.portfolioMixScore,
      summary: computed.summary,
    },
  });
}
