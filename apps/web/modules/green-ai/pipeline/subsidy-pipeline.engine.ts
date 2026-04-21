import { prisma } from "@/lib/db";
import { evaluateGreenEngine } from "@/modules/green/green.engine";
import type { GreenEngineInput } from "@/modules/green/green.types";
import type { GreenProgramTier } from "@/modules/green/green.types";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import { runGreenAiAnalysis } from "@/modules/green-ai/green-ai.engine";
import { buildGreenUpgradePlan } from "@/modules/green-ai/green-upgrade.advisor";
import { evaluateGreenVerifiedPresentation } from "@/modules/green-ai/green-certification";
import { findEligibleGrants } from "@/modules/green-ai/grants/grants.engine";
import {
  estimateRenoclimatGrants,
  syntheticUpgradesFromProperty,
  RENOCLIMAT_GRANT_ESTIMATE_DISCLAIMER,
} from "@/modules/green-ai/renoclimat/grant-calculator";
import { runRenoclimatEligibility } from "@/modules/green-ai/renoclimat/renoclimat.engine";
import type { DocumentRefInput } from "@/modules/green-ai/green-verification.service";
import { CONTRACTOR_WORK_DISCLAIMER } from "@/modules/contractors/contractor.model";
import { matchContractorsForPipeline } from "./contractor-integration";
import { grantPipelineLog, pipelineLog } from "./pipeline-logger";
import {
  PIPELINE_POSITIONING,
  PIPELINE_SAFETY_NOTICE,
  type SubsidyPipelineResult,
  type SubsidyPipelineStage,
} from "./pipeline.types";
import { OFFICIAL_PROGRAM_NOTICE, PIPELINE_MONETIZATION } from "./upgrade-flow";

export type RunSubsidyPipelineArgs = {
  intake: GreenEngineInput;
  documents?: DocumentRefInput[];
  selectedImprovementActions?: string[];
  /** Region label for Rénoclimat-style heuristics */
  locationRegion?: string;
  propertyValueMajor?: number;
  /** Matches public analyze API naming */
  propertyValue?: number;
  windowCount?: number;
  /** Tier for badge + monetization previews */
  programTier?: GreenProgramTier;
  premiumReportPurchased?: boolean;
  persistedVerificationLevel?: string | null;
  contractorRegion?: string | null;
  contractorMatchLimit?: number;
};

function resolvedPropertyValueMajor(args: RunSubsidyPipelineArgs): number | undefined {
  const a =
    typeof args.propertyValueMajor === "number" && args.propertyValueMajor > 0
      ? args.propertyValueMajor
      : undefined;
  const b =
    typeof args.propertyValue === "number" && args.propertyValue > 0 ? args.propertyValue : undefined;
  return a ?? b;
}

/**
 * Orchestrates eligibility → grants → ROI context → upgrades → contractors → certification preview → listing boost hints.
 * Informational only — see disclaimers on the result object.
 */
