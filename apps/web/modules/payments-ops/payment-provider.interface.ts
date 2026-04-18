import type { LecipmPaymentRecordStatus } from "@prisma/client";

/**
 * Provider-facing surface — no money movement unless implementation exists and is authorized.
 */
export type PaymentProviderKind = "manual" | "stripe_request" | "escrow_placeholder" | "notary_funds" | "external";

export type CreatePaymentRequestInput = {
  dealId: string;
  amountCents: number;
  currency: string;
  externalMemo?: string;
};

export type PaymentProviderResult = {
  ok: boolean;
  providerReference?: string | null;
  /** Provider-reported status only — never infer "paid" without event */
  externalStatus?: string;
  message?: string;
};

export interface DealPaymentProviderAdapter {
  readonly key: PaymentProviderKind;
  createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentProviderResult>;
  /** Poll or interpret webhook — returns opaque status string for logging */
  fetchExternalStatus?(providerReference: string): Promise<{ status: string } | undefined>;
}
