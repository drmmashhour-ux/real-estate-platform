import { getListingsDB } from "@/lib/db/routeSwitch";
import { logInfo, logWarn } from "@/lib/logger";
import { trackEvent } from "@/src/services/analytics";

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

const listingsClient = () => getListingsDB();

/**
 * Mark unpaid holds as expired (Order 57) — run from cron; releases inventory.
 * Only `pending` with `expiresAt` strictly before `now` (Order 57.1).
 */
export async function expirePendingMarketplaceBookings() {
  const now = new Date();
  const r = await listingsClient().booking.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });
  logInfo("[marketplace] expirePendingMarketplaceBookings", { count: r.count, at: now.toISOString() });
  void trackEvent("marketplace_holds_expired", { count: r.count, at: now.toISOString() }).catch(() => {});
  return r;
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
  const r = await listingsClient().booking.updateMany({
    where: { id: bookingId, status: "pending" },
    data: { status: "expired", expiresAt: null },
  });
  return { count: r.count } as const;
}

function paymentIntentIdFromSession(session: {
  payment_intent?: string | { id?: string } | null;
}): string | null {
  const piRaw = session.payment_intent;
  if (typeof piRaw === "string" && piRaw.trim()) return piRaw.trim();
  if (piRaw && typeof piRaw === "object" && "id" in piRaw && typeof (piRaw as { id: string }).id === "string") {
    return (piRaw as { id: string }).id;
  }
  return null;
}

export type ConfirmFromCheckoutResult =
  | { ok: true; idempotent: true; bookingId: string }
  | { ok: true; idempotent: false; bookingId: string }
  | { ok: false; reason: string; bookingId?: string };

/**
 * **Single entry** from Stripe `checkout.session.completed` when `paymentType === marketplace_listing_checkout`.
 * - Idempotent if already **confirmed** (duplicate webhooks).
 * - **Atomic** `updateMany` only for `pending` or `expired` (late payment); allows payment after hold expiry.
 * - Validates `listingId` / `userId` in metadata against the `Booking` row.
 * - Optionally validates `expected_amount_cents` vs `amount_total` (set at checkout; never trust metadata alone for listing match).
 * - Re-checks calendar overlap (final net); logs `booking_conflict_on_payment` if another stay blocks.
 *
 * @see confirmMarketplaceListingBookingPaid — legacy one-liner; prefer this from the webhook.
 */
