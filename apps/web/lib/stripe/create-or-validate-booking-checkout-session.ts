import { logError, logInfo } from "@/lib/logger";
import { notifyHostForGuestCheckoutStarted } from "@/lib/bnhub/notify-bnhub-supabase-host";
import {
  computeBnhubGuestCheckoutCents,
  isBnhubItemizedCheckoutEnabled,
  type BnhubUpsellSelection,
} from "@/lib/monetization/bnhub-checkout-pricing";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import {
  amountCentsFromTotalPrice,
  fetchGuestSupabaseBookingForCheckout,
  getSupabaseServiceForGuestBookings,
  GUEST_SUPABASE_BOOKING_PAYMENT_TYPE,
} from "@/lib/stripe/guestSupabaseBooking";

/**
 * Creates Stripe Checkout for a guest Supabase booking and marks the row `processing` with the new session id.
 * Only `pending` and `processing` rows are updated; if the row changed (e.g. paid), returns an error.
 */
export async function createOrValidateGuestSupabaseBookingCheckoutSession(params: {
  bookingId: string;
  clientTotal?: string | number | null;
  clientTitle?: string | null;
  successUrl: string;
  cancelUrl: string;
  upsells?: BnhubUpsellSelection;
}): Promise<{ url: string; sessionId: string } | { error: string; status: number }> {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured.", status: 503 };
  }
  const stripe = getStripe();
  if (!stripe) {
    return { error: "Payments are not configured.", status: 503 };
  }

  const loaded = await fetchGuestSupabaseBookingForCheckout(params.bookingId);
  if (!loaded.ok) {
    return { error: loaded.error, status: loaded.status };
  }

  const accommodationCents = amountCentsFromTotalPrice(loaded.row.total_price);
  if (accommodationCents === null || accommodationCents < 50) {
    return { error: "Invalid booking total for checkout.", status: 400 };
  }

  const currency = (process.env.STRIPE_GUEST_SUPABASE_BOOKING_CURRENCY ?? "cad").toLowerCase();
  const listingId = loaded.row.listing_id;
  const itemized = isBnhubItemizedCheckoutEnabled();
  const breakdown = itemized
    ? computeBnhubGuestCheckoutCents({
        accommodationCents,
        dates: loaded.row.dates,
        upsells: params.upsells,
      })
    : null;

  const totalChargeCents = itemized && breakdown ? breakdown.totalCents : accommodationCents;

  if (totalChargeCents < 50) {
    return { error: "Checkout total is below the minimum charge.", status: 400 };
  }

  if (params.clientTotal != null && params.clientTotal !== "") {
    const client = Number(params.clientTotal);
    if (Number.isFinite(client)) {
      const serverDollars = totalChargeCents / 100;
      if (Math.abs(client - serverDollars) > 0.02) {
        return { error: "Total does not match booking. Refresh and try again.", status: 400 };
      }
    }
  }

  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string; description?: string };
      unit_amount: number;
    };
    quantity: number;
  }> = [];

  if (itemized && breakdown) {
    lineItems.push({
      price_data: {
        currency,
        product_data: {
          name: loaded.listingTitle,
          description: `Booking ${params.bookingId} — accommodation`,
        },
        unit_amount: breakdown.accommodationCents,
      },
      quantity: 1,
    });
    if (breakdown.baseFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Platform service fee (base)" },
          unit_amount: breakdown.baseFeeCents,
        },
        quantity: 1,
      });
    }
    if (breakdown.peakFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Peak demand service fee" },
          unit_amount: breakdown.peakFeeCents,
        },
        quantity: 1,
      });
    }
    if (breakdown.upsellCents.insurance > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Trip protection / insurance add-on" },
          unit_amount: breakdown.upsellCents.insurance,
        },
        quantity: 1,
      });
    }
    if (breakdown.upsellCents.earlyCheckIn > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Early check-in" },
          unit_amount: breakdown.upsellCents.earlyCheckIn,
        },
        quantity: 1,
      });
    }
    if (breakdown.upsellCents.lateCheckOut > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: "Late check-out" },
          unit_amount: breakdown.upsellCents.lateCheckOut,
        },
        quantity: 1,
      });
    }
  } else {
    lineItems.push({
      price_data: {
        currency,
        product_data: {
          name: loaded.listingTitle,
          description: `Booking ${params.bookingId}`,
        },
        unit_amount: accommodationCents,
      },
      quantity: 1,
    });
  }

  const sbMeta = getSupabaseServiceForGuestBookings();
  let hostUserIdMeta = "";
  if (sbMeta) {
    const { data: lr } = await sbMeta.from("listings").select("host_user_id").eq("id", listingId).maybeSingle();
    hostUserIdMeta = typeof lr?.host_user_id === "string" ? lr.host_user_id.trim() : "";
  }
  const market = await getResolvedMarket();
  const payoutMethodStripe =
    resolveActivePaymentModeFromMarket(market) === "manual" ? "manual" : "stripe_connect";

  const metadata: Record<string, string> = {
    paymentType: GUEST_SUPABASE_BOOKING_PAYMENT_TYPE,
    supabaseBookingId: params.bookingId,
    bookingId: params.bookingId,
    listingId,
    currency,
    flow: "bnhub_booking",
    payoutMethod: payoutMethodStripe,
    ...(hostUserIdMeta ? { hostUserId: hostUserIdMeta } : {}),
  };

  if (itemized && breakdown) {
    metadata.checkoutPricingVersion = "v2";
    metadata.checkoutTotalCents = String(breakdown.totalCents);
    metadata.accommodationCents = String(breakdown.accommodationCents);
    metadata.serviceFeeBaseCents = String(breakdown.baseFeeCents);
    metadata.serviceFeePeakCents = String(breakdown.peakFeeCents);
    metadata.upsellInsuranceCents = String(breakdown.upsellCents.insurance);
    metadata.upsellEarlyCents = String(breakdown.upsellCents.earlyCheckIn);
    metadata.upsellLateCents = String(breakdown.upsellCents.lateCheckOut);
    metadata.upsellsJson = JSON.stringify({
      insurance: Boolean(params.upsells?.insurance),
      earlyCheckIn: Boolean(params.upsells?.earlyCheckIn),
      lateCheckOut: Boolean(params.upsells?.lateCheckOut),
    });
    metadata.amountCents = String(breakdown.totalCents);
  } else {
    metadata.amountCents = String(accommodationCents);
  }

  let session: { id: string; url: string | null };
  try {
    const s = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata,
      payment_intent_data: { metadata },
    });
    session = { id: s.id, url: s.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed";
    logError("[stripe] guest_supabase_booking checkout failed", err);
    return { error: message, status: 500 };
  }

  if (!session.url) {
    return { error: "Stripe did not return a checkout URL.", status: 502 };
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Supabase service is not configured on the server.", status: 503 };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: upErr } = await sb
    .from("bookings")
    .update({
      status: "processing",
      stripe_checkout_session_id: session.id,
      updated_at: nowIso,
    })
    .eq("id", params.bookingId)
    .in("status", ["pending", "processing"])
    .select("id")
    .maybeSingle();

  if (upErr) {
    logError("[stripe] guest_supabase_booking: could not mark processing", upErr);
    return { error: "Could not start checkout. Try again.", status: 502 };
  }
  if (!updated) {
    return {
      error: "This booking is no longer available for checkout. Refresh the app.",
      status: 409,
    };
  }

  logInfo("[bnhub] guest_booking checkout_session_created", {
    bookingId: params.bookingId,
    sessionId: session.id,
    listingId,
    accommodationCents,
    totalChargeCents,
    itemized,
    paymentIntentId: null,
  });

  const { data: hostRow } = await sb
    .from("listings")
    .select("host_user_id, title")
    .eq("id", listingId)
    .maybeSingle();
  const H = hostRow as { host_user_id?: string | null; title?: string | null } | null;
  const hostUid = typeof H?.host_user_id === "string" ? H.host_user_id.trim() : "";
  if (hostUid) {
    const t =
      typeof H?.title === "string" && H.title.trim() ? H.title.trim() : loaded.listingTitle;
    void notifyHostForGuestCheckoutStarted({
      bookingId: params.bookingId,
      listingId,
      listingTitle: t,
      hostSupabaseUserId: hostUid,
    }).catch((e) => logError("[bnhub] host checkout-started notify failed", e));
  }

  return { url: session.url, sessionId: session.id };
}
