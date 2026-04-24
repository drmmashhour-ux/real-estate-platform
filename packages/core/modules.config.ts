/**
 * High-level product modules (AI Intelligence, Marketplace, Investor).
 * Used for routing, entitlements, and integration metadata — not runtime auth.
 */

export const PLATFORM_MODULE_IDS = {
  AI_INTELLIGENCE: "ai_intelligence",
  MARKETPLACE: "marketplace",
  INVESTOR: "investor",
} as const;

export type PlatformModuleId = (typeof PLATFORM_MODULE_IDS)[keyof typeof PLATFORM_MODULE_IDS];

export type PlatformModuleConfig = {
  id: PlatformModuleId;
  label: string;
  description: string;
  /** Related internal service keys (see @lecipm/api/internal). */
  services: ("leads" | "deals" | "messaging" | "analytics")[];
};

export const PLATFORM_MODULES: readonly PlatformModuleConfig[] = [
  {
    id: PLATFORM_MODULE_IDS.AI_INTELLIGENCE,
    label: "AI Intelligence",
    description: "Scoring, recommendations, and assistive workflows across CRM and deals.",
    services: ["analytics", "messaging"],
  },
  {
    id: PLATFORM_MODULE_IDS.MARKETPLACE,
    label: "Marketplace",
    description: "Listings, demand, and transaction surfaces that connect participants.",
    services: ["leads", "deals"],
  },
  {
    id: PLATFORM_MODULE_IDS.INVESTOR,
    label: "Investor",
    description: "Investor-facing pipelines, packets, and capital-room experiences.",
    services: ["deals", "analytics"],
  },
] as const;

export function getModuleById(id: PlatformModuleId): PlatformModuleConfig | undefined {
  return PLATFORM_MODULES.find((m) => m.id === id);
}
