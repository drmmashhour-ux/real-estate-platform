import {
  BNHUB_RANKING_COLD_START_CONVERSION_DAMPING,
  BNHUB_RANKING_COLD_START_EVENT_THRESHOLD,
  BNHUB_RANKING_NEW_LISTING_BOOST_MAX_AGE_DAYS,
  BNHUB_RANKING_NEW_LISTING_MAX_BOOST,
  BNHUB_RANKING_WEIGHTS,
} from "@/config/bnhub-ranking-pricing.config";
import type {
  BnhubRankingScore,
  BnhubRankingSignals,
  BnhubSortMode,
} from "./bnhub-ranking.types";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Sub-scores 0–100 */
export function scoreConversionQuality(s: BnhubRankingSignals, coldDamp: boolean): number {
  const ctr = clamp01(s.ctr * 8);
  const vs = clamp01(s.viewToStartRate * 15);
  const sp = clamp01(s.startToPaidRate * 5);
  let raw = (ctr * 35 + vs * 40 + sp * 25);
  if (coldDamp) raw *= BNHUB_RANKING_COLD_START_CONVERSION_DAMPING;
  return Math.min(100, raw);
}

export function scoreListingQuality(s: BnhubRankingSignals): number {
  const photo = Math.min(100, (s.photoCount / 12) * 100);
  const amen = Math.min(100, (s.amenityCount / 18) * 100);
  const desc = Math.min(100, (s.descriptionLen / 600) * 100);
  const ver = s.verified ? 15 : 0;
  return Math.min(100, photo * 0.35 + amen * 0.25 + desc * 0.3 + ver);
}

export function scoreFreshness(s: BnhubRankingSignals): number {
  const days = s.listingAgeDays;
  if (days <= 14) return 100;
  if (days <= 45) return 85;
  if (days <= 120) return 70;
  if (days <= 365) return 55;
  return 40;
}

export function scorePriceCompetitiveness(s: BnhubRankingSignals): number {
  if (s.priceVsPeerMedian == null || s.peerSampleSize < 3) return 55;
  const r = s.priceVsPeerMedian;
  if (r <= 0.75) return 95;
  if (r <= 0.9) return 85;
  if (r <= 1.05) return 72;
  if (r <= 1.2) return 55;
  return 38;
}

export function scoreTrustCompleteness(s: BnhubRankingSignals): number {
  let x = 40;
  if (s.verified) x += 25;
  if (s.photoCount >= 8) x += 15;
  else if (s.photoCount >= 5) x += 10;
  if (s.descriptionLen >= 400) x += 12;
  else if (s.descriptionLen >= 200) x += 8;
  if (s.hostResponsiveness01 != null) x += 10 * s.hostResponsiveness01;
  return Math.min(100, x);
}

export function isColdStartTraffic(s: BnhubRankingSignals): boolean {
  const ev =
    s.searchViews + s.clicks + s.listingViews + s.bookingStarts + s.bookingsCompleted;
  return ev < BNHUB_RANKING_COLD_START_EVENT_THRESHOLD;
}

/**
 * Recent + low traffic: small additive boost so scores are not driven only by zero conversion.
 */
export function computeNewListingDiscoveryBoost(listingAgeDays: number, coldStart: boolean): number {
  if (!coldStart) return 0;
  if (listingAgeDays > BNHUB_RANKING_NEW_LISTING_BOOST_MAX_AGE_DAYS) return 0;
  const t = 1 - listingAgeDays / BNHUB_RANKING_NEW_LISTING_BOOST_MAX_AGE_DAYS;
  return Math.round(BNHUB_RANKING_NEW_LISTING_MAX_BOOST * Math.max(0, t) * 100) / 100;
}

export function buildRankingExplanations(s: BnhubRankingSignals): string[] {
  const lines: string[] = [];
  if (s.bookingsCompleted >= 3 && s.startToPaidRate >= 0.35) lines.push("Solid completion rate");
  else if (s.bookingsCompleted >= 1) lines.push("Completed stay on record");
  if (s.photoCount >= 8 && s.descriptionLen >= 280) lines.push("High listing completeness");
  else if (s.photoCount >= 5) lines.push("Photo count above minimum");
  if (s.priceVsPeerMedian != null && s.peerSampleSize >= 5 && s.priceVsPeerMedian <= 0.92) {
    lines.push("Nightly rate below peer median (city sample)");
  }
  if (s.listingAgeDays <= 21 && s.descriptionLen >= 200) lines.push("New publish, details present");
  if (lines.length === 0 && isColdStartTraffic(s)) {
    lines.push("Low event volume — rank uses completeness over conversion");
  }
  return lines.slice(0, 3);
}

export function computeBnhubRankingScore(
  listingId: string,
  signals: BnhubRankingSignals,
  featuredBoost = 0,
): BnhubRankingScore {
  const cold = isColdStartTraffic(signals);
  const conv = scoreConversionQuality(signals, cold);
  const qual = scoreListingQuality(signals);
  const fresh = scoreFreshness(signals);
  const price = scorePriceCompetitiveness(signals);
  const trust = scoreTrustCompleteness(signals);
  const w = BNHUB_RANKING_WEIGHTS;

  const boost = Math.min(w.featuredBoostCap * 100, Math.max(0, featuredBoost));
  const newListingBoost = computeNewListingDiscoveryBoost(signals.listingAgeDays, cold);

  const finalScore =
    conv * w.conversionQuality +
    qual * w.listingQuality +
    fresh * w.freshness +
    price * w.priceCompetitiveness +
    trust * w.trustCompleteness +
    boost +
    newListingBoost;

  const breakdown = {
    conversionQuality: conv,
    listingQuality: qual,
    freshness: fresh,
    priceCompetitiveness: price,
    trustCompleteness: trust,
    featuredBoost: boost,
    coldStartDampingApplied: cold,
    newListingDiscoveryBoost: newListingBoost,
  };

  const base: BnhubRankingScore = {
    listingId,
    finalScore: Math.min(100, Math.max(0, finalScore)),
    signalBreakdown: breakdown,
    explanations: [],
  };
  base.explanations = buildRankingExplanations(signals);
  return base;
}

export function bestValueIndex(score: BnhubRankingScore, nightPriceCents: number): number {
  const priceK = Math.max(1, nightPriceCents / 10000);
  const q = (score.signalBreakdown.listingQuality + score.signalBreakdown.conversionQuality) / 2;
  return q / Math.sqrt(priceK);
}

export function compareBnhubRanking(
  a: BnhubRankingScore,
  b: BnhubRankingScore,
  mode: BnhubSortMode,
  nightPriceA: number,
  nightPriceB: number,
): number {
  switch (mode) {
    case "best_value":
      return (
        bestValueIndex(b, nightPriceB) - bestValueIndex(a, nightPriceA) ||
        b.finalScore - a.finalScore
      );
    case "top_conversion":
      return (
        b.signalBreakdown.conversionQuality - a.signalBreakdown.conversionQuality ||
        b.finalScore - a.finalScore
      );
    case "recommended":
    case "newest":
    case "price_low_high":
    case "price_high_low":
    default:
      return b.finalScore - a.finalScore || nightPriceA - nightPriceB;
  }
}
