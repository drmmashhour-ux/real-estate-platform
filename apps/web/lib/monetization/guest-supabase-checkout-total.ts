import type Stripe from "stripe";
import { amountCentsFromTotalPrice } from "@/lib/stripe/guestSupabaseBooking";

/**
 * Validates Stripe Checkout `amount_total` against booking row + optional v2 itemized metadata.
 */
export function resolveExpectedGuestSupabasePaidCents(params: {
  session: Stripe.Checkout.Session;
  bookingTotalPrice: number | string;
}): { ok: true; expectedCents: number; pricingVersion: "legacy" | "v2" } | { ok: false; reason: string } {
  const md = params.session.metadata ?? {};
  const v = typeof md.checkoutPricingVersion === "string" ? md.checkoutPricingVersion.trim() : "";

  if (v === "v2") {
    const total = Number(md.checkoutTotalCents);
    const accommodation = Number(md.accommodationCents);
    if (!Number.isFinite(total) || total < 1) {
      return { ok: false, reason: "invalid_checkout_total_metadata" };
    }
    const rowCents = amountCentsFromTotalPrice(params.bookingTotalPrice);
    if (rowCents === null || rowCents < 1) {
      return { ok: false, reason: "invalid_booking_total" };
    }
    if (!Number.isFinite(accommodation) || accommodation !== rowCents) {
      return { ok: false, reason: "accommodation_mismatch" };
    }
    return { ok: true, expectedCents: Math.round(total), pricingVersion: "v2" };
  }

  const rowCents = amountCentsFromTotalPrice(params.bookingTotalPrice);
  if (rowCents === null || rowCents < 1) {
    return { ok: false, reason: "invalid_booking_total" };
  }
  return { ok: true, expectedCents: rowCents, pricingVersion: "legacy" };
}
