/**
 * Unified marketplace lead semantics — sources map into existing `Lead`, `FsboLead`, `BuyerRequest`, `MortgageRequest`.
 * Use these strings in `leadSource` / analytics for consistent reporting.
 */
export const MARKETPLACE_LEAD_SOURCES = {
  LISTING_CONTACT: "LISTING_CONTACT",
  PLATFORM_BROKER_REQUEST: "PLATFORM_BROKER_REQUEST",
  MORTGAGE_REQUEST: "MORTGAGE_REQUEST",
} as const;

export type MarketplaceLeadSource = (typeof MARKETPLACE_LEAD_SOURCES)[keyof typeof MARKETPLACE_LEAD_SOURCES];

/** Routing target for ops / automation (denormalized labels). */
export const MARKETPLACE_ROUTING_TARGETS = {
  LISTING_REP: "LISTING_REP",
  PLATFORM_BROKER: "PLATFORM_BROKER",
  MORTGAGE_EXPERT: "MORTGAGE_EXPERT",
} as const;
