import Link from "next/link";
import { redirect } from "next/navigation";
import { InvestorFinancialsClient } from "@/components/investor-hub/InvestorFinancialsClient";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { loadAdminInvestorHubData } from "@/lib/investor/load-admin-investor-hub";

export const dynamic = "force-dynamic";

export default async function AdminInvestorFinancialsPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const hub = await loadAdminInvestorHubData();
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);

  const [paymentAgg, bookingCount, feeSum] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, updatedAt: { gte: d30 } },
      _sum: { amountCents: true },
      _count: { id: true },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: d30 },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, updatedAt: { gte: d30 } },
      _sum: { platformFeeCents: true },
    }),
  ]);

  const grossCents = paymentAgg._sum.amountCents ?? 0;
  const platformFeeCents = feeSum._sum.platformFeeCents ?? 0;

  return (
    <main className="pb-16">
      <section className="border-b border-amber-900/25 bg-zinc-950/50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Financials</p>
          <h1 className="mt-2 font-serif text-2xl text-amber-100">Revenue & projections</h1>
          <Link href="/admin/investor" className="mt-4 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            ← Investor home
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <InvestorFinancialsClient
          display={hub.display}
          projections={hub.projections}
          bnhub30d={{
            grossRevenueCents: grossCents,
            platformFeeCents,
            paidBookings30d: bookingCount,
            paymentCount30d: paymentAgg._count.id,
          }}
        />
      </div>
    </main>
  );
}
