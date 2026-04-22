import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canAccessBrokerPortfolio } from "@/modules/portfolio/portfolio-policy";
import { addAssetToPortfolio, getPortfolioById, listPortfolioAssets } from "@/modules/portfolio/portfolio.service";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const portfolio = await getPortfolioById(id);
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessBrokerPortfolio(auth.role, auth.userId, portfolio)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assets = await listPortfolioAssets(id);
    return NextResponse.json({ assets });
  } catch (e) {
    logError("[api.portfolio.assets.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const portfolio = await getPortfolioById(id);
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessBrokerPortfolio(auth.role, auth.userId, portfolio)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    if (!assetId) return NextResponse.json({ error: "assetId required" }, { status: 400 });

    const allocationWeight =
      typeof body.allocationWeight === "number" ? body.allocationWeight : undefined;

    const updated = await addAssetToPortfolio(id, assetId, allocationWeight, auth.userId, auth.role);
    return NextResponse.json({ portfolio: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.portfolio.assets.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
