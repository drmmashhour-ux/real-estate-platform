import type { BuyerSessionSummary, ScoredBuyerIntent } from "./types";

/**
 * Demand-side intent from observed behavior only (no fabricated psychology claims).
 */
export function scoreBuyerIntent(s: BuyerSessionSummary): ScoredBuyerIntent {
  let score = 15;
  const reasons: string[] = [];

  if (s.uniqueListings >= 4) {
    score += 12;
    reasons.push("Multiple distinct listings engaged.");
  }
  if (s.contactClicks >= 2) {
    score += 18;
    reasons.push("Repeated contact clicks.");
  }
  if (s.unlockStarts >= 1) {
    score += 14;
    reasons.push("Unlock checkout started.");
  }
  if (s.unlockSuccesses >= 1) {
    score += 20;
    reasons.push("Unlock completed.");
  }
  if (s.saves >= 2) {
    score += 10;
    reasons.push("Multiple saves.");
  }
  if (s.bookingAttempts >= 1) {
    score += 22;
    reasons.push("Booking attempt recorded.");
  }
  if (s.mapClicks >= 2) {
    score += 6;
    reasons.push("Map interactions suggest location-focused search.");
  }
  if (s.filterEvents >= 2) {
    score += 6;
    reasons.push("Search refinements recorded.");
  }
  if (s.positiveDwell >= 1) {
    score += 5;
    reasons.push("Positive dwell signal.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: ScoredBuyerIntent["tier"] = "browse";
  if (score >= 78) tier = "ready";
  else if (score >= 58) tier = "high_intent";
  else if (score >= 38) tier = "engaged";

  let recommendedNextAction = "Continue organic discovery — light nudges only.";
  if (tier === "ready") {
    recommendedNextAction =
      "Offer concierge help (saved searches, booking assistance) without pressure language.";
  } else if (tier === "high_intent") {
    recommendedNextAction = "Surface similar inventory and transparent pricing/help content.";
  } else if (tier === "engaged") {
    recommendedNextAction = "Recommend refinements and comparable listings.";
  }

  const sessionKey = s.userId ?? s.sessionId;

  return {
    sessionKey,
    userId: s.userId,
    score,
    tier,
    reasons,
    recommendedNextAction,
  };
}
