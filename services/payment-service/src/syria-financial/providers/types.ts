import { z } from "zod";
import {
  financialCurrencySchema,
  financialIdSchema,
  financialMetadataSchema,
  requestCorrelationSchema,
  syriaProviderCodeSchema,
  type FinancialMetadata,
  type RequestCorrelation,
  type SyriaProviderCode,
} from "../common/types.js";

export const paymentIntentRequestSchema = z.object({
  amount: z.number().int().positive(),
  currency: financialCurrencySchema,
  bookingId: financialIdSchema,
  payerId: financialIdSchema,
  merchantId: financialIdSchema,
  idempotencyKey: financialIdSchema,
  metadata: financialMetadataSchema,
  correlation: requestCorrelationSchema,
});

export const verifyPaymentRequestSchema = z.object({
  providerPaymentId: financialIdSchema,
  correlation: requestCorrelationSchema,
});

export const payoutRequestSchema = z.object({
  merchantId: financialIdSchema,
  amount: z.number().int().positive(),
  currency: financialCurrencySchema,
  destinationReference: financialIdSchema.optional(),
  idempotencyKey: financialIdSchema,
  metadata: financialMetadataSchema,
  correlation: requestCorrelationSchema,
});

export const webhookRequestSchema = z.object({
  headers: z.record(z.string()),
  body: z.unknown(),
  correlation: requestCorrelationSchema,
});

export type PaymentIntentRequest = z.infer<typeof paymentIntentRequestSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentRequestSchema>;
export type PayoutRequest = z.infer<typeof payoutRequestSchema>;
export type WebhookRequest = z.infer<typeof webhookRequestSchema>;

export interface StubbedProviderResult {
  provider: SyriaProviderCode;
  liveMode: false;
  executed: false;
  status: "disabled" | "not_executed";
  providerReference?: string;
  message: string;
  correlation: RequestCorrelation;
  metadata?: FinancialMetadata;
}

export interface ProviderHealth {
  provider: SyriaProviderCode;
  status: "disabled" | "ready_for_configuration";
  liveMode: false;
  checkedAt: string;
  message: string;
}

export interface SyriaPaymentProvider {
  readonly code: SyriaProviderCode;
  createPaymentIntent(request: PaymentIntentRequest): Promise<StubbedProviderResult>;
  verifyPayment(request: VerifyPaymentRequest): Promise<StubbedProviderResult>;
  createPayout(request: PayoutRequest): Promise<StubbedProviderResult>;
  handleWebhook(request: WebhookRequest): Promise<StubbedProviderResult>;
  healthCheck(): Promise<ProviderHealth>;
}

export function assertProviderCode(value: unknown): SyriaProviderCode {
  return syriaProviderCodeSchema.parse(value);
}
