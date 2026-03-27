import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function assertDocumentAccess(documentId: string, userId: string) {
  const admin = await isPlatformAdmin(userId);
  if (admin) return true;
  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId }, select: { sellerUserId: true, adminUserId: true } });
  if (!doc) return false;
  return doc.sellerUserId === userId || doc.adminUserId === userId;
}
