import { NextResponse } from "next/server";
import { getAssetManagerSnapshot } from "@/modules/portfolio/portfolio-intelligence.service";
import { requirePortfolioSession } from "../../../_auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  const { assetId } = await ctx.params;

  try {
    const data = await getAssetManagerSnapshot(auth.userId, auth.role, assetId);
    return NextResponse.json({
      assetHealth: data.assetHealth,
      strategy: data.strategy,
      actions: data.actions,
      outcomeHistory: data.outcomeHistory,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status === 403 ? 403 : 404;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Not found" }, { status });
  }
}
