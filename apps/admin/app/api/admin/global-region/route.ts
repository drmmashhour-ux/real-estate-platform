import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getRegionAdapter } from "@/modules/integrations/regions/region-adapter-registry";
import {
  buildGlobalRegionSummary,
  getGlobalUnifiedIntelligenceSnapshot,
} from "@/modules/global-intelligence/global-unified-intelligence.service";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const regionRaw = url.searchParams.get("region")?.trim().toLowerCase() ?? "";
  const regionCode =
    regionRaw === "syria" ? "sy"
    : regionRaw === "qc" || regionRaw === "quebec" ? "ca_qc"
    : regionRaw === "" ? "ca_qc"
    : regionRaw;

  const bundle = getRegionAdapter(regionCode);
  const freshness = new Date().toISOString();
  const pack = getJurisdictionPolicyPack(regionCode);

  if (!bundle?.adapter) {
    return NextResponse.json({
      regionCode: regionCode || null,
      summary: null,
      jurisdictionPack: pack,
      capabilities: {
        read: false,
        writes: false,
        quebecLegalPackApplied: pack.checklistEnabled,
      },
      availabilityNotes: ["region_adapter_not_registered"],
      freshness,
    });
  }

  if (bundle.regionCode === "sy") {
    const snap = await getGlobalUnifiedIntelligenceSnapshot();

    const trustRiskSafe = {
      fraudElevatedHint: snap.syria.trustRisk.fraudElevatedHint,
      reviewBacklogHint: snap.syria.trustRisk.reviewBacklogHint,
      payoutPipelineStressHint: snap.syria.trustRisk.payoutPipelineStressHint,
      normalizedRiskTags: snap.syria.trustRisk.normalizedRiskTags,
      legalPackAvailability: snap.syria.trustRisk.legalPackAvailability,
      quebecComplianceEngine: snap.syria.trustRisk.quebecComplianceEngine,
      trustAvailabilityNotes: snap.syria.trustRisk.trustAvailabilityNotes,
    };

    return NextResponse.json({
      regionCode: bundle.regionCode,
      summary: snap.syria.regionSummary,
      jurisdictionPack: pack,
      capabilities: {
        read: engineFlags.syriaRegionAdapterV1,
        writes: false,
        quebecLegalPackApplied: pack.checklistEnabled,
        bnhubListingSignals: false,
      },
      availabilityNotes: [...snap.syria.availabilityNotes, ...(snap.syria.regionSummary ? [] : ["summary_null"])],
      trustRisk: trustRiskSafe,
      sourceStatus: snap.syria.sourceStatus,
      flaggedListingRefs: snap.syria.flaggedListingRefs,
      capabilityNotes: snap.syria.capabilityNotes,
      previewAvailable: snap.syria.previewAvailable,
      executionUnavailableForSyria: snap.syria.executionUnavailableForSyria,
      freshness: snap.freshness,
    });
  }

  const webSummary = await buildGlobalRegionSummary(String(bundle.regionCode));

  return NextResponse.json({
    regionCode: bundle.regionCode,
    summary: webSummary,
    jurisdictionPack: pack,
    capabilities: {
      read: engineFlags.regionAdaptersV1,
      writes: false,
      quebecLegalPackApplied: pack.checklistEnabled,
      webCrmListingSample: webSummary.listingSample.length,
    },
    availabilityNotes: webSummary.notes,
    freshness: webSummary.freshness,
  });
}
