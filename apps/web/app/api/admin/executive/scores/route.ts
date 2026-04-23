import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET — entity scores for executive dashboards. */
export async function GET(req: Request) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const scoreType = searchParams.get("scoreType");
  const take = Math.min(200, Math.max(1, Number(searchParams.get("take") ?? 50)));

  try {
    const rows = await prisma.executiveEntityScore.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(scoreType ? { scoreType } : {}),
      },
      orderBy: [{ scoreValue: "desc" }],
      take,
    });
    return Response.json({
      scores: rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        scoreType: r.scoreType,
        scoreValue: r.scoreValue,
        evidenceJson: r.evidenceJson,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2021") {
      return Response.json({ scores: [], warning: "executive_entity_scores missing — run migration." });
    }
    throw e;
  }
}
