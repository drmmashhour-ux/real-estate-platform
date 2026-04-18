import { NextResponse } from "next/server";
import { aiGrowthAutopilotSafeFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { listAutopilotActionsWithStatus } from "@/modules/growth/ai-autopilot-api.helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!aiGrowthAutopilotSafeFlags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const payload = await listAutopilotActionsWithStatus();
  return NextResponse.json({
    actions: payload.actions,
    autopilotStatus: payload.autopilotStatus,
    grouped: payload.grouped,
    focusTitle: payload.focusTitle,
    panelSignalStrength: payload.panelSignalStrength,
  });
}
