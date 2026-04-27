import "server-only";

import { unstable_cache } from "next/cache";

import { getGuestId } from "@/lib/auth/session";
import { flags } from "@/lib/flags";
import { query } from "@/lib/sql";

const CACHE_SEC = 60;
const MAX_EVENTS = 2000;

export type UserBehaviorType = "new" | "browser" | "high_intent";

export type UserProfile = {
  /** Opaque Prisma user id from session; omitted when unauthenticated or no signal. */
  userId?: string;
  preferredCities: string[];
  avgPriceRange: { min: number; max: number };
  viewedListings: string[];
  behaviorType: UserBehaviorType;
};

type EventRow = {
  listingId: string;
  city: string | null;
  nightPriceCents: string | null;
  createdAt: string;
};

const EMPTY: UserProfile = {
  preferredCities: [],
  avgPriceRange: { min: 0, max: 0 },
  viewedListings: [],
  behaviorType: "new",
};

function inferBehaviorType(totalViews: number, bookingCount: number, maxRepeatOnListing: number): UserBehaviorType {
  if (totalViews === 0 && bookingCount === 0) return "new";
  if (bookingCount > 0) return "high_intent";
  if (maxRepeatOnListing >= 2 || totalViews >= 12) return "high_intent";
  if (totalViews >= 1) return "browser";
  return "new";
}

function topCitiesByFrequency(cities: string[], limit: number): string[] {
  const byCity = new Map<string, number>();
  for (const c of cities) {
    const t = c.trim();
    if (!t) continue;
    byCity.set(t, (byCity.get(t) ?? 0) + 1);
  }
  return [...byCity.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, limit);
}

function priceRangeFromCents(cents: number[]): { min: number; max: number } {
  if (cents.length === 0) return { min: 0, max: 0 };
  const dollars = cents.map((c) => c / 100);
  return { min: Math.min(...dollars), max: Math.max(...dollars) };
}

async function loadUserProfile(resolvedUserId: string | null): Promise<UserProfile> {
  if (!flags.RECOMMENDATIONS) {
    return { ...EMPTY, userId: resolvedUserId ?? undefined };
  }
  if (!resolvedUserId) {
    return EMPTY;
  }

  const rows = await query<EventRow>(
    `
    SELECT
      (e."data"->>'listingId') AS "listingId",
      l."city" AS "city",
      l."nightPriceCents"::text AS "nightPriceCents",
      e."created_at"::text AS "createdAt"
    FROM "marketplace_events" e
    INNER JOIN "bnhub_listings" l
      ON l."id"::text = (e."data"->>'listingId')
    WHERE e."event" = 'listing_view'
      AND (e."data" ? 'listingId')
      AND (e."data"->>'userId') = $1
      AND l."listingStatus" = 'PUBLISHED'
    ORDER BY e."created_at" DESC
    LIMIT $2
  `,
    [resolvedUserId, MAX_EVENTS]
  );

  const bookingRows = await query<{ c: string }>(
    `
    SELECT COUNT(*)::text AS c
    FROM "marketplace_events" e
    WHERE e."event" = 'booking_created'
      AND (e."data" ? 'listingId')
      AND (e."data"->>'userId') = $1
  `,
    [resolvedUserId]
  );

  const bookingCount = Math.max(0, Math.floor(Number.parseInt(bookingRows[0]?.c ?? "0", 10)));

  const byListing = new Map<string, number>();
  const cents: number[] = [];
  const cityList: string[] = [];
  for (const r of rows) {
    if (r.listingId) {
      byListing.set(r.listingId, (byListing.get(r.listingId) ?? 0) + 1);
    }
    if (r.city) cityList.push(r.city);
    const nc = r.nightPriceCents != null ? Number.parseInt(String(r.nightPriceCents), 10) : NaN;
    if (Number.isFinite(nc)) {
      cents.push(nc);
    }
  }

  const totalViews = rows.length;
  const maxRepeatOnListing = byListing.size > 0 ? Math.max(...byListing.values()) : 0;
  const preferredCities = topCitiesByFrequency(cityList, 5);
  const seen = new Set<string>();
  const viewedListings: string[] = [];
  for (const r of rows) {
    const id = r.listingId;
    if (id && !seen.has(id)) {
      seen.add(id);
      viewedListings.push(id);
    }
  }

  return {
    userId: resolvedUserId,
    preferredCities,
    avgPriceRange: priceRangeFromCents(cents),
    viewedListings: viewedListings.slice(0, 20),
    behaviorType: inferBehaviorType(totalViews, bookingCount, maxRepeatOnListing),
  };
}

/**
 * Behavior-only profile from `marketplace_events` (no PII; only behavioral aggregates + opaque `userId`).
 * Resolves the current session user when `userId` is omitted.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile> {
  if (!flags.RECOMMENDATIONS) {
    return userId != null && userId !== "" ? { ...EMPTY, userId } : EMPTY;
  }
  const resolved = userId && userId.trim() !== "" ? userId : await getGuestId();
  if (!resolved) {
    return EMPTY;
  }
  return unstable_cache(
    () => loadUserProfile(resolved),
    ["user-profile", resolved],
    { revalidate: CACHE_SEC, tags: ["user-profile"] }
  )();
}
