import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { resolveExpectedGuestSupabasePaidCents } from "@/lib/monetization/guest-supabase-checkout-total";

function session(md: Record<string, string>, amountTotal: number): Stripe.Checkout.Session {
  return {
    metadata: md,
    amount_total: amountTotal,
    currency: "cad",
  } as Stripe.Checkout.Session;
}

describe("resolveExpectedGuestSupabasePaidCents", () => {
  it("legacy: expects booking row total in cents", () => {
    const res = resolveExpectedGuestSupabasePaidCents({
      session: session({ currency: "cad" }, 10000),
      bookingTotalPrice: 100,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.expectedCents).toBe(10000);
      expect(res.pricingVersion).toBe("legacy");
    }
  });

  it("v2: validates accommodation matches row and total metadata", () => {
    const res = resolveExpectedGuestSupabasePaidCents({
      session: session(
        {
          checkoutPricingVersion: "v2",
          checkoutTotalCents: "11500",
          accommodationCents: "10000",
          currency: "cad",
        },
        11500
      ),
      bookingTotalPrice: 100,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.expectedCents).toBe(11500);
      expect(res.pricingVersion).toBe("v2");
    }
  });

  it("v2: rejects accommodation mismatch", () => {
    const res = resolveExpectedGuestSupabasePaidCents({
      session: session(
        {
          checkoutPricingVersion: "v2",
          checkoutTotalCents: "11500",
          accommodationCents: "9999",
          currency: "cad",
        },
        11500
      ),
      bookingTotalPrice: 100,
    });
    expect(res.ok).toBe(false);
  });
});
