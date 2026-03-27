import { prisma } from "@/lib/db";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

export async function getDocumentContext(documentId: string, userId: string) {
  if (!(await assertDocumentAccess(documentId, userId))) throw new Error("forbidden");
  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("not_found");
  return doc;
}
