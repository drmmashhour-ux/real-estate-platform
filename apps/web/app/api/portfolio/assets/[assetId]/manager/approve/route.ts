import { NextResponse } from "next/server";
import { approveAssetManagerPlan } from "@/modules/portfolio/portfolio-intelligence.service";
import { requirePortfolioSession } from "../../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  const { assetId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const planId = typeof body?.planId === "string" ? body.planId : "";
  if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

  try {
    await approveAssetManagerPlan(auth.userId, auth.role, assetId, planId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as Error & { status?: number }).status === 403 ? 403 : 404;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Not found" }, { status });
  }
}
