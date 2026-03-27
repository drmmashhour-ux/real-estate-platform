import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";

export async function requireAutoDraftingAccess(documentId: string | undefined) {
  if (!documentId?.trim()) return { ok: false as const, status: 400, userId: null as string | null };
  return requireDocumentAccess(documentId);
}
