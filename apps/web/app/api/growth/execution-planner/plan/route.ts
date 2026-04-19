import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildExecutionPlan } from "@/modules/growth/execution-planner.service";
import { getApprovalRecord } from "@/modules/growth/execution-planner-approval.service";
import type { ApprovalRecord } from "@/modules/growth/execution-planner-approval.service";
import type { ExecutionPlan, ExecutionTask } from "@/modules/growth/execution-planner.types";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

function enrichTask<T extends ExecutionTask>(t: T): T & { approval: ApprovalRecord } {
  return { ...t, approval: getApprovalRecord(t.id) };
}

function enrichPlan(plan: ExecutionPlan): Omit<ExecutionPlan, "todayTasks" | "weeklyTasks" | "blockedTasks"> & {
  todayTasks: Array<ExecutionTask & { approval: ApprovalRecord }>;
  weeklyTasks: Array<ExecutionTask & { approval: ApprovalRecord }>;
  blockedTasks: Array<(typeof plan.blockedTasks)[number] & { approval: ApprovalRecord }>;
} {
  return {
    ...plan,
    todayTasks: plan.todayTasks.map(enrichTask),
    weeklyTasks: plan.weeklyTasks.map(enrichTask),
    blockedTasks: plan.blockedTasks.map((t) => ({ ...t, approval: getApprovalRecord(t.id) })),
  };
}

export async function GET(req: Request) {
  if (!engineFlags.executionPlannerV1) {
    return NextResponse.json({ error: "Execution planner disabled" }, { status: 403 });
  }

  const authResult = await requireGrowthMachineActor();
  if (!authResult.ok) return authResult.response;

  const url = new URL(req.url);
  const windowDays = Math.min(30, Math.max(7, Number(url.searchParams.get("windowDays")) || 14));

  const raw = await buildExecutionPlan(windowDays);
  const plan = enrichPlan(raw);

  return NextResponse.json({
    plan,
    disclaimer:
      "Planning + approval only — server records approval state internally; navigation does not mutate billing, bookings, or outbound messaging.",
  });
}
