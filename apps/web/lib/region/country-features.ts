import type { CountryDefinition } from "@/config/countries";

export function isBnhubEnabled(country: CountryDefinition | undefined): boolean {
  return country?.features.BNHub ?? true;
}

export function isBuySellEnabled(country: CountryDefinition | undefined): boolean {
  return country?.features.BuySell ?? true;
}

export function isMortgageHubEnabled(country: CountryDefinition | undefined): boolean {
  return country?.features.mortgageHub ?? true;
}

export function isInsuranceHubEnabled(country: CountryDefinition | undefined): boolean {
  return country?.features.insuranceHub ?? true;
}
