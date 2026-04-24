import { NextResponse } from "next/server";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS } from "@/modules/green-ai/quebec-esg-disclaimers";
import { runQuebecEsgEconomicsPipeline } from "@/modules/green-ai/quebec-esg-economics.runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseGreenInput(intake: Record<string, unknown>): GreenEngineInput {
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
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({
      ok: false,
      currentScore: null,
      projectedScore: null,
      delta: null,
      netCostLow: null,
      netCostHigh: null,
      roi: null,
      pricingBoost: null,
      disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
      error: "invalid_json",
    });
  }

  const baseRaw = body.baseInput ?? body.input ?? body.intake;
  if (!baseRaw || typeof baseRaw !== "object" || Array.isArray(baseRaw)) {
    return NextResponse.json({
      ok: false,
      currentScore: null,
      projectedScore: null,
      delta: null,
      netCostLow: null,
      netCostHigh: null,
      roi: null,
      pricingBoost: null,
      disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
      error: "baseInput_required",
    });
  }

  const input = parseGreenInput(baseRaw as Record<string, unknown>);
  const recommendationKeys = Array.isArray(body.recommendationKeys)
    ? body.recommendationKeys.map((x) => String(x)).filter(Boolean)
    : undefined;
  const optionalListingPrice =
    typeof body.optionalListingPrice === "number" && Number.isFinite(body.optionalListingPrice)
      ? body.optionalListingPrice
      : null;

  const run = runQuebecEsgEconomicsPipeline(input, {
    recommendationKeys,
    optionalListingPriceCad: optionalListingPrice,
    propertyType: input.propertyType ?? null,
  });

  if (!run) {
    return NextResponse.json({
      ok: false,
      currentScore: null,
      projectedScore: null,
      delta: null,
      netCostLow: null,
      netCostHigh: null,
      roi: null,
      pricingBoost: null,
      disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
      error: "roi_unavailable",
    });
  }

  return NextResponse.json({
    ok: true,
    currentScore: run.simulation.currentScore,
    projectedScore: run.simulation.projectedScore,
    delta: run.simulation.delta,
    netCostLow: run.roi.netCostLow,
    netCostHigh: run.roi.netCostHigh,
    roi: run.roi,
    pricingBoost: run.pricingBoost,
    costEstimates: run.costEstimates,
    incentives: run.incentives,
    recommendations: run.recommendations,
    disclaimers: [...QUEBEC_ESG_ECONOMICS_API_DISCLAIMERS],
  });
}
