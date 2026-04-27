import { generateSocialProof } from "./socialProof";

export type ReputationLevel = "low" | "medium" | "high";

export type ListingReputation = {
  listingId: string;
  /** 0…1, internal / ranking / analytics only — do not show raw number to end users. */
  score: number;
  level: ReputationLevel;
  signals: string[];
};

export function reputationLevelFromScore(s: number): ReputationLevel {
  if (s >= 0.75) return "high";
  if (s >= 0.4) return "medium";
  return "low";
}

export type ListingReputationMetrics = {
  listingId: string;
  bookings: number;
  views: number;
  rating: number;
  descriptionLength: number;
  hasPhoto: boolean;
  /**
   * Optional max recent price swing vs `nightPriceCents` (e.g. 0.2 = 20% move).
   * `undefined` = not measured — neutral (no penalty for new).
   */
  maxRecentPriceChangeRatio?: number | null;
};

/**
 * Deterministic rule-based listing reputation; safe for feed batch use (Order 48).
 * Baseline ~0.2 so new / sparse listings are not over-penalized.
 */
export function computeListingReputationFromMetrics(m: ListingReputationMetrics): ListingReputation {
  const sp = generateSocialProof({ bookings: m.bookings, views: m.views, rating: m.rating });
  const cr = m.views > 0 ? m.bookings / m.views : 0;

  let acc = 0.2;
  const signals: string[] = ["published_baseline"];

  if (m.bookings > 10) {
    acc += 0.25;
    signals.push("sustained_bookings");
  }
  if (cr > 0.05) {
    acc += 0.25;
    signals.push("healthy_conversion");
  }
  if (sp.strength === "high") {
    acc += 0.2;
    signals.push("strong_social_proof");
  }
  if (m.hasPhoto && m.descriptionLength >= 80) {
    acc += 0.15;
    signals.push("full_content");
  } else if (m.hasPhoto || m.descriptionLength >= 40) {
    acc += 0.08;
    signals.push("partial_content");
  }
  if (m.maxRecentPriceChangeRatio == null) {
    acc += 0.15;
    signals.push("pricing_stability_unverified_neutral");
  } else if (m.maxRecentPriceChangeRatio <= 0.3) {
    acc += 0.15;
    signals.push("stable_pricing");
  } else {
    acc += 0.05;
    signals.push("pricing_volatile");
  }

  const score = Math.min(1, acc);
  return {
    listingId: m.listingId,
    score,
    level: reputationLevelFromScore(score),
    signals,
  };
}
