import type { PaymentProvider } from "./types.js";
import { MockPaymentProvider } from "./mockProvider.js";
import { createStripeProvider } from "./stripeProvider.js";
import { config } from "../config.js";

export type { PaymentProvider } from "./types.js";
export { MockPaymentProvider } from "./mockProvider.js";
export { createStripeProvider } from "./stripeProvider.js";

/** Resolve the active payment provider (Stripe if configured, else mock). */
export function getPaymentProvider(): PaymentProvider {
  if (config.stripeSecretKey) {
    return createStripeProvider(config.stripeSecretKey);
  }
  return new MockPaymentProvider();
}
