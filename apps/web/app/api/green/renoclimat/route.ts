import { NextResponse } from "next/server";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { greenSystemLog } from "@/modules/green/green-logger";
import { estimateRenoclimatGrants, syntheticUpgradesFromProperty } from "@/modules/green-ai/renoclimat/grant-calculator";
import { runRenoclimatEligibility } from "@/modules/green-ai/renoclimat/renoclimat.engine";
import type { RenoclimatInput } from "@/modules/green-ai/renoclimat/renoclimat.types";

export const dynamic = "force-dynamic";

function parseRenoclimatBody(body: Record<string, unknown>): RenoclimatInput {
  const insulation =
    body.insulationQuality === "poor" ||
    body.insulationQuality === "average" ||
    body.insulationQuality === "good" ||
    body.insulationQuality === "unknown"
      ? body.insulationQuality
      : undefined;

  const windows =
    body.windowsQuality === "single" ||
    body.windowsQuality === "double" ||
    body.windowsQuality === "triple_high_performance" ||
    body.windowsQuality === "unknown"
      ? body.windowsQuality
      : undefined;

  return {
    propertyType: typeof body.propertyType === "string" && body.propertyType.trim() ? body.propertyType : "house",
    yearBuilt: typeof body.yearBuilt === "number" ? body.yearBuilt : undefined,
    heatingType: typeof body.heatingType === "string" ? body.heatingType : undefined,
    insulationQuality: insulation,
    windowsQuality: windows,
    locationRegion:
      typeof body.locationRegion === "string" && body.locationRegion.trim()
        ? body.locationRegion.trim()
        : "Quebec",
  };
}

function renoclimatBodyToGreenEngineInput(r: RenoclimatInput, body: Record<string, unknown>): GreenEngineInput {
  const heat = (r.heatingType ?? "").toLowerCase();
  return {
    propertyType: r.propertyType,
    yearBuilt: r.yearBuilt,
    heatingType: r.heatingType,
    insulationQuality: r.insulationQuality,
    windowsQuality: r.windowsQuality,
    hasHeatPump: typeof body.hasHeatPump === "boolean" ? body.hasHeatPump : heat.includes("heat pump") || heat.includes("thermopompe"),
    solarPvKw: 0,
    surfaceSqft: typeof body.surfaceSqft === "number" ? body.surfaceSqft : undefined,
  };
}

/**
 * POST — AI-assisted Rénoclimat incentive **potential** (not official eligibility).
 */
export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const input = parseRenoclimatBody(json);
    const result = runRenoclimatEligibility(input);

    const greenLike = renoclimatBodyToGreenEngineInput(input, json);
    const upgradeLines = syntheticUpgradesFromProperty(greenLike);
    const propertyValueMajor =
      typeof json.propertyValueMajor === "number" && json.propertyValueMajor > 0
        ? json.propertyValueMajor
        : typeof json.propertyValue === "number" && json.propertyValue > 0
          ? json.propertyValue
          : undefined;
    const grantEstimate = estimateRenoclimatGrants({
      upgradeActions: upgradeLines,
      propertyDetails: {
        surfaceSqft: greenLike.surfaceSqft,
        windowCount: typeof json.windowCount === "number" ? json.windowCount : undefined,
        propertyValueMajor,
      },
    });

    greenSystemLog.info("renoclimat_api_ok", { eligible: result.eligible, level: result.eligibilityLevel });

    return NextResponse.json({
      renoclimatPotential: result,
      uiTitle: "Rénoclimat Potential",
      estimatedFinancialSupport: {
        heading: "Estimated Financial Support",
        totalCad: grantEstimate.estimatedGrant,
        breakdown: grantEstimate.breakdown.map((b) => ({ upgrade: b.upgrade, amount: b.amount })),
        grantToPropertyValueRatio: grantEstimate.grantToPropertyValueRatio,
        disclaimer: grantEstimate.disclaimer,
        roiNote:
          grantEstimate.grantToPropertyValueRatio != null
            ? `Illustrative grants ≈ ${(grantEstimate.grantToPropertyValueRatio * 100).toFixed(2)}% of declared property value — not investment advice.`
            : null,
      },
    });
  } catch (e) {
    greenSystemLog.error("renoclimat_api_failed", { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
