import { NextResponse } from "next/server";
import { z } from "zod";
import { rankPortfolioProperties } from "@/lib/investor/apply-ranking";
import { computePortfolio } from "@/lib/investor/portfolio";
import { prisma } from "@/lib/db";
import { requireUser } from "@/modules/security/access-guard.service";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  portfolioId: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const book = await prisma.portfolioBook.findFirst({
    where: { id: parsed.data.portfolioId, ownerUserId: auth.userId },
  });

  if (!book) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  await rankPortfolioProperties(parsed.data.portfolioId);

  await recordAuditEvent({
    actorUserId: auth.userId,
    action: "PORTFOLIO_RANKING_COMPUTED",
    payload: { portfolioId: parsed.data.portfolioId },
  });

  const portfolio = await computePortfolio(parsed.data.portfolioId);

  await recordAuditEvent({
    actorUserId: auth.userId,
    action: "PORTFOLIO_AGGREGATES_COMPUTED",
    payload: {
      portfolioId: parsed.data.portfolioId,
      totalValueCents: portfolio?.totalValueCents ?? 0,
      propertyCount: portfolio?.properties.length ?? 0,
    },
  });

  return NextResponse.json({ success: true, portfolio });
}
