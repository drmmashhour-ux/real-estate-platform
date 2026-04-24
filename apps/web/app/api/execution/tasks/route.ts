import { NextResponse } from "next/server";
import { listExecutionTasks } from "@/modules/lecipm-autonomous-execution/autonomous-execution.engine";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const tasks = await listExecutionTasks(actor.userId);
  return NextResponse.json({ tasks });
}
