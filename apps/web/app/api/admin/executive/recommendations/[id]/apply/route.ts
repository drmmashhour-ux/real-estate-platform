import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { executeSafeExecutiveAction } from "@/src/modules/executive/autoActionEngine";

export const dynamic = "force-dynamic";

/** POST — manually apply safe auto-action for this recommendation (respects AI_EXECUTIVE_AUTO_ACTIONS_ENABLED). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const result = await executeSafeExecutiveAction(id, { bypassEnv: true });
  if (!result.ok) {
    return Response.json({ ok: false, message: result.message }, { status: 400 });
  }
  const rec = await prisma.executiveRecommendation.findUnique({ where: { id } });
  return Response.json({ ok: true, message: result.message, recommendation: rec });
}
