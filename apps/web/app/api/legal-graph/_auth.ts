import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export async function requireLegalGraphDocumentAccess(documentId: string) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401, userId: null };
  const admin = await isPlatformAdmin(userId);
  if (admin) return { ok: true as const, status: 200, userId };
  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId }, select: { sellerUserId: true, adminUserId: true } });
  if (!doc || (doc.sellerUserId !== userId && doc.adminUserId !== userId)) return { ok: false as const, status: 403, userId };
  return { ok: true as const, status: 200, userId };
}
