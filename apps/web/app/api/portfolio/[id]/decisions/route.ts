import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { generateProposedDecisions } from "@/modules/portfolio/ai-asset-manager.service";
import { canAccessBrokerPortfolio } from "@/modules/portfolio/portfolio-policy";
import { getPortfolioById } from "@/modules/portfolio/portfolio.service";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { prisma } from "@/lib/db";

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

    const decisions = await prisma.lecipmBrokerPortfolioDecision.findMany({
      where: { portfolioId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ decisions });
  } catch (e) {
    logError("[api.portfolio.decisions.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const portfolio = await getPortfolioById(id);
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessBrokerPortfolio(auth.role, auth.userId, portfolio)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const proposed = await generateProposedDecisions(id, auth.userId);
    return NextResponse.json({ decisions: proposed });
  } catch (e) {
    logError("[api.portfolio.decisions.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
