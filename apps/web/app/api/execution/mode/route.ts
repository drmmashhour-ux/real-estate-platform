import { NextResponse } from "next/server";
import type { LecipmAutonomousExecutionMode } from "@prisma/client";
import { getBrokerExecutionSettingsView, setBrokerExecutionMode } from "@/modules/lecipm-autonomous-execution/autonomous-execution.engine";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";

export const dynamic = "force-dynamic";

const MODES = new Set<LecipmAutonomousExecutionMode>(["OFF", "ASSIST", "SAFE_AUTOMATION", "APPROVAL_REQUIRED"]);

export async function GET() {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const settings = await getBrokerExecutionSettingsView(actor.userId);
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode as LecipmAutonomousExecutionMode | undefined;
  if (!mode || !MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  await setBrokerExecutionMode(actor.userId, mode);
  const settings = await getBrokerExecutionSettingsView(actor.userId);
  return NextResponse.json(settings);
}
