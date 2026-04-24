import { NextResponse } from "next/server";
import { generateExecutionTasksForBroker } from "@/modules/lecipm-autonomous-execution/execution-task-builder.service";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";

export const dynamic = "force-dynamic";

export async function POST() {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const result = await generateExecutionTasksForBroker(actor.userId);
  return NextResponse.json(result);
}
