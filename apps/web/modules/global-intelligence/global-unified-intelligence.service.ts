/**
 * Global unified intelligence facade — Syria regional snapshot + listing-level routing (read-only).
 */
import { REGION_REGISTRY, getRegionDefinition } from "@lecipm/platform-core";
import { engineFlags } from "@/config/feature-flags";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";
import { getRegionAdapter } from "@/modules/integrations/regions/region-adapter-registry";
import { webRegionAdapter } from "@/modules/integrations/regions/web-region-adapter.service";
import type {
  GlobalListingIntelligence,
  GlobalMarketplaceSummary,
  GlobalRegionSnapshot,
  GlobalRegionSummary,
} from "./global-intelligence.types";
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

export async function buildGlobalMarketplaceSummary(): Promise<GlobalMarketplaceSummary> {
  const snap = await getGlobalUnifiedIntelligenceSnapshot();
  let webSample: { items: import("@lecipm/platform-core").NormalizedListing[]; notes: readonly string[] } = {
    items: [],
    notes: ["web_sample_skipped"],
  };
  try {
    if (engineFlags.regionAdaptersV1) {
      webSample = await webRegionAdapter.listListingsSummary(8);
    }
  } catch {
    webSample = { items: [], notes: ["web_sample_failed"] };
  }

  const packs: GlobalMarketplaceSummary["jurisdictionPacks"] = {};
  for (const r of REGION_REGISTRY) {
    packs[r.code] = getJurisdictionPolicyPack(r.code);
  }

  const syTotal = snap.syria.regionSummary?.totalListings ?? null;
  const syBookings = snap.syria.regionSummary?.totalBookings ?? null;

  const regions: GlobalRegionSnapshot[] = REGION_REGISTRY.map((def) => {
    const isSy = def.code === "sy";
    return {
      regionCode: def.code,
      label: def.label,
      listingCountHint: isSy ? syTotal : webSample.items.length > 0 ? webSample.items.length : null,
      bookingCountHint: isSy ? syBookings : null,
      trustScoreHint: null,
      legalRiskHint: null,
      blockedPublishHint: isSy ? snap.syria.regionSummary?.pendingReviewListings ?? null : null,
      growthOpportunityHint: null,
      availabilityNotes: isSy ? snap.syria.availabilityNotes : webSample.notes,
    };
  }).sort((a, b) => String(a.regionCode).localeCompare(String(b.regionCode)));

  return {
    computedAt: snap.freshness,
    regions,
    featureFlags: {
      globalMultiRegionV1: engineFlags.globalMultiRegionV1 === true,
      regionAdaptersV1: engineFlags.regionAdaptersV1 === true,
    },
    syriaSummaryAvailable: snap.syria.regionSummary !== null,
    webListingSampleCount: webSample.items.length,
    webSample: engineFlags.regionAdaptersV1 ? { items: webSample.items, notes: webSample.notes } : null,
    jurisdictionPacks: packs,
  };
}

export async function buildGlobalRegionSummary(regionCode: string): Promise<GlobalRegionSummary> {
  const freshness = new Date().toISOString();
  const bundle = getRegionAdapter(regionCode);
  const notes: string[] = [];
  if (!bundle?.adapter) {
    return { regionCode, capabilities: [], listingSample: [], notes: ["region_adapter_missing"], freshness };
  }
  try {
    const sample = await bundle.adapter.listListingsSummary(12);
    const def = getRegionDefinition(String(bundle.regionCode));
    const caps = def ? Object.entries(def.capabilities).filter(([, v]) => v === true).map(([k]) => k) : [];
    return {
      regionCode: bundle.regionCode,
      capabilities: caps.sort((a, b) => a.localeCompare(b)),
      listingSample: sample.items,
      notes: [...sample.availabilityNotes, ...notes],
      freshness,
    };
  } catch {
    return { regionCode, capabilities: [], listingSample: [], notes: ["region_summary_failed"], freshness };
  }
}

export async function buildGlobalListingIntelligence(
  regionCode: string,
  listingId: string,
): Promise<GlobalListingIntelligence> {
  const bundle = getRegionAdapter(regionCode);
  if (!bundle?.adapter) {
    return { regionCode, listingId, normalized: null, intelligenceNotes: ["adapter_missing"] };
  }
  try {
    const res = await bundle.adapter.getListingById(listingId);
    return {
      regionCode: bundle.regionCode,
      listingId,
      normalized: res.listing,
      intelligenceNotes: [...res.availabilityNotes],
    };
  } catch {
    return { regionCode, listingId, normalized: null, intelligenceNotes: ["lookup_failed"] };
  }
}

