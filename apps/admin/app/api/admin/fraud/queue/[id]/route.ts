import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status : undefined;
  const assignedAdminId =
    body.assignedAdminId === null ? null : typeof body.assignedAdminId === "string" ? body.assignedAdminId : undefined;

  const row = await prisma.fraudReviewQueue.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const nextStatus =
    status && ["pending", "in_review", "resolved"].includes(status) ? status : row.status;
  const nextAssign = assignedAdminId !== undefined ? assignedAdminId : row.assignedAdminId;

  const updated = await prisma.fraudReviewQueue.update({
    where: { id },
    data: {
      status: nextStatus,
      assignedAdminId: nextAssign,
      ...(nextStatus === "in_review" && row.status === "pending" ? {} : {}),
    },
  });

  await prisma.fraudActionLog.create({
    data: {
      entityType: row.entityType,
      entityId: row.entityId,
      actionType: "queue_update",
      resultJson: { queueId: id, status: nextStatus, assignedAdminId: nextAssign },
    },
  });

  return Response.json({ item: updated });
}
