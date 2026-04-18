import type { FsboListing, FsboListingMetrics } from "@prisma/client";

export function scoreListingHealth(input: {
  listing: Pick<FsboListing, "title" | "description" | "images" | "status" | "createdAt">;
  metrics: FsboListingMetrics | null;
  views: number;
  inquiries: number;
}): { health: number; exposure: number; conversion: number } {
  const photoCount = input.listing.images?.length ?? 0;
  const descLen = (input.listing.description ?? "").trim().length;
  const titleLen = (input.listing.title ?? "").trim().length;

  const baseQuality = input.metrics?.qualityScore ?? 0;
  const engagement = input.metrics?.engagementScore ?? 0;
  const conv = input.metrics?.conversionScore ?? 0;

  let completeness = 40;
  if (photoCount >= 8) completeness += 15;
  else if (photoCount >= 4) completeness += 10;
  else if (photoCount >= 1) completeness += 5;
  if (descLen >= 400) completeness += 15;
  else if (descLen >= 120) completeness += 10;
  if (titleLen >= 20) completeness += 10;
  completeness = Math.min(100, completeness);

  const health = Math.round(Math.min(100, (baseQuality * 0.35 + completeness * 0.35 + engagement * 0.3) / 1));
  const exposure = Math.round(Math.min(100, engagement));
  const conversion = Math.round(Math.min(100, conv));

  void input.views;
  void input.inquiries;

  return { health, exposure, conversion };
}
