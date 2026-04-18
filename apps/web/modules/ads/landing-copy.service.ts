/**
 * High-conversion landing copy — deterministic text for Meta/Google + LECIPM landings (no LLM).
 */
export type LandingCampaignType = "bnhub" | "host" | "buy";

export type LandingCopyBundle = {
  headline: string;
  subheadline: string;
  benefits: string[];
  primaryCta: string;
  secondaryCta: string;
};

export function generateLandingCopy(type: LandingCampaignType, city: string): LandingCopyBundle {
  const c = city.trim() || "Montréal";

  if (type === "bnhub") {
    return {
      headline: `Find your stay in ${c} — verified BNHub listings`,
      subheadline: "Search short-term stays with clear pricing and booking flows. No pay-to-win placement for hosts in this funnel.",
      benefits: [
        "Real listings from hosts on the platform",
        "Transparent nightly pricing before you book",
        "Local discovery — neighbourhoods you actually want",
        "Secure checkout when you continue to book",
        "Support paths if something doesn’t match the listing",
      ],
      primaryCta: "Browse stays",
      secondaryCta: "Talk to us",
    };
  }

  if (type === "host") {
    return {
      headline: `Host on BNHub in ${c}`,
      subheadline: "Reach guests with structured listings, calendar control, and growth tools — you approve what goes live.",
      benefits: [
        "Listing wizard tuned for short-term rentals",
        "BNHub booking rails you control",
        "Performance and reputation signals in one place",
        "Marketing Studio + distribution when you enable flags",
        "No automated ad spend from LECIPM — you run Meta/Google manually",
      ],
      primaryCta: "Start hosting",
      secondaryCta: "See requirements",
    };
  }

  return {
    headline: `Buy & rent smarter in ${c}`,
    subheadline: "Explore FSBO and marketplace listings with CRM-ready lead capture — real data, no fake urgency.",
    benefits: [
      "Unified search across BNHub and resale paths where enabled",
      "Save listings and route to a broker when you choose",
      "Lead forms tied to your growth dashboard (when logged in)",
      "Attribution via UTM so ROI stays honest",
      "Law 25–aligned consent on marketing touches",
    ],
    primaryCta: "Browse listings",
    secondaryCta: "Get a callback",
  };
}
