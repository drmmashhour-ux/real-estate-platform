import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireAdminSession(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const id = await getGuestId();
  if (!id) return { ok: false, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false, status: 403, error: "Admin only" };
  return { ok: true, userId: id };
}