export async function confirmMarketplaceListingBookingFromCheckoutSession(
  session: {
    id: string;
    payment_status: string | null;
    amount_total: number | null;
    metadata: Record<string, string> | null | undefined;
    payment_intent?: string | { id?: string } | null;
  }
): Promise<ConfirmFromCheckoutResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  const md = (session.metadata ?? {}) as Record<string, string | undefined>;
  const bid = marketplaceListingBookingIdFromStripeMetadata(md);
  if (!bid) {
    return { ok: false, reason: "missing_booking_id" };
  }

  const amountTotal = session.amount_total ?? 0;
  const expectedRaw =
    (typeof md.expected_amount_cents === "string" && md.expected_amount_cents.trim()) ||
    (typeof md.expectedAmountCents === "string" && md.expectedAmountCents.trim()) ||
    "";
  if (expectedRaw) {
    const expected = Number.parseInt(expectedRaw, 10);
    if (Number.isFinite(expected) && expected !== amountTotal) {
      logWarn("[marketplace] checkout amount mismatch — skip confirm", {
        bookingId: bid,
        sessionId: session.id,
        amount_total: amountTotal,
        expected_amount_cents: expected,
      });
      return { ok: false, reason: "amount_mismatch", bookingId: bid };
    }
  }

  const metaListing =
    (typeof md.listingId === "string" && md.listingId.trim()) ||
    (typeof md.listing_id === "string" && md.listing_id.trim()) ||
    "";
  const metaUser = (typeof md.userId === "string" && md.userId.trim()) || "";

  const db = listingsClient();
  const b = await db.booking.findUnique({ where: { id: bid } });
  if (!b) {
    logWarn("[marketplace] booking not found for payment confirmation", { bookingId: bid, sessionId: session.id });
    return { ok: false, reason: "not_found", bookingId: bid };
  }
  if (metaListing && metaListing !== b.listingId) {
    logWarn("[marketplace] listingId metadata mismatch — skip confirm", {
      bookingId: bid,
      sessionId: session.id,
      metaListing,
      bookingListingId: b.listingId,
    });
    return { ok: false, reason: "listing_mismatch", bookingId: bid };
  }
  if (metaUser && metaUser !== b.userId) {
    logWarn("[marketplace] userId metadata mismatch — skip confirm", {
      bookingId: bid,
      sessionId: session.id,
    });
    return { ok: false, reason: "user_mismatch", bookingId: bid };
  }

  if (b.status === "confirmed") {
    return { ok: true, idempotent: true, bookingId: bid };
  }
  if (b.status !== "pending" && b.status !== "expired") {
    return { ok: false, reason: "not_eligible", bookingId: bid };
  }

  const other = await db.booking.findFirst({
    where: {
      id: { not: bid },
      ...whereRangeBlocksListing(b.listingId, b.startDate, b.endDate),
    },
    select: { id: true, status: true },
  });
  if (other) {
    logWarn("[marketplace] booking_conflict_on_payment — overlapping active stay, not confirming", {
      bookingId: bid,
      blockingBookingId: other.id,
      blockingStatus: other.status,
      sessionId: session.id,
    });
    void trackEvent("booking_conflict_on_payment", {
      bookingId: bid,
      blockingBookingId: other.id,
      sessionId: session.id,
    }).catch(() => {});
    return { ok: false, reason: "overlap", bookingId: bid };
  }

  const now = new Date();
  const holdExpiredAt =
    b.expiresAt != null && b.expiresAt.getTime() < now.getTime();
  if (b.status === "expired" || holdExpiredAt) {
    void trackEvent("booking_paid_after_expiry", { bookingId: bid, listingId: b.listingId, sessionId: session.id }).catch(
      () => {}
    );
  }

  const paymentIntentId = paymentIntentIdFromSession(session) ?? undefined;
  const updated = await db.booking.updateMany({
    where: { id: bid, status: { in: ["pending", "expired"] } },
    data: {
      status: "confirmed",
      expiresAt: null,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });

  if (updated.count === 0) {
    const again = await db.booking.findUnique({ where: { id: bid }, select: { status: true } });
    if (again?.status === "confirmed") {
      return { ok: true, idempotent: true, bookingId: bid };
    }
    logWarn("[marketplace] confirm update race — not confirmed", { bookingId: bid, sessionId: session.id });
    return { ok: false, reason: "update_race", bookingId: bid };
  }

  void trackEvent("marketplace_booking_confirmed_paid", {
    bookingId: bid,
    sessionId: session.id,
    paidAfterHoldExpiry: b.status === "expired" || holdExpiredAt,
  }).catch(() => {});

  return { ok: true, idempotent: false, bookingId: bid };
}

/**
 * After Stripe payment success; prefer {@link confirmMarketplaceListingBookingFromCheckoutSession} from webhooks.
 * Atomic `updateMany` for **pending** only (legacy: pending-only path).
 * @deprecated for webhook use — use session-based confirm above.
 */
export async function confirmMarketplaceListingBookingPaid(
  bookingId: string,
  opts?: { paymentIntentId?: string | null }
) {
  const b = await listingsClient().booking.findUnique({ where: { id: bookingId } });
  if (!b) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (b.status === "confirmed") {
    return { ok: true as const, idempotent: true as const };
  }
  if (b.status !== "pending" && b.status !== "expired") {
    return { ok: false as const, reason: "not_pending" as const };
  }
  const paymentIntentId = opts?.paymentIntentId?.trim() || undefined;
  const u = await listingsClient().booking.updateMany({
    where: { id: bookingId, status: { in: ["pending", "expired"] } },
    data: {
      status: "confirmed",
      expiresAt: null,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
  if (u.count === 0) {
    const a = await listingsClient().booking.findUnique({ where: { id: bookingId }, select: { status: true } });
    if (a?.status === "confirmed") {
      return { ok: true as const, idempotent: true as const };
    }
    return { ok: false as const, reason: "not_pending" as const };
  }
  return { ok: true as const, idempotent: false as const };
}
