/**
 * Social proof: ranking, conversion, pricing, and listing copy (Order 47).
 * Counts and ratings must be real; never fabricate timeframes or availability.
 */
export type SocialProofListingInput = {
  bookings?: number;
  views?: number;
  rating?: number;
};

export type SocialProofStrength = "low" | "medium" | "high";

export type SocialProofResult = {
  messages: string[];
  /** 0…1, clamped. */
  score: number;
  strength: SocialProofStrength;
};

function n(v: unknown): number {
  if (v == null) return 0;
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

const BOOKING_SCORE = 0.4;
const VIEW_SCORE = 0.3;
const RATING_SCORE = 0.3;
const BOOKING_MSG_THRESHOLD = 10;
const VIEWS_MSG_THRESHOLD = 100;
const RATING_MSG_THRESHOLD = 4.8;

function strengthFromScore(score: number): SocialProofStrength {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

/**
 * Produces user-facing copy and a normalized score for ML-style ranking and downstream engines.
 * When metrics are missing, returns empty copy and score 0 (Order 47 §9).
 */
export function generateSocialProof(listing: SocialProofListingInput): SocialProofResult {
  const bookings = n(listing.bookings);
  const views = n(listing.views);
  const rating = n(listing.rating);

  let score = 0;
  if (bookings > 10) score += BOOKING_SCORE;
  if (views > 100) score += VIEW_SCORE;
  if (rating >= RATING_MSG_THRESHOLD) score += RATING_SCORE;
  score = Math.min(1, score);

  const strength = strengthFromScore(score);
  const messages: string[] = [];

  if (strength === "high") {
    messages.push("Popular listing");
  }
  if (bookings > BOOKING_MSG_THRESHOLD) {
    messages.push(`Booked ${bookings} times`);
  }
  if (views > VIEWS_MSG_THRESHOLD) {
    messages.push("High interest listing");
  }
  if (rating >= RATING_MSG_THRESHOLD) {
    messages.push("Top-rated property");
  }

  return { messages, score, strength };
}
