import { NextResponse } from "next/server";
import { buildMontrealMarketSnapshot } from "@/modules/market-intelligence/montreal-market.service";
import { buildDominationBundle } from "@/modules/domination-strategy/domination-strategy.service";
import { requireMontrealGrowthAdmin } from "@/lib/growth/montreal-growth-api-auth";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMontrealGrowthAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const includeDomination =
    searchParams.get("includeDomination") === "1" || searchParams.get("includeDomination") === "true";

  const snapshot = await buildMontrealMarketSnapshot();

  if (includeDomination && montrealGrowthEngineFlags.dominationStrategyV1) {
    const domination = await buildDominationBundle();
    return NextResponse.json({ snapshot, domination });
  }

  return NextResponse.json({
    snapshot,
    domination: null,
    dominationDisabledReason:
      includeDomination && !montrealGrowthEngineFlags.dominationStrategyV1
        ? "FEATURE_DOMINATION_STRATEGY_V1 is off"
        : undefined,
  });
}
