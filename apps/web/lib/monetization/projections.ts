import { PRICING } from "./pricing";

export type RevenueProjectionInput = {
  /** Confirmed paid bookings in month */
  monthlyBookings: number;
  /** Average booking GMV (guest total) in CAD cents */
  averageBookingGmvCents: number;
  /** Qualified leads sold */
  monthlyLeads: number;
  /** Featured slots sold */
  monthlyFeaturedSlots: number;
};

export function projectGrossRevenueCents(input: RevenueProjectionInput): {
  bookingFeesCents: number;
  leadsCents: number;
  featuredCents: number;
  totalCents: number;
} {
  const bookingFeesCents = Math.round(
    input.monthlyBookings * input.averageBookingGmvCents * PRICING.bookingFeePercent,
  );
  const leadsCents = input.monthlyLeads * PRICING.leadPriceCents;
  const featuredCents = input.monthlyFeaturedSlots * PRICING.featuredListingPriceCents;
  return {
    bookingFeesCents,
    leadsCents,
    featuredCents,
    totalCents: bookingFeesCents + leadsCents + featuredCents,
  };
}

/** Example path to ~$10k CAD/month using PRICING defaults. */
export function exampleTenKCadModel(): RevenueProjectionInput & { note: string } {
  return {
    monthlyBookings: 100,
    /** $500 GMV × 10% ≈ $50 platform fee per booking → 100 × $50 = $5k */
    averageBookingGmvCents: 50_000,
    monthlyLeads: 20,
    monthlyFeaturedSlots: 0,
    note: "100 bookings × ~$50 fee (10% of $500 GMV) ≈ $5k; 20 leads × $275 ≈ $5.5k → ~$10.5k CAD — tune to your market.",
  };
}
