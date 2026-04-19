import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import {
  approveExecutionTask,
  denyExecutionTask,
} from "@/modules/growth/execution-planner-approval.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!engineFlags.executionPlannerV1) {
    return NextResponse.json({ error: "Execution planner disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    taskId?: string;
    action?: "approve" | "deny";
    reason?: string;
  };

  if (!body.taskId || !body.action) {
    return NextResponse.json({ error: "taskId and action required" }, { status: 400 });
  }

  if (body.action === "approve") {
    approveExecutionTask(body.taskId, auth.userId);
  } else {
    denyExecutionTask(body.taskId, body.reason, auth.userId);
  }

  return NextResponse.json({ ok: true });
}
