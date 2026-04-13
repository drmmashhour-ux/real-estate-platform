import { prisma } from "@/lib/db";

export type InsurancePresentationHint = {
  /** 0–100; higher = better time to show insurance upsell */
  score: string;
  listingViews7d: number;
  rationale: string;
};

/**
 * Uses BNHUB client view events to suggest when to surface insurance (checkout vs listing).
 */
export async function getInsurancePresentationHintForUser(userId: string): Promise<InsurancePresentationHint> {
  const uid = userId.trim();
  if (!uid) {
    return { score: "low", listingViews7d: 0, rationale: "no_user" };
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const listingViews7d = await prisma.bnhubClientListingViewEvent.count({
    where: { userId: uid, createdAt: { gte: since } },
  });

  if (listingViews7d >= 5) {
    return {
      score: "high",
      listingViews7d,
      rationale: "high_engagement_show_at_checkout_with_bundle",
    };
  }
  if (listingViews7d >= 2) {
    return {
      score: "medium",
      listingViews7d,
      rationale: "show_after_listing_detail_and_checkout",
    };
  }
  return {
    score: "low",
    listingViews7d,
    rationale: "show_soft_prompt_on_listing_first",
  };
}

/**
 * Adjust display price tier for insurance leads (informational — does not change regulated premiums).
 */
export function insuranceLeadQualityTierFromViews(listingViews7d: number): "standard" | "plus" | "priority" {
  if (listingViews7d >= 8) return "priority";
  if (listingViews7d >= 3) return "plus";
  return "standard";
}