export async function runSubsidyPipeline(args: RunSubsidyPipelineArgs): Promise<SubsidyPipelineResult> {
  pipelineLog.info("run_start", {});
  const tier = parseGreenProgramTier(args.programTier ?? "none");

  const ai = runGreenAiAnalysis({
    intake: args.intake,
    documents: args.documents ?? [],
    persistedVerificationLevel: args.persistedVerificationLevel ?? null,
  });

  const engine = evaluateGreenEngine(args.intake);
  const selectedKeys = new Set(args.selectedImprovementActions ?? []);
  const selectedImprovements =
    selectedKeys.size > 0 ? engine.improvements.filter((i) => selectedKeys.has(i.action)) : [];

  const grantsBundle = findEligibleGrants({ property: args.intake, plannedUpgrades: engine.improvements });
  grantPipelineLog.info("eligible_grants_computed", {
    eligible: grantsBundle.eligibleGrants.length,
    upgrades: engine.improvements.length,
  });

  const upgradePlan = buildGreenUpgradePlan(engine.improvements, args.intake, grantsBundle);

  const renoclimatRegion =
    typeof args.locationRegion === "string" && args.locationRegion.trim()
      ? args.locationRegion.trim()
      : "Quebec";
  const renoclimatPotential = runRenoclimatEligibility({
    propertyType: typeof args.intake.propertyType === "string" ? args.intake.propertyType : "house",
    yearBuilt: args.intake.yearBuilt,
    heatingType: args.intake.heatingType,
    insulationQuality: args.intake.insulationQuality,
    windowsQuality: args.intake.windowsQuality,
    locationRegion: renoclimatRegion,
  });

  const upgradeLinesForGrants =
    selectedImprovements.length > 0
      ? selectedImprovements.map((i) => i.action)
      : engine.improvements.map((i) => i.action);
  const grantLines =
    upgradeLinesForGrants.length > 0 ? upgradeLinesForGrants : syntheticUpgradesFromProperty(args.intake);

  const propertyValueMajor = resolvedPropertyValueMajor(args);

  const estimatedGrants = estimateRenoclimatGrants({
    upgradeActions: grantLines,
    propertyDetails: {
      surfaceSqft: args.intake.surfaceSqft ?? undefined,
      windowCount: args.windowCount,
      propertyValueMajor,
    },
  });
  grantPipelineLog.info("renoclimat_grant_estimate", {
    totalCad: estimatedGrants.estimatedGrant,
    ratio: estimatedGrants.grantToPropertyValueRatio,
  });

  const roiNote =
    estimatedGrants.grantToPropertyValueRatio != null
      ? `Illustrative grant load ≈ ${(estimatedGrants.grantToPropertyValueRatio * 100).toFixed(2)}% of declared value — not investment advice.`
      : null;

  const upgradeLinesForContractors = engine.improvements.slice(0, 12).map((i) => i.action);
  const contractorBundle = await matchContractorsForPipeline({
    upgradeRecommendations: upgradeLinesForContractors,
    region: args.contractorRegion ?? renoclimatRegion,
    limit: args.contractorMatchLimit,
  });

  const certificationPreview = evaluateGreenVerifiedPresentation({
    score: ai.score,
    label: ai.label,
    verificationLevel: ai.verificationLevel,
    confidence: ai.confidence,
    programTier: tier,
    premiumReportPurchased: args.premiumReportPurchased,
  });

  const tierBoostEligible = tier === "premium" || Boolean(args.premiumReportPurchased);
  const listingBoostEligible =
    tierBoostEligible && (certificationPreview.showBadge || ai.score >= 62 || engine.currentScore >= 58);

  const result: SubsidyPipelineResult = {
    analysis: {
      ai,
      quebecEsg: ai.quebecEsg,
      engineImprovements: engine.improvements,
    },
    renoclimat: renoclimatPotential,
    quebecGrants: {
      eligibleGrants: grantsBundle.eligibleGrants,
      disclaimer: grantsBundle.disclaimer,
    },
    estimatedGrants,
    roiContext: {
      grantToPropertyValueRatio: estimatedGrants.grantToPropertyValueRatio,
      propertyValueMajor: propertyValueMajor ?? null,
      note: roiNote,
    },
    upgradePlan,
    contractors: contractorBundle.contractors,
    certificationPreview,
    listingBoost: {
      modelEligible: listingBoostEligible,
      summary: listingBoostEligible
        ? "Premium tier + strong green signals may qualify this listing for illustrative ranking priority — actual placement depends on catalog competition."
        : "Consider the premium green program tier for illustrative browse visibility cues alongside verified green positioning.",
    },
    disclaimers: {
      pipeline: PIPELINE_SAFETY_NOTICE,
      renoclimatGrants: RENOCLIMAT_GRANT_ESTIMATE_DISCLAIMER,
      contractor: contractorBundle.disclaimer ?? CONTRACTOR_WORK_DISCLAIMER,
      officialPrograms: OFFICIAL_PROGRAM_NOTICE,
    },
    monetization: {
      premiumReport: PIPELINE_MONETIZATION.premiumReport,
      contractorLeads: PIPELINE_MONETIZATION.contractorLeads,
      listingBoost: PIPELINE_MONETIZATION.listingBoost,
    },
    positioning: PIPELINE_POSITIONING,
  };

  pipelineLog.info("run_complete", {
    score: ai.score,
    contractors: contractorBundle.contractors.length,
    estGrant: estimatedGrants.estimatedGrant,
  });

  return result;
}

export async function upsertGreenProjectSnapshot(args: {
  fsboListingId: string;
  stage?: SubsidyPipelineStage;
  /** Omit or pass `null` to leave existing estimate unchanged on update. */
  estimatedGrantCad?: number | null;
  metadataPatch?: Record<string, unknown>;
}) {
  const prev = await prisma.greenProject.findUnique({
    where: { fsboListingId: args.fsboListingId },
    select: { metadataJson: true },
  });
  const prevMeta =
    prev?.metadataJson !== null &&
    typeof prev.metadataJson === "object" &&
    !Array.isArray(prev.metadataJson)
      ? (prev.metadataJson as Record<string, unknown>)
      : {};
  const mergedMeta =
    args.metadataPatch !== undefined ? { ...prevMeta, ...args.metadataPatch } : prevMeta;

  return prisma.greenProject.upsert({
    where: { fsboListingId: args.fsboListingId },
    create: {
      fsboListingId: args.fsboListingId,
      stage: args.stage ?? "ANALYSIS",
      ...(typeof args.estimatedGrantCad === "number" ? { estimatedGrant: args.estimatedGrantCad } : {}),
      ...(Object.keys(mergedMeta).length > 0 ? { metadataJson: mergedMeta } : {}),
    },
    update: {
      ...(args.stage !== undefined ? { stage: args.stage } : {}),
      ...(typeof args.estimatedGrantCad === "number" ? { estimatedGrant: args.estimatedGrantCad } : {}),
      ...(args.metadataPatch !== undefined ? { metadataJson: mergedMeta } : {}),
    },
  });
}
