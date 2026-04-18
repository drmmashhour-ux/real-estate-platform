import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logDocumentAudit } from "./doc-audit.service";
import { parseStructuredDocument } from "./doc-parser.service";

export async function createExecutionDocument(input: {
  dealId: string;
  type: string;
  templateKey?: string | null;
  structuredData?: Record<string, unknown>;
  sourceType?: string;
  workflowStatus?: string;
  actorUserId: string;
}) {
  const doc = await prisma.dealDocument.create({
    data: {
      dealId: input.dealId,
      type: input.type,
      fileUrl: null,
      status: "uploaded",
      templateKey: input.templateKey ?? null,
      sourceType: input.sourceType ?? "generated_assistance",
      structuredData: (input.structuredData ?? {}) as Prisma.InputJsonValue,
      workflowStatus: input.workflowStatus ?? "draft",
    },
  });
  await logDocumentAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    actionKey: "execution_document_created",
    payload: { dealDocumentId: doc.id },
  });
  return doc;
}

export async function getDocumentWithVersions(dealDocumentId: string) {
  return prisma.dealDocument.findUnique({
    where: { id: dealDocumentId },
    include: { documentVersions: { orderBy: { versionNumber: "desc" } } },
  });
}

export { parseStructuredDocument };
