import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH — mark audit entry reverted (does not delete messages; audit trail only).
 * Body: { "revert": true }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: { revert?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.revert !== true) {
    return Response.json({ error: "revert:true required" }, { status: 400 });
  }

  const row = await prisma.autoCloseAuditEvent.updateMany({
    where: { id, revertedAt: null },
    data: { revertedAt: new Date() },
  });
  if (row.count === 0) {
    return Response.json({ error: "Not found or already reverted" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
