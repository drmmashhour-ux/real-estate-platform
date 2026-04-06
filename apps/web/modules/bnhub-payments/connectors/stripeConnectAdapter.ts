/**
 * Stripe Connect implementation of {@link MarketplacePaymentProcessorAdapter}.
 */

import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type {
  CapturePaymentInput,
  CreatePaymentSessionInput,
  MarketplacePaymentProcessorAdapter,
  RefundInput,
  TransferOrPayoutInput,
  WebhookIngestResult,
} from "@/modules/bnhub-payments/connectors/paymentProcessorTypes";

function stripe(): Stripe | null {
  return getStripe();
}

export class StripeConnectAdapter implements MarketplacePaymentProcessorAdapter {
  readonly processorId = "stripe" as const;

  mapProcessorError(err: unknown): { message: string; code?: string; retryable?: boolean } {
    if (err instanceof Stripe.errors.StripeError) {
      return {
        message: err.message,
        code: err.code,
        retryable: err.type === "StripeConnectionError" || err.code === "rate_limit",
      };
    }
    if (err instanceof Error) return { message: err.message };
    return { message: "Unknown processor error" };
  }

  async createHostedOnboardingLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string } | { error: string }> {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      const link = await s.accountLinks.create({
        account: params.accountId,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: "account_onboarding",
      });
      if (!link.url) return { error: "No onboarding URL returned" };
      return { url: link.url };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async getAccountStatus(accountId: string) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      const acct = await s.accounts.retrieve(accountId);
      return {
        processorAccountId: acct.id,
        onboardingComplete: Boolean(acct.details_submitted),
        payoutsEnabled: Boolean(acct.payouts_enabled),
        chargesEnabled: Boolean(acct.charges_enabled),
        requirementsJson: {
          currently_due: acct.requirements?.currently_due ?? [],
          eventually_due: acct.requirements?.eventually_due ?? [],
          past_due: acct.requirements?.past_due ?? [],
        } as Record<string, unknown>,
      };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async createPaymentSession(input: CreatePaymentSessionInput) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
      metadata: input.metadata,
      ...(input.captureMethod === "manual" ? { capture_method: "manual" } : {}),
      ...(input.connect && input.connect.destinationAccountId
        ? {
            application_fee_amount: input.connect.applicationFeeAmount,
            transfer_data: { destination: input.connect.destinationAccountId },
          }
        : {}),
    };
    try {
      const session = await s.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amountCents,
              product_data: { name: "BNHub stay" },
            },
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata,
        payment_intent_data: paymentIntentData,
      });
      const url = session.url;
      if (!url) return { error: "Failed to get checkout URL" };
      return { url, sessionId: session.id };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async capturePayment(input: CapturePaymentInput) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      await s.paymentIntents.capture(input.paymentIntentId, {
        ...(input.amountCents != null ? { amount_to_capture: input.amountCents } : {}),
      });
      return { ok: true as const };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async createTransferOrPayout(input: TransferOrPayoutInput) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      const transfer = await s.transfers.create(
        {
          amount: input.amountCents,
          currency: input.currency.toLowerCase(),
          destination: input.destinationAccountId,
          metadata: input.metadata ?? {},
        },
        input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
      );
      return { transferId: transfer.id };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async createRefund(input: RefundInput) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      const refund = await s.refunds.create(
        {
          payment_intent: input.paymentIntentId,
          ...(input.amountCents != null ? { amount: input.amountCents } : {}),
          metadata: input.metadata ?? {},
        },
        input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
      );
      return { refundId: refund.id };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async ingestWebhook(_rawBody: string, _signatureHeader: string | null): Promise<WebhookIngestResult> {
    return { ok: true, ignored: true };
  }

  async getDisputeStatus(disputeId: string) {
    const s = stripe();
    if (!s) return { error: "Stripe not configured" };
    try {
      const d = await s.disputes.retrieve(disputeId);
      return { status: d.status, raw: d };
    } catch (e) {
      return { error: this.mapProcessorError(e).message };
    }
  }

  async uploadDisputeEvidence(): Promise<{ ok: true } | { error: string }> {
    return { error: "Dispute evidence upload not implemented in adapter v1 — use Stripe Dashboard or extend API" };
  }
}

export function isStripeMarketplaceReady(): boolean {
  return isStripeConfigured();
}
