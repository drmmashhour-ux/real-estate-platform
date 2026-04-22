import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { canOps, seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { updateLeadStatus } from "@/modules/senior-living/lead.service";

export const dynamic = "force-dynamic";

/**
 * Operational actions — does not send external email/SMS unless you wire integrations later.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canOps(auth.ctx)) {
    return NextResponse.json({ error: "Insufficient permission" }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim().toUpperCase() : "";

  switch (action) {
    case "NUDGE_OPERATOR":
      logSeniorCommand("[senior-command]", "nudge_operator", { leadId: id.slice(0, 8) });
      return NextResponse.json({
        ok: true,
        message: "Nudge logged — connect email/push to notify the operator team.",
      });
    case "PRIORITIZE_FOLLOWUP":
      logSeniorCommand("[senior-command]", "prioritize_followup", { leadId: id.slice(0, 8) });
      return NextResponse.json({
        ok: true,
        message: "Priority flag recorded for CRM routing when connected.",
      });
    case "REASSIGN_PLACEHOLDER":
      logSeniorCommand("[senior-override]", "reassign_requested", { leadId: id.slice(0, 8) });
      return NextResponse.json({
        ok: true,
        message: "Reassignment requires residence routing rules — logged for ops review.",
      });
    case "ESCALATE":
      logSeniorCommand("[senior-alert]", "escalate_stuck_lead", { leadId: id.slice(0, 8) });
      return NextResponse.json({ ok: true, message: "Escalation logged." });
    case "MARK_CONTACTED":
      await updateLeadStatus(id, "CONTACTED");
      logSeniorCommand("[senior-override]", "status_contacted", { leadId: id.slice(0, 8) });
      return NextResponse.json({ ok: true, message: "Status set to CONTACTED." });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
