import type { CountryDefinition } from "@/config/countries";

/** Stripe Connect / Checkout is enabled only for markets configured with the Stripe provider. */
export function isStripeEnabledForCountry(country: CountryDefinition | undefined): boolean {
  if (!country) return true;
  return country.paymentProvider === "stripe";
}
