import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { compareOffers } from "@/modules/capital/lender-offer.service";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await compareOffers(dealId, auth.userId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.offers.compare.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
