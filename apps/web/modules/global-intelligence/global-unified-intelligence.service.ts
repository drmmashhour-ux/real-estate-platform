/**
 * Global unified intelligence facade — Syria regional snapshot + listing-level routing (read-only).
 */
import { engineFlags } from "@/config/feature-flags";
import {
  buildRegionListingRef,
  buildRegionListingKey,
  stringifyRegionListingKey,
} from "@/modules/integrations/regions/region-listing-key.service";
import type { SyriaRegionSummary } from "@/modules/integrations/regions/syria/syria-region.types";
import {
  listFlaggedListings,
  getRegionSummary,
  SYRIA_REGION_CODE,
} from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { buildSyriaTrustRiskOverlay } from "@/modules/integrations/regions/syria/syria-region-trust-risk.service";
import {
  getSyriaCapabilityNotes,
  canSyriaUsePreview,
} from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import {
  getUnifiedListingIntelligence,
  type GetUnifiedListingIntelligenceParams,
} from "@/modules/unified-intelligence/unified-intelligence.service";

/** Flagged Syria listings with stable keys — safe for admin / global aggregates (no bare ids). */
export type SyriaFlaggedListingRefWire = {
  regionCode: string;
  source: "syria";
  listingId: string;
  displayId: string;
  label: string;
  riskScore: number;
};

export type SyriaGlobalIntelPayload = {
  regionSummary: SyriaRegionSummary | null;
  trustRisk: ReturnType<typeof buildSyriaTrustRiskOverlay>;
  availabilityNotes: string[];
  sourceStatus: { syria: "available" | "missing" };
  flaggedListingRefs: SyriaFlaggedListingRefWire[];
  capabilityNotes: readonly string[];
  previewAvailable: boolean;
  executionUnavailableForSyria: true;
};

export async function getGlobalUnifiedIntelligenceSnapshot(): Promise<{
  syria: SyriaGlobalIntelPayload;
  freshness: string;
}> {
  const freshness = new Date().toISOString();
  const capabilityNotes = getSyriaCapabilityNotes();
  const previewAvailable = canSyriaUsePreview() && engineFlags.syriaPreviewV1;

  if (!engineFlags.syriaRegionAdapterV1) {
    return {
      syria: {
        regionSummary: null,
        trustRisk: buildSyriaTrustRiskOverlay(null),
        availabilityNotes: ["syria_region_adapter_disabled"],
        sourceStatus: { syria: "missing" },
        flaggedListingRefs: [],
        capabilityNotes,
        previewAvailable: false,
        executionUnavailableForSyria: true,
      },
      freshness,
    };
  }

  const { summary, availabilityNotes } = await getRegionSummary();
  const flagged = await listFlaggedListings(12);

  const flaggedListingRefs: SyriaFlaggedListingRefWire[] = [];
  for (const item of flagged.items) {
    const key = buildRegionListingKey({
      regionCode: SYRIA_REGION_CODE,
      source: "syria",
      listingId: item.id,
    });
    const ref = key ? buildRegionListingRef(key) : null;
    flaggedListingRefs.push({
      regionCode: SYRIA_REGION_CODE,
      source: "syria",
      listingId: item.id,
      displayId: ref?.displayId ?? (key ? stringifyRegionListingKey(key) : `sy:syria:${item.id}`),
      label: item.title,
      riskScore: item.riskScore,
    });
  }

  return {
    syria: {
      regionSummary: summary,
      trustRisk: buildSyriaTrustRiskOverlay(summary),
      availabilityNotes: [...availabilityNotes, ...flagged.availabilityNotes],
      sourceStatus: { syria: summary ? "available" : "missing" },
      flaggedListingRefs,
      capabilityNotes,
      previewAvailable,
      executionUnavailableForSyria: true,
    },
    freshness,
  };
}

export async function getGlobalUnifiedListingIntelligence(params: GetUnifiedListingIntelligenceParams) {
  return getUnifiedListingIntelligence(params);
}
