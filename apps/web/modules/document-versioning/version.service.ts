import { prisma } from "@/lib/db";
import {
  getNextVersionNumber,
  listDocumentVersions,
  recordDocumentVersion,
} from "@/modules/review/versioning.service";

export type { DealDocumentVersionSource } from "@prisma/client";

export { getNextVersionNumber, recordDocumentVersion, listDocumentVersions };

/** Lists documents on a deal with version counts (audit-friendly overview). */
export async function listDealDocumentsWithVersionStats(dealId: string) {
  const docs = await prisma.dealDocument.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { documentVersions: true } },
    },
  });
  return docs.map((d) => ({
    id: d.id,
    type: d.type,
    workflowStatus: d.workflowStatus,
    templateKey: d.templateKey,
    versionCount: d._count.documentVersions,
    createdAt: d.createdAt,
  }));
}
