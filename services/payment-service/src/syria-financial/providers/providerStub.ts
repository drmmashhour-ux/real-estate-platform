import { randomUUID } from "node:crypto";
import { SYRIA_FINANCIAL_SAFETY_NOTICE } from "../constants.js";
import { assertNoSensitiveFinancialPayload } from "../security.js";
import {
  createPaymentIntentSchema,
  createProviderPayoutSchema,
  providerWebhookSchema,
  verifyPaymentSchema,
  type CreatePaymentIntentInput,
  type CreateProviderPayoutInput,
  type NonLiveProviderResult,
  type ProviderHealthCheck,
  type ProviderWebhookInput,
  type SyriaPaymentProvider,
  type SyriaPaymentProviderId,
  type VerifyPaymentInput,
} from "./types.js";

export class SyriaStubPaymentProvider implements SyriaPaymentProvider {
  constructor(readonly id: SyriaPaymentProviderId = "provider_stub") {}

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<NonLiveProviderResult> {
    const parsed = createPaymentIntentSchema.parse(input);
    assertNoSensitiveFinancialPayload(parsed.metadata);
    return this.nonLiveResult("not_executed", `intent_${randomUUID()}`);
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<NonLiveProviderResult> {
    const parsed = verifyPaymentSchema.parse(input);
    assertNoSensitiveFinancialPayload(parsed.metadata);
    return this.nonLiveResult("stub_verified", parsed.providerPaymentId);
  }

  async createPayout(input: CreateProviderPayoutInput): Promise<NonLiveProviderResult> {
    const parsed = createProviderPayoutSchema.parse(input);
    assertNoSensitiveFinancialPayload(parsed.metadata);
    return this.nonLiveResult("not_executed", `payout_${parsed.idempotencyKey}`);
  }

  async handleWebhook(input: ProviderWebhookInput): Promise<NonLiveProviderResult> {
    providerWebhookSchema.parse(input);
    assertNoSensitiveFinancialPayload(input.body);
    return this.nonLiveResult("webhook_accepted", `webhook_${input.correlationId}`);
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    return {
      provider: this.id,
      status: "stubbed",
      liveConnectivity: false,
      checkedAt: new Date(),
      message: SYRIA_FINANCIAL_SAFETY_NOTICE,
    };
  }

  protected nonLiveResult(
    status: NonLiveProviderResult["status"],
    providerReference: string,
  ): NonLiveProviderResult {
    return {
      provider: this.id,
      providerReference,
      status,
      livePaymentExecuted: false,
      message: SYRIA_FINANCIAL_SAFETY_NOTICE,
    };
  }
}
