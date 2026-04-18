import type { NextRequest } from "next/server";
import { verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getGuestId } from "@/lib/auth/session";

/**
 * Internal tooling: `Authorization: Bearer CRON_SECRET` **or** signed-in platform ADMIN.
 * Works when `CRON_SECRET` is unset (admin-only ops in dev).
 */
export async function requireCronSecretOrAdmin(
  request: NextRequest,
): Promise<{ ok: true; mode: "cron" | "admin"; userId?: string } | { ok: false; response: Response }> {
  if (process.env.CRON_SECRET?.trim() && verifyCronBearer(request)) {
    return { ok: true, mode: "cron" };
  }

  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const admin = await isPlatformAdmin(userId);
  if (!admin) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, mode: "admin", userId };
}
