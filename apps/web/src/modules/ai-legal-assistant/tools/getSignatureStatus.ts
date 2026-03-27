import { prisma } from "@/lib/db";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

export async function getSignatureStatus(documentId: string, userId: string) {
  if (!(await assertDocumentAccess(documentId, userId))) throw new Error("forbidden");
  return prisma.documentSignature.findMany({ where: { documentId }, orderBy: { createdAt: "desc" } });
}
