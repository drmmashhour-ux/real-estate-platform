/**
 * Global dashboard augmentation — Syria regional slices + deterministic comparison rows (read-only).
 */
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import {
  buildGlobalMarketplaceSummary,
  buildGlobalRegionSummary,
  getGlobalUnifiedIntelligenceSnapshot,
} from "@/modules/global-intelligence/global-unified-intelligence.service";
import type {
  GlobalExecutionSummary,
  GlobalMarketplaceSummary,
  GlobalRegionSummary,
  GlobalRiskSummary,
  GlobalTrustSummary,
  GlobalGrowthSummary,
} from "@/modules/global-intelligence/global-intelligence.types";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";
import { isRegionCapabilityEnabled, REGION_REGISTRY } from "@lecipm/platform-core";
import { listAvailableRegionAdapters } from "@/modules/integrations/regions/region-adapter-registry";
import type {
  MarketplaceGrowthSummary,
  MarketplaceKpiSummary,
  MarketplaceRiskSummary,
  RegionComparisonRow,
  SyriaGovernanceDashboardSlice,
  SyriaPolicySummarySlice,
  SyriaSignalDashboardRollup,
} from "@/modules/dashboard-intelligence/dashboard-intelligence.types";
import { listListingsSummary } from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { buildSyriaTrustRiskOverlay } from "@/modules/integrations/regions/syria/syria-region-trust-risk.service";
import { SYRIA_PAYOUT_PENDING_DOMINANCE } from "@/modules/integrations/regions/syria/syria-signal-thresholds";
import type { SyriaRegionSummary } from "@/modules/integrations/regions/syria/syria-region.types";

async function safeWebListingCount(): Promise<number | null> {
  try {
    return await prisma.listing.count();
  } catch {
    return null;
  }
}

export type SyriaDashboardAugmentation = {
  kpisSyria: MarketplaceKpiSummary["syria"];
  riskSyria: MarketplaceRiskSummary["syria"];
  growthSyria: MarketplaceGrowthSummary["syria"];
  regionComparison: RegionComparisonRow[];
  syriaSignalRollup: SyriaSignalDashboardRollup | null;
  syriaPolicySummary: SyriaPolicySummarySlice | null;
  syriaGovernanceSlice: SyriaGovernanceDashboardSlice | null;
};

/** Aggregate dashboard proxy — maps SQL counts to same decision literals as listing preview policy (heuristic). */
function buildSyriaPolicySummarySlice(summary: SyriaRegionSummary): SyriaPolicySummarySlice {
  let worstCasePolicy: SyriaPolicySummarySlice["worstCasePolicy"] = "allow_preview";
  if (summary.fraudFlaggedListings > 0) worstCasePolicy = "requires_local_approval";
  else if (summary.pendingReviewListings > 0) worstCasePolicy = "requires_local_approval";

  const requiresHumanReviewLikely = worstCasePolicy !== "allow_preview";

  return {
    worstCasePolicy,
    liveExecutionBlocked: true,
    requiresHumanReviewLikely,
    notes: [
      "dashboard_syria_policy_summary_uses_aggregate_sql_proxies",
      `fraud_flagged_listings=${summary.fraudFlaggedListings}`,
      `pending_review_listings=${summary.pendingReviewListings}`,
      requiresHumanReviewLikely ? "requires_human_review_likely_true" : "requires_human_review_likely_false",
      "approval_boundary_dashboard_proxy:live_execution_blocked_always_true_for_sy_web",
    ],
  };
}

function buildSyriaGovernanceDashboardSlice(summary: SyriaRegionSummary): SyriaGovernanceDashboardSlice {
  const fraud = summary.fraudFlaggedListings;
  const pending = summary.pendingReviewListings;
  const total = summary.totalListings;
  return {
    requiresApprovalCount: pending + fraud,
    fraudFlaggedCount: fraud,
    blockedForRegionCount: total,
    previewableCount: total,
    notes: [
      "governance_slice_uses_regional_sql_aggregates",
      "requiresApprovalCount_may_double_count_overlapping_fraud_and_pending",
      "blockedForRegionCount_equals_totalListings_execution_path_blocked_for_region_phase",
      "previewableCount_equals_totalListings_dry_run_preview_scope",
    ],
  };
}

