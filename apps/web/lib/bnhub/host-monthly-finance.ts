import type { Booking, Payment } from "@prisma/client";

export type MonthlyHostFinanceRow = {
  key: string;
  monthLabel: string;
  hostCents: number;
  platformCents: number;
  guestChargedCents: number;
};

/** Last N calendar months of completed-payment activity for host dashboard charts. */
export function buildMonthlyHostFinance(
  bookings: Array<
    Pick<Booking, "createdAt"> & {
      payment: Pick<Payment, "status" | "hostPayoutCents" | "platformFeeCents" | "amountCents" | "paidAt"> | null;
    }
  >,
  monthsBack = 6
): MonthlyHostFinanceRow[] {
  const now = new Date();
  const rows: MonthlyHostFinanceRow[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    rows.push({
      key,
      monthLabel: d.toLocaleString("en-CA", { month: "short", year: "numeric" }),
      hostCents: 0,
      platformCents: 0,
      guestChargedCents: 0,
    });
  }

  const bucketIndex = (dt: Date) => {
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return rows.findIndex((r) => r.key === k);
  };

  for (const b of bookings) {
    const p = b.payment;
    if (!p || p.status !== "COMPLETED") continue;
    const dt = p.paidAt ?? b.createdAt;
    const idx = bucketIndex(new Date(dt));
    if (idx < 0) continue;
    const row = rows[idx]!;
    row.hostCents += p.hostPayoutCents ?? 0;
    row.platformCents += p.platformFeeCents ?? 0;
    row.guestChargedCents += p.amountCents ?? 0;
  }

  return rows;
}
