import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: "unauthorized" }, { status: auth.status });

  const u = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(u.searchParams.get("days") ?? "14")));
  const since = new Date(Date.now() - days * 86400000);

  const rows = await prisma.eventLog.groupBy({
    by: ["eventType"],
    where: {
      createdAt: { gte: since },
      eventType: { in: ["listing_save", "price_drop_seen", "recommendation_impression", "cta_clicked"] },
    },
    _count: { _all: true },
  });

  return Response.json({
    ok: true,
    since: since.toISOString(),
    counts: Object.fromEntries(rows.map((r) => [r.eventType, r._count._all])),
  });
}
