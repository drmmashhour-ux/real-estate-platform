import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const WORKFLOW: readonly string[] = ["draft", "broker_review", "approved", "exported", "signed", "archived"];

export function isValidWorkflowStatus(s: string | null | undefined): boolean {
  if (!s) return false;
  return WORKFLOW.includes(s);
}

export async function setDocumentWorkflowStatus(
  dealDocumentId: string,
  workflowStatus: string,
  actorUserId: string,
): Promise<void> {
  if (!isValidWorkflowStatus(workflowStatus)) throw new Error("Invalid workflow status");
  await prisma.dealDocument.update({
    where: { id: dealDocumentId },
    data: { workflowStatus },
  });
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: (
        await prisma.dealDocument.findUniqueOrThrow({ where: { id: dealDocumentId }, select: { dealId: true } })
      ).dealId,
      actorUserId,
      actionKey: "document_workflow_status",
      payload: { dealDocumentId, workflowStatus } as Prisma.InputJsonValue,
    },
  });
}
