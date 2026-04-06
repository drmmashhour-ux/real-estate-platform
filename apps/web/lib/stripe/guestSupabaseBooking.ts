import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { resolveExpectedGuestSupabasePaidCents } from "@/lib/monetization/guest-supabase-checkout-total";
import { recordBnhubGuestBookingRevenueFromPaidSession } from "@/lib/monetization/bnhub-guest-booking-revenue";
import { sendBookingConfirmationEmail } from "@/lib/notifications/booking-emails";
import {
  isGuestBookingCanceled,
  isGuestBookingPaidOrCompleted,
  canGuestBookingStartCheckout,
} from "@/lib/bookings/guest-booking-status";

export const GUEST_SUPABASE_BOOKING_PAYMENT_TYPE = "guest_supabase_booking" as const;

type GuestBookingRow = {
  id: string;
  listing_id: string;
  total_price: number | string;
  status?: string | null;
  dates?: unknown;
};

export function getSupabaseServiceForGuestBookings(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * BNHub Supabase booking checkout: `bookingId` + optional app deep-link URLs.
 * Optional `successUrl` / `cancelUrl` are validated server-side (no open redirects).
 */
export function isGuestSupabaseOnlyCheckoutBody(body: Record<string, unknown>): boolean {
  const bid = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (!bid) return false;
  if (typeof body.paymentType === "string" && body.paymentType.trim() !== "") return false;
  if (body.amountCents != null && String(body.amountCents).trim() !== "") return false;
  return true;
}

export async function fetchGuestSupabaseBookingForCheckout(bookingId: string): Promise<
  | { ok: true; row: GuestBookingRow; listingTitle: string }
  | { ok: false; error: string; status: number }
> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, error: "Supabase service is not configured on the server.", status: 503 };
  }

  const { data: booking, error: bErr } = await sb
    .from("bookings")
    .select("id, listing_id, total_price, status, dates")
    .eq("id", bookingId)
    .maybeSingle();

  if (bErr) {
    return { ok: false, error: bErr.message, status: 502 };
  }
  if (!booking) {
    return { ok: false, error: "Booking not found.", status: 404 };
  }

  const row = booking as GuestBookingRow;
  const st = row.status ?? "pending";
  if (isGuestBookingPaidOrCompleted(st)) {
    return { ok: false, error: "This booking is already paid or completed.", status: 409 };
  }
  if (isGuestBookingCanceled(st)) {
    return { ok: false, error: "This booking was canceled.", status: 409 };
  }
  if (!canGuestBookingStartCheckout(st)) {
    return { ok: false, error: "This booking cannot be checked out.", status: 409 };
  }

  const { data: listing, error: lErr } = await sb
    .from("listings")
    .select("title")
    .eq("id", row.listing_id)
    .maybeSingle();

  if (lErr) {
    return { ok: false, error: lErr.message, status: 502 };
  }

  const listingTitle = typeof listing?.title === "string" && listing.title.trim() ? listing.title.trim() : "BNHub stay";

  return { ok: true, row, listingTitle };
}

export function amountCentsFromTotalPrice(totalPrice: number | string): number | null {
  const n = typeof totalPrice === "number" ? totalPrice : Number(totalPrice);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function checkoutPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  if (pi && typeof pi === "object" && "id" in pi) return (pi as Stripe.PaymentIntent).id;
  return null;
}

function formatDatesSummary(dates: unknown): string {
  if (Array.isArray(dates)) {
    return dates.slice(0, 14).join(", ") + (dates.length > 14 ? "…" : "");
  }
  try {
    return JSON.stringify(dates).slice(0, 500);
  } catch {
    return "—";
  }
}

/**
 * Creates Stripe Checkout for Supabase `public.bookings` and sets `processing` + session id.
 */
export async function createGuestSupabaseBookingCheckoutSession(params: {
  bookingId: string;
  clientTotal?: string | number | null;
  clientTitle?: string | null;
  successUrl: string;
  cancelUrl: string;
  upsells?: import("@/lib/monetization/bnhub-checkout-pricing").BnhubUpsellSelection;
}): Promise<{ url: string; sessionId: string } | { error: string; status: number }> {
  const { createOrValidateGuestSupabaseBookingCheckoutSession } = await import(
    "@/lib/stripe/create-or-validate-booking-checkout-session"
  );
  return createOrValidateGuestSupabaseBookingCheckoutSession(params);
}

/**
 * Webhook: mark Supabase booking paid; idempotent if already paid.
 */
