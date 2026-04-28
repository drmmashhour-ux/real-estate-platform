import type { SyriaAppUser, SyriaProperty } from "@/generated/prisma";
import { normalizeSyriaAmenityKeys } from "@/lib/syria/amenities";

export type Sy8LocationQualityTier = "incomplete" | "general" | "medium" | "precise";

/**
 * ORDER SYBNB-69 — Smart Ranking v2 engagement inputs (weighted below).
 */
export type Sy8FeedRankEngagement = {
  /** SybnbEvent rows: `contact_click` + `hotel_contact_click` */
  contactClicks: number;
  /** Open Sybnb stay requests + legacy BNHUB SyriaBooking pendings */
  bookingRequests: number;
  /** Finished stays (Sybnb `completed` + Syria `COMPLETED`) */
  completedBookings: number;
};

function nz(s: string | null | undefined): string {
  return (s ?? "").trim();
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * ORDER SYBNB-69 — first **3 days after listing creation**: **+5** fresh boost (exclusive with decay below zero decay inside window).
 */
export function computeSybnbFreshBoostV69(createdAt: Date, nowMs = Date.now()): number {
  const days = (nowMs - createdAt.getTime()) / (86400 * 1000);
  return days <= 3 ? 5 : 0;
}

/**
 * ORDER SYBNB-69 — older listings lose priority vs steady-state inventory (applied **after** the 3-day fresh window).
 */
export function computeListingAgeDecayPenaltyV69(createdAt: Date, nowMs = Date.now()): number {
  const days = Math.max(0, (nowMs - createdAt.getTime()) / (86400 * 1000));
  if (days <= 3) return 0;
  const pastFresh = days - 3;
  return Math.min(48, Math.floor(pastFresh / 14) * 3);
}

/** COUNT(*) semantics over persisted listing photo URLs (data URLs or HTTPS). */
export function countPersistedListingImages(images: SyriaProperty["images"]): number {
  return Array.isArray(images) ?
      images.filter((x): x is string => typeof x === "string" && x.trim().length > 0).length
    : 0;
}

/**
 * ORDER SYBNB-65 — image tier contributes to **image_score** (bounded boosts).
 */
export function computeSy8ImageRankBoost(imgCount: number): number {
  let b = 0;
  if (imgCount === 0) b -= 2;
  if (imgCount >= 3) b += 3;
  if (imgCount >= 5) b += 5;
  return b;
}

/** ORDER SYBNB-65 — amenities tier contributes to **amenities_score** */
export function computeSy8AmenityRankBoost(amenities: SyriaProperty["amenities"]): number {
  const keys = normalizeSyriaAmenityKeys(Array.isArray(amenities) ? amenities.filter((x): x is string => typeof x === "string") : []);
  let s = 0;
  if (keys.includes("electricity_24h")) s += 3;
  if (keys.includes("wifi")) s += 2;
  const extras = keys.filter((k) => k !== "electricity_24h" && k !== "wifi").length;
  s += extras;
  return Math.min(40, s);
}

/** ORDER SYBNB-69 — +3 / +5 / +8 with caps so one viral listing cannot dominate forever. */
export function computeSy8EngagementScoreFromSignals(e: Sy8FeedRankEngagement): number {
  const cc = Math.min(e.contactClicks, 400);
  const br = Math.min(e.bookingRequests, 200);
  const done = Math.min(e.completedBookings, 120);
  return Math.min(160, cc * 3 + br * 5 + done * 8);
}

function computeSy8TrustAndListingSignals(input: {
  property: Pick<
    SyriaProperty,
    "amenities" | "images" | "area" | "addressDetails" | "type" | "plan" | "listingVerified" | "verified"
  >;
  owner: Pick<SyriaAppUser, "flagged" | "phoneVerifiedAt" | "verifiedAt" | "verificationLevel">;
}): number {
  const { property: p, owner } = input;
  let score = 0;

  const sellerVerified =
    owner.phoneVerifiedAt != null || owner.verifiedAt != null || Boolean(owner.verificationLevel?.trim());
  if (sellerVerified) score += 5;

  const verifiedHotel = p.type === "HOTEL" && (Boolean(p.listingVerified) || Boolean(p.verified));
  if (verifiedHotel) score += 5;

  if (owner.flagged) score -= 10;

  if (nz(p.area) !== "") score += 2;
  if (nz(p.addressDetails) !== "") score += 2;

  if (p.plan === "premium" || p.plan === "hotel_featured") score += 5;
  else if (p.plan === "featured") score += 3;

  return score;
}

/**
 * ORDER SYBNB-69 — Smart Ranking **v2** (persisted as `sy8FeedRankScore`).
 *
 * score ≈ trust_score + amenities_score + image_score + engagement_score + fresh_boost − age_decay
 *
 * Browse safety & exclusions (`needsReview`, flagged sellers): see `sy8FeedExtraWhere` — SQL filters,
 * not this scalar (scores still recompute for hidden rows).
 *
 * Sort: `sy8FeedRankScore DESC`, `listingPhotoCount DESC`, `createdAt DESC` (`listingBrowseOrderBy`).
 */
export function computeSy8FeedRankScore(input: {
  property: Pick<
    SyriaProperty,
    | "amenities"
    | "images"
    | "area"
    | "addressDetails"
    | "type"
    | "plan"
    | "listingVerified"
    | "verified"
    | "createdAt"
  >;
  owner: Pick<SyriaAppUser, "flagged" | "phoneVerifiedAt" | "verifiedAt" | "verificationLevel">;
  engagement: Sy8FeedRankEngagement;
  /** Defaults to `Date.now()` — inject in tests */
  nowMs?: number;
}): number {
  const { property: p, owner, engagement } = input;
  const nowMs = input.nowMs ?? Date.now();

  const trustScore = computeSy8TrustAndListingSignals({ property: p, owner });
  const amenitiesScore = computeSy8AmenityRankBoost(p.amenities);
  const imgCount = countPersistedListingImages(p.images);
  const imageScore = computeSy8ImageRankBoost(imgCount);
  const engagementScore = computeSy8EngagementScoreFromSignals(engagement);

  let score =
    trustScore +
    amenitiesScore +
    imageScore +
    engagementScore +
    computeSybnbFreshBoostV69(p.createdAt, nowMs) -
    computeListingAgeDecayPenaltyV69(p.createdAt, nowMs);

  return clampInt(score, 0, 500);
}

/** Whether listing has a “state / governorate” and city for SYBNB safety checks. */
export function hasSy8ListingStateAndCity(
  p: Pick<SyriaProperty, "state" | "governorate" | "city">,
): boolean {
  const hasState = nz(p.state) !== "" || nz(p.governorate) !== "";
  return hasState && nz(p.city) !== "";
}

/**
 * - **incomplete** — no state/governorate or no city
 * - **general** — state / governorate only (no city)
 * - **medium** — state + city, but not “full” address
 * - **precise** — state + city + area + addressDetails
 */
export function sy8LocationQualityTier(
  p: Pick<SyriaProperty, "state" | "governorate" | "city" | "area" | "addressDetails">,
): Sy8LocationQualityTier {
  const hasState = nz(p.state) !== "" || nz(p.governorate) !== "";
  const hasCity = nz(p.city) !== "";
  if (!hasState || !hasCity) {
    if (hasState && !hasCity) return "general";
    return "incomplete";
  }
  const hasArea = nz(p.area) !== "";
  const hasDetails = nz(p.addressDetails) !== "";
  if (hasArea && hasDetails) return "precise";
  return "medium";
}
