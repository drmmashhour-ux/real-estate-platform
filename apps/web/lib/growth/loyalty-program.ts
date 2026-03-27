/**
 * Retention + loyalty — tiers and reward copy (ops + product hooks).
 * Wire to billing/credits when ready; today: single source for messaging.
 */

export type LoyaltyTierId = "standard" | "plus" | "elite";

export type LoyaltyTier = {
  id: LoyaltyTierId;
  label: string;
  minCompletedBookings12mo: number;
  perks: string[];
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "standard",
    label: "Standard",
    minCompletedBookings12mo: 0,
    perks: ["Member rates on select stays", "Early access to new cities"],
  },
  {
    id: "plus",
    label: "Plus",
    minCompletedBookings12mo: 2,
    perks: ["5% off eligible stays (campaign windows)", "Priority support"],
  },
  {
    id: "elite",
    label: "Elite",
    minCompletedBookings12mo: 5,
    perks: ["10% off eligible stays (campaign windows)", "Free cancellation windows on select listings"],
  },
];

export function tierFromCompletedBookings(count: number): LoyaltyTier {
  const ordered = [...LOYALTY_TIERS].sort(
    (a, b) => b.minCompletedBookings12mo - a.minCompletedBookings12mo
  );
  for (const t of ordered) {
    if (count >= t.minCompletedBookings12mo) return t;
  }
  return LOYALTY_TIERS[0];
}

export const REPEAT_BOOKING_DISCOUNT_COPY =
  "Book again within 60 days — check your inbox for member pricing on your next stay.";
