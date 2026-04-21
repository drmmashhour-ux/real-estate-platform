import { NextResponse } from "next/server";
import { generateAssetManagerPlan } from "@/modules/portfolio/portfolio-intelligence.service";
import { requirePortfolioSession } from "../../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  const { assetId } = await ctx.params;

  try {
    const result = await generateAssetManagerPlan(auth.userId, auth.role, assetId);
    return NextResponse.json({
      generated: result.generated,
      strategy: result.strategy,
      actionCount: result.actionCount,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status === 403 ? 403 : 404;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Not found" }, { status });
  }
}
