import type { SearchEvent } from "@prisma/client";
import { prisma } from "@/lib/db";

function labelFromSearchEvent(s: SearchEvent): string {
  const m = s.metadata;
  if (m && typeof m === "object" && !Array.isArray(m)) {
    const q = (m as Record<string, unknown>).query;
    if (typeof q === "string" && q.trim()) return q.trim();
    const filters = (m as Record<string, unknown>).filters;
    if (typeof filters === "string" && filters.trim()) return filters.trim();
  }
  return String(s.eventType);
}

export type UserIntentProfile = {
  userId: string;
  intent: "buy" | "rent" | "invest" | "browse";
  budgetMinCents?: number;
  budgetMaxCents?: number;
  cities: string[];
  urgency: "low" | "medium" | "high";
  sources: string[];
};

/** Derived from real saves + searches — no inference beyond observed data. */
export async function buildUserIntentProfile(userId: string): Promise<UserIntentProfile> {
  const [saves, searches] = await Promise.all([
    prisma.buyerSavedListing.findMany({
      where: { userId },
      take: 40,
      include: { fsboListing: { select: { city: true, priceCents: true, listingDealType: true } } },
    }),
    prisma.searchEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const cities = [...new Set(saves.map((s) => s.fsboListing.city).filter(Boolean))];
  const prices = saves.map((s) => s.fsboListing.priceCents).filter((p) => p > 0);
  const budgetMinCents = prices.length ? Math.min(...prices) : undefined;
  const budgetMaxCents = prices.length ? Math.max(...prices) : undefined;
  const rentBias = saves.filter((s) => s.fsboListing.listingDealType === "RENT").length > saves.length / 2;
  return {
    userId,
    intent: rentBias ? "rent" : "buy",
    budgetMinCents,
    budgetMaxCents,
    cities,
    urgency: saves.length >= 5 ? "high" : saves.length >= 2 ? "medium" : "low",
    sources: [...new Set(searches.map(labelFromSearchEvent).filter(Boolean))],
  };
}
