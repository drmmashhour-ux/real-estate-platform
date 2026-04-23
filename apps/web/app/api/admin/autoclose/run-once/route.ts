import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { readAutoCloseEnv, runAutoCloseHourlyPass } from "@/src/modules/autoclose/autoCloseEngine";

export const dynamic = "force-dynamic";

/** POST — admin manual run (same guards as cron: env + pause). */
export async function POST() {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const env = readAutoCloseEnv();
  const summary = await runAutoCloseHourlyPass();
  return Response.json({ ok: true, env, ...summary });
}
