import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canAccessPipelineDeal, requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { transitionPipelineStage } from "@/modules/deals/deal-stage.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const toStage = typeof body.toStage === "string" ? body.toStage : "";
  const reason = typeof body.reason === "string" ? body.reason : undefined;

  if (!toStage) return NextResponse.json({ error: "toStage required" }, { status: 400 });

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await transitionPipelineStage({
      dealId,
      toStage,
      actorUserId: auth.userId,
      reason: reason ?? null,
    });
    return NextResponse.json({ deal: updated });
  } catch (e) {
    logError("[api.deals.stage]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