function buildSyriaSignalRollup(summary: SyriaRegionSummary, payoutStress: boolean): SyriaSignalDashboardRollup {
  const fraud = summary.fraudFlaggedListings;
  const stale = summary.stalePublishedListings;
  const pending = summary.pendingReviewListings;
  const payoutWarningUnit = payoutStress ? 1 : 0;
  return {
    signalsBySeverity: {
      critical: fraud,
      warning: pending + payoutWarningUnit,
      info: stale,
    },
    fraudSignalListingCount: fraud,
    staleListingCount: stale,
    highRiskListingCount: fraud + pending,
    notes: [
      "syria_signal_rollup_uses_sql_proxies_not_per_listing_engine_sum",
      "warning_proxy_counts_pending_review_plus_optional_payout_stress_unit",
    ],
  };
}

export async function buildSyriaDashboardAugmentation(): Promise<SyriaDashboardAugmentation> {
  if (!engineFlags.syriaRegionAdapterV1) {
    return {
      kpisSyria: undefined,
      riskSyria: undefined,
      growthSyria: undefined,
      regionComparison: [],
      syriaSignalRollup: null,
      syriaPolicySummary: null,
      syriaGovernanceSlice: null,
    };
  }

  const { summary, raw, availabilityNotes } = await listListingsSummary();
  const webListings = await safeWebListingCount();
  const baseNotes = availabilityNotes ?? [];

  if (!summary || !raw) {
    const emptyKpi: NonNullable<MarketplaceKpiSummary["syria"]> = {
      totalListings: 0,
      pendingReviewListings: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      stalePublishedListings: 0,
      totalBookings: 0,
      bnhubStaysListings: 0,
      bookingGrossHint: null,
      payoutsPending: 0,
      payoutsApproved: 0,
      payoutsPaid: 0,
      listingPaymentsVerifiedHint: 0,
      availability: "unavailable",
      notes: baseNotes,
    };
    const comparison: RegionComparisonRow[] = [];
    if (typeof webListings === "number") {
      comparison.push({
        regionCode: "web_crm",
        label: "Web CRM listings (count)",
        totalListings: webListings,
        pendingReview: 0,
        featuredListings: 0,
        fraudFlaggedListings: 0,
        bookings: 0,
        notes: ["crm_scope_listing_table_only"],
      });
    }
    comparison.push({
      regionCode: "sy",
      label: "Syria region",
      totalListings: 0,
      pendingReview: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      bookings: 0,
      notes: ["syria_adapter_no_aggregate_snapshot"],
    });

    return {
      kpisSyria: emptyKpi,
      syriaPolicySummary: null,
      syriaGovernanceSlice: {
        requiresApprovalCount: 0,
        fraudFlaggedCount: 0,
        blockedForRegionCount: 0,
        previewableCount: 0,
        notes: ["syria_adapter_no_aggregate_snapshot"],
      },
      riskSyria: {
        fraudFlaggedListings: 0,
        elevatedFraudHint: false,
        reviewBacklogHint: false,
        payoutStressHint: false,
        normalizedRiskTags: ["syria_data_unavailable"],
        notes: baseNotes,
      },
      growthSyria: {
        bookingVolumeHint: null,
        bnhubStaysListings: 0,
        payoutPipelinePending: 0,
        cancelledBookings: 0,
        notes: baseNotes,
      },
      regionComparison: comparison.sort((a, b) => a.regionCode.localeCompare(b.regionCode)),
      syriaSignalRollup: {
        signalsBySeverity: { critical: 0, warning: 0, info: 0 },
        fraudSignalListingCount: 0,
        staleListingCount: 0,
        highRiskListingCount: 0,
        notes: ["syria_adapter_no_aggregate_snapshot"],
      },
    };
  }

  const overlay = buildSyriaTrustRiskOverlay(summary);
  const payoutStress =
    summary.payoutsPending >= summary.payoutsPaid + SYRIA_PAYOUT_PENDING_DOMINANCE && summary.payoutsPending > 0;

  const kpisSyria: NonNullable<MarketplaceKpiSummary["syria"]> = {
    totalListings: summary.totalListings,
    pendingReviewListings: summary.pendingReviewListings,
    featuredListings: summary.featuredListings,
    fraudFlaggedListings: summary.fraudFlaggedListings,
    stalePublishedListings: summary.stalePublishedListings,
    totalBookings: summary.totalBookings,
    bnhubStaysListings: summary.bnhubStaysListings,
    bookingGrossHint: summary.bookingGrossHint,
    payoutsPending: summary.payoutsPending,
    payoutsApproved: summary.payoutsApproved,
    payoutsPaid: summary.payoutsPaid,
    listingPaymentsVerifiedHint: summary.listingPaymentsVerifiedHint,
    availability: "available",
    notes: [...baseNotes],
  };

  const riskSyria: NonNullable<MarketplaceRiskSummary["syria"]> = {
    fraudFlaggedListings: summary.fraudFlaggedListings,
    elevatedFraudHint: overlay.fraudElevatedHint,
    reviewBacklogHint: overlay.reviewBacklogHint,
    payoutStressHint: overlay.payoutPipelineStressHint,
    normalizedRiskTags: overlay.normalizedRiskTags,
    notes: [...overlay.normalizedRiskTags.map((t) => `risk_tag:${t}`)],
  };

  const growthSyria: NonNullable<MarketplaceGrowthSummary["syria"]> = {
    bookingVolumeHint: summary.bookingGrossHint,
    bnhubStaysListings: summary.bnhubStaysListings,
    payoutPipelinePending: summary.payoutsPending,
    cancelledBookings: summary.cancelledBookings,
    notes: summary.bnhubStaysListings > 0 ? ["bnhub_stays_properties_present"] : [],
  };

  const comparison: RegionComparisonRow[] = [];
  if (typeof webListings === "number") {
    comparison.push({
      regionCode: "web_crm",
      label: "Web CRM listings (count)",
      totalListings: webListings,
      pendingReview: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      bookings: 0,
      notes: ["crm_scope_listing_table_only"],
    });
  }
  comparison.push({
    regionCode: "sy",
    label: "Syria region",
    totalListings: summary.totalListings,
    pendingReview: summary.pendingReviewListings,
    featuredListings: summary.featuredListings,
    fraudFlaggedListings: summary.fraudFlaggedListings,
    bookings: summary.totalBookings,
    notes: ["syria_syria_properties_scope"],
  });

  return {
    kpisSyria,
    riskSyria,
    growthSyria,
    regionComparison: comparison.sort((a, b) => a.regionCode.localeCompare(b.regionCode)),
    syriaSignalRollup: buildSyriaSignalRollup(summary, payoutStress),
    syriaPolicySummary: buildSyriaPolicySummarySlice(summary),
    syriaGovernanceSlice: buildSyriaGovernanceDashboardSlice(summary),
  };
}

