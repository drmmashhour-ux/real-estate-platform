import type {
  PaymentProvider,
  CreateIntentParams,
  CreateIntentResult,
  CaptureIntentParams,
  RefundParams,
  RefundResult,
  CreatePayoutParams,
  CreatePayoutResult,
} from "./types.js";

/**
 * In-memory mock provider for development and tests.
 * Simulates intent creation, hold, capture, and refund without calling an external API.
 */
export class MockPaymentProvider implements PaymentProvider {
  private intents = new Map<string, { amountCents: number; status: string }>();
  private payouts = new Map<string, { amountCents: number }>();

  async createIntent(_params: CreateIntentParams): Promise<CreateIntentResult> {
    throw new Error(
      "Mock PaymentIntents are disabled — use Stripe Checkout Sessions only (same as production).",
    );
  }

  async captureIntent(params: CaptureIntentParams): Promise<void> {
    const intent = this.intents.get(params.providerIntentId);
    if (!intent) throw new Error("Intent not found");
    if (intent.status !== "HELD") throw new Error("Intent not in HELD state");
    intent.status = "CAPTURED";
  }

  async cancelIntent(providerIntentId: string): Promise<void> {
    const intent = this.intents.get(providerIntentId);
    if (!intent) throw new Error("Intent not found");
    intent.status = "CANCELLED";
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const refundId = `re_mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return {
      refundId,
      providerRefundId: refundId,
    };
  }

  async createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult> {
    const providerPayoutId = `po_mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.payouts.set(providerPayoutId, { amountCents: params.amountCents });
    return {
      payoutId: providerPayoutId,
      providerPayoutId,
    };
  }
}
