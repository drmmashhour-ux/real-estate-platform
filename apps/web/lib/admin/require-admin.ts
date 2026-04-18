import { PlatformRole } from "@prisma/client";
import { isDevAutoLoginBypass } from "@/lib/auth/dev-auto-login";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireAdminSession(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  if (isDevAutoLoginBypass()) {
    const explicit = process.env.DEV_AUTO_LOGIN_USER_ID?.trim();
    if (explicit) {
      const u = await prisma.user.findUnique({ where: { id: explicit }, select: { id: true, role: true } });
      if (u?.role === PlatformRole.ADMIN) return { ok: true, userId: u.id };
    }
    const admin = await prisma.user.findFirst({
      where: { role: PlatformRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (admin) return { ok: true, userId: admin.id };
  }

  const id = await getGuestId();
  if (!id) return { ok: false, status: 401, error: "Sign in required" };
  try {
    const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (u?.role !== PlatformRole.ADMIN) return { ok: false, status: 403, error: "Admin only" };
    return { ok: true, userId: id };
  } catch (e) {
    console.error("[requireAdminSession] role lookup failed", e);
    return { ok: false, status: 503, error: "Unable to verify admin access" };
  }
}
