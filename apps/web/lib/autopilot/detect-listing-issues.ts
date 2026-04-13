import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ListingIssueReport = {
  summaryLines: string[];
  flags: {
    lowQuality: boolean;
    weakContent: boolean;
    lowCtr: boolean;
    lowConversion: boolean;
    fewPhotos: boolean;
    incompleteFields: boolean;
    weakTrust: boolean;
    overpricedVsPeers: boolean;
  };
};

export async function detectListingIssues(listingId: string): Promise<ListingIssueReport> {
  const [listing, quality, metrics, learning, analytics, trustListing] = await Promise.all([
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        description: true,
        subtitle: true,
        nightPriceCents: true,
        city: true,
        listingPhotos: { select: { id: true } },
        photos: true,
      },
    }),
    prisma.listingQualityScore.findUnique({ where: { listingId } }),
    prisma.listingSearchMetrics.findUnique({ where: { listingId } }),
    prisma.listingLearningStats.findUnique({ where: { listingId } }),
    prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: ListingAnalyticsKind.BNHUB, listingId } },
    }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "listing", entityId: listingId } },
      select: { score: true },
    }),
  ]);

  const flags: ListingIssueReport["flags"] = {
    lowQuality: false,
    weakContent: false,
    lowCtr: false,
    lowConversion: false,
    fewPhotos: false,
    incompleteFields: false,
    weakTrust: false,
    overpricedVsPeers: false,
  };

  const lines: string[] = [];

  if (quality != null && quality.qualityScore < 55) {
    flags.lowQuality = true;
    lines.push(`Overall listing quality is below target (${quality.qualityScore}/100).`);
  }
  if (quality != null && quality.contentScore < 50) {
    flags.weakContent = true;
    lines.push(`Content completeness score is weak (${quality.contentScore}/100).`);
  }

  const photoCount =
    listing != null && listing.listingPhotos.length > 0
      ? listing.listingPhotos.length
      : Array.isArray(listing?.photos)
        ? (listing!.photos as unknown[]).filter((p): p is string => typeof p === "string").length
        : 0;
  if (photoCount < 5) {
    flags.fewPhotos = true;
    lines.push(`Photo count is low (${photoCount}); add more high-quality images.`);
  }

  if (listing) {
    const t = listing.title.trim().length;
    const d = (listing.description ?? "").trim().length;
    if (t < 12 || d < 120) {
      flags.incompleteFields = true;
      lines.push("Title or description is too short for search and guest clarity.");
    }
    if (!listing.subtitle?.trim()) {
      flags.incompleteFields = true;
      lines.push("Subtitle / short hook is empty — add a concise value line.");
    }
  }

  if (metrics?.ctr != null && metrics.ctr < 0.025 && (metrics.views30d ?? 0) > 30) {
    flags.lowCtr = true;
    lines.push("Click-through rate is low relative to impressions.");
  }
  if (metrics?.conversionRate != null && metrics.conversionRate < 0.01 && (metrics.views30d ?? 0) > 40) {
    flags.lowConversion = true;
    lines.push("Conversion from views to bookings appears weak.");
  }
  if (learning?.clickThroughRate != null && learning.clickThroughRate < 0.03) {
    flags.lowCtr = true;
    lines.push("Learning layer shows soft engagement; refresh hero copy and cover image.");
  }

  if (trustListing != null && trustListing.score < 45) {
    flags.weakTrust = true;
    lines.push("Platform trust score for this listing is on the lower side.");
  }

  if (analytics && analytics.viewsTotal > 20) {
    const br = analytics.bookings / Math.max(1, analytics.viewsTotal);
    if (br < 0.005) {
      flags.lowConversion = true;
      lines.push("Booking rate vs tracked views is very low.");
    }
  }

  const peers = listing
    ? await prisma.shortTermListing.findMany({
        where: { city: listing.city, id: { not: listingId } },
        select: { nightPriceCents: true },
        take: 40,
      })
    : [];
  if (listing && peers.length >= 5) {
    const sorted = peers.map((p) => p.nightPriceCents).sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
    if (med > 0 && listing.nightPriceCents / med > 1.3) {
      flags.overpricedVsPeers = true;
      lines.push("Nightly rate is materially above similar stays in this city — review competitiveness.");
    }
  }

  if (lines.length === 0) {
    lines.push("Minor optimization opportunities — refresh copy and photo order for incremental gains.");
  }

  return { summaryLines: lines, flags };
}
