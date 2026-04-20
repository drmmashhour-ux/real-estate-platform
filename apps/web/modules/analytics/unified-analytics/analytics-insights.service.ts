import type { UnifiedAnalyticsInsight } from "./unified-analytics.types";

export function buildDeterministicInsights(params: {
  conversionRate: number;
  conversionPrev: number;
  leadsTotal: number;
  leadsPrev: number;
  revenueCents: number;
  revenuePrevCents: number;
  topCityLabel: string | null;
  demandSpikeRisk: "low" | "medium" | "high";
  growthTrendPct: number;
}): UnifiedAnalyticsInsight[] {
  const out: UnifiedAnalyticsInsight[] = [];
  let id = 0;
  const add = (text: string, category: UnifiedAnalyticsInsight["category"]) => {
    id += 1;
    out.push({ id: `ins-${id}`, text, category });
  };

  const convDeltaPct =
    params.conversionPrev > 0
      ? Math.round(((params.conversionRate - params.conversionPrev) / params.conversionPrev) * 100)
      : 0;
  if (convDeltaPct >= 3) {
    add(`Conversion improved about ${convDeltaPct}% vs the prior window — funnel follow-up is working.`, "conversion");
  } else if (convDeltaPct <= -5) {
    add(`Conversion moved down about ${Math.abs(convDeltaPct)}% — review lead response time and qualification.`, "conversion");
  }

  if (params.leadsTotal > params.leadsPrev * 1.15 && params.leadsPrev > 0) {
    add("Lead volume is materially above the prior period — capacity and routing may need attention.", "volume");
  }

  if (params.revenueCents > params.revenuePrevCents * 1.1 && params.revenuePrevCents > 0) {
    add("Revenue is outpacing the prior window — pricing and attach products may have room to scale.", "pricing");
  }

  if (params.topCityLabel) {
    add(`Recent lead activity is concentrated in ${params.topCityLabel} — consider local campaigns or inventory focus.`, "geo");
  }

  if (params.demandSpikeRisk === "high") {
    add("Demand signals show a spike pattern — verify capacity, pricing, and SLAs on high-traffic listings.", "health");
  }

  if (params.growthTrendPct > 5) {
    add(`Trailing revenue momentum is positive (~${params.growthTrendPct}% vs prior week).`, "health");
  } else if (params.growthTrendPct < -5) {
    add(`Trailing revenue momentum cooled (~${params.growthTrendPct}% vs prior week) — review acquisition and monetization levers.`, "health");
  }

  return out.slice(0, 8);
}
