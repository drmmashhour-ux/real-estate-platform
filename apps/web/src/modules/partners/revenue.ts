import { prisma } from "@/lib/db";

export async function recordPartnerRevenue(input: {
  partnerId: string;
  amountCents: number;
  currency?: string;
  source: string;
  metadata?: object;
}) {
  return prisma.platformRevenueEvent.create({
    data: {
      entityType: "partner",
      entityId: input.partnerId,
      revenueType: input.source,
      amountCents: input.amountCents,
      currency: (input.currency ?? "cad").toUpperCase(),
      status: "realized",
      sourceReference: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function partnerRevenueSummary(partnerId: string, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 864e5);
  const rows = await prisma.platformRevenueEvent.findMany({
    where: {
      entityType: "partner",
      entityId: partnerId,
      createdAt: { gte: since },
    },
    select: { amountCents: true, currency: true },
  });
  const byCurrency = new Map<string, number>();
  for (const r of rows) {
    const c = r.currency.toLowerCase();
    byCurrency.set(c, (byCurrency.get(c) ?? 0) + r.amountCents);
  }
  return { totalEvents: rows.length, byCurrency: Object.fromEntries(byCurrency) };
}
