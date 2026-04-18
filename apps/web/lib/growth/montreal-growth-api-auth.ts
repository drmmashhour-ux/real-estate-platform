import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";

export type MontrealGrowthAuth =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

/**
 * Admin-only APIs for Montreal growth intelligence — drafts are generated server-side; never auto-sent from these routes.
 */
export async function requireMontrealGrowthAdmin(): Promise<MontrealGrowthAuth> {
  if (!montrealGrowthEngineFlags.montrealGrowthEngineV1) {
    return { ok: false, response: Response.json({ error: "Montreal growth engine disabled" }, { status: 403 }) };
  }
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (u?.role !== "ADMIN") {
    return { ok: false, response: Response.json({ error: "Admin only" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
