import { getPricingPlans } from "./pricing-model.service";

export function getPricingModelExplanation(): {
  strategy: string[];
  why: string[];
  plans: ReturnType<typeof getPricingPlans>;
  disclaimer: string;
} {
  return {
    strategy: [
      "LECIPM competes on host net income: transparent fees plus tools that can lift gross revenue.",
      "Free and Pro tiers balance acquisition with sustainable platform revenue.",
      "Growth combines subscription with a reduced take for high-activity hosts.",
      "Featured boosts are optional paid visibility — not a substitute for listing quality.",
    ],
    why: [
      "Lower effective fee burden vs high-commission OTAs when combined with optimization (modeled separately).",
      "Monetize premium tools and visibility instead of only taxing every booking — configurable.",
    ],
    plans: getPricingPlans(),
    disclaimer:
      "Figures are product configuration and models — not guarantees. Actual fees and taxes depend on checkout, region, and Stripe/connect rules.",
  };
}
