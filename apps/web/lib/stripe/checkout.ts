/**
 * Create Stripe Checkout session. Safe when Stripe is not configured.
 */

import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { FsboPublishPlan } from "@/lib/fsbo/constants";

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
   * Stripe Connect: destination charge with application fee (BNHub host payout).
   * When set, `payment_intent_data.application_fee_amount` + `transfer_data.destination` are applied.
   */
  connect?: {
    destinationAccountId: string;
    /** Stripe application fee (may be 0); remainder transfers to destination. */
    applicationFeeAmount: number;
    /** Auditable BNHub split (may differ from applicationFeeAmount only in pathological rate config). */
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

  const metadataCombined: Record<string, string> = {
    userId,
    paymentType,
    ...metadata,
  };
  if (paymentType === "fsbo_publish") {
    metadataCombined.type = "fsbo_listing";
    if (fsboPlan) metadataCombined.fsboPlan = fsboPlan;
  }
  if (listingId) metadataCombined.listingId = listingId;
  if (projectId) metadataCombined.projectId = projectId;
  if (bookingId) metadataCombined.bookingId = bookingId;
  if (dealId) metadataCombined.dealId = dealId;
  if (brokerId) metadataCombined.brokerId = brokerId;
  if (mortgageRequestId) metadataCombined.mortgageRequestId = mortgageRequestId;
  if (mortgageBrokerId) metadataCombined.mortgageBrokerId = mortgageBrokerId;
  if (fsboListingId) metadataCombined.fsboListingId = fsboListingId;
  if (connect) {
    metadataCombined.applicationFeeCents = String(connect.applicationFeeAmount);
    metadataCombined.connectDestination = connect.destinationAccountId;
    if (typeof connect.bnhubPlatformFeeCents === "number") {
      metadataCombined.bnhubPlatformFeeCents = String(connect.bnhubPlatformFeeCents);
    }
    if (typeof connect.bnhubHostPayoutCents === "number") {
      metadataCombined.bnhubHostPayoutCents = String(connect.bnhubHostPayoutCents);
    }
  }

  if (paymentType === "booking") {
    if (!bookingId?.trim()) {
      return { error: "bookingId is required for booking checkout (metadata + webhook)" };
    }
    if (!listingId?.trim()) {
      return { error: "listingId is required for booking checkout (metadata + webhook)" };
    }
  }

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    metadata: metadataCombined,
    ...(connect && connect.destinationAccountId
      ? {
          application_fee_amount: connect.applicationFeeAmount,
          transfer_data: { destination: connect.destinationAccountId },
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
    return { url, sessionId: session.id };
  } catch (e) {
    console.error("[stripe] createCheckoutSession error:", e);
    return {
      error: e instanceof Error ? e.message : "Failed to create checkout session",
    };
  }
}
