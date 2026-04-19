/**
 * `[lead:geo]` / `[lead:enrichment]` — never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG_GEO = "[lead:geo]";
const LOG_ENRICH = "[lead:enrichment]";

export type LeadGeoMonitoringSnapshot = {
  geoRoutingApplied: number;
  geoFallbackNoStrongMatch: number;
  geoStrictPoolUsed: number;
};

export type LeadEnrichmentMonitoringSnapshot = {
  enrichmentsBuilt: number;
};

let geoState: LeadGeoMonitoringSnapshot = {
  geoRoutingApplied: 0,
  geoFallbackNoStrongMatch: 0,
  geoStrictPoolUsed: 0,
};

let enrichState: LeadEnrichmentMonitoringSnapshot = {
  enrichmentsBuilt: 0,
};

export function getLeadGeoMonitoringSnapshot(): LeadGeoMonitoringSnapshot {
  return { ...geoState };
}

export function getLeadEnrichmentMonitoringSnapshot(): LeadEnrichmentMonitoringSnapshot {
  return { ...enrichState };
}

export function resetLeadGeoEnrichmentMonitoringForTests(): void {
  geoState = {
    geoRoutingApplied: 0,
    geoFallbackNoStrongMatch: 0,
    geoStrictPoolUsed: 0,
  };
  enrichState = { enrichmentsBuilt: 0 };
}

export function recordLeadGeoRouting(meta: {
  matchType: string;
  fallback: boolean;
  strictPool: boolean;
}): void {
  try {
    geoState.geoRoutingApplied += 1;
    if (meta.fallback) geoState.geoFallbackNoStrongMatch += 1;
    if (meta.strictPool) geoState.geoStrictPoolUsed += 1;
    logInfo(`${LOG_GEO} routing`, meta);
  } catch {
    /* noop */
  }
}

export function recordLeadEnrichmentBuilt(meta: {
  completenessScore: number;
  hasCity: boolean;
  hasProvince: boolean;
}): void {
  try {
    enrichState.enrichmentsBuilt += 1;
    logInfo(`${LOG_ENRICH} built`, meta);
  } catch {
    /* noop */
  }
}
