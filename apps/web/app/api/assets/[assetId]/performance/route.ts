import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { recordPerformance } from "@/modules/portfolio/asset-performance.service";
import { computeAndStoreHealthScore } from "@/modules/portfolio/asset-health.service";
import { findPrimaryPortfolioForAsset } from "@/modules/portfolio/portfolio.service";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ assetId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { assetId } = await context.params;

  try {
    const asset = await prisma.lecipmPortfolioAsset.findUnique({
      where: { id: assetId },
      include: { deal: { select: { brokerId: true } } },
    });
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "ADMIN" && asset.deal.brokerId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const period = typeof body.period === "string" ? body.period : "MONTHLY";

    const portfolioId = await findPrimaryPortfolioForAsset(assetId);

    const perf = await recordPerformance(
      assetId,
      {
        revenue: typeof body.revenue === "number" ? body.revenue : undefined,
        expenses: typeof body.expenses === "number" ? body.expenses : undefined,
        occupancyRate: typeof body.occupancyRate === "number" ? body.occupancyRate : undefined,
        period,
      },
      portfolioId,
      auth.userId
    );

    const health = await computeAndStoreHealthScore(assetId, portfolioId, auth.userId);

    return NextResponse.json({ performance: perf, health });
  } catch (e) {
    logError("[api.assets.performance.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
