/**
 * LECIPM ecosystem layers — structural map for product planning.
 * Describes capability groupings, not market power or competitive positioning.
 */

export const LAYER_CORE = "core" as const;
export const LAYER_INTELLIGENCE = "intelligence" as const;
export const LAYER_MARKETPLACE = "marketplace" as const;
export const LAYER_INFRASTRUCTURE = "infrastructure" as const;
export const LAYER_PARTNER = "partner" as const;

export const ECOSYSTEM_LAYER_IDS = [
  LAYER_CORE,
  LAYER_INTELLIGENCE,
  LAYER_MARKETPLACE,
  LAYER_INFRASTRUCTURE,
  LAYER_PARTNER,
] as const;

export type EcosystemLayerId = (typeof ECOSYSTEM_LAYER_IDS)[number];

export type EcosystemLayer = {
  id: EcosystemLayerId;
  title: string;
  summary: string;
  /** Representative capabilities — illustrative, not an exhaustive product spec. */
  capabilities: string[];
};

export const ECOSYSTEM_LAYERS: Record<EcosystemLayerId, EcosystemLayer> = {
  [LAYER_CORE]: {
    id: LAYER_CORE,
    title: "Core",
    summary: "Day-to-day operating system for relationship and pipeline work.",
    capabilities: ["CRM", "Deals", "Messaging"],
  },
  [LAYER_INTELLIGENCE]: {
    id: LAYER_INTELLIGENCE,
    title: "Intelligence",
    summary: "Assistive analytics and ranking — human decisions stay in the loop.",
    capabilities: ["AI assistance", "Scoring", "Recommendations"],
  },
  [LAYER_MARKETPLACE]: {
    id: LAYER_MARKETPLACE,
    title: "Marketplace",
    summary: "Discovery and transaction surfaces that connect supply and demand.",
    capabilities: ["Leads", "Listings", "Transactions"],
  },
  [LAYER_INFRASTRUCTURE]: {
    id: LAYER_INFRASTRUCTURE,
    title: "Infrastructure",
    summary: "Composability and interoperability so teams can adopt incrementally.",
    capabilities: ["APIs", "Integrations"],
  },
  [LAYER_PARTNER]: {
    id: LAYER_PARTNER,
    title: "Partner layer",
    summary: "Channels and service providers that extend reach without replacing user agency.",
    capabilities: ["Brokers", "Agencies", "Services"],
  },
};
