import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requirePortfolioOwnerOrAdmin } from "@/lib/portfolio-autopilot/portfolio-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("ownerUserId");
  const status = url.searchParams.get("status");

  const gate = await requirePortfolioOwnerOrAdmin({ targetOwnerUserId: target });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const actions = await prisma.portfolioAutopilotAction.findMany({
    where: {
      ownerUserId: gate.effectiveOwnerId,
      ...(status && ["suggested", "approved", "rejected", "applied"].includes(status)
        ? { status: status as "suggested" | "approved" | "rejected" | "applied" }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 80,
  });

  return NextResponse.json({ actions, effectiveOwnerId: gate.effectiveOwnerId });
}
