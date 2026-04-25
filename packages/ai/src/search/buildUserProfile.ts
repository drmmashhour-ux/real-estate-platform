import { SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Aggregates recent `SearchEvent` rows into `UserSearchProfile` for personalization.
 */
export async function buildUserSearchProfileFromEvents(userId: string): Promise<void> {
  const since = new Date(Date.now() - 90 * 86400000);
  const events = await prisma.searchEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 800,
  });

  const listingIds = [...new Set(events.map((e) => e.listingId).filter((x): x is string => Boolean(x)))];
  const listings = listingIds.length
    ? await prisma.shortTermListing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, city: true, propertyType: true, nightPriceCents: true, maxGuests: true },
      })
    : [];
  const byListing = new Map(listings.map((l) => [l.id, l]));

  const cityCount = new Map<string, number>();
  const typeCount = new Map<string, number>();
  const prices: number[] = [];
  const guestVals: number[] = [];

  for (const e of events) {
    if (e.eventType === SearchEventType.SEARCH && e.metadata && typeof e.metadata === "object") {
      const m = e.metadata as { city?: string; location?: string };
      const c = m.city ?? m.location;
      if (c?.trim()) {
        const key = c.trim();
        cityCount.set(key, (cityCount.get(key) ?? 0) + 2);
      }
    }
    if (!e.listingId) continue;
    const l = byListing.get(e.listingId);
    if (!l) continue;
    cityCount.set(l.city, (cityCount.get(l.city) ?? 0) + 1);
    if (l.propertyType?.trim()) {
      const t = l.propertyType.trim();
      typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
    }
    prices.push(l.nightPriceCents / 100);
    guestVals.push(l.maxGuests);
  }

  const topCities = [...cityCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c]) => c);
  const topTypes = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  prices.sort((a, b) => a - b);
  const pick = (p: number) =>
    prices.length ? prices[Math.min(prices.length - 1, Math.max(0, Math.floor(p * (prices.length - 1))))]! : null;
  const preferredPriceMin = prices.length ? pick(0.12) : null;
  const preferredPriceMax = prices.length ? pick(0.88) : null;
  const preferredGuests =
    guestVals.length > 0 ? Math.round(guestVals.reduce((a, b) => a + b, 0) / guestVals.length) : null;

  const lastSearch = events.find((e) => e.eventType === SearchEventType.SEARCH)?.createdAt ?? null;

  await prisma.userSearchProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredCities: topCities,
      preferredTypes: topTypes,
      preferredPriceMin,
      preferredPriceMax,
      preferredGuests: preferredGuests ?? undefined,
      preferredAmenities: [],
      lastSearchAt: lastSearch ?? undefined,
    },
    update: {
      preferredCities: topCities,
      preferredTypes: topTypes,
      preferredPriceMin,
      preferredPriceMax,
      preferredGuests: preferredGuests ?? undefined,
      lastSearchAt: lastSearch ?? undefined,
    },
  });
}
