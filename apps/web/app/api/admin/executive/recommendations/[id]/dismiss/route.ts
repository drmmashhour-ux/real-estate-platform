import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const r = await prisma.executiveRecommendation.update({
    where: { id },
    data: { status: "dismissed", updatedAt: new Date() },
  });
  return Response.json({ ok: true, recommendation: r });
}
