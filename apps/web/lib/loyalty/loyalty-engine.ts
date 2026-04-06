/**
 * BNHub guest loyalty — deterministic tiers, no points, no discount stacking with promos (max wins).
 */

export type LoyaltyTierCode = "NONE" | "BRONZE" | "SILVER" | "GOLD";

export type LoyaltyTierResult = {
  tier: LoyaltyTierCode;
  /** 0–10 — applied to lodging nightly subtotal only */
  discountPercent: number;
  label: string;
  explanation: string;
};

/** Tier is based on completed paid stays **before** the booking being priced. */
export function loyaltyTierFromCompletedBookings(completedBookings: number): LoyaltyTierResult {
  const n = Math.max(0, Math.floor(completedBookings));
  if (n <= 0) {
    return {
      tier: "NONE",
      discountPercent: 0,
      label: "Member",
      explanation: "Complete a stay to unlock member savings on future bookings.",
    };
  }
  if (n === 1) {
    return {
      tier: "BRONZE",
      discountPercent: 3,
      label: "Bronze",
      explanation: "You have completed 1 stay — 3% off eligible lodging on your next trip (best offer vs other promos).",
    };
  }
  if (n >= 2 && n <= 3) {
    return {
      tier: "SILVER",
      discountPercent: 5,
      label: "Silver",
      explanation: "You have completed 2–3 stays — 5% off eligible lodging (we apply the best single discount at checkout).",
    };
  }
  return {
    tier: "GOLD",
    discountPercent: 8,
    label: "Gold",
    explanation: "You have completed 4+ stays — 8% off eligible lodging (single discount; never stacked with other promos).",
  };
}

export function loyaltyDiscountCentsFromPercent(subtotalCents: number, discountPercent: number): number {
  if (subtotalCents <= 0 || discountPercent <= 0) return 0;
  const raw = Math.round((subtotalCents * discountPercent) / 100);
  return Math.min(Math.max(0, raw), Math.max(0, subtotalCents - 1));
}

export type LodgingDiscountSource = "NONE" | "EARLY_BOOKING" | "LOYALTY";

export function pickBestLodgingDiscount(input: {
  subtotalCents: number;
  earlyDiscountCents: number;
  loyaltyDiscountCents: number;
}): {
  appliedCents: number;
  source: LodgingDiscountSource;
} {
  const e = Math.max(0, input.earlyDiscountCents);
  const l = Math.max(0, input.loyaltyDiscountCents);
  if (e <= 0 && l <= 0) return { appliedCents: 0, source: "NONE" };
  if (l > e) return { appliedCents: Math.min(l, input.subtotalCents), source: "LOYALTY" };
  if (e > l) return { appliedCents: Math.min(e, input.subtotalCents), source: "EARLY_BOOKING" };
  if (l > 0) return { appliedCents: Math.min(l, input.subtotalCents), source: "LOYALTY" };
  if (e > 0) return { appliedCents: Math.min(e, input.subtotalCents), source: "EARLY_BOOKING" };
  return { appliedCents: 0, source: "NONE" };
}
