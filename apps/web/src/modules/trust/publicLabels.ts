import type { PublicTrustPresentation, TrustEvaluation } from "./trust.types";

export type PublicLabelContext = {
  emailVerified: boolean;
  identityVerified: boolean;
  listingAgeDays: number;
  moderationPending: boolean;
  adminReviewQueue: boolean;
};

/**
 * Maps internal trust + workflow state to **safe** consumer copy — never "fraud" or "suspicious".
 */
export function getPublicTrustPresentation(
  trust: TrustEvaluation,
  ctx: PublicLabelContext,
): PublicTrustPresentation {
  if (ctx.adminReviewQueue || ctx.moderationPending) {
    return {
      badge: "under_review",
      subtitle: "This listing is being reviewed by our team.",
    };
  }
  if (ctx.identityVerified && ctx.emailVerified) {
    return {
      badge: "verified",
      subtitle: "Seller identity checks completed for this listing.",
    };
  }
  if (trust.score >= 78) {
    return { badge: "high_trust", subtitle: "Strong completeness and trust signals on file." };
  }
  if (ctx.listingAgeDays < 14) {
    return { badge: "new_listing", subtitle: "Recently published — we’re still collecting performance signals." };
  }
  return { badge: "standard", subtitle: "Standard marketplace listing." };
}
