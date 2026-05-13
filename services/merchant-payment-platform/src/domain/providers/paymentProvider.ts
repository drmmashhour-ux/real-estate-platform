import type { Money, PaymentProviderId } from "../shared/types.js";

export interface ProviderAuthorizeInput {
  provider: PaymentProviderId;
  transactionId: string;
  merchantId: string;
  money: Money;
  idempotencyKey: string;
}

export interface ProviderResult {
  provider: PaymentProviderId;
  providerReference: string;
  approved: true;
  liveExecution: false;
  message: string;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  authorize(input: ProviderAuthorizeInput): Promise<ProviderResult>;
  confirm(input: ProviderAuthorizeInput): Promise<ProviderResult>;
  healthCheck(): Promise<{
    provider: PaymentProviderId;
    mode: "mock";
    liveExecution: false;
  }>;
}
