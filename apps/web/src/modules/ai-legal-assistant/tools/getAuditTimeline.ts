import { prisma } from "@/lib/db";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

export async function getAuditTimeline(documentId: string, userId: string) {
  if (!(await assertDocumentAccess(documentId, userId))) throw new Error("forbidden");
  return prisma.documentAuditLog.findMany({ where: { documentId }, orderBy: { createdAt: "desc" }, take: 100 });
}
