/**
 * Landing optimization suggestions — use alongside `generateLandingCopy`; does not mutate runtime copy unless product wires it.
 */
import type { LandingCampaignType } from "./landing-copy.service";
import { generateLandingCopy } from "./landing-copy.service";

export type LandingOptimizationPack = {
  type: LandingCampaignType;
  city: string;
  headlineAlt: string;
  primaryCtaAlt: string;
  secondaryCtaAlt: string;
  trustBadges: string[];
  urgencyCopy: string;
  testimonialPlaceholders: string[];
  sectionOrder: string[];
  notes: string[];
};

export function buildLandingOptimizationPack(type: LandingCampaignType, city: string): LandingOptimizationPack {
  const base = generateLandingCopy(type, city);
  const c = city.trim() || "Montréal";

  const byType: Record<LandingCampaignType, Omit<LandingOptimizationPack, "type" | "city">> = {
    bnhub: {
      headlineAlt: `Compare BNHub stays in ${c} — pricing upfront`,
      primaryCtaAlt: "See available nights",
      secondaryCtaAlt: "Talk to support",
      trustBadges: ["Stripe checkout on book path (where enabled)", "Host verification where shown", "Law 25 marketing consent on CRM leads"],
      urgencyCopy: "Inventory changes daily — refresh dates before you decide.",
      testimonialPlaceholders: [
        "[Guest name] — “Booking flow was clear vs other apps.”",
        "[Host name] — “Calendar blocks saved me from double bookings.”",
      ],
      sectionOrder: ["Hero", "Trust & proof", "Why LECIPM", "Live preview", "Lead callback", "Repeat CTA"],
      notes: ["Keep BNHub vs resale distinction obvious to reduce wrong-lead volume."],
    },
    host: {
      headlineAlt: `List your ${c} stay — structured onboarding`,
      primaryCtaAlt: "Open listing wizard",
      secondaryCtaAlt: "Read host requirements",
      trustBadges: ["You approve publish", "BNHub booking rails", "No LECIPM auto-spend"],
      urgencyCopy: "Early hosts get featured in growth experiments when flags allow — subject to moderation.",
      testimonialPlaceholders: ["[Host] — “Support answered my calendar question same day.”"],
      sectionOrder: ["Hero", "Trust", "Benefits", "Inventory proof", "Lead form", "CTA"],
      notes: ["Avoid income promises — Québec regulation varies by borough."],
    },
    buy: {
      headlineAlt: `Homes & rentals in ${c} — one search stack`,
      primaryCtaAlt: "Browse listings",
      secondaryCtaAlt: "Request broker callback",
      trustBadges: ["CRM attribution with UTMs", "Broker tools when workspace enabled"],
      urgencyCopy: "Rates and availability depend on sellers — verify with a licensed pro before offers.",
      testimonialPlaceholders: ["[Buyer] — “Saved search helped me shortlist faster.”"],
      sectionOrder: ["Hero", "Trust", "Benefits", "Live preview", "Lead", "CTA"],
      notes: ["FSBO and brokerage paths may coexist — label clearly."],
    },
  };

  const pack = byType[type];
  return {
    type,
    city: c,
    ...pack,
    notes: [...pack.notes, `Baseline copy from generator — headline: "${base.headline}"`],
  };
}

export function listLandingOptimizationPacks(city: string): LandingOptimizationPack[] {
  return [buildLandingOptimizationPack("bnhub", city), buildLandingOptimizationPack("host", city), buildLandingOptimizationPack("buy", city)];
}
