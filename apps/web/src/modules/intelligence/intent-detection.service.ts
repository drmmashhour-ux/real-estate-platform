import type { UserIntentProfile } from "./user-profile.service";

/** Rule-based intent label from profile — transparent rules only. */
export function detectIntentLabel(profile: UserIntentProfile): string {
  if (profile.intent === "rent") return "rent_seeker";
  if (profile.urgency === "high") return "high_intent_buyer";
  if (profile.cities.length >= 2) return "multi_market_explorer";
  return "buyer_explorer";
}
