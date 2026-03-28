import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — list recommendations; POST — trigger one manual cycle (optional). */
export async function GET(req: Request) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const recommendationType = searchParams.get("type");
  const minPriority = searchParams.get("minPriority");
  const take = Math.min(200, Math.max(1, Number(searchParams.get("take") ?? 40)));

  try {
    const rows = await prisma.executiveRecommendation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(recommendationType ? { recommendationType } : {}),
        ...(minPriority ? { priorityScore: { gte: Number(minPriority) } } : {}),
      },
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      take,
    });
    return Response.json({
      recommendations: rows.map((r) => ({
        id: r.id,
        recommendationType: r.recommendationType,
        priorityScore: r.priorityScore,
        status: r.status,
        title: r.title,
        summary: r.summary,
        detailsJson: r.detailsJson,
        evidenceJson: r.evidenceJson,
        targetEntityType: r.targetEntityType,
        targetEntityId: r.targetEntityId,
        safeAutoActionKey: r.safeAutoActionKey,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2021") {
      return Response.json({ recommendations: [], warning: "executive_recommendations missing." });
    }
    throw e;
  }
}
