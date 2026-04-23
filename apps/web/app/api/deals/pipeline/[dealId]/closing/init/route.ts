import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { initializeClosing } from "@/modules/closing/closing.service";
import { canManageClosing } from "@/modules/closing/closing-policy";
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
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageClosing(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const closing = await initializeClosing(dealId, auth.userId);
    return NextResponse.json({ closing });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.closing.init]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
