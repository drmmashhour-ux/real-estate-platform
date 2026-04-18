import type { ListingQualityLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listingQualityBadgeLabelFromRow } from "@/lib/quality/validators";

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
  const label = listingQualityBadgeLabelFromRow(row);
  if (!label) return null;

  return {
    label,
    title: "Listing quality score reflects content, pricing fit, guest performance signals, and platform trust.",
    level: row.level,
  };
}
