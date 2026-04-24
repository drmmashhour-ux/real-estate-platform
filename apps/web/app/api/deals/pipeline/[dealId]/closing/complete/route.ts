import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canManageClosing } from "@/modules/closing/closing-policy";
import { completeClosing } from "@/modules/closing/closing.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageClosing(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const actionPipelineId =
      typeof body.action_pipeline_id === "string" && body.action_pipeline_id.trim()
        ? body.action_pipeline_id.trim()
        : null;

    const closing = await completeClosing(dealId, auth.userId, actionPipelineId);
    const playAssign = typeof body.playbookAssignmentId === "string" ? body.playbookAssignmentId.trim() : null;
    void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
      m.playbookLearningBridge.afterDealClosingComplete({ dealId, playbookAssignmentId: playAssign });
    });
    return NextResponse.json({ closing });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.closing.complete]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
