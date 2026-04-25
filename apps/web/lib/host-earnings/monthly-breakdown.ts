import { PaymentStatus } from "@prisma/client";
import { subMonths } from "date-fns";
import { prisma } from "@/lib/db";

export type HostMonthlyRow = { month: string; label: string; cents: number };

/**
 * Sums guest payment `amountCents` by YYYY-MM for completed charges (last N months).
 */
export async function getHostMonthlyPaymentTotals(hostId: string, monthsBack = 12): Promise<HostMonthlyRow[]> {
  const since = subMonths(new Date(), monthsBack);
  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      paidAt: { gte: since, not: null },
      booking: { listing: { ownerId: hostId } },
    },
    select: { paidAt: true, amountCents: true },
  });

  const map = new Map<string, number>();
  for (const p of payments) {
    if (!p.paidAt) continue;
    const k = p.paidAt.toISOString().slice(0, 7);
    map.set(k, (map.get(k) ?? 0) + p.amountCents);
  }

  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, cents]) => ({
      month,
      cents,
      label: new Date(`${month}-01T12:00:00Z`).toLocaleString(undefined, { month: "long", year: "numeric" }),
    }));
}
