import { NextResponse } from "next/server";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS } from "@/modules/green-ai/quebec-esg-disclaimers";
import { runQuebecEsgEconomicsPipeline } from "@/modules/green-ai/quebec-esg-economics.runner";
import { generateQuebecEsgRecommendations } from "@/modules/green-ai/quebec-esg-recommendation.service";
import { evaluateQuebecEsg } from "@/modules/green-ai/quebec-esg.engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseInput(body: Record<string, unknown>): GreenEngineInput | null {
  try {
    const intake = (body.input ?? body.intake ?? body) as Record<string, unknown>;
    return {
      propertyType: typeof intake.propertyType === "string" ? intake.propertyType : undefined,
      yearBuilt: typeof intake.yearBuilt === "number" ? intake.yearBuilt : undefined,
      surfaceSqft: typeof intake.surfaceSqft === "number" ? intake.surfaceSqft : undefined,
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
      atticInsulationQuality:
        intake.atticInsulationQuality === "poor" ||
        intake.atticInsulationQuality === "average" ||
        intake.atticInsulationQuality === "good" ||
        intake.atticInsulationQuality === "unknown"
          ? intake.atticInsulationQuality
          : undefined,
      wallInsulationQuality:
        intake.wallInsulationQuality === "poor" ||
        intake.wallInsulationQuality === "average" ||
        intake.wallInsulationQuality === "good" ||
        intake.wallInsulationQuality === "unknown"
          ? intake.wallInsulationQuality
          : undefined,
      hasGreenRoof: typeof intake.hasGreenRoof === "boolean" ? intake.hasGreenRoof : undefined,
      energyConsumptionBand:
        intake.energyConsumptionBand === "high" ||
        intake.energyConsumptionBand === "moderate" ||
        intake.energyConsumptionBand === "low" ||
        intake.energyConsumptionBand === "unknown"
          ? intake.energyConsumptionBand
          : undefined,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json(
      {
        ok: false,
        recommendations: [],
        costEstimates: [],
        incentives: [],
        totalEstimatedIncentives: null,
        disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
        error: "invalid_json",
      },
      { status: 200 },
    );
  }

  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({
      ok: false,
      recommendations: [],
      costEstimates: [],
      incentives: [],
      totalEstimatedIncentives: null,
      disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
      error: "invalid_input",
    });
  }

  const recommendationKeys = Array.isArray(body.recommendationKeys)
    ? body.recommendationKeys.map((x) => String(x)).filter(Boolean)
    : undefined;
  const historyMode = body.historyMode === true;
  const optionalListingPriceCad =
    typeof body.optionalListingPriceCad === "number" && Number.isFinite(body.optionalListingPriceCad)
      ? body.optionalListingPriceCad
      : null;

  const run = runQuebecEsgEconomicsPipeline(input, {
    recommendationKeys,
    historyMode,
    optionalListingPriceCad,
    propertyType: input.propertyType ?? null,
  });

  if (!run) {
    const evaluation = evaluateQuebecEsg(input);
    const { recommendations } = generateQuebecEsgRecommendations(input, evaluation);
    return NextResponse.json({
      ok: false,
      recommendations,
      costEstimates: [],
      incentives: [],
      totalEstimatedIncentives: null,
      disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
      error: "economics_unavailable",
    });
  }

  return NextResponse.json({
    ok: true,
    recommendations: run.recommendations,
    costEstimates: run.costEstimates.costEstimates,
    totalLowCost: run.costEstimates.totalLowCost,
    totalHighCost: run.costEstimates.totalHighCost,
    incentives: run.incentives.incentives,
    totalEstimatedIncentives: run.incentives.totalEstimatedIncentives,
    simulation: run.simulation,
    roiSummary: {
      netCostLow: run.roi.netCostLow,
      netCostHigh: run.roi.netCostHigh,
      scoreDelta: run.roi.scoreDelta,
    },
    pricingBoost: run.pricingBoost,
    disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
  });
}
