import { NextResponse } from "next/server";
import { aiGrowthAutopilotSafeFlags } from "@/config/feature-flags";
import { executeApprovedSafeActions } from "@/modules/growth/ai-autopilot-controlled-execution.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!aiGrowthAutopilotSafeFlags.aiAutopilotV1 || !aiGrowthAutopilotSafeFlags.aiAutopilotExecutionV1) {
    return NextResponse.json({ error: "AI Autopilot safe execution disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const result = await executeApprovedSafeActions({ actorUserId: auth.userId });
  return NextResponse.json(result);
}
