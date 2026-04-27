import type { ReputationLevel } from "@/lib/ai/reputationScoringCore";
import type { UserProfile } from "@/lib/ai/userProfile";

export type FeedListingForRank = {
  id: string;
  title: string;
  city: string;
  price: number;
  createdAt: Date;
  /** From market heatmap (or 0 if unknown). */
  demandScore: number;
  imageUrl: string | null;
  /** 0…1 from {@link generateSocialProof} (Order 47). */
  socialProofScore: number;
  socialProofStrength: "low" | "medium" | "high";
  /** 0…1 from {@link computeListingReputationFromMetrics} (Order 48). */
  listingReputationScore: number;
  reputationLevel: ReputationLevel;
  /** For host batch / “Top host” (Order 48). */
  ownerId: string;
  /** Order A.1 — night occupancy last 30d (0..1). */
  occupancyRate?: number;
};

export type FeedRankOptions = {
  sessionBoostCities?: string[];
  /** Injected for deterministic unit tests. */
  random01?: () => number;
  now?: Date;
};

const MS_DAY = 86_400_000;

function normCity(s: string) {
  return s.trim().toLowerCase();
}

function cityInSet(city: string, set: string[] | undefined) {
  if (!set || set.length === 0) return false;
  const c = normCity(city);
  return set.some((x) => normCity(x) === c);
}

/**
 * @returns 0..1; 1 = inside [min,max], lower when price is far from band.
 */
function priceMatch01(price: number, min: number, max: number): number {
  if (min <= 0 && max <= 0) return 0.5;
  if (min > 0 && max > 0) {
    if (price >= min && price <= max) return 1;
    const mid = (min + max) / 2;
    const span = Math.max(max - min, 1);
    const dist = Math.abs(price - mid) / span;
    return Math.max(0, 1 - dist / 3);
  }
  if (min > 0) return price >= min ? 1 : Math.max(0, 1 - (min - price) / Math.max(min, 1));
  if (max > 0) return price <= max ? 1 : Math.max(0, 1 - (price - max) / Math.max(max, 1));
  return 0.5;
}

function cityMatchWeight(
  city: string,
  profile: UserProfile | null | undefined,
  sessionBoost: string[] | undefined
): number {
  if (profile?.preferredCities && cityInSet(city, profile.preferredCities)) return 1;
  if (sessionBoost && cityInSet(city, sessionBoost)) return 0.75;
  return 0.2;
}

function freshnessScore(createdAt: Date, now: Date): number {
  const days = (now.getTime() - createdAt.getTime()) / MS_DAY;
  return 2 / (1 + days / 14);
}

/**
 * Composite score: city / price / demand / freshness + small exploration.
 */
export function feedScore(
  l: FeedListingForRank,
  userProfile: UserProfile | null | undefined,
  opts: FeedRankOptions
): number {
  const now = opts.now ?? new Date();
  const r = opts.random01 ?? Math.random;
  const { sessionBoostCities = [] } = opts;

  const city = cityMatchWeight(l.city, userProfile, sessionBoostCities);
  const { min, max } = userProfile?.avgPriceRange ?? { min: 0, max: 0 };
  const p = priceMatch01(l.price, min, max);
  const fresh = freshnessScore(l.createdAt, now);
  return (
    city * 5 +
    p * 3 +
    l.demandScore * 0.05 +
    fresh +
    l.socialProofScore * 2 +
    l.listingReputationScore * 3 +
    (l.occupancyRate ?? 0) * 2 +
    r()
  );
}

/**
 * Ranks a batch of listings (e.g. 50) for the feed, **highest score first**. Exploration uses `Math.random` unless `random01` is passed.
 */
export function rankListings(
  listings: FeedListingForRank[],
  userProfile: UserProfile | null | undefined,
  opts: FeedRankOptions = {}
): FeedListingForRank[] {
  if (listings.length === 0) return [];
  return [...listings]
    .map((row) => ({ row, score: feedScore(row, userProfile, opts) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.row);
}
