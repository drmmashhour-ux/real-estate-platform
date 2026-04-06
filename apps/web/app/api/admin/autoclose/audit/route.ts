import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET recent auto-close audit rows (admin). */
export async function GET() {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.autoCloseAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      actionType: true,
      targetType: true,
      targetId: true,
      safeMode: true,
      detail: true,
      revertedAt: true,
      createdAt: true,
    },
  });

  return Response.json({
    events: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      revertedAt: r.revertedAt?.toISOString() ?? null,
    })),
  });
}
