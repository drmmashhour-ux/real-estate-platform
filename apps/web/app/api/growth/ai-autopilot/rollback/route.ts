import { NextResponse } from "next/server";
import { aiGrowthAutopilotSafeFlags } from "@/config/feature-flags";
import { rollbackExecutedSafeAction } from "@/modules/growth/ai-autopilot-rollback.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (
    !aiGrowthAutopilotSafeFlags.aiAutopilotV1 ||
    !aiGrowthAutopilotSafeFlags.aiAutopilotExecutionV1 ||
    !aiGrowthAutopilotSafeFlags.aiAutopilotRollbackV1
  ) {
    return NextResponse.json({ error: "AI Autopilot rollback disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const actionId = typeof body.actionId === "string" ? body.actionId.trim() : "";
  if (!actionId) {
    return NextResponse.json({ error: "actionId required" }, { status: 400 });
  }

  const result = await rollbackExecutedSafeAction(actionId);
  return NextResponse.json(result);
}
