import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const entityType = searchParams.get("entityType");

  const items = await prisma.fraudReviewQueue.findMany({
    where: {
      ...(status === "all" ? {} : { status }),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 100,
  });

  const scores =
    items.length === 0
      ? []
      : await prisma.fraudRiskScore.findMany({
          where: {
            OR: items.map((q) => ({ entityType: q.entityType, entityId: q.entityId })),
          },
        });
  const scoreKey = (t: string, id: string) => `${t}:${id}`;
  const scoreMap = new Map(scores.map((s) => [scoreKey(s.entityType, s.entityId), s]));

  const enriched = items.map((q) => ({
    ...q,
    risk: scoreMap.get(scoreKey(q.entityType, q.entityId)) ?? null,
  }));

  return Response.json({ items: enriched });
}
