import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canAccessBrokerPortfolio } from "@/modules/portfolio/portfolio-policy";
import { getPortfolioById } from "@/modules/portfolio/portfolio.service";
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

    return NextResponse.json({ portfolio });
  } catch (e) {
    logError("[api.portfolio.id.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
