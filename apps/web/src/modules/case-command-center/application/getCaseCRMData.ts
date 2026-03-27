import { prisma } from "@/lib/db";

export async function getCaseCRMData(documentId: string) {
  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId }, select: { listingId: true } });
  if (!doc) return null;
  const leads = await prisma.lead.findMany({ where: { fsboListingId: doc.listingId }, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, name: true, score: true, pipelineStatus: true, updatedAt: true } });
  return { listingId: doc.listingId, leadCount: leads.length, leads };
}
