import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function requireDocumentAccess(documentId: string) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401, userId: null, isAdmin: false };
  const admin = await isPlatformAdmin(userId);
  if (admin) return { ok: true as const, status: 200, userId, isAdmin: true };

  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId }, select: { sellerUserId: true, adminUserId: true } });
  if (!doc) return { ok: false as const, status: 404, userId, isAdmin: false };
  if (doc.sellerUserId !== userId && doc.adminUserId !== userId) return { ok: false as const, status: 403, userId, isAdmin: false };
  return { ok: true as const, status: 200, userId, isAdmin: false };
}
