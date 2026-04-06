import type { RankingSearchContext, RankingSignalBundle, BnhubListingRankingInput, FsboListingRankingInput } from "./types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function normLog(x: number, cap: number): number {
  return clamp01(Math.log1p(Math.max(0, x)) / Math.log1p(Math.max(1, cap)));
}

/** City / region / neighborhood vs search context */
export function getRelevanceSignalsBnhub(
  listing: BnhubListingRankingInput,
  ctx: RankingSearchContext
): number {
  let s = 1;
  const qCity = ctx.city?.trim().toLowerCase();
  if (qCity) {
    const lc = listing.city.toLowerCase();
    const lr = (listing.region ?? "").toLowerCase();
    if (lc === qCity || lr === qCity) s *= 1;
    else if (lc.includes(qCity) || qCity.includes(lc)) s *= 0.82;
    else s *= 0.45;
  }
  const qN = ctx.neighborhood?.trim().toLowerCase();
  if (qN && listing.region) {
    s *= listing.region.toLowerCase().includes(qN) ? 1 : 0.88;
  }
  if (ctx.propertyType?.trim()) {
    const pt = (listing.propertyType ?? "").toLowerCase();
    const want = ctx.propertyType.trim().toLowerCase();
    s *= pt === want || pt.includes(want) ? 1 : 0.55;
  }
  if (ctx.roomType?.trim() && listing.roomType) {
    s *= listing.roomType.toLowerCase().includes(ctx.roomType.trim().toLowerCase()) ? 1 : 0.75;
  }
  if (ctx.guestCount != null && ctx.guestCount > 0) {
    s *= listing.maxGuests >= ctx.guestCount ? 1 : clamp01(listing.maxGuests / ctx.guestCount * 0.65);
  }
  if (ctx.budgetMinCents != null && ctx.budgetMinCents > 0 && listing.nightPriceCents < ctx.budgetMinCents) {
    s *= 0.55;
  }
  if (ctx.budgetMaxCents != null && ctx.budgetMaxCents > 0 && listing.nightPriceCents > ctx.budgetMaxCents) {
    const over = listing.nightPriceCents / ctx.budgetMaxCents;
    s *= over <= 1 ? 1 : clamp01(1.15 - (over - 1) * 0.8);
  }
  return clamp01(s);
}

export function getRelevanceSignalsFsbo(listing: FsboListingRankingInput, ctx: RankingSearchContext): number {
  let s = 1;
  const qCity = ctx.city?.trim().toLowerCase();
  if (qCity) {
    const lc = listing.city.toLowerCase();
    if (lc === qCity) s *= 1;
    else if (lc.includes(qCity) || qCity.includes(lc)) s *= 0.85;
    else s *= 0.48;
  }
  if (ctx.propertyType?.trim()) {
    const pt = (listing.propertyType ?? "").toLowerCase();
    const want = ctx.propertyType.trim().toLowerCase();
    s *= pt === want || pt.includes(want) ? 1 : 0.58;
  }
  if (ctx.budgetMinCents != null && listing.priceCents < ctx.budgetMinCents) s *= 0.6;
  if (ctx.budgetMaxCents != null && listing.priceCents > ctx.budgetMaxCents) {
    const over = listing.priceCents / Math.max(1, ctx.budgetMaxCents);
    s *= over <= 1 ? 1 : clamp01(1.2 - (over - 1) * 0.5);
  }
  return clamp01(s);
}

export function getTrustSignalsBnhub(listing: BnhubListingRankingInput): number {
  let t = 0.45;
  if (listing.verificationStatus === "VERIFIED") t += 0.35;
  else if (listing.verificationStatus === "PENDING") t += 0.15;
  if (listing.listingVerificationStatus === "VERIFIED") t += 0.1;
  else if (listing.listingVerificationStatus === "APPROVED") t += 0.08;
  t -= Math.min(0.35, listing.disputeCount * 0.07);
  return clamp01(t);
}

export function getTrustSignalsFsbo(listing: FsboListingRankingInput): number {
  let t = 0.4;
  if (listing.moderationStatus === "APPROVED") t += 0.15;
  if (listing.verificationStatus === "VERIFIED") t += 0.25;
  else if (listing.verificationStatus === "PENDING") t += 0.08;
  if (listing.trustScore != null) t += clamp01(listing.trustScore / 100) * 0.25;
  if (listing.riskScore != null) t -= clamp01(listing.riskScore / 100) * 0.2;
  return clamp01(t);
}

export function getQualitySignalsBnhub(listing: BnhubListingRankingInput): number {
  const desc = (listing.description ?? "").trim().length;
  const descS = desc >= 400 ? 1 : desc >= 120 ? 0.75 : desc >= 40 ? 0.5 : 0.25;
  const photos = clamp01(listing.photoCount / 8);
  const am = Array.isArray(listing.amenities) ? listing.amenities.length : 0;
  const amS = clamp01(am / 12);
  const rules = listing.houseRules?.trim() ? 0.08 : 0;
  const cin = listing.checkInInstructions?.trim() ? 0.08 : 0;
  return clamp01(0.35 * descS + 0.35 * photos + 0.22 * amS + rules + cin);
}

export function getQualitySignalsFsbo(listing: FsboListingRankingInput): number {
  const desc = listing.description.trim().length;
  const descS = desc >= 500 ? 1 : desc >= 200 ? 0.78 : desc >= 60 ? 0.52 : 0.28;
  const img = clamp01(listing.images.length / 10);
  return clamp01(0.45 * descS + 0.55 * img);
}

