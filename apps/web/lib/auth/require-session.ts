import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { LECIPM_PATH_HEADER } from "@/lib/auth/session-cookie";
import { getGuestId } from "@/lib/auth/session";

/**
 * Server-only guard for authenticated dashboard routes.
 * Validates session cookie + User row (invalid/tampered IDs redirect to login).
 * Middleware already enforces cookie presence; this adds DB verification and deep-link `next`.
 */
export async function requireAuthenticatedUser(): Promise<{ userId: string }> {
  await ensureDynamicAuthRequest();
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
