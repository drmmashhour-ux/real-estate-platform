import { NextResponse } from "next/server";
import { evaluateGreenEngine, projectScoreFromQuebecBase } from "@/modules/green/green.engine";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { greenSystemLog } from "@/modules/green/green-logger";
import { runGreenAiAnalysis } from "@/modules/green-ai/green-ai.engine";
import { buildGreenUpgradePlan } from "@/modules/green-ai/green-upgrade.advisor";
import { findEligibleGrants } from "@/modules/green-ai/grants/grants.engine";
import { LECIPM_GREEN_AI_DISCLAIMER } from "@/modules/green-ai/green.types";
import type { DocumentRefInput } from "@/modules/green-ai/green-verification.service";
import { CONTRACTOR_WORK_DISCLAIMER, POSITIONING_GREEN_EXECUTION } from "@/modules/contractors/contractor.model";
import { runRenoclimatEligibility } from "@/modules/green-ai/renoclimat/renoclimat.engine";
import { estimateRenoclimatGrants, syntheticUpgradesFromProperty } from "@/modules/green-ai/renoclimat/grant-calculator";

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
 * POST — LECIPM AI Green Score + verification framing (no listing write).
 */
export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const input = parseInput(json);
    const docs = parseDocuments(json);
    const ai = runGreenAiAnalysis({ intake: input, documents: docs });

    const engine = evaluateGreenEngine(input);
    const selectedKeys = Array.isArray(json.selectedImprovementActions)
      ? (json.selectedImprovementActions as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const selectedImprovements = engine.improvements.filter((i) => selectedKeys.includes(i.action));
    const projectedScore =
      selectedImprovements.length > 0 ? projectScoreFromQuebecBase(ai.score, selectedImprovements) : ai.score;

    const grantsBundle = findEligibleGrants({ property: input, plannedUpgrades: engine.improvements });
    const upgradePlan = buildGreenUpgradePlan(engine.improvements, input, grantsBundle);
    const improvementsForContractors = engine.improvements
      .slice(0, 8)
      .map((i) => i.action)
      .join(",");

    const renoclimatRegion =
      typeof json.locationRegion === "string" && json.locationRegion.trim()
        ? json.locationRegion.trim()
        : "Quebec";
    const renoclimatPotential = runRenoclimatEligibility({
      propertyType: typeof json.propertyType === "string" ? json.propertyType : "house",
      yearBuilt: input.yearBuilt,
      heatingType: input.heatingType,
      insulationQuality: input.insulationQuality,
      windowsQuality: input.windowsQuality,
      locationRegion: renoclimatRegion,
    });

    const upgradeLinesForGrants =
      selectedImprovements.length > 0
        ? selectedImprovements.map((i) => i.action)
        : engine.improvements.map((i) => i.action);
    const grantLines =
      upgradeLinesForGrants.length > 0 ? upgradeLinesForGrants : syntheticUpgradesFromProperty(input);
    const propertyValueMajor =
      typeof json.propertyValueMajor === "number" && json.propertyValueMajor > 0
        ? json.propertyValueMajor
        : typeof json.propertyValue === "number" && json.propertyValue > 0
          ? json.propertyValue
          : undefined;
    const renoclimatGrantEstimate = estimateRenoclimatGrants({
      upgradeActions: grantLines,
      propertyDetails: {
        surfaceSqft: input.surfaceSqft ?? undefined,
        windowCount: typeof json.windowCount === "number" ? json.windowCount : undefined,
        propertyValueMajor,
      },
    });

    greenSystemLog.info("green_analyze_ok", {
      score: ai.score,
      projectedScore,
      verificationLevel: ai.verificationLevel,
    });

    return NextResponse.json({
      ai,
      /** @deprecated naming — use `ai.score` */
      currentScore: ai.score,
      targetScore: engine.targetScore,
      projectedScore,
      upgradePlan,
      improvements: engine.improvements,
      disclaimer: LECIPM_GREEN_AI_DISCLAIMER,
      financialSupport: {
        heading: "Available Financial Support",
        eligibleGrants: grantsBundle.eligibleGrants,
        byRecommendation: grantsBundle.byRecommendation,
        disclaimer: grantsBundle.disclaimer,
      },
      positioning: {
        aiGreenScore: "LECIPM AI Green Score",
        labels: ["LECIPM Green Verified", "AI-Assessed Green Property"],
      },
      contractorIntroduction: {
        tagline: POSITIONING_GREEN_EXECUTION,
        dashboardPath: "/dashboard/broker/green-professionals",
        suggestedSearchParams: `region=Quebec&actions=${encodeURIComponent(improvementsForContractors)}`,
        matchApiPath: "/api/contractors/match",
        disclaimer: CONTRACTOR_WORK_DISCLAIMER,
      },
      renoclimatPotential: {
        ...renoclimatPotential,
        uiTitle: "Rénoclimat Potential",
      },
      estimatedFinancialSupport: {
        heading: "Estimated Financial Support",
        totalCad: renoclimatGrantEstimate.estimatedGrant,
        breakdown: renoclimatGrantEstimate.breakdown.map((b) => ({
          upgrade: b.upgrade,
          amount: b.amount,
        })),
        grantToPropertyValueRatio: renoclimatGrantEstimate.grantToPropertyValueRatio,
        disclaimer: renoclimatGrantEstimate.disclaimer,
        roiNote:
          renoclimatGrantEstimate.grantToPropertyValueRatio != null
            ? `Illustrative grant load ≈ ${(renoclimatGrantEstimate.grantToPropertyValueRatio * 100).toFixed(2)}% of declared value — not investment advice.`
            : null,
      },
    });
  } catch (e) {
    greenSystemLog.error("green_analyze_failed", { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
