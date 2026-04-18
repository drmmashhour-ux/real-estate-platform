import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import type { BnhubPricingSignals } from "./bnhub-dynamic-pricing.types";

export async function loadBnhubPricingSignals(listingId: string): Promise<{
  smart: Awaited<ReturnType<typeof generateSmartPrice>>;
  funnel: BnhubPricingSignals;
} | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      nightPriceCents: true,
      city: true,
      id: true,
    },
  });
  if (!listing) return null;

  const since = subDays(new Date(), 30);
  const grouped = await prisma.aiConversionSignal.groupBy({
    by: ["eventType"],
    where: { listingId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const c = (t: string) => grouped.find((g) => g.eventType === t)?._count._all ?? 0;
  const views = c("listing_view");
  const starts = c("booking_started");
  const completions = c("booking_completed");
  const viewToStartRate = views > 0 ? starts / views : 0;
  const startToPaidRate = starts > 0 ? completions / starts : 0;

  const q = await prisma.listingQualityScore.findUnique({
    where: { listingId },
    select: { qualityScore: true },
  });
  const qualityScore01 =
    q != null && Number.isFinite(q.qualityScore) ? Math.min(1, Math.max(0, q.qualityScore / 100)) : null;

  let smart: Awaited<ReturnType<typeof generateSmartPrice>>;
  try {
    smart = await generateSmartPrice(listingId);
  } catch {
    return null;
  }
  const events = views + starts + completions + c("listing_click") + c("search_view");

  const funnel: BnhubPricingSignals = {
    currentNightCents: listing.nightPriceCents,
    marketAvgCents: smart.marketAvgCents,
    peerListingCount: smart.peerListingCount,
    demandLevel: smart.demandLevel,
    listingViews: views,
    bookingStarts: starts,
    bookingsCompleted: completions,
    viewToStartRate,
    startToPaidRate,
    qualityScore01,
    dataSparse: events < 15 && smart.peerListingCount < 6,
  };

  return { smart, funnel };
}
