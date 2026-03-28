import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const r = await prisma.executiveRecommendation.findUnique({ where: { id } });
  if (!r) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ recommendation: r });
}

/** PATCH — accept / mark reviewed (body: { status: 'accepted' | 'reviewed' }) */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const st = body.status;
  if (!st || !["accepted", "reviewed", "open"].includes(st)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const r = await prisma.executiveRecommendation.update({
    where: { id },
    data: { status: st, updatedAt: new Date() },
  });
  return Response.json({ ok: true, recommendation: r });
}
