import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { trustgraphJsonError } from "@/lib/trustgraph/infrastructure/auth/http";

/**
 * Platform admin only — TrustGraph admin queue, case detail, trust profile (internal).
 */
export async function requireTrustgraphAdmin(): Promise<{ userId: string } | Response> {
  const userId = await getGuestId();
  if (!userId) return trustgraphJsonError("Unauthorized", 401);
  if (!(await isPlatformAdmin(userId))) return trustgraphJsonError("Forbidden", 403);
  return { userId };
}