export type GlobalInvestorDashboard = {
  marketplace: GlobalMarketplaceSummary | null;
  syriaAugmentation: SyriaDashboardAugmentation;
  regionRows: GlobalRegionSummary[];
  freshness: string;
  availabilityNotes: readonly string[];
};

export async function buildGlobalInvestorDashboard(): Promise<GlobalInvestorDashboard> {
  const freshness = new Date().toISOString();
  const notes: string[] = [];
  let marketplace: GlobalMarketplaceSummary | null = null;
  try {
    if (engineFlags.globalDashboardV1) {
      marketplace = await buildGlobalMarketplaceSummary();
    }
  } catch {
    notes.push("global_marketplace_summary_failed");
  }

  let syriaAugmentation: SyriaDashboardAugmentation = {
    kpisSyria: undefined,
    riskSyria: undefined,
    growthSyria: undefined,
    regionComparison: [],
    syriaSignalRollup: null,
    syriaPolicySummary: null,
    syriaGovernanceSlice: null,
  };
  try {
    syriaAugmentation = await buildSyriaDashboardAugmentation();
  } catch {
    notes.push("syria_dashboard_augmentation_failed");
  }

  const regionRows: GlobalRegionSummary[] = [];
  try {
    if (engineFlags.regionAdaptersV1) {
      for (const b of listAvailableRegionAdapters()) {
        const row = await buildGlobalRegionSummary(String(b.regionCode));
        regionRows.push(row);
      }
      regionRows.sort((a, b) => a.regionCode.localeCompare(b.regionCode));
    }
  } catch {
    notes.push("region_summaries_partial_failure");
  }

  return {
    marketplace,
    syriaAugmentation,
    regionRows,
    freshness,
    availabilityNotes: notes,
  };
}

