/**
 * Processor-agnostic payment adapter types (v1: Stripe Connect).
 * All implementations run server-side only.
 */

export type BnhubProcessorId = "stripe";

export type HostedOnboardingLinkResult =
  | { url: string; expiresAt?: Date }
  | { error: string; code?: string };

export type AccountStatusResult = {
  processorAccountId: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  requirementsJson: Record<string, unknown>;
};

export type CreatePaymentSessionInput = {
  successUrl: string;
  cancelUrl: string;
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
  connect?: {
    destinationAccountId: string;
    applicationFeeAmount: number;
  };
  captureMethod?: "automatic" | "manual";
};

export type CreatePaymentSessionResult =
  | { url: string; sessionId: string }
  | { error: string; code?: string };

export type CapturePaymentInput = {
  paymentIntentId: string;
  amountCents?: number;
};

export type TransferOrPayoutInput = {
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
};

export type RefundInput = {
  paymentIntentId: string;
  amountCents?: number;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
};

export type ProcessorError = {
  message: string;
  code?: string;
  retryable?: boolean;
};

export type WebhookIngestResult =
  | { ok: true; ignored?: boolean }
  | { ok: false; error: string };

/**
 * Marketplace payment processor contract — implement per provider.
 */
export interface MarketplacePaymentProcessorAdapter {
  readonly processorId: BnhubProcessorId;

  createHostedOnboardingLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<HostedOnboardingLinkResult>;

  getAccountStatus(accountId: string): Promise<AccountStatusResult | { error: string }>;

  createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult>;

  capturePayment(input: CapturePaymentInput): Promise<{ ok: true } | { error: string }>;

  createTransferOrPayout(input: TransferOrPayoutInput): Promise<
    { transferId: string } | { error: string }
  >;

  createRefund(input: RefundInput): Promise<{ refundId: string } | { error: string }>;

  ingestWebhook(_rawBody: string, _signatureHeader: string | null): Promise<WebhookIngestResult>;

  getDisputeStatus(_disputeId: string): Promise<{ status: string; raw: unknown } | { error: string }>;

  uploadDisputeEvidence(
    _disputeId: string,
    _evidence: Record<string, unknown>
  ): Promise<{ ok: true } | { error: string }>;

  mapProcessorError(err: unknown): ProcessorError;
}
