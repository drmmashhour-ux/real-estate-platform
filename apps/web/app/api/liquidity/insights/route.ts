import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { computeCityLiquiditySnapshots } from "@/src/modules/liquidity/liquidity.engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/liquidity/insights — public aggregate market liquidity (no PII).
 */
export async function GET() {
  if (!intelligenceFlags.liquidityEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const rows = await computeCityLiquiditySnapshots(25);
  return NextResponse.json({ ok: true, cities: rows });
}
