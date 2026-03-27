/**
 * Global Legal Hub System – config per hub.
 * Unified structure: verification, contracts, disclosure, onboarding.
 */

export type HubKey = "bnhub" | "realestate" | "luxury" | "broker" | "projects";

export type HubConfig = {
  key: HubKey;
  requiresHostVerification?: boolean;
  requiresBroker?: boolean;
  requiresVerification?: boolean;
  requiresPremiumApproval?: boolean;
  requiresDeveloperVerification?: boolean;
  requiresContract?: boolean;
  requiresDisclosure?: boolean;
  requiresInvestmentInfo?: boolean;
  /** Admin must approve listing before public */
  requiresListingApproval?: boolean;
  /** Standard sections every hub must have */
  sections: ("dashboard" | "listings" | "onboarding" | "analytics" | "contracts")[];
  /** UI theme key (matches lib/hub/themes) */
  themeKey: string;
};

export const BNHUB: HubConfig = {
  key: "bnhub",
  requiresHostVerification: true,
  requiresContract: true,
  requiresListingApproval: false,
  sections: ["dashboard", "listings", "onboarding", "analytics", "contracts"],
  themeKey: "bnhub",
};

export const REALESTATE: HubConfig = {
  key: "realestate",
  requiresBroker: true,
  requiresDisclosure: true,
  requiresContract: true,
  requiresListingApproval: true,
  sections: ["dashboard", "listings", "onboarding", "analytics", "contracts"],
  themeKey: "realEstate",
};

export const LUXURY: HubConfig = {
  key: "luxury",
  requiresVerification: true,
  requiresPremiumApproval: true,
  requiresDisclosure: true,
  requiresListingApproval: true,
  sections: ["dashboard", "listings", "onboarding", "analytics", "contracts"],
  themeKey: "luxury",
};

export const BROKER: HubConfig = {
  key: "broker",
  requiresBroker: true,
  requiresContract: true,
  requiresListingApproval: false,
  sections: ["dashboard", "listings", "onboarding", "analytics", "contracts"],
  themeKey: "broker",
};

export const PROJECTS: HubConfig = {
  key: "projects",
  requiresDeveloperVerification: true,
  requiresInvestmentInfo: true,
  requiresDisclosure: true,
  requiresContract: true,
  requiresListingApproval: true,
  sections: ["dashboard", "listings", "onboarding", "analytics", "contracts"],
  themeKey: "projects",
};

export const HUB_CONFIGS: Record<HubKey, HubConfig> = {
  bnhub: BNHUB,
  realestate: REALESTATE,
  luxury: LUXURY,
  broker: BROKER,
  projects: PROJECTS,
};

export function getHubConfig(hub: string): HubConfig | null {
  const key = hub.toLowerCase() as HubKey;
  return HUB_CONFIGS[key] ?? null;
}

/** Hub accent colors for UI standardization (BNHub → red, Real Estate → blue, etc.) */
export const HUB_COLORS: Record<string, { primary: string; name: string }> = {
  bnhub: { primary: "#ff5a5f", name: "red" },
  realEstate: { primary: "#1e3a8a", name: "blue" },
  luxury: { primary: "#C9A96E", name: "gold" },
  broker: { primary: "#111827", name: "dark" },
  projects: { primary: "#14b8a6", name: "green" },
};
