import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { isDevAutoLoginBypass } from "@/lib/auth/dev-auto-login";
import { LECIPM_PATH_HEADER } from "@/lib/auth/session-cookie";
import { getGuestId } from "@/lib/auth/session";

/**
 * Server-only guard for authenticated dashboard routes.
 * Validates session cookie + User row (invalid/tampered IDs redirect to login).
 * Middleware already enforces cookie presence; this adds DB verification and deep-link `next`.
 *
 * Do not use on public browse surfaces (`/`, `/listings`, `/bnhub` — see `isPublicBrowseSurface`);
 * those routes must not call this helper.
 */
export async function requireAuthenticatedUser(): Promise<{ userId: string }> {
  await ensureDynamicAuthRequest();
  if (isDevAutoLoginBypass()) {
    const explicit = process.env.DEV_AUTO_LOGIN_USER_ID?.trim();
    if (explicit) {
      const u = await prisma.user.findUnique({ where: { id: explicit }, select: { id: true } });
      if (u) return { userId: u.id };
    }
    const admin = await prisma.user.findFirst({
      where: { role: PlatformRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (admin) return { userId: admin.id };
  }

  const userId = await getGuestId();
  if (!userId) {
    const path = (await headers()).get(LECIPM_PATH_HEADER) ?? "/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    const path = (await headers()).get(LECIPM_PATH_HEADER) ?? "/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  return { userId: user.id };
}