export function getEngagementSignalsBnhub(listing: BnhubListingRankingInput): number {
  const fav = normLog(listing.favoriteCount, 40);
  const rev = normLog(listing.reviewCount, 30);
  const book = normLog(listing.completedBookings, 25);
  return clamp01(0.35 * fav + 0.35 * rev + 0.3 * book);
}

export function getEngagementSignalsFsbo(listing: FsboListingRankingInput): number {
  const v = normLog(listing.viewCount, 200);
  const s = normLog(listing.saveCount, 50);
  const l = normLog(listing.leadCount, 30);
  const d = clamp01((listing.demandScoreFromAnalytics ?? 0) / 100);
  return clamp01(0.36 * v + 0.31 * s + 0.21 * l + 0.12 * d);
}

export function getConversionSignalsBnhub(listing: BnhubListingRankingInput): number {
  const b = Math.max(0, listing.completedBookings);
  const denom = Math.max(1, listing.reviewCount + b);
  const ratio = b / denom;
  return clamp01(0.45 + 0.55 * Math.min(1, ratio * 1.5));
}

export function getConversionSignalsFsbo(listing: FsboListingRankingInput): number {
  const leads = listing.leadCount;
  const views = Math.max(1, listing.viewCount);
  return clamp01(Math.min(1, (leads / views) * 25));
}

export function getFreshnessSignals(createdAt: Date, updatedAt: Date): number {
  const now = Date.now();
  const daysCreate = (now - createdAt.getTime()) / (86400000);
  const daysUpdate = (now - updatedAt.getTime()) / (86400000);
  const c = Math.exp(-daysCreate / 120);
  const u = Math.exp(-daysUpdate / 45);
  return clamp01(0.45 * c + 0.55 * u);
}

export function getHostSignalsBnhub(listing: BnhubListingRankingInput): number {
  const base = listing.hostPerformanceScore != null ? clamp01(listing.hostPerformanceScore / 100) : 0.55;
  let bonus = 0;
  if (listing.hostHasFastResponder) bonus += 0.06;
  if (listing.hostHasReliable) bonus += 0.04;
  return clamp01(base + bonus);
}

export function getHostSignalsFsbo(): number {
  return 0.5;
}

export function getReviewSignalsBnhub(listing: BnhubListingRankingInput): number {
  const avg =
    listing.aggregateAvgRating ??
    listing.reviewAvg ??
    (listing.reviewCount > 0 ? 3.5 : null);
  if (avg == null) return 0.35;
  const stars = clamp01(avg / 5);
  const vol = normLog(listing.aggregateTotalReviews || listing.reviewCount, 25);
  const boost = Math.min(0.12, Math.max(0, listing.reputationRankBoost ?? 0));
  return clamp01(0.65 * stars + 0.35 * vol + boost);
}

export function getReviewSignalsFsbo(): number {
  return 0.45;
}

export function getPriceCompetitivenessBnhub(
  listing: BnhubListingRankingInput,
  median: number | null
): number {
  if (median == null || median <= 0) return 0.6;
  const ratio = listing.nightPriceCents / median;
  const dev = Math.abs(Math.log(Math.max(0.01, ratio)));
  return clamp01(1 - Math.min(1, dev / Math.log(4)));
}

export function getPriceCompetitivenessFsbo(listing: FsboListingRankingInput, median: number | null): number {
  if (median == null || median <= 0) return 0.6;
  const ratio = listing.priceCents / median;
  const dev = Math.abs(Math.log(Math.max(0.01, ratio)));
  return clamp01(1 - Math.min(1, dev / Math.log(5)));
}

export function getAvailabilitySignals(ctx: RankingSearchContext): number {
  if (ctx.checkIn && ctx.checkOut) {
    return ctx.availableForDates === false ? 0.05 : 1;
  }
  return 0.72;
}

/** Aggregate all BNHub signals */
export function buildBnhubSignalBundle(
  listing: BnhubListingRankingInput,
  ctx: RankingSearchContext
): RankingSignalBundle {
  return {
    relevance: getRelevanceSignalsBnhub(listing, ctx),
    trust: getTrustSignalsBnhub(listing),
    quality: getQualitySignalsBnhub(listing),
    engagement: getEngagementSignalsBnhub(listing),
    conversion: getConversionSignalsBnhub(listing),
    freshness: getFreshnessSignals(listing.createdAt, listing.updatedAt),
    host: getHostSignalsBnhub(listing),
    review: getReviewSignalsBnhub(listing),
    priceCompetitiveness: getPriceCompetitivenessBnhub(listing, listing.medianNightPriceCents),
    availability: getAvailabilitySignals(ctx),
  };
}

export function buildFsboSignalBundle(listing: FsboListingRankingInput, ctx: RankingSearchContext): RankingSignalBundle {
  return {
    relevance: getRelevanceSignalsFsbo(listing, ctx),
    trust: getTrustSignalsFsbo(listing),
    quality: getQualitySignalsFsbo(listing),
    engagement: getEngagementSignalsFsbo(listing),
    conversion: getConversionSignalsFsbo(listing),
    freshness: getFreshnessSignals(listing.createdAt, listing.updatedAt),
    host: getHostSignalsFsbo(),
    review: getReviewSignalsFsbo(),
    priceCompetitiveness: getPriceCompetitivenessFsbo(listing, listing.medianPriceCents),
    availability: 0.75,
  };
}
