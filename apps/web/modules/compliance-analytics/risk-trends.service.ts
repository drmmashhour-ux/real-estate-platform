import { prisma } from "@/lib/db";

export async function getCaseSeverityTrends(days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.complianceCase.groupBy({
    by: ["severity"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });
  return rows.map((r) => ({ severity: r.severity, count: r._count.id }));
}
