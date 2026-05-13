import { randomUUID } from "node:crypto";
import { FinancialError } from "../common/errors.js";
import { nowIso } from "../common/types.js";
import { sanitizeFinancialMetadata } from "../common/security.js";
import {
  paymentIntentRequestSchema,
  payoutRequestSchema,
  verifyPaymentRequestSchema,
  webhookRequestSchema,
  type PaymentIntentRequest,
  type PayoutRequest,
  type ProviderHealth,
  type StubbedProviderResult,
  type SyriaPaymentProvider,
  type VerifyPaymentRequest,
  type WebhookRequest,
} from "./types.js";

export class SyriaStubPaymentProvider implements SyriaPaymentProvider {
  readonly code = "provider_stub";

  async createPaymentIntent(request: PaymentIntentRequest): Promise<StubbedProviderResult> {
    const parsed = paymentIntentRequestSchema.parse(request);
    return this.disabledResult("Stub payment intents are architecture-only.", parsed.correlation, parsed.metadata);
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<StubbedProviderResult> {
    const parsed = verifyPaymentRequestSchema.parse(request);
    return this.disabledResult("Stub payment verification is architecture-only.", parsed.correlation);
  }

  async createPayout(request: PayoutRequest): Promise<StubbedProviderResult> {
    const parsed = payoutRequestSchema.parse(request);
    return this.disabledResult("Stub payouts are architecture-only.", parsed.correlation, parsed.metadata);
  }

  async handleWebhook(request: WebhookRequest): Promise<StubbedProviderResult> {
    const parsed = webhookRequestSchema.parse(request);
    return this.disabledResult("Stub webhooks are ignored because no provider is active.", parsed.correlation);
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.code,
      status: "ready_for_configuration",
      liveMode: false,
      checkedAt: nowIso(),
      message: "Provider stub is available for validation only; no money movement is enabled.",
    };
  }

  protected disabledResult(
    message: string,
    correlation: StubbedProviderResult["correlation"],
    metadata = {},
  ): StubbedProviderResult {
    if (!correlation.correlationId) {
      throw new FinancialError("VALIDATION_ERROR", "Missing financial correlation ID.");
    }

    return {
      provider: this.code,
      liveMode: false,
      executed: false,
      status: "not_executed",
      providerReference: `stub_${randomUUID()}`,
      message,
      correlation,
      metadata: sanitizeFinancialMetadata(metadata),
    };
  }
}
