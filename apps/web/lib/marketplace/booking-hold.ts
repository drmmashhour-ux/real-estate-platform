import { marketplacePrisma } from "@/lib/db";

/** Stripe Checkout `metadata.paymentType` for `POST /api/checkout` (listing demo / marketplace holds). */
export const MARKETPLACE_LISTING_CHECKOUT = "marketplace_listing_checkout" as const;

const HOLD_MS = 15 * 60 * 1000;

export function computeHoldExpiry(): Date {
  return new Date(Date.now() + HOLD_MS);
}

/**
 * Ranges that still block the calendar and conflict checks: `confirmed` stays, or unexpired `pending` holds
 * (`expiresAt` in the future). Order 62 — use this for guest calendar / availability list APIs so temporary
 * holds block selection; expired lapsed holds are excluded.
 */
export function activeMarketplaceInventoryFilter() {
  return {
    AND: [
      { NOT: { status: "cancelled" } },
      {
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
      },
    ],
  };
}

/**
 * Any existing row for this listing that overlaps the requested range and still holds inventory.
 */
export function whereRangeBlocksListing(listingId: string, startDate: Date, endDate: Date) {
  return {
    listingId,
    AND: [
      activeMarketplaceInventoryFilter(),
      { startDate: { lte: endDate } },
      { endDate: { gte: startDate } },
    ],
  };
}

/**
 * List-query overlap: rows whose stay intersects the inclusive window [from, to] (Order 64).
 * Pair with `activeMarketplaceInventoryFilter` for public calendar/availability fetches.
 */
export function whereBookingListOverlapsWindow(from: Date, to: Date) {
  return {
    startDate: { lte: to },
    endDate: { gte: from },
  };
}

/**
 * Mark unpaid holds as expired (Order 57) — run from cron; releases inventory.
 */
export async function expirePendingMarketplaceBookings() {
  return marketplacePrisma.booking.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
}

/**
 * Resolves `bookingId` or `booking_id` from Stripe Checkout `metadata` (Order 66).
 */
export function marketplaceListingBookingIdFromStripeMetadata(
  metadata: Record<string, string> | null | undefined
): string | null {
  if (!metadata) return null;
  const camel = typeof metadata.bookingId === "string" ? metadata.bookingId.trim() : "";
  const snake = typeof metadata.booking_id === "string" ? metadata.booking_id.trim() : "";
  return camel || snake || null;
}

/**
 * `checkout.session.expired` — no successful charge; clear `pending` hold so inventory is released.
 */
export async function expirePendingMarketplaceListingBookingOnCheckoutExpired(bookingId: string) {
  const r = await marketplacePrisma.booking.updateMany({
    where: { id: bookingId, status: "pending" },
    data: { status: "expired", expiresAt: null },
  });
  return { count: r.count } as const;
}

/**
 * After Stripe `checkout.session.completed` (or `async_payment_succeeded` when `payment_status === "paid"`).
 * **Source of truth for confirmation** — only call from webhook once payment succeeded; idempotent.
 * `paymentIntentId` is persisted as `stripePaymentIntentId` for refund-on-cancel.
 */
export async function confirmMarketplaceListingBookingPaid(
  bookingId: string,
  opts?: { paymentIntentId?: string | null }
) {
  const b = await marketplacePrisma.booking.findUnique({ where: { id: bookingId } });
  if (!b) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (b.status === "confirmed") {
    return { ok: true as const, idempotent: true as const };
  }
  if (b.status !== "pending") {
    return { ok: false as const, reason: "not_pending" as const };
  }
  const paymentIntentId = opts?.paymentIntentId?.trim() || undefined;
  await marketplacePrisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "confirmed",
      expiresAt: null,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
  return { ok: true as const, idempotent: false as const };
}
