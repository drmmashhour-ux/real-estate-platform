/**
 * Global cross-region summary types — advisory / admin; no raw PII.
 */
import type { JurisdictionPolicyPack, NormalizedListing, PlatformRegionCode } from "@lecipm/platform-core";

export type GlobalRegionSnapshot = {
  regionCode: PlatformRegionCode | string;
  label: string;
  listingCountHint: number | null;
  bookingCountHint: number | null;
  trustScoreHint: number | null;
  legalRiskHint: number | null;
  blockedPublishHint: number | null;
  growthOpportunityHint: number | null;
  availabilityNotes: readonly string[];
};

export type GlobalMarketplaceSummary = {
  computedAt: string;
  regions: GlobalRegionSnapshot[];
  featureFlags: {
    globalMultiRegionV1: boolean;
    regionAdaptersV1: boolean;
  };
  syriaSummaryAvailable: boolean;
  webListingSampleCount: number | null;
  webSample: { items: NormalizedListing[]; notes: readonly string[] } | null;
  jurisdictionPacks: Record<string, JurisdictionPolicyPack>;
};

export type GlobalRegionSummary = {
  regionCode: string;
  capabilities: string[];
  listingSample: NormalizedListing[];
  notes: readonly string[];
  freshness: string;
};

export type GlobalListingIntelligence = {
  regionCode: string;
  listingId: string;
  normalized: NormalizedListing | null;
  intelligenceNotes: readonly string[];
};

export type GlobalRiskSummary = {
  regions: Array<{ regionCode: string; elevatedCount: number; notes: readonly string[] }>;
  freshness: string;
};

export type GlobalTrustSummary = {
  regions: Array<{ regionCode: string; trustAvailability: boolean; notes: readonly string[] }>;
  freshness: string;
};

export type GlobalGrowthSummary = {
  regions: Array<{ regionCode: string; opportunityUnits: number; notes: readonly string[] }>;
  freshness: string;
};

export type GlobalExecutionSummary = {
  regions: Array<{ regionCode: string; autonomyPreview: boolean; controlledExecution: boolean; notes: readonly string[] }>;
  freshness: string;
};
