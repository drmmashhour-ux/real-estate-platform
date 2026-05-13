import type { PaymentProvider } from "./types.js";
import { MockPaymentProvider } from "./mockProvider.js";
import { config } from "../config.js";

export type { PaymentProvider } from "./types.js";
export { MockPaymentProvider } from "./mockProvider.js";

const REQUIRED_FINANCIAL_MODE = "mock";

function assertPaymentServiceMockMode(): void {
  const mode = (process.env["SYBNB_FINANCIAL_MODE"] ?? REQUIRED_FINANCIAL_MODE).trim().toLowerCase();
  if (mode !== REQUIRED_FINANCIAL_MODE || config.stripeSecretKey) {
    throw new Error(
      "Payment service is locked to mock mode. Live Stripe/card/bank provider initialization is disabled.",
    );
  }
}

/** Resolve the active payment provider. Live providers are disabled; mock mode is mandatory. */
export function getPaymentProvider(): PaymentProvider {
  assertPaymentServiceMockMode();
  return new MockPaymentProvider();
}
