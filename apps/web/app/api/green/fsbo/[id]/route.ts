import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import type { GreenEngineInput, GreenListingMetadata } from "@/modules/green/green.types";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import { evaluateGreenEngine } from "@/modules/green/green.engine";
import { esgUpgradeLog } from "@/modules/green/green-logger";
import { findEligibleGrants } from "@/modules/green-ai/grants/grants.engine";
import { sumIllustrativeGrantDollars } from "@/modules/green-ai/green-search-parsing";
import { runGreenAiAnalysis } from "@/modules/green-ai/green-ai.engine";
import type { DocumentRefInput } from "@/modules/green-ai/green-verification.service";
import { evaluateGreenVerifiedPresentation } from "@/modules/green-ai/green-certification";
import type { GreenAiPerformanceLabel, GreenVerificationLevel } from "@/modules/green-ai/green.types";
import { runQuebecEsgEconomicsPipeline } from "@/modules/green-ai/quebec-esg-economics.runner";
import { QUEBEC_ESG_INCENTIVES_CATALOG_VERSION } from "@/modules/green-ai/quebec-esg-incentives.catalog";
import { QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS } from "@/modules/green-ai/quebec-esg-disclaimers";

export const dynamic = "force-dynamic";

function metaDocuments(meta: GreenListingMetadata | undefined): DocumentRefInput[] {
  const list = meta?.officialDocuments ?? [];
  return list.map((d) => ({
    kind: d.kind,
    uploadedAtIso: d.uploadedAtIso,
  }));
}

