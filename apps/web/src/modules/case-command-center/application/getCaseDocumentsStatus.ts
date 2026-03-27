import { prisma } from "@/lib/db";

export async function getCaseDocumentsStatus(documentId: string) {
  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId }, include: { signatures: true } });
  if (!doc) return null;
  return {
    documentId: doc.id,
    status: doc.status,
    signatures: doc.signatures.map((s) => ({ signerName: s.signerName, signerEmail: s.signerEmail, status: s.status })),
    updatedAt: doc.updatedAt,
  };
}
