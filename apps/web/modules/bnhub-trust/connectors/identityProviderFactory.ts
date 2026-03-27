import type { IdentityProviderAdapter } from "./identityProviderTypes";
import { StripeIdentityAdapter } from "./stripeIdentityAdapter";

const stripe = new StripeIdentityAdapter();

export function getIdentityProvider(id: "stripe_identity" | "manual" = "stripe_identity"): IdentityProviderAdapter {
  if (id === "stripe_identity") return stripe;
  return stripe;
}
