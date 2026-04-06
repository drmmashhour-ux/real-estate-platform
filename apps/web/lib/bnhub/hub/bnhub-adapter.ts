/**
 * BNHub adapter — maps generic hub engines to short-term stay primitives.
 */

import { computeBookingPricing, type PricingBreakdown } from "@/lib/bnhub/booking-pricing";
import { isListingAvailable } from "@/lib/bnhub/listings";
import type { HubBookingEngine } from "@/lib/hub/core/hub-booking-types";
import type { HubPricingContext, HubPricingEngine, HubPricingResult } from "@/lib/hub/core/hub-pricing-types";

let bookingSingleton: HubBookingEngine | null = null;
let pricingSingleton: HubPricingEngine | null = null;

export function getBnhubBookingEngine(): HubBookingEngine {
  if (bookingSingleton) return bookingSingleton;
  bookingSingleton = {
    async computeQuote(req) {
      const checkIn = typeof req.window.checkIn === "string" ? req.window.checkIn : "";
      const checkOut = typeof req.window.checkOut === "string" ? req.window.checkOut : "";
      if (!checkIn || !checkOut) {
        return { ok: false, error: "checkIn and checkOut are required" };
      }
      const guestUserId =
        typeof req.metadata?.guestUserId === "string" ? req.metadata.guestUserId : undefined;
      const priced = await computeBookingPricing({
        listingId: req.entityId,
        checkIn,
        checkOut,
        guestUserId,
      });
      if (!priced) return { ok: false, error: "Pricing unavailable" };
      return {
        ok: true,
        totalCents: priced.breakdown.totalCents,
        currency: priced.listing.currency,
        breakdown: { ...priced.breakdown, listingTitle: priced.listing.title } as Record<string, unknown>,
      };
    },
    async validateAvailability(req) {
      const checkIn = typeof req.window.checkIn === "string" ? req.window.checkIn : "";
      const checkOut = typeof req.window.checkOut === "string" ? req.window.checkOut : "";
      if (!checkIn || !checkOut) return { ok: false, error: "Invalid window" };
      const available = await isListingAvailable(req.entityId, new Date(checkIn), new Date(checkOut));
      return { ok: true, available, reason: available ? undefined : "Unavailable for selected dates" };
    },
    async createReservation() {
      return { ok: false, error: "Create stays via /api/bnhub/bookings or booking service" };
    },
    async transitionReservationStatus() {
      return { ok: false, error: "Use BNHub payment and booking modules" };
    },
  };
  return bookingSingleton;
}

function buildPricingResult(b: PricingBreakdown, _currency: string): HubPricingResult {
  return {
    lines: [
      { code: "lodging", labelKey: "price.lodging", amountCents: b.lodgingSubtotalAfterDiscountCents, kind: "lodging" },
      { code: "tax", labelKey: "price.tax", amountCents: b.taxCents, kind: "tax" },
      { code: "service", labelKey: "price.service_fee", amountCents: b.serviceFeeCents, kind: "fee" },
    ],
    totalCents: b.totalCents,
    pricingSchemaVersion: 1,
  };
}

export function getBnhubPricingEngine(): HubPricingEngine {
  if (pricingSingleton) return pricingSingleton;
  pricingSingleton = {
    async price(ctx: HubPricingContext) {
      const checkIn = ctx.window.checkIn;
      const checkOut = ctx.window.checkOut;
      if (!checkIn || !checkOut) return null;
      const priced = await computeBookingPricing({
        listingId: ctx.entityId,
        checkIn,
        checkOut,
      });
      if (!priced) return null;
      return buildPricingResult(priced.breakdown, ctx.currency);
    },
  };
  return pricingSingleton;
}
