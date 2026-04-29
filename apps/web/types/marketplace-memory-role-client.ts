/** Marketplace memory UI — role enum mirror. */

export type MarketplaceMemoryRole = "BUYER" | "RENTER" | "BROKER" | "INVESTOR";

export const MarketplaceMemoryRole = {
  BUYER: "BUYER" as MarketplaceMemoryRole,
  RENTER: "RENTER" as MarketplaceMemoryRole,
  BROKER: "BROKER" as MarketplaceMemoryRole,
  INVESTOR: "INVESTOR" as MarketplaceMemoryRole,
} as const;