/**
 * PATCH — persist LECIPM AI Green Score + verification fields for an FSBO listing (owner-only).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      ownerId: true,
      yearBuilt: true,
      propertyType: true,
      surfaceSqft: true,
      lecipmGreenProgramTier: true,
      lecipmGreenVerificationLevel: true,
      lecipmGreenMetadataJson: true,
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tier = parseGreenProgramTier(body.tier ?? listing.lecipmGreenProgramTier ?? "none");

  const intake = (body.intake ?? {}) as Record<string, unknown>;
  const input: GreenEngineInput = {
    propertyType: listing.propertyType ?? (typeof intake.propertyType === "string" ? intake.propertyType : undefined),
    yearBuilt:
      typeof intake.yearBuilt === "number" ? intake.yearBuilt : listing.yearBuilt ?? undefined,
    surfaceSqft:
      typeof intake.surfaceSqft === "number" ? intake.surfaceSqft : listing.surfaceSqft ?? undefined,
    heatingType: typeof intake.heatingType === "string" ? intake.heatingType : undefined,
    insulationQuality:
      intake.insulationQuality === "poor" ||
      intake.insulationQuality === "average" ||
      intake.insulationQuality === "good" ||
      intake.insulationQuality === "unknown"
        ? intake.insulationQuality
        : undefined,
    windowsQuality:
      intake.windowsQuality === "single" ||
      intake.windowsQuality === "double" ||
      intake.windowsQuality === "triple_high_performance" ||
      intake.windowsQuality === "unknown"
        ? intake.windowsQuality
        : undefined,
    hasHeatPump: typeof intake.hasHeatPump === "boolean" ? intake.hasHeatPump : undefined,
    solarPvKw: typeof intake.solarPvKw === "number" ? intake.solarPvKw : undefined,
    envelopeRetrofitYearsAgo:
      typeof intake.envelopeRetrofitYearsAgo === "number" ? intake.envelopeRetrofitYearsAgo : undefined,
  };

  const metadataPayload = body.metadata;
  const metadata: GreenListingMetadata | undefined =
    metadataPayload && typeof metadataPayload === "object"
      ? (metadataPayload as GreenListingMetadata)
      : undefined;

  const docs = metaDocuments(metadata);

  const ai = runGreenAiAnalysis({
    intake: input,
    documents: docs,
    persistedVerificationLevel: listing.lecipmGreenVerificationLevel,
  });

  const presentation = evaluateGreenVerifiedPresentation({
    score: ai.score,
    label: ai.label as GreenAiPerformanceLabel,
    verificationLevel: ai.verificationLevel as GreenVerificationLevel,
    confidence: ai.confidence,
    programTier: tier,
  });

  const engine = evaluateGreenEngine(input);
  const grantsBundle = findEligibleGrants({ property: input, plannedUpgrades: engine.improvements });
  const delta = Math.max(0, engine.targetScore - engine.currentScore);
  const incentiveTotal = grantsBundle.eligibleGrants.length
    ? sumIllustrativeGrantDollars(grantsBundle.eligibleGrants.map((g) => g.amount))
    : 0;
  const improvementDelta =
    delta >= 20 ? ("high" as const) : delta >= 10 ? ("medium" as const) : ("low" as const);

  const prevRaw = listing.lecipmGreenMetadataJson;
  const prevMeta: GreenListingMetadata =
    prevRaw !== null && typeof prevRaw === "object" && !Array.isArray(prevRaw)
      ? (prevRaw as GreenListingMetadata)
      : {};

  const listingPriceCad =
    typeof body.listingPriceCad === "number" && Number.isFinite(body.listingPriceCad) ? body.listingPriceCad : null;
  const econ = runQuebecEsgEconomicsPipeline(input, {
    optionalListingPriceCad: listingPriceCad,
    propertyType: listing.propertyType ?? null,
  });

  const mergedMeta: GreenListingMetadata = {
    ...prevMeta,
    ...(metadata ?? {}),
    quebecEsgSnapshot: {
      score: ai.quebecEsg.score,
      label: ai.quebecEsg.label,
      breakdown: ai.quebecEsg.breakdown as Record<string, number>,
      improvementAreas: ai.quebecEsg.improvementAreas,
      disclaimer: ai.quebecEsg.quebecDisclaimer,
      updatedAtIso: new Date().toISOString(),
      recommendations: ai.quebecEsgRecommendations,
      simulation: ai.quebecEsgSimulation,
      callouts: ai.quebecEsgCallouts,
    },
    grantsSnapshot: {
      eligibleGrants: grantsBundle.eligibleGrants,
      disclaimer: grantsBundle.disclaimer,
      byRecommendation: grantsBundle.byRecommendation,
      updatedAtIso: new Date().toISOString(),
    },
    greenSearchSnapshot: {
      currentScore: ai.score,
      projectedScore: ai.quebecEsgSimulation?.projectedScore ?? engine.targetScore,
      scoreDelta: ai.quebecEsgSimulation?.delta ?? delta,
      quebecLabel: ai.quebecEsg.label,
      label: ai.label,
      improvementPotential: improvementDelta,
      estimatedIncentivesTotal: incentiveTotal,
      rankingBoostSuggestion:
        econ?.pricingBoost.rankingBoostSuggestion ??
        (presentation.showBadge ? 1.06 : tier === "premium" ? 1.04 : 1.01),
      hasSolarIndicated: typeof input.solarPvKw === "number" && input.solarPvKw > 0,
      hasGreenRoofIndicated: input.hasGreenRoof === true,
      updatedAtIso: new Date().toISOString(),
    },
    greenIntake: input,
    ...(econ
      ? {
          recommendationsSnapshot: econ.recommendations.map((r) => r.key),
          quebecEsgEconomicsSnapshot: {
            recommendationKeys: econ.recommendations.map((r) => r.key),
            projectedQuebecScore: econ.simulation.projectedScore,
            currentQuebecScore: econ.evaluation.score,
            costEstimates: econ.costEstimates as unknown as Record<string, unknown>,
            incentives: econ.incentives as unknown as Record<string, unknown>,
            roi: econ.roi as unknown as Record<string, unknown>,
            pricingBoost: econ.pricingBoost as unknown as Record<string, unknown>,
            disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
            catalogVersion: QUEBEC_ESG_INCENTIVES_CATALOG_VERSION,
            updatedAtIso: new Date().toISOString(),
          },
          incentivesSnapshot: {
            totalIllustrativeCad: econ.incentives.totalEstimatedIncentives ?? undefined,
            note: "Illustrative — verify official programs (see quebecEsgEconomicsSnapshot).",
            updatedAtIso: new Date().toISOString(),
          },
          roiSnapshot: {
            bandLabel:
              econ.roi.netCostLow != null && econ.roi.netCostHigh != null ? "estimated_net_band" : "narrative_only",
            note: econ.roi.simpleRoiNarrative.slice(0, 2).join(" "),
            updatedAtIso: new Date().toISOString(),
          },
          pricingBoostSnapshot: {
            boostFactor: econ.pricingBoost.rankingBoostSuggestion ?? undefined,
            note: econ.pricingBoost.rationale.join(" "),
            updatedAtIso: new Date().toISOString(),
          },
        }
      : {}),
  };

  const updated = await prisma.fsboListing.update({
    where: { id },
    data: {
      lecipmGreenInternalScore: ai.score,
      lecipmGreenAiLabel: ai.label,
      lecipmGreenVerificationLevel: ai.verificationLevel,
      lecipmGreenConfidence: ai.confidence,
      lecipmGreenProgramTier: tier,
      lecipmGreenCertifiedAt: presentation.showBadge ? new Date() : null,
      lecipmGreenMetadataJson: mergedMeta as object,
    },
    select: {
      id: true,
      lecipmGreenInternalScore: true,
      lecipmGreenCertifiedAt: true,
      lecipmGreenProgramTier: true,
      lecipmGreenAiLabel: true,
      lecipmGreenVerificationLevel: true,
      lecipmGreenConfidence: true,
    },
  });

  esgUpgradeLog.info("listing_green_ai_sync", {
    listingId: id,
    score: ai.score,
    tier,
    verificationLevel: ai.verificationLevel,
    badge: presentation.showBadge,
  });

  return NextResponse.json({
    listing: updated,
    ai,
    greenVerified: presentation,
  });
}