export async function markGuestSupabaseBookingPaidFromStripeSession(session: Stripe.Checkout.Session): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const md = session.metadata ?? {};
  const bookingId =
    (typeof md.supabaseBookingId === "string" ? md.supabaseBookingId.trim() : "") ||
    (typeof md.bookingId === "string" ? md.bookingId.trim() : "");
  if (!bookingId) {
    return { ok: false, reason: "missing_booking_id_metadata" };
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    logWarn("[bnhub] guest_booking webhook", { phase: "aborted", reason: "supabase_client_missing" });
    return { ok: false, reason: "supabase_not_configured" };
  }

  const piPreview = checkoutPaymentIntentId(session);
  logInfo("[bnhub] guest_booking webhook", {
    phase: "checkout_session_received",
    bookingId,
    sessionId: session.id,
    paymentIntentId: piPreview,
    paymentStatus: session.payment_status,
  });

  const { data: booking, error: fetchErr } = await sb
    .from("bookings")
    .select("id, listing_id, total_price, status, dates, guest_email, stripe_checkout_session_id, stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchErr) {
    logError("[bnhub] guest_booking webhook fetch failed", fetchErr);
    return { ok: false, reason: fetchErr.message };
  }
  if (!booking) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "aborted",
      reason: "booking_not_found",
      bookingId,
      sessionId: session.id,
    });
    return { ok: false, reason: "booking_not_found" };
  }

  const row = booking as {
    id: string;
    listing_id: string;
    total_price: number | string;
    status?: string | null;
    dates?: unknown;
    guest_email?: string | null;
    stripe_checkout_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
  };
  const paid = session.amount_total ?? 0;
  const metaCurrency = typeof md.currency === "string" ? md.currency.toLowerCase() : "";
  const sessionCurrency = (session.currency ?? "").toLowerCase();
  if (metaCurrency && sessionCurrency && metaCurrency !== sessionCurrency) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: "currency_mismatch",
      bookingId,
      metaCurrency,
      sessionCurrency,
    });
    return { ok: false, reason: "currency_mismatch" };
  }

  const resolved = resolveExpectedGuestSupabasePaidCents({ session, bookingTotalPrice: row.total_price });
  if (!resolved.ok) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: resolved.reason,
      bookingId,
      paid,
    });
    return { ok: false, reason: resolved.reason };
  }
  const expectedCents = resolved.expectedCents;
  if (paid !== expectedCents) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: "amount_mismatch",
      bookingId,
      expectedCents,
      paid,
      pricingVersion: resolved.pricingVersion,
    });
    return { ok: false, reason: "amount_mismatch" };
  }

  const storedCheckout =
    typeof row.stripe_checkout_session_id === "string" ? row.stripe_checkout_session_id.trim() : "";
  if (storedCheckout && storedCheckout !== session.id) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: "checkout_session_mismatch",
      bookingId,
      storedCheckoutSessionId: storedCheckout,
      sessionId: session.id,
    });
    return { ok: false, reason: "checkout_session_mismatch" };
  }

  const current = (row.status ?? "pending").toLowerCase();
  const piFromSession = checkoutPaymentIntentId(session);
  if (current === "paid" || current === "completed") {
    const storedSessionId =
      typeof row.stripe_checkout_session_id === "string" && row.stripe_checkout_session_id.trim()
        ? row.stripe_checkout_session_id.trim()
        : null;
    const duplicateSessionReplay = Boolean(storedSessionId && storedSessionId === session.id);
    logInfo("[bnhub] guest_booking webhook", {
      phase: "idempotent_skip_already_paid",
      bookingId,
      sessionId: session.id,
      paymentIntentId: piFromSession,
      storedCheckoutSessionId: storedSessionId,
      storedPaymentIntentId:
        typeof row.stripe_payment_intent_id === "string" ? row.stripe_payment_intent_id : null,
      duplicateCheckoutSessionReplay: duplicateSessionReplay,
    });
    return { ok: true };
  }

  if (isGuestBookingCanceled(row.status ?? "")) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: "booking_canceled",
      bookingId,
      sessionId: session.id,
    });
    return { ok: false, reason: "booking_canceled" };
  }

  if (current !== "pending" && current !== "processing") {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "rejected",
      reason: "unexpected_booking_status",
      bookingId,
      status: current,
      sessionId: session.id,
    });
    return { ok: false, reason: "unexpected_booking_status" };
  }

  const piId = piFromSession;
  const nowIso = new Date().toISOString();

  const { data: listingRow } = await sb.from("listings").select("title").eq("id", row.listing_id).maybeSingle();
  const listingTitle =
    listingRow && typeof (listingRow as { title?: string }).title === "string"
      ? (listingRow as { title: string }).title
      : "BNHub stay";

  const { data: updatedRow, error: upErr } = await sb
    .from("bookings")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      ...(piId ? { stripe_payment_intent_id: piId } : {}),
      updated_at: nowIso,
    })
    .eq("id", bookingId)
    .in("status", ["pending", "processing"])
    .select("id")
    .maybeSingle();

  if (upErr) {
    logError("[bnhub] guest_booking webhook update failed", upErr);
    return { ok: false, reason: upErr.message };
  }
  if (!updatedRow) {
    logWarn("[bnhub] guest_booking webhook", {
      phase: "no_row_updated",
      bookingId,
      sessionId: session.id,
    });
    return { ok: false, reason: "no_row_updated" };
  }

  logInfo("[bnhub] guest_booking webhook", {
    phase: "marked_paid",
    bookingId,
    sessionId: session.id,
    paymentIntentId: piId,
  });

  void recordBnhubGuestBookingRevenueFromPaidSession(session, bookingId).catch((e) =>
    logError("[bnhub] guest_booking revenue event insert failed", e)
  );

  const totalNum = typeof row.total_price === "number" ? row.total_price : Number(row.total_price);
  const curr = (session.currency ?? "cad").toUpperCase();
  const nightsCount = Array.isArray(row.dates) ? row.dates.length : null;
  void sendBookingConfirmationEmail({
    bookingId,
    listingTitle,
    totalDisplay: `${Number.isFinite(totalNum) ? totalNum.toFixed(2) : row.total_price} ${curr}`,
    datesSummary: formatDatesSummary(row.dates),
    guestEmail: typeof row.guest_email === "string" && row.guest_email.includes("@") ? row.guest_email.trim() : null,
    nightsCount,
    currency: curr,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: piId,
  }).catch((e) => logError("[email] booking confirmation send failed", e));

  return { ok: true };
}
