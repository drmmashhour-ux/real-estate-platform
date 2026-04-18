import { NextResponse } from "next/server";
import { getMarketExpansionSnapshot } from "@/modules/growth/market-expansion.service";
import { listGlobalPricingMatrix } from "@/modules/growth/global-pricing.service";
import { getBrokerNetworkOverview } from "@/modules/growth/broker-network.service";
import { getRetentionIntelligence } from "@/modules/growth/retention-intelligence.service";
import { getAcquisitionScaleSnapshot } from "@/modules/growth/acquisition-scale.service";
import { getFinanceControlSnapshot } from "@/modules/growth/finance-control.service";
import { getRiskManagement1mSnapshot } from "@/modules/growth/risk-management-1m.service";
import { getRevenueForecast30d } from "@/modules/growth/forecast.service";
import { buildGrowthForecast } from "@/modules/growth/growth-scale-forecast.service";
import { build1mGlobalStrategicActions } from "@/modules/growth/ai-global-decision-1m.builder";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.growth1mV1) {
    return NextResponse.json({ error: "Global command center v8 disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const [
      expansion,
      pricingMatrix,
      brokerNetwork,
      retention,
      acquisition,
      finance,
      risk,
      forecast30d,
      monthRunRate,
      topActions,
    ] = await Promise.all([
      getMarketExpansionSnapshot(),
      Promise.resolve(listGlobalPricingMatrix()),
      getBrokerNetworkOverview(18),
      getRetentionIntelligence(),
      getAcquisitionScaleSnapshot(),
      getFinanceControlSnapshot(),
      getRiskManagement1mSnapshot(),
      getRevenueForecast30d(),
      buildGrowthForecast(),
      build1mGlobalStrategicActions(5),
    ]);

    const alerts: string[] = [];
    if (expansion.underperforming.length >= 8) {
      alerts.push(`${expansion.underperforming.length} markets look thin — review acquisition/geo focus.`);
    }
    if (finance.profitCad30dEstimated != null && finance.profitCad30dEstimated < 0) {
      alerts.push("Estimated profit negative vs configured monthly ops cost — validate cost inputs.");
    }
    for (const r of risk.velocityAlerts) alerts.push(r);
    for (const r of risk.imbalanceAlerts) alerts.push(r);

    return NextResponse.json({
      expansion,
      pricingMatrix,
      brokerNetwork,
      retention,
      acquisition,
      finance,
      risk,
      forecast30d,
      monthRunRate,
      topActions,
      alerts,
    });
  } catch (e) {
    console.error("[growth/command-center-v8]", e);
    return NextResponse.json({ error: "Failed to load global command center" }, { status: 500 });
  }
}
