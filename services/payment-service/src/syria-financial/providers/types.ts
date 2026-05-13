import { z } from "zod";

export const SYRIA_PAYMENT_PROVIDER_IDS = [
  "provider_stub",
  "provider_qnb_stub",
  "provider_chamcash_stub",
] as const;

export const syriaPaymentProviderIdSchema = z.enum(SYRIA_PAYMENT_PROVIDER_IDS);
export type SyriaPaymentProviderId = z.infer<typeof syriaPaymentProviderIdSchema>;

export const providerMoneySchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
});

export const providerMetadataSchema = z.record(z.union([z.string(), z.number(), z.boolean()])).default({});

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  payerId: z.string().uuid(),
  merchantId: z.string().uuid(),
  amount: providerMoneySchema,
  idempotencyKey: z.string().trim().min(16).max(128),
  metadata: providerMetadataSchema,
});

export const verifyPaymentSchema = z.object({
  providerPaymentId: z.string().trim().min(1),
  transactionId: z.string().uuid().optional(),
  metadata: providerMetadataSchema,
});

export const createProviderPayoutSchema = z.object({
  merchantId: z.string().uuid(),
  amount: providerMoneySchema,
  idempotencyKey: z.string().trim().min(16).max(128),
  metadata: providerMetadataSchema,
});

export const providerWebhookSchema = z.object({
  headers: z.record(z.string()).default({}),
  body: z.unknown(),
  correlationId: z.string().trim().min(1),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateProviderPayoutInput = z.infer<typeof createProviderPayoutSchema>;
export type ProviderWebhookInput = z.infer<typeof providerWebhookSchema>;

export interface NonLiveProviderResult {
  provider: SyriaPaymentProviderId;
  providerReference: string;
  status: "not_executed" | "stub_verified" | "webhook_accepted";
  livePaymentExecuted: false;
  message: string;
}

export interface ProviderHealthCheck {
  provider: SyriaPaymentProviderId;
  status: "stubbed" | "disabled";
  liveConnectivity: false;
  checkedAt: Date;
  message: string;
}

export interface SyriaPaymentProvider {
  readonly id: SyriaPaymentProviderId;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<NonLiveProviderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<NonLiveProviderResult>;
  createPayout(input: CreateProviderPayoutInput): Promise<NonLiveProviderResult>;
  handleWebhook(input: ProviderWebhookInput): Promise<NonLiveProviderResult>;
  healthCheck(): Promise<ProviderHealthCheck>;
}
