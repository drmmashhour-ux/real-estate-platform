import { NextResponse } from "next/server";
import { getMarketplaceBalance } from "@/modules/growth/marketplace-balance.service";
import { getAdvancedRecommendedLeadPriceCad } from "@/modules/growth/marketplace-dynamic-pricing-advanced.service";
import { listBrokerTierSummaries } from "@/modules/growth/broker-tier.service";
import { getBrokerLifecycleSnapshots } from "@/modules/growth/lifecycle.service";
import { getAcquisitionChannelRoi } from "@/modules/growth/acquisition-channel-roi.service";
import { getRevenueForecast30d } from "@/modules/growth/forecast.service";
import { buildGrowthForecast } from "@/modules/growth/growth-scale-forecast.service";
import { getGrowth100kGovernanceHints } from "@/modules/growth/growth-100k-governance-hints.service";
import { build100kGrowthOrchestratorTopActions } from "@/modules/growth/ai-growth-orchestrator-100k.builder";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.growth100kV1) {
    return NextResponse.json({ error: "Company command center v7 disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const [
      marketplace,
      pricingAdvanced,
      brokerTiers,
      lifecycle,
      acquisition,
      forecast30d,
      monthForecast,
      governance,
      topActions,
    ] = await Promise.all([
      getMarketplaceBalance(),
      getAdvancedRecommendedLeadPriceCad(),
      listBrokerTierSummaries(20),
      getBrokerLifecycleSnapshots(15),
      getAcquisitionChannelRoi(),
      getRevenueForecast30d(),
      buildGrowthForecast(),
      getGrowth100kGovernanceHints(),
      build100kGrowthOrchestratorTopActions(3),
    ]);

    const alerts: string[] = [];
    if (marketplace.balance === "undersupply") alerts.push("Undersupply: leads thin vs brokers — boost acquisition.");
    if (marketplace.balance === "oversupply") alerts.push("Oversupply: many leads per broker — recruit brokers or tighten quality.");
    if (governance.overpricingRisk) alerts.push(governance.overpricingRisk);
    for (const g of governance.lowQualityLeadSignals) alerts.push(g);

    return NextResponse.json({
      marketplace,
      pricingAdvanced,
      brokerTiers,
      lifecycle,
      acquisition,
      forecast30d,
      monthForecast,
      governance,
      topActions,
      alerts,
    });
  } catch (e) {
    console.error("[growth/command-center-v7]", e);
    return NextResponse.json({ error: "Failed to load command center" }, { status: 500 });
  }
}
