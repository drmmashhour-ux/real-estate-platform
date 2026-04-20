import { engineFlags } from "@/config/feature-flags";
import { buildSyriaDashboardAugmentation } from "@/modules/global-intelligence/global-dashboard.service";
import { getSyriaCapabilityNotes, canSyriaUsePreview } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import type {
  DashboardHealthLevel,
  MarketplaceDashboardSummary,
  MarketplaceGrowthSummary,
  MarketplaceKpiSummary,
  MarketplaceRiskSummary,
} from "./dashboard-intelligence.types";

function emptyKpis(): MarketplaceKpiSummary {
  return {
    activeListingHint: null,
    blockedActionHint: null,
    automationDryRunRatioHint: null,
    notes: ["aggregates_not_configured"],
  };
}

function emptyRisk(): MarketplaceRiskSummary {
  return {
    elevatedLegalRiskHint: false,
    complianceHoldHint: false,
    notes: ["no_live_risk_feed_wired"],
  };
}

export function buildMarketplaceHealthSummary(): DashboardHealthLevel {
  if (!engineFlags.autonomousMarketplaceV1) return "unknown";
  if (engineFlags.controlledExecutionV1 && !engineFlags.autonomyApprovalsV1) return "degraded";
  return "healthy";
}

export function buildMarketplaceKpiSummary(): MarketplaceKpiSummary {
  return emptyKpis();
}

export function buildMarketplaceRiskSummary(): MarketplaceRiskSummary {
  return emptyRisk();
}

export async function buildMarketplaceDashboardSummary(): Promise<MarketplaceDashboardSummary> {
  const health = buildMarketplaceHealthSummary();
  const aug = await buildSyriaDashboardAugmentation();
  const syriaCapabilityNotes = getSyriaCapabilityNotes();
  const syriaPreviewAvailable = canSyriaUsePreview();

  const kpis: MarketplaceKpiSummary = {
    ...buildMarketplaceKpiSummary(),
    ...(aug.kpisSyria !== undefined ? { syria: aug.kpisSyria } : {}),
  };
  const risk: MarketplaceRiskSummary = {
    ...buildMarketplaceRiskSummary(),
    ...(aug.riskSyria !== undefined ? { syria: aug.riskSyria } : {}),
  };
  const growth: MarketplaceGrowthSummary = {
    growthMachineEnabled: engineFlags.growthMachineV1,
    notes: [],
    ...(aug.growthSyria !== undefined ? { syria: aug.growthSyria } : {}),
  };

  return {
    health,
    kpis,
    risk,
    trust: {
      trustFloorActiveHint: engineFlags.trustIndicatorsV1,
      notes: [],
    },
    growth,
    legal: {
      legalIntelRouteAvailable: true,
      notes: [],
    },
    automation: {
      autonomousMarketplaceEnabled: engineFlags.autonomousMarketplaceV1,
      controlledExecutionEnabled: engineFlags.controlledExecutionV1,
      approvalsEnabled: engineFlags.autonomyApprovalsV1,
    },
    ranking: {
      rankingFlagEnabled: engineFlags.rankingV1 || engineFlags.rankingV2,
      notes: [],
    },
    ...(aug.regionComparison.length > 0 ? { regionComparison: aug.regionComparison } : {}),
    ...(syriaCapabilityNotes && syriaCapabilityNotes.length > 0 ? { syriaCapabilityNotes } : {}),
    ...(typeof syriaPreviewAvailable === "boolean" ? { syriaPreviewAvailable } : {}),
    ...(engineFlags.syriaRegionAdapterV1 ? { executionUnavailableForSyria: true as const } : {}),
    ...(aug.syriaSignalRollup !== null ? { syriaSignalRollup: aug.syriaSignalRollup } : {}),
    ...(engineFlags.syriaRegionAdapterV1 ? { syriaPolicySummary: aug.syriaPolicySummary } : {}),
    ...(engineFlags.syriaRegionAdapterV1 ? { syriaGovernanceSlice: aug.syriaGovernanceSlice } : {}),
  };
}
