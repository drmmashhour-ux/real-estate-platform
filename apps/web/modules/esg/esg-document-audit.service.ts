import { prisma } from "@/lib/db";

export async function appendEsgDocumentAudit(
  documentId: string,
  input: {
    action: string;
    status: string;
    message: string;
    metadataJson?: Record<string, unknown> | null;
  }
): Promise<void> {
  await prisma.esgDocumentAudit.create({
    data: {
      documentId,
      action: input.action,
      status: input.status,
      message: input.message,
      metadataJson: input.metadataJson ?? undefined,
    },
  });
}
