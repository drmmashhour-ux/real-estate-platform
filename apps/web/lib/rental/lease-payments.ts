import { prisma } from "@/lib/db";

/** Create monthly rent rows starting at `startMonth` (first of month recommended). */
export async function createRentPaymentSchedule(
  leaseId: string,
  monthlyRentCents: number,
  startMonth: Date,
  months: number
): Promise<void> {
  const rows: Array<{
    leaseId: string;
    amount: number;
    dueDate: Date;
  }> = [];
  for (let i = 0; i < months; i++) {
    const due = new Date(startMonth);
    due.setUTCMonth(due.getUTCMonth() + i);
    due.setUTCDate(1);
    rows.push({
      leaseId,
      amount: monthlyRentCents,
      dueDate: due,
    });
  }
  if (rows.length === 0) return;
  await prisma.rentPayment.createMany({ data: rows });
}
