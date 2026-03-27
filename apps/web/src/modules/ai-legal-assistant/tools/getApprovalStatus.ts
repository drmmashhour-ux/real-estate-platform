import { getDocumentContext } from "@/src/modules/ai-legal-assistant/tools/getDocumentContext";

export async function getApprovalStatus(documentId: string, userId: string) {
  const doc = await getDocumentContext(documentId, userId);
  return { status: doc.status, updatedAt: doc.updatedAt };
}
