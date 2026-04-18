import type { PersonalizedOffer, UserSegment } from "./v4-types";

/**
 * Marketing copy suggestions only — does not change pricing, legal terms, or checkout rules.
 * Avoids fabricated scarcity or false urgency.
 */
export function generatePersonalizedOffer(segment: UserSegment | string): PersonalizedOffer {
  switch (segment) {
    case "HIGH_INTENT":
      return {
        segment: "HIGH_INTENT",
        headline: "You are close to booking your next stay or visit",
        cta: "Continue to booking",
      };

    case "ABANDONED_BOOKING":
      return {
        segment: "ABANDONED_BOOKING",
        headline: "Your booking flow can be resumed anytime",
        cta: "Resume booking",
        incentive: "Progress saved on supported flows",
      };

    case "HIGH_VALUE":
      return {
        segment: "HIGH_VALUE",
        headline: "Explore listings matched to your history",
        cta: "View recommendations",
      };

    case "RETURNING_USER":
      return {
        segment: "RETURNING_USER",
        headline: "Welcome back — see what is new",
        cta: "Browse listings",
      };

    default:
      return {
        segment: "NEW_VISITOR",
        headline: "Find verified properties with clear pricing",
        cta: "Start searching",
      };
  }
}
