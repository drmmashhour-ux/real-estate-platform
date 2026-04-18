import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/** Matches `app/[locale]/[country]/admin/layout.tsx` — ADMIN + ACCOUNTANT on active accounts. */
const ADMIN_SURFACE_ROLES = new Set<PlatformRole>([PlatformRole.ADMIN, PlatformRole.ACCOUNTANT]);

export async function requireAdminSurfaceSession(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const id = await getGuestId();
  if (!id) return { ok: false, status: 401, error: "Sign in required" };
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, accountStatus: true },
    });
    if (!user || user.accountStatus !== "ACTIVE") {
      return { ok: false, status: 401, error: "Inactive or unknown user" };
    }
    if (!user.role || !ADMIN_SURFACE_ROLES.has(user.role)) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, userId: id };
  } catch (e) {
    console.error("[requireAdminSurfaceSession]", e);
    return { ok: false, status: 503, error: "Unable to verify access" };
  }
}
