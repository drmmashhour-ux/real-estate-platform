import type { MarketplacePersona } from "@prisma/client";

/** Personas users can pick during marketplace onboarding (not `UNSET`). */
export const ONBOARDING_MARKETPLACE_PERSONAS = [
  "BUYER",
  "SELLER_DIRECT",
  "BROKER",
  "MORTGAGE_BROKER",
] as const satisfies readonly MarketplacePersona[];

export type OnboardingMarketplacePersona = (typeof ONBOARDING_MARKETPLACE_PERSONAS)[number];

const SET = new Set<string>(ONBOARDING_MARKETPLACE_PERSONAS);

export function isOnboardingMarketplacePersona(v: string): v is OnboardingMarketplacePersona {
  return SET.has(v);
}

/** Default dashboard URL after onboarding / deep links. */
export function dashboardPathForPersona(p: MarketplacePersona): string {
  switch (p) {
    case "BUYER":
      return "/dashboard/buyer";
    case "SELLER_DIRECT":
      return "/dashboard/seller";
    case "BROKER":
      return "/dashboard/broker";
    case "MORTGAGE_BROKER":
      return "/dashboard/mortgage";
    default:
      return "/dashboard";
  }
}
