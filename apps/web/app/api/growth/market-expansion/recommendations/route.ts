import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildMarketExpansionRecommendations } from "@/modules/growth/market-expansion.service";
import { DEFAULT_FAST_DEAL_COMPARISON_CITIES } from "@/modules/growth/fast-deal-city-comparison.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

function parseCities(raw: string | null): string[] {
  if (!raw?.trim()) return [...DEFAULT_FAST_DEAL_COMPARISON_CITIES];
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export async function GET(req: Request) {
  if (!engineFlags.marketExpansionV1 || !engineFlags.fastDealCityComparisonV1) {
    return NextResponse.json({ error: "Market expansion unavailable" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(180, Math.max(14, Number(url.searchParams.get("windowDays")) || 30));
  const cities = parseCities(url.searchParams.get("cities"));

  const recommendation = await buildMarketExpansionRecommendations(cities, windowDays);
  if (!recommendation) {
    return NextResponse.json({ error: "Could not build recommendations" }, { status: 503 });
  }

  return NextResponse.json({
    recommendation,
    disclaimer:
      "Advisory ranking only — does not guarantee expansion success and does not trigger outreach or payments.",
  });
}
