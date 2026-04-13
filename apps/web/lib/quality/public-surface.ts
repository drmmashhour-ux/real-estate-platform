import type { ListingQualityLevel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PublicListingQualityBadge = {
  label: string;
  title: string;
  level: ListingQualityLevel;
};

/** Subtle public badge: only for strong listings (good / excellent). */
export async function getPublicListingQualityBadge(
  listingId: string
): Promise<PublicListingQualityBadge | null> {
  const row = await prisma.listingQualityScore.findUnique({
    where: { listingId },
    select: { level: true, qualityScore: true, healthStatus: true },
  });
  if (!row) return null;
  if (row.level !== "excellent" && row.level !== "good") return null;
  if (row.qualityScore < 62) return null;

  const label =
    row.level === "excellent"
      ? "Top quality"
      : row.healthStatus === "healthy" || row.healthStatus === "top_performer"
        ? "High quality"
        : "Quality stay";

  return {
    label,
    title: "Listing quality score reflects content, pricing fit, guest performance signals, and platform trust.",
    level: row.level,
  };
}
