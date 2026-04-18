import { NextResponse } from "next/server";
import { getBrokerPerformanceSummaries } from "@/modules/growth/broker-performance.service";
import { getCampaignRoiSummary } from "@/modules/growth/ads-campaign-roi.service";
import { buildGrowthForecast } from "@/modules/growth/growth-scale-forecast.service";
import { getRecommendedLeadPriceCad } from "@/modules/revenue/pricing-optimizer.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.growthScaleV1) {
    return NextResponse.json({ error: "Growth scale layer disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const [brokers, forecast, pricing, adsFull] = await Promise.all([
      getBrokerPerformanceSummaries(15),
      buildGrowthForecast(),
      getRecommendedLeadPriceCad(),
      getCampaignRoiSummary(),
    ]);
    const ads = {
      health: adsFull.health,
      scaleSuggestion: adsFull.scaleSuggestion,
      pauseSuggestion: adsFull.pauseSuggestion,
    };
    return NextResponse.json({ brokers, forecast, pricing, ads });
  } catch (e) {
    console.error("[growth/scale]", e);
    return NextResponse.json({ error: "Failed to load scale snapshot" }, { status: 500 });
  }
}
