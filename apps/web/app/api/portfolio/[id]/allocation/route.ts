import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { generateAllocation } from "@/modules/portfolio/capital-allocation.service";
import { canAccessBrokerPortfolio } from "@/modules/portfolio/portfolio-policy";
import { getPortfolioById } from "@/modules/portfolio/portfolio.service";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

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
    const totalBudget = typeof body.totalBudget === "number" ? body.totalBudget : NaN;
    if (!Number.isFinite(totalBudget)) {
      return NextResponse.json({ error: "totalBudget required" }, { status: 400 });
    }

    const result = await generateAllocation(id, totalBudget, auth.userId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.portfolio.allocation.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
