import { assertFinancialSafety } from "../../safety/financialSafetyGuard.js";
import type { PaymentProvider, ProviderAuthorizeInput, ProviderResult } from "./paymentProvider.js";
import type { PaymentProviderId } from "../shared/types.js";

abstract class BaseMockProvider implements PaymentProvider {
  abstract readonly id: PaymentProviderId;

  async authorize(input: ProviderAuthorizeInput): Promise<ProviderResult> {
    return this.mockResult(input, "authorized");
  }

  async confirm(input: ProviderAuthorizeInput): Promise<ProviderResult> {
    return this.mockResult(input, "confirmed");
  }

  async healthCheck(): Promise<{ provider: PaymentProviderId; mode: "mock"; liveExecution: false }> {
    assertFinancialSafety();
    return { provider: this.id, mode: "mock", liveExecution: false };
  }

  private async mockResult(input: ProviderAuthorizeInput, action: string): Promise<ProviderResult> {
    assertFinancialSafety();
    if (input.provider !== this.id) throw new Error(`Provider mismatch for ${this.id}.`);
    return {
      provider: this.id,
      providerReference: `${this.id}_${action}_${input.transactionId}`,
      approved: true,
      liveExecution: false,
      message: "Mock provider only. No real money movement occurred.",
    };
  }
}

export class MockVisaProvider extends BaseMockProvider {
  readonly id = "mock_visa" as const;
}

export class MockMastercardProvider extends BaseMockProvider {
  readonly id = "mock_mastercard" as const;
}

export class MockBankTransferProvider extends BaseMockProvider {
  readonly id = "mock_bank_transfer" as const;
}
