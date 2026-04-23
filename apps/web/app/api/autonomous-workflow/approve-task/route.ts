import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { updateTaskStatus, recordWorkflowAutomationEvent } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";
import { isRestrictedTaskType } from "@/src/modules/autonomous-workflow-assistant/policies/approvalRequiredPolicy";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const taskId = String(body.taskId ?? "");
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const task = await prisma.autonomousWorkflowTask.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (task.requiresApproval === false) return NextResponse.json({ error: "task does not require approval" }, { status: 400 });

  if (!task.documentId) {
    const admin = await isPlatformAdmin(userId);
    if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else {
    const auth = await requireDocumentAccess(task.documentId);
    if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

    if (isRestrictedTaskType(task.taskType)) {
      const doc = await prisma.sellerDeclarationDraft.findUnique({
        where: { id: task.documentId },
        select: { adminUserId: true },
      });
      const platformAdmin = await isPlatformAdmin(userId);
      const isDocAdmin = doc?.adminUserId === userId;
      if (!platformAdmin && !isDocAdmin) {
        return NextResponse.json({ error: "restricted task approval requires document or platform admin" }, { status: 403 });
      }
    }
  }

  await updateTaskStatus(taskId, "approved");
  if (task.documentId) {
    await recordWorkflowAutomationEvent({
      triggerType: "human_decision",
      entityType: "seller_declaration_draft",
      entityId: task.documentId,
      actionType: `task_approved:${task.taskType}`,
      status: "approved",
      payload: { taskId, approvedBy: userId },
    });
  }
  captureServerEvent(userId, "autonomous_task_approved", { taskId, documentId: task.documentId });
  return NextResponse.json({ ok: true });
}
