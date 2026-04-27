import { flags } from "@/lib/flags";

import type { UserProfile } from "@/lib/ai/userProfile";

export type PricingBias = "premium" | "discount" | "neutral";
export type TrustMessageVariant = "urgency" | "social_proof" | "security";

export type PersonalizedContent = {
  recommendedCities: string[];
  recommendedListings: string[];
  pricingBias: PricingBias;
  trustMessageVariant: TrustMessageVariant;
};

const DEFAULT: PersonalizedContent = {
  recommendedCities: [],
  recommendedListings: [],
  pricingBias: "neutral",
  trustMessageVariant: "security",
};

function mapBehaviorToContent(profile: UserProfile): PersonalizedContent {
  const { behaviorType, preferredCities, viewedListings } = profile;
  if (behaviorType === "high_intent") {
    return {
      recommendedCities: [...preferredCities].slice(0, 5),
      recommendedListings: [...viewedListings].slice(0, 8),
      pricingBias: "premium",
      trustMessageVariant: "urgency",
    };
  }
  if (behaviorType === "browser") {
    return {
      recommendedCities: [...preferredCities].slice(0, 5),
      recommendedListings: [...viewedListings].slice(0, 8),
      pricingBias: "discount",
      trustMessageVariant: "social_proof",
    };
  }
  return {
    recommendedCities: [...preferredCities].slice(0, 5),
    recommendedListings: [...viewedListings].slice(0, 8),
    pricingBias: "neutral",
    trustMessageVariant: "security",
  };
}

/**
 * Non-persisted view model for the marketing surface + trust blocks. Safe to call with default profile when the flag is off.
 */
export function getPersonalizedContent(userProfile: UserProfile): PersonalizedContent {
  if (!flags.RECOMMENDATIONS) {
    return { ...DEFAULT };
  }
  return mapBehaviorToContent(userProfile);
}
