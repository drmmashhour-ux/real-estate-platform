/**
 * Global dashboard augmentation — Syria regional slices + deterministic comparison rows (read-only).
 */
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import type {
  MarketplaceGrowthSummary,
  MarketplaceKpiSummary,
  MarketplaceRiskSummary,
  RegionComparisonRow,
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
};

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
  };
}
