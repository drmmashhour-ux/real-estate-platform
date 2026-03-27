import type { MarketplacePersona, PlatformRole } from "@prisma/client";

const PROTECTED_FROM_PERSONA_DOWNGRADE: ReadonlySet<PlatformRole> = new Set([
  "ADMIN",
  "BROKER",
  "MORTGAGE_EXPERT",
  "MORTGAGE_BROKER",
  "HOST",
  "DEVELOPER",
  "ACCOUNTANT",
]);

/**
 * When onboarding sets `marketplacePersona`, align `PlatformRole` for marketplace users.
 * Does not downgrade professional roles when the persona is consumer-only (buyer / DIY seller).
 */
export function derivePlatformRoleFromPersona(
  persona: MarketplacePersona,
  current: PlatformRole
): PlatformRole | null {
  if (current === "ADMIN") return null;

  switch (persona) {
    case "BUYER":
      if (PROTECTED_FROM_PERSONA_DOWNGRADE.has(current)) return null;
      return "BUYER";
    case "SELLER_DIRECT":
      if (PROTECTED_FROM_PERSONA_DOWNGRADE.has(current)) return null;
      return "SELLER_DIRECT";
    case "BROKER":
      if (current === "BROKER") return null;
      return "BROKER";
    case "MORTGAGE_BROKER":
      if (current === "MORTGAGE_EXPERT" || current === "MORTGAGE_BROKER") return null;
      return "MORTGAGE_BROKER";
    default:
      return null;
  }
}
