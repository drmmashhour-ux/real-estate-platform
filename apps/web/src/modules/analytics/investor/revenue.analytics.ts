import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function revenueByMonthApprox(monthsBack = 6): Promise<{ month: string; cents: number }[]> {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - monthsBack);

  const rows = await prisma.payment.findMany({
    where: { status: PaymentStatus.COMPLETED, createdAt: { gte: since } },
    select: { amountCents: true, createdAt: true },
    take: 100_000,
  });

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (r.amountCents ?? 0));
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cents]) => ({ month, cents }));
}
