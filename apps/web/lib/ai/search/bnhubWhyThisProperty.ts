import { SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Short guest-facing reasons for personalization (logged-in users only).
 */
export async function getBnhubWhyThisPropertyBullets(
  listing: { id: string; city: string; nightPriceCents: number },
  userId: string | null
): Promise<string[]> {
  if (!userId) return [];

  const since = new Date(Date.now() - 30 * 86400000);
  const [profile, metrics, searchCount] = await Promise.all([
    prisma.userSearchProfile.findUnique({ where: { userId } }),
    prisma.listingSearchMetrics.findUnique({ where: { listingId: listing.id } }),
    prisma.searchEvent.count({
      where: { userId, eventType: SearchEventType.SEARCH, createdAt: { gte: since } },
    }),
  ]);

  const lines: string[] = [];
  const night = listing.nightPriceCents / 100;

  if (profile?.preferredCities?.length) {
    const hit = profile.preferredCities.some(
      (c) =>
        c.trim() &&
        (listing.city.toLowerCase().includes(c.trim().toLowerCase()) ||
          c.trim().toLowerCase().includes(listing.city.toLowerCase()))
    );
    if (hit) {
      lines.push(`Because you searched in ${listing.city}`);
    }
  }

  if (
    profile?.preferredPriceMin != null &&
    profile?.preferredPriceMax != null &&
    night >= profile.preferredPriceMin * 0.92 &&
    night <= profile.preferredPriceMax * 1.08
  ) {
    lines.push("Matches your price range");
  }

  if ((metrics?.views7d ?? 0) >= 4 || (metrics?.bookings7d ?? 0) >= 1) {
    lines.push("Popular in this area");
  }

  if (searchCount >= 3) {
    lines.push("Similar to your previous searches");
  }

  return [...new Set(lines)].slice(0, 4);
}
