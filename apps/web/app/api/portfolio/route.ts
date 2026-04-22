import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { createPortfolio, listPortfoliosForOwner } from "@/modules/portfolio/portfolio.service";
import { canManagePortfolio } from "@/modules/portfolio/portfolio-access";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  try {
    if (!canManagePortfolio(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const portfolios = await listPortfoliosForOwner(auth.userId);
    return NextResponse.json({ portfolios });
  } catch (e) {
    logError("[api.portfolio.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  try {
    if (!canManagePortfolio(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const portfolio = await createPortfolio(auth.userId, {
      name,
      description: typeof body.description === "string" ? body.description : undefined,
    });

    return NextResponse.json({ portfolio });
  } catch (e) {
    logError("[api.portfolio.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
