import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import {
  acknowledgeTask,
  assignTaskToRole,
  assignTaskToUser,
  buildCoordinationPlanSnapshot,
  getCoordinationSummary,
  listTaskAssignments,
  updateTaskCoordinationStatus,
} from "@/modules/growth/team-coordination.service";
import type { CoordinationRole, CoordinationStatus } from "@/modules/growth/team-coordination.types";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.teamCoordinationV1) {
    return NextResponse.json({ error: "Team coordination disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    assignments: listTaskAssignments(),
    snapshot: buildCoordinationPlanSnapshot(),
    summary: getCoordinationSummary(),
    disclaimer:
      "In-memory coordination map — resets on deploy; approvals still required before assignment.",
  });
}

export async function POST(req: Request) {
  if (!engineFlags.teamCoordinationV1) {
    return NextResponse.json({ error: "Team coordination disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    kind?:
      | "assign_role"
      | "assign_user"
      | "acknowledge"
      | "status";
    taskId?: string;
    role?: CoordinationRole;
    userId?: string;
    status?: CoordinationStatus;
    note?: string;
  };

  if (!body.kind || !body.taskId) {
    return NextResponse.json({ error: "kind and taskId required" }, { status: 400 });
  }

  if (body.kind === "assign_role") {
    if (!body.role) return NextResponse.json({ error: "role required" }, { status: 400 });
    const r = assignTaskToRole(body.taskId, body.role, auth.userId);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }

  if (body.kind === "assign_user") {
    if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const r = assignTaskToUser(body.taskId, body.userId, auth.userId);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }

  if (body.kind === "acknowledge") {
    const r = acknowledgeTask(body.taskId);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }

  if (body.kind === "status") {
    if (!body.status) return NextResponse.json({ error: "status required" }, { status: 400 });
    const r = updateTaskCoordinationStatus(body.taskId, body.status, auth.userId, body.note);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
