export const QUEBEC_PRICING = {
  firstLead: 99,
  standardLead: 225,
  premiumLead: 325,
  discountedLeadMin: 150,
  discountedLeadMax: 199,

  subscriptionBasic: 49,
  subscriptionPro: 79,

  bundle3: 550, // ~183 per lead
};

export type PricingContext = {
  isFirstPurchase: boolean;
  leadQuality: "HIGH" | "MEDIUM" | "LOW";
  demandLevel: "HIGH" | "NORMAL" | "LOW";
  location?: string | null;
  abVariant?: string;
};

export type PricingDisplay = {
  price: number;
  anchorPrice?: number;
  reasoning: string[];
  badge?: string;
  type: "FIRST" | "STANDARD" | "PREMIUM" | "DISCOUNTED";
};

export function getPsychologicalPricing(context: PricingContext): PricingDisplay {
  const { isFirstPurchase, leadQuality, demandLevel, abVariant } = context;

  // Rule 1: First Purchase Hook
  if (isFirstPurchase) {
    let firstPrice = QUEBEC_PRICING.firstLead;
    if (abVariant === "FIRST_LEAD_79") firstPrice = 79;
    
    return {
      price: firstPrice,
      anchorPrice: QUEBEC_PRICING.standardLead,
      reasoning: ["First-time user special", "Platform onboarding discount"],
      badge: "FIRST LEAD SPECIAL",
      type: "FIRST"
    };
  }

  // Rule 2: Quality & Demand Based Pricing
  if (leadQuality === "HIGH" && demandLevel === "HIGH") {
    return {
      price: QUEBEC_PRICING.premiumLead,
      reasoning: ["High buyer intent", "Premium market location", "Verified contact"],
      badge: "HIGH PROBABILITY",
      type: "PREMIUM"
    };
  }

  if (leadQuality === "LOW") {
    return {
      price: QUEBEC_PRICING.discountedLeadMin,
      anchorPrice: QUEBEC_PRICING.standardLead,
      reasoning: ["Lower engagement signals", "Discovery opportunity"],
      badge: "GOOD DEAL",
      type: "DISCOUNTED"
    };
  }

  // Default Standard
  let standardPrice = QUEBEC_PRICING.standardLead;
  if (abVariant === "STANDARD_199") standardPrice = 199;

  return {
    price: standardPrice,
    reasoning: ["Standard market demand", "Verified lead quality"],
    type: "STANDARD"
  };
}

export function getPricingExplanations(display: PricingDisplay, location?: string | null): string {
  const factors = [...display.reasoning];
  if (location) {
    factors.push(`Regional demand in ${location}`);
  }
  return factors.join(" + ");
}
