import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — latest executive KPI snapshots (daily / weekly). */
export async function GET(req: Request) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "daily" | "weekly" | null;
  const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit") ?? 14)));

  try {
    const rows = await prisma.executiveKpiSnapshot.findMany({
      where: type ? { snapshotType: type } : undefined,
      orderBy: [{ snapshotDate: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return Response.json({
      snapshots: rows.map((r) => ({
        id: r.id,
        snapshotType: r.snapshotType,
        snapshotDate: r.snapshotDate.toISOString(),
        metricsJson: r.metricsJson,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2021") {
      return Response.json({ snapshots: [], warning: "executive_kpi_snapshots table missing — run migration." });
    }
    throw e;
  }
}
