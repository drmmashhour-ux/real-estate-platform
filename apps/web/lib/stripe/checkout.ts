/**
 * Create Stripe Checkout session. Safe when Stripe is not configured.
 */

import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logInfo } from "@/lib/logger";
import type { FsboPublishPlan } from "@/lib/fsbo/constants";
import {
  assertCoreCheckoutMetadata,
  compactStripeMetadata,
  validateBookingPaymentMetadata,
} from "@/lib/stripe/checkoutMetadata";

/**
 * Short Stripe metadata `type` for dashboards / logs (maps to paymentType).
 * booking | fsbo | lead | …
 */
export function revenueFlowTypeLabel(paymentType: PaymentType): string {
  switch (paymentType) {
    case "booking":
      return "booking";
    case "fsbo_publish":
      return "fsbo";
    case "lead_unlock":
    case "mortgage_contact_unlock":
      return "lead";
    case "featured_listing":
      return "featured";
    case "deposit":
      return "deposit";
    case "closing_fee":
      return "closing";
    case "subscription":
      return "subscription";
    default:
      return paymentType;
  }
}

export type PaymentType =
  | "booking"
  | "subscription"
  | "lead_unlock"
  | "mortgage_contact_unlock"
  | "deposit"
  | "closing_fee"
  | "featured_listing"
  | "fsbo_publish";

export type CreateCheckoutParams = {
  successUrl: string;
  cancelUrl: string;
  amountCents: number;
  currency?: string;
  paymentType: PaymentType;
  userId: string;
  listingId?: string;
  projectId?: string;
  bookingId?: string;
  dealId?: string;
  brokerId?: string;
  /** FSBO listing id for publish fee checkout (metadata). */
  fsboListingId?: string;
  /** basic | premium — stored in Stripe metadata for webhook. */
  fsboPlan?: FsboPublishPlan;
  /** Mortgage broker dashboard: unlock borrower contact on a `MortgageRequest`. */
  mortgageRequestId?: string;
  mortgageBrokerId?: string;
  description?: string;
  /** Merged into Stripe Session metadata (server-controlled keys only). */
  metadata?: Record<string, string>;
  /**
   * Stripe Connect: destination charge with application fee (BNHUB host payout).
   * When set, `payment_intent_data.application_fee_amount` + `transfer_data.destination` are applied.
   */
  connect?: {
    destinationAccountId: string;
    /** Stripe application fee (may be 0); remainder transfers to destination. */
    applicationFeeAmount: number;
    /**
     * Optional settlement merchant for destination charges.
     * Use when Stripe requires `on_behalf_of` (for example some cross-region setups).
     */
    onBehalfOfAccountId?: string;
    /** Auditable BNHUB split (may differ from applicationFeeAmount only in pathological rate config). */
    bnhubPlatformFeeCents?: number;
    bnhubHostPayoutCents?: number;
  };
};

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ url: string; sessionId: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured" };
  }
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured" };

  const {
    successUrl,
    cancelUrl,
    amountCents,
    currency = "cad",
    paymentType,
    userId,
    listingId,
    projectId,
    bookingId,
    dealId,
    brokerId,
    fsboListingId,
    fsboPlan,
    mortgageRequestId,
    mortgageBrokerId,
    description,
    metadata = {},
    connect,
  } = params;

  const metadataCombined = compactStripeMetadata({
    userId,
    paymentType,
    ...metadata,
    /** Canonical short label — must not be overridden by caller `metadata`. */
    type: revenueFlowTypeLabel(paymentType),
    ...(paymentType === "fsbo_publish"
      ? {
          type: "fsbo_listing",
          ...(fsboPlan ? { fsboPlan } : {}),
        }
      : {}),
    ...(listingId ? { listingId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(dealId ? { dealId } : {}),
    ...(brokerId ? { brokerId } : {}),
    ...(mortgageRequestId ? { mortgageRequestId } : {}),
    ...(mortgageBrokerId ? { mortgageBrokerId } : {}),
    ...(fsboListingId ? { fsboListingId } : {}),
    ...(connect
      ? {
          applicationFeeCents: String(connect.applicationFeeAmount),
          connectDestination: connect.destinationAccountId,
          ...(connect.onBehalfOfAccountId
            ? { onBehalfOfAccountId: connect.onBehalfOfAccountId }
            : {}),
          ...(typeof connect.bnhubPlatformFeeCents === "number"
            ? { bnhubPlatformFeeCents: String(connect.bnhubPlatformFeeCents) }
            : {}),
          ...(typeof connect.bnhubHostPayoutCents === "number"
            ? { bnhubHostPayoutCents: String(connect.bnhubHostPayoutCents) }
            : {}),
        }
      : {}),
  });

  try {
    assertCoreCheckoutMetadata(metadataCombined);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid checkout metadata" };
  }

  const bookingMetaErr = validateBookingPaymentMetadata(metadataCombined);
  if (bookingMetaErr) {
    return { error: bookingMetaErr };
  }

  // BNHUB marketplace: when `connect` is set, Stripe collects gross on platform and applies
  // `application_fee_amount` + `transfer_data.destination` (host Connect account).
  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    metadata: metadataCombined,
    ...(connect && connect.destinationAccountId
      ? {
          application_fee_amount: connect.applicationFeeAmount,
          transfer_data: { destination: connect.destinationAccountId },
          ...(connect.onBehalfOfAccountId
            ? { on_behalf_of: connect.onBehalfOfAccountId }
            : {}),
        }
      : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: amountCents,
            product_data: {
              name: description || `${paymentType.replace(/_/g, " ")}`,
              description: description || undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadataCombined,
      payment_intent_data: paymentIntentData,
    });

    const url = session.url;
    if (!url) return { error: "Failed to get checkout URL" };
    logInfo(
      `[STRIPE] [CHECKOUT] session created sessionId=${session.id} paymentType=${paymentType} type=${revenueFlowTypeLabel(paymentType)} currency=${currency.toLowerCase()} amountCents=${amountCents} userId=${userId} bookingId=${bookingId ?? "n/a"} listingId=${listingId ?? "n/a"}`
    );
    return { url, sessionId: session.id };
  } catch (e) {
    console.error("[stripe] createCheckoutSession error:", e);
    return {
      error: e instanceof Error ? e.message : "Failed to create checkout session",
    };
  }
}
