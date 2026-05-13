import { assertFinancialSafety } from "../../safety/financialSafetyGuard.js";
import type { PaymentProviderId } from "../shared/types.js";
import type { PaymentProvider } from "./paymentProvider.js";
import {
  MockBankTransferProvider,
  MockMastercardProvider,
  MockVisaProvider,
} from "./mockProviders.js";

const providers: Record<PaymentProviderId, PaymentProvider> = {
  mock_visa: new MockVisaProvider(),
  mock_mastercard: new MockMastercardProvider(),
  mock_bank_transfer: new MockBankTransferProvider(),
};

export function getPaymentProvider(providerId: PaymentProviderId): PaymentProvider {
  assertFinancialSafety();
  return providers[providerId];
}
