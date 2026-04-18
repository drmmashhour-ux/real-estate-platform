import { prisma } from "@/lib/db";

export async function loadDocumentsForBundle(dealId: string) {
  return prisma.dealDocument.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: {
      documentVersions: { orderBy: { versionNumber: "desc" }, take: 3 },
    },
  });
}
