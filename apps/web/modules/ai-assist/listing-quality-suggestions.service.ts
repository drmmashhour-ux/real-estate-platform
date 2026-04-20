import { prisma } from "@/lib/db";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

const MIN_PHOTOS = 5;

function scoreListing(row: {
  title: string;
  description: string | null;
  photos: unknown;
  amenities: unknown;
  beds: number;
}): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (!row.title?.trim()) missing.push("title");
  const descLen = row.description?.trim().length ?? 0;
  if (descLen < 120) missing.push("description_depth");
  const photos = Array.isArray(row.photos) ? row.photos.length : 0;
  if (photos < MIN_PHOTOS) missing.push("photos");
  const amenities = Array.isArray(row.amenities) ? row.amenities.length : 0;
  if (amenities < 3) missing.push("amenities");
  if (row.beds < 1) missing.push("beds");

  const score = Math.max(
    0,
    100 -
      missing.length * 18 -
      (descLen < 120 ? 12 : 0) -
      (photos < MIN_PHOTOS ? 15 : 0)
  );

  return { score: Math.round(score), missing };
}

/**
 * Listing Quality v1 — heuristic completeness; **never mutates** listing rows.
 */
export async function getListingQualitySuggestionsForHost(
  hostUserId: string,
  opts?: { maxListings?: number }
): Promise<AiAssistResult<{ items: AiRecommendationItem[] }>> {
  try {
    const take = Math.min(opts?.maxListings ?? 15, 40);
    const listings = await prisma.shortTermListing.findMany({
      where: { ownerId: hostUserId },
      select: {
        id: true,
        title: true,
        description: true,
        photos: true,
        amenities: true,
        beds: true,
        listingCode: true,
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const items: AiRecommendationItem[] = [];

    for (const l of listings) {
      const { score, missing } = scoreListing(l);
      if (score >= 82 || missing.length === 0) continue;

      items.push({
        id: `lq:${l.id}`,
        hub: "bnhub_host",
        actionClass: "recommendation",
        title: `Improve listing ${l.listingCode}`,
        body: `Completeness score ~${score}/100. Focus on: ${missing.join(", ")}.`,
        reasonCodes: [
          { code: "LISTING_QUALITY_HEURISTIC", message: "Rule-based completeness scan" },
          ...missing.map((m) => ({ code: `GAP:${m}`, message: `Missing or weak: ${m}` })),
        ],
        refs: { listingId: l.id },
      });
    }

    return { ok: true, value: { items } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "listing quality failed",
      code: "LISTING_QUALITY",
    };
  }
}
