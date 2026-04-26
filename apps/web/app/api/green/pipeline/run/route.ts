import { NextResponse } from "next/server";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import type { DocumentRefInput } from "@/modules/green-ai/green-verification.service";
import { pipelineLog } from "@/modules/green-ai/pipeline/pipeline-logger";
import {
  runSubsidyPipeline,
  upsertGreenProjectSnapshot,
} from "@/modules/green-ai/pipeline/subsidy-pipeline.engine";

export const dynamic = "force-dynamic";

function parseInsulation(v: unknown): GreenEngineInput["insulationQuality"] {
  return v === "poor" || v === "average" || v === "good" || v === "unknown" ? v : undefined;
}

function parseInput(body: Record<string, unknown>): GreenEngineInput {
  return {
    propertyType: typeof body.propertyType === "string" ? body.propertyType : undefined,
    yearBuilt: typeof body.yearBuilt === "number" ? body.yearBuilt : undefined,
    surfaceSqft: typeof body.surfaceSqft === "number" ? body.surfaceSqft : undefined,
    heatingType: typeof body.heatingType === "string" ? body.heatingType : undefined,
    insulationQuality: parseInsulation(body.insulationQuality),
    atticInsulationQuality: parseInsulation(body.atticInsulationQuality),
    wallInsulationQuality: parseInsulation(body.wallInsulationQuality),
    windowsQuality:
      body.windowsQuality === "single" ||
      body.windowsQuality === "double" ||
      body.windowsQuality === "triple_high_performance" ||
      body.windowsQuality === "unknown"
        ? body.windowsQuality
        : undefined,
    hasHeatPump: typeof body.hasHeatPump === "boolean" ? body.hasHeatPump : undefined,
    solarPvKw: typeof body.solarPvKw === "number" ? body.solarPvKw : undefined,
    envelopeRetrofitYearsAgo:
      typeof body.envelopeRetrofitYearsAgo === "number" ? body.envelopeRetrofitYearsAgo : undefined,
    materialsProfile:
      body.materialsProfile === "sustainable" || body.materialsProfile === "standard" || body.materialsProfile === "unknown"
        ? body.materialsProfile
        : undefined,
    waterEfficiency:
      body.waterEfficiency === "low" ||
      body.waterEfficiency === "average" ||
      body.waterEfficiency === "high" ||
      body.waterEfficiency === "unknown"
        ? body.waterEfficiency
        : undefined,
    energyConsumptionBand:
      body.energyConsumptionBand === "high" ||
      body.energyConsumptionBand === "moderate" ||
      body.energyConsumptionBand === "low" ||
      body.energyConsumptionBand === "unknown"
        ? body.energyConsumptionBand
        : undefined,
    hasGreenRoof: typeof body.hasGreenRoof === "boolean" ? body.hasGreenRoof : undefined,
  };
}

function parseDocuments(body: Record<string, unknown>): DocumentRefInput[] {
  const raw = body.documents;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((d) => ({
      kind: typeof d.kind === "string" ? d.kind : undefined,
      uploadedAtIso: typeof d.uploadedAtIso === "string" ? d.uploadedAtIso : undefined,
    }));
}

/**
 * POST — full subsidy / green pipeline (analyze + grants + ROI + contractors + previews). Optional persistence per listing (owner-only).
 */
export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const userId = await getGuestId();
    const fsboListingId = typeof json.fsboListingId === "string" && json.fsboListingId.trim() ? json.fsboListingId.trim() : null;

    if (fsboListingId) {
      if (!userId) return NextResponse.json({ error: "Unauthorized: sign in to attach pipeline to a listing." }, { status: 401 });
      const listing = await prisma.fsboListing.findUnique({
        where: { id: fsboListingId },
        select: {
          ownerId: true,
          region: true,
          lecipmGreenVerificationLevel: true,
          lecipmGreenProgramTier: true,
        },
      });
      if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      if (listing.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const input = parseInput(json);
      const tier = parseGreenProgramTier(json.programTier ?? listing.lecipmGreenProgramTier ?? "none");
      const premiumReportPurchased = Boolean(json.premiumReportPurchased);

      const result = await runSubsidyPipeline({
        intake: input,
        documents: parseDocuments(json),
        selectedImprovementActions: Array.isArray(json.selectedImprovementActions)
          ? (json.selectedImprovementActions as unknown[]).filter((x): x is string => typeof x === "string")
          : undefined,
        locationRegion:
          typeof json.locationRegion === "string" && json.locationRegion.trim()
            ? json.locationRegion.trim()
            : listing.region ?? "Quebec",
        propertyValueMajor:
          typeof json.propertyValueMajor === "number" && json.propertyValueMajor > 0
            ? json.propertyValueMajor
            : typeof json.propertyValue === "number" && json.propertyValue > 0
              ? json.propertyValue
              : listing.propertyValueMajorNum ?? undefined,
        windowCount: typeof json.windowCount === "number" ? json.windowCount : undefined,
        programTier: tier,
        premiumReportPurchased,
        persistedVerificationLevel: listing.lecipmGreenVerificationLevel,
        contractorRegion:
          typeof json.contractorRegion === "string" && json.contractorRegion.trim()
            ? json.contractorRegion.trim()
            : listing.region ?? null,
      });

      await upsertGreenProjectSnapshot({
        fsboListingId,
        stage: "ANALYSIS",
        estimatedGrantCad: result.estimatedGrants.estimatedGrant,
        metadataPatch: { lastPipelineRunAtIso: new Date().toISOString() },
      });
      pipelineLog.info("persisted_green_project", { fsboListingId });

      return NextResponse.json(result);
    }

    const input = parseInput(json);
    const tier = parseGreenProgramTier(json.programTier ?? "none");

    const result = await runSubsidyPipeline({
      intake: input,
      documents: parseDocuments(json),
      selectedImprovementActions: Array.isArray(json.selectedImprovementActions)
        ? (json.selectedImprovementActions as unknown[]).filter((x): x is string => typeof x === "string")
        : undefined,
      locationRegion: typeof json.locationRegion === "string" ? json.locationRegion : undefined,
      propertyValueMajor: typeof json.propertyValueMajor === "number" ? json.propertyValueMajor : undefined,
      propertyValue: typeof json.propertyValue === "number" ? json.propertyValue : undefined,
      windowCount: typeof json.windowCount === "number" ? json.windowCount : undefined,
      programTier: tier,
      premiumReportPurchased: Boolean(json.premiumReportPurchased),
      contractorRegion: typeof json.contractorRegion === "string" ? json.contractorRegion : undefined,
    });

    return NextResponse.json(result);
  } catch (e) {
    pipelineLog.error("pipeline_run_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Pipeline run failed" }, { status: 500 });
  }
}
