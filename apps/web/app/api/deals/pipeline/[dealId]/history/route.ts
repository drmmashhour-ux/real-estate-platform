import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@repo/db";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const history = await prisma.lecipmPipelineDealStageHistory.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ history });
  } catch (e) {
    logError("[api.deals.history]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
