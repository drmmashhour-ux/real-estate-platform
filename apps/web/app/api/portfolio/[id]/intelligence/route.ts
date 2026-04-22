import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  detectTopPerformers,
  detectUnderperformers,
  identifyRiskAssets,
  rankAssets,
} from "@/modules/portfolio/portfolio-intelligence.service";
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

    const [ranked, underperformers, topPerformers, riskAssets] = await Promise.all([
      rankAssets(id),
      detectUnderperformers(id),
      detectTopPerformers(id),
      identifyRiskAssets(id),
    ]);

    return NextResponse.json({
      ranked,
      underperformers,
      topPerformers,
      riskAssets,
    });
  } catch (e) {
    logError("[api.portfolio.intelligence.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
