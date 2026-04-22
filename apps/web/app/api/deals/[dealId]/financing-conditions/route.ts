import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { listFinancingConditions } from "@/modules/capital/financing-conditions.service";
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

    const conditions = await listFinancingConditions(dealId);
    return NextResponse.json({ conditions });
  } catch (e) {
    logError("[api.deals.financing-conditions.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