export async function buildRegionComparisonSummary(): Promise<GlobalMarketplaceSummary | null> {
  try {
    return await buildGlobalMarketplaceSummary();
  } catch {
    return null;
  }
}

export async function buildRegionRiskComparison(): Promise<GlobalRiskSummary> {
  const snap = await getGlobalUnifiedIntelligenceSnapshot().catch(() => null);
  const freshness = new Date().toISOString();
  if (!snap) {
    return { regions: [], freshness };
  }
  const fraudCount = snap.syria.regionSummary?.fraudFlaggedListings ?? 0;
  const flaggedElevated = snap.syria.flaggedListingRefs.filter((x) => x.riskScore > 0).length;
  const regions = [
    {
      regionCode: "sy",
      elevatedCount: Math.max(fraudCount, flaggedElevated),
      notes: [...snap.syria.availabilityNotes],
    },
  ].sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { regions, freshness };
}

export async function buildRegionGrowthComparison(): Promise<GlobalGrowthSummary> {
  const freshness = new Date().toISOString();
  try {
    const aug = await buildSyriaDashboardAugmentation();
    const opp =
      aug.growthSyria?.bookingVolumeHint != null ? Math.min(100, aug.growthSyria.bnhubStaysListings + 1) : 0;
    return {
      regions: [{ regionCode: "sy", opportunityUnits: opp, notes: aug.growthSyria?.notes ?? [] }],
      freshness,
    };
  } catch {
    return { regions: [], freshness };
  }
}

export async function buildTrustComparisonSummary(): Promise<GlobalTrustSummary> {
  const freshness = new Date().toISOString();
  const regions: GlobalTrustSummary["regions"] = [];
  try {
    for (const b of listAvailableRegionAdapters()) {
      const enabled = isRegionCapabilityEnabled(String(b.regionCode), "trustScoring");
      regions.push({
        regionCode: String(b.regionCode),
        trustAvailability: enabled && b.adapter !== null,
        notes: enabled ? ["trust_capability_on"] : ["trust_capability_off"],
      });
    }
  } catch {
    /* empty */
  }
  regions.sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { regions, freshness };
}

export async function buildGlobalExecutionSummary(): Promise<GlobalExecutionSummary> {
  const freshness = new Date().toISOString();
  const regions: GlobalExecutionSummary["regions"] = REGION_REGISTRY.map((def) => ({
    regionCode: def.code,
    autonomousPreview: def.capabilities.autonomousPreview,
    controlledExecution: def.capabilities.controlledExecution,
    notes: [...getJurisdictionPolicyPack(def.code).notes],
  })).sort((a, b) => a.regionCode.localeCompare(b.regionCode));
  return { regions, freshness };
}
