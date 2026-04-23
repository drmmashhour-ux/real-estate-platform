import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { seniorCommandAuth, canOps } from "@/lib/senior-command/api-auth";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canOps(auth.ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let status: string;
  try {
    const body = (await request.json()) as { status?: string };
    status = typeof body.status === "string" ? body.status : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (status !== "DONE" && status !== "PENDING") {
    return NextResponse.json({ error: "status must be DONE or PENDING" }, { status: 400 });
  }

  const task = await prisma.seniorExpansionTask.findUnique({
    where: { id },
    select: { id: true, cityId: true, taskType: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  logSeniorCommand("[senior-expansion]", "task_update", {
    userId: auth.ctx.userId.slice(0, 8),
    taskId: id.slice(0, 8),
    status,
    taskType: task.taskType,
  });

  const updated = await prisma.seniorExpansionTask.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({
    id: updated.id,
    cityId: updated.cityId,
    taskType: updated.taskType,
    status: updated.status,
  });
}
