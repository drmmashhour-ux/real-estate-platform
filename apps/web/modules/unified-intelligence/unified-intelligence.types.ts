/** Cross-app listing intelligence — Syria is isolated by `source` + `regionCode`; web remains default path. */

import type { RegionListingRef } from "@/modules/integrations/regions/region-listing-key.types";
import type { RegionCapabilities } from "@lecipm/platform-core";

export type UnifiedListingSource = "web" | "syria" | "external";

export type UnifiedListingSourceStatusKey = "syria" | "web";

export type ListingSourceAvailability = "available" | "missing";

export type UnifiedListingIntelligence = {
  listingId: string;
  source: UnifiedListingSource;
  /** Mirrors `source` for global dashboards — explicit app attribution. */
  sourceApp?: UnifiedListingSource;
  /** Stable cross-region identity when `FEATURE_REGION_LISTING_KEY_V1` is enabled. */
  regionListingRef: RegionListingRef | null;
  regionCode?: string;
  /** Resolved from `@lecipm/platform-core` registry when region code known. */
  regionCapabilities?: Partial<RegionCapabilities>;
  /** Jurisdiction policy pack availability — advisory only. */
  jurisdictionNotes?: readonly string[];
  priceHint: number | null;
  currencyHint: string | null;
  statusHint: string | null;
  fraudFlag: boolean;
  featuredHint: boolean;
  bookingCounts: {
    total: number;
    fraudBookings: number;
    guestPaid: number;
    payoutPending: number;
    payoutPaid: number;
    cancelled: number;
  };
  payoutPipeline: {
    pendingHint: number;
    paidHint: number;
    approvedHint: number;
    notes: string[];
  };
  /** Syrian aggregate admin snapshot when source is Syria (optional subset). */
  syriaRegionSummaryAttached: boolean;
  sourceStatus: Partial<Record<UnifiedListingSourceStatusKey, ListingSourceAvailability>>;
  availabilityNotes: string[];
};

/** Canonical read-model entity kinds — advisory grouping only. */
export type UnifiedEntityType = "listing" | "user" | "legal_record" | "workflow" | "run" | "action";

/**
 * Single-pane listing intelligence (serialized facets — no duplicate CRM vs Syria rows).
 * Prefer this shape for admin “source of truth” panels; keep `UnifiedListingIntelligence` for CRM listing signals.
 */
export type UnifiedListingReadModel = {
  listingId: string;
  source: UnifiedListingSource;
  observation?: Record<string, unknown>;
  preview?: Record<string, unknown>;
  compliance?: Record<string, unknown>;
  legalRisk?: Record<string, unknown>;
  trust?: Record<string, unknown>;
  ranking?: Record<string, unknown>;
  growth?: Record<string, unknown>;
  governance?: Record<string, unknown>;
  execution?: Record<string, unknown>;
  auditSummary?: Record<string, unknown>;
  freshness: string;
  availabilityNotes: string[];
  sourceStatus: UnifiedIntelligenceSourceStatus;
};

export type UnifiedEntityIntelligence = {
  entityType: UnifiedEntityType;
  entityId: string;
  facets: Record<string, Record<string, unknown> | undefined>;
  freshness: string;
  availabilityNotes: string[];
  sourceStatus: UnifiedIntelligenceSourceStatus;
};

export type UnifiedIntelligenceSummary = {
  freshness: string;
  recentListingIds: string[];
  canonicalRunCountHint: number;
  flags: {
    autonomousMarketplace: boolean;
    controlledExecution: boolean;
    unifiedReadModel: boolean;
  };
  availabilityNotes: string[];
};

export type UnifiedIntelligenceSourceStatus = {
  canonicalRuns: "available" | "missing" | "partial";
  eventTimeline: "available" | "missing" | "partial";
  legalTrust: "available" | "missing" | "partial";
  notes: string[];
};
