import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { buildDealSummary, getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const allowed =
      canAccessPipelineDeal(auth.role, auth.userId, deal) || auth.role === "INVESTOR" || auth.role === "ADMIN";
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const summary = await buildDealSummary(dealId);
    return NextResponse.json(summary);
  } catch (e) {
    logError("[api.deals.summary]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
