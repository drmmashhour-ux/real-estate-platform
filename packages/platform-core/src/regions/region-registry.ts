/**
 * Deterministic region registry — extend by appending to REGION_REGISTRY only.
 */

import type { PlatformRegionCode, RegionDefinition } from "./region.types";

const CA_QC: RegionDefinition = {
  code: "ca_qc",
  group: "canada",
  label: "Canada — Québec",
  appTarget: "web",
  defaultLocale: "fr-CA",
  supportedLocales: ["fr-CA", "en-CA"],
  currency: "CAD",
  capabilities: {
    legalHub: true,
    fraudEngine: true,
    trustScoring: true,
    autonomousPreview: true,
    controlledExecution: true,
    payouts: true,
    bnhub: true,
    brokerFlow: true,
    rentalFlow: true,
    shortTermRentalFlow: true,
  },
};

const SY: RegionDefinition = {
  code: "sy",
  group: "middle_east",
  label: "Syria",
  appTarget: "syria",
  defaultLocale: "ar-SY",
  supportedLocales: ["ar-SY", "en"],
  currency: "USD",
  capabilities: {
    legalHub: false,
    fraudEngine: true,
    trustScoring: true,
    autonomousPreview: true,
    controlledExecution: false,
    payouts: false,
    bnhub: false,
    brokerFlow: false,
    rentalFlow: false,
    shortTermRentalFlow: true,
  },
};

/** Fixed order for stable serialization — sorted by code. */
export const REGION_REGISTRY: readonly RegionDefinition[] = [CA_QC, SY].sort((a, b) =>
  a.code.localeCompare(b.code),
);

export type RegionCapabilityKey = keyof RegionDefinition["capabilities"];

export function getRegionDefinition(regionCode: string): RegionDefinition | null {
  const raw = typeof regionCode === "string" ? regionCode.trim().toLowerCase() : "";
  const normalized =
    raw === "syria" ? "sy"
    : raw === "qc" || raw === "quebec" ? "ca_qc"
    : raw === "canada" ? "ca_rest"
    : raw;
  const hit = REGION_REGISTRY.find((r) => r.code === normalized);
  return hit ?? null;
}

export function getRegionsByAppTarget(appTarget: RegionDefinition["appTarget"]): RegionDefinition[] {
  return REGION_REGISTRY.filter((r) => r.appTarget === appTarget || r.appTarget === "shared").sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

/** Regions hosted by the primary web app (excludes dedicated regional apps unless marked shared). */
export function listWebHostedRegions(): RegionDefinition[] {
  return REGION_REGISTRY.filter((r) => r.appTarget === "web" || r.appTarget === "shared").sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

export function isRegionCapabilityEnabled(regionCode: string, capability: RegionCapabilityKey): boolean {
  const def = getRegionDefinition(regionCode);
  if (!def) return false;
  return def.capabilities[capability] === true;
}

/** Safe default when resolution fails — Québec primary web market. */
export const DEFAULT_PLATFORM_REGION_CODE: PlatformRegionCode = "ca_qc";
