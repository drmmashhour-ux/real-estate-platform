import type { GreenEngineInput } from "@/modules/green/green.types";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import type { DocumentRefInput } from "@/modules/green-ai/green-verification.service";
import { runSubsidyPipeline, type RunSubsidyPipelineArgs } from "@/modules/green-ai/pipeline/subsidy-pipeline.engine";
import type { SubsidyPipelineResult } from "@/modules/green-ai/pipeline/pipeline.types";
import {
  GREEN_DOCUMENT_DISCLAIMER,
  GREEN_DOCUMENT_MONETIZATION,
  type GreenReportBundle,
  type ReportTier,
} from "./document.types";
import { buildAllStructuredReports } from "./report-builder";

export type GenerateGreenDocumentsInput = RunSubsidyPipelineArgs & {
  tier?: ReportTier;
  /** Optional labels for property overview sections */
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
};

export type GenerateGreenDocumentsResult = {
  bundle: GreenReportBundle;
  pipeline: SubsidyPipelineResult;
};

/**
 * Runs the subsidy / ESG pipeline and materializes JSON + PDF-ready sections for all document kinds.
 */
export async function generateGreenDocuments(input: GenerateGreenDocumentsInput): Promise<GenerateGreenDocumentsResult> {
  const tier: ReportTier = input.tier === "premium" ? "premium" : "basic";

  const pipeline = await runSubsidyPipeline({
    intake: input.intake,
    documents: input.documents ?? [],
    selectedImprovementActions: input.selectedImprovementActions,
    locationRegion: input.locationRegion,
    propertyValueMajor: input.propertyValueMajor,
    propertyValue: input.propertyValue,
    windowCount: input.windowCount,
    programTier: input.programTier,
    premiumReportPurchased: input.premiumReportPurchased,
    persistedVerificationLevel: input.persistedVerificationLevel,
    contractorRegion: input.contractorRegion,
    contractorMatchLimit: input.contractorMatchLimit,
  });

  const { combined, documents } = buildAllStructuredReports({
    pipeline,
    intake: input.intake,
    tier,
    city: input.city,
    region: input.region,
    listingTitle: input.listingTitle,
  });

  const bundle: GreenReportBundle = {
    tier,
    disclaimers: {
      document: GREEN_DOCUMENT_DISCLAIMER,
      monetizationNote:
        tier === "premium" ? GREEN_DOCUMENT_MONETIZATION.premium : GREEN_DOCUMENT_MONETIZATION.basic,
      pipeline: pipeline.disclaimers.pipeline,
    },
    generatedAtIso: combined.generatedAtIso,
    combined,
    documents,
  };

  return { bundle, pipeline };
}

/** Serialize for browser download (pretty JSON). */
export function stringifyGreenReportBundle(bundle: GreenReportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

function parseInsulation(v: unknown): GreenEngineInput["insulationQuality"] {
  return v === "poor" || v === "average" || v === "good" || v === "unknown" ? v : undefined;
}

function parseIntake(body: Record<string, unknown>): GreenEngineInput {
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

/** Maps POST JSON body (same shape as `/api/green/pipeline/run`) into generator input. */
export function parseGreenDocumentRequestBody(body: Record<string, unknown>): GenerateGreenDocumentsInput {
  const tier: ReportTier = body.tier === "premium" ? "premium" : "basic";

  const selectedImprovementActions = Array.isArray(body.selectedImprovementActions)
    ? (body.selectedImprovementActions as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;

  return {
    intake: parseIntake(body),
    documents: parseDocuments(body),
    ...(selectedImprovementActions !== undefined ? { selectedImprovementActions } : {}),
    locationRegion: typeof body.locationRegion === "string" ? body.locationRegion : undefined,
    propertyValueMajor:
      typeof body.propertyValueMajor === "number" && body.propertyValueMajor > 0
        ? body.propertyValueMajor
        : undefined,
    propertyValue:
      typeof body.propertyValue === "number" && body.propertyValue > 0 ? body.propertyValue : undefined,
    windowCount: typeof body.windowCount === "number" ? body.windowCount : undefined,
    programTier: parseGreenProgramTier(body.programTier ?? body.lecipmGreenProgramTier ?? "none"),
    premiumReportPurchased: Boolean(body.premiumReportPurchased),
    persistedVerificationLevel:
      typeof body.persistedVerificationLevel === "string" ? body.persistedVerificationLevel : undefined,
    contractorRegion: typeof body.contractorRegion === "string" ? body.contractorRegion : undefined,
    contractorMatchLimit: typeof body.contractorMatchLimit === "number" ? body.contractorMatchLimit : undefined,
    tier,
    city: typeof body.city === "string" ? body.city : undefined,
    region: typeof body.region === "string" ? body.region : undefined,
    listingTitle: typeof body.listingTitle === "string" ? body.listingTitle : undefined,
  };
}
