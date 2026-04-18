import { engineFlags, intelligenceFlags } from "@/config/feature-flags";
import { PRICING } from "@/lib/monetization/pricing";
import { getFeaturedBoostPackages } from "@/modules/business/pricing-model.service";

export type UpsellOffer = {
  id: string;
  title: string;
  priceCents: number | null;
  requiresFlag?: string;
  notes: string;
};

export function listUpsellOffers(): UpsellOffer[] {
  const boosts = getFeaturedBoostPackages().map((b) => ({
    id: b.key,
    title: `Listing boost · ${b.label}`,
    priceCents: b.priceCents,
    notes: "Paid window for additional visibility — subject to moderation.",
  }));

  return [
    ...boosts,
    {
      id: "featured_monthly",
      title: "Featured listing (monthly slot)",
      priceCents: PRICING.featuredListingPriceCents,
      notes: "CAD; Stripe-billed when checkout enabled.",
    },
    {
      id: "promoted_placement",
      title: "Promoted placement",
      priceCents: PRICING.promotedListingPriceCents,
      notes: "One-time or campaign — see admin pricing.",
    },
    {
      id: "seo_premium",
      title: "AI pricing / SEO candidates",
      priceCents: null,
      requiresFlag: "seoCandidateGenerationV1",
      notes: "Draft generation may be gated; publishing requires review.",
    },
    {
      id: "analytics_pro",
      title: "Analytics premium",
      priceCents: null,
      requiresFlag: "analyticsDashboardV1",
      notes: "Bundled with subscription in some tiers.",
    },
  ].filter((o) => {
    if (o.id === "seo_premium" && !engineFlags.seoCandidateGenerationV1) return false;
    if (o.id === "analytics_pro" && !intelligenceFlags.analyticsDashboardV1) return false;
    return true;
  });
}
