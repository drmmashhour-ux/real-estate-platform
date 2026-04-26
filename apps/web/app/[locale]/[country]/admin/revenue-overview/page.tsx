import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getBnhubCommissionRate } from "@/lib/stripe/bnhub-connect";

export const dynamic = "force-dynamic";

function fmtCad(cents: number | null | undefined) {
  const n = typeof cents === "number" && Number.isFinite(cents) ? cents / 100 : 0;
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function AdminRevenueOverviewPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/revenue-overview");
  if (!(await isPlatformAdmin(guestId))) redirect("/admin");

  const days = 30;
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [paidTotals, byType, bookingFeeSum, confirmedBookings] = await Promise.all([
    prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: { gte: start } },
      _sum: { amountCents: true, platformFeeCents: true },
      _count: true,
    }),
    prisma.platformPayment.groupBy({
      by: ["paymentType"],
      where: { status: "paid", createdAt: { gte: start } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.platformPayment.aggregate({
      where: { status: "paid", paymentType: "booking", createdAt: { gte: start } },
      _sum: { platformFeeCents: true },
    }),
    prisma.booking.count({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] }, updatedAt: { gte: start } },
    }),
  ]);

  const grossCents = paidTotals._sum.amountCents ?? 0;
  const platformFeeCentsTotal = paidTotals._sum.platformFeeCents ?? 0;
  const bnhubBookingPlatformFees = bookingFeeSum._sum.platformFeeCents ?? 0;
  const rate = getBnhubCommissionRate();

  return (
    <HubLayout title="Revenue overview" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="mx-auto max-w-3xl space-y-8 text-slate-100">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue snapshot</h1>
          <p className="mt-2 text-sm text-slate-400">
            Last {days} days — paid <code className="rounded bg-white/10 px-1 text-xs">PlatformPayment</code> rows +
            confirmed bookings count. BNHub commission rate (env): <strong>{(rate * 100).toFixed(1)}%</strong>
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <Link href="/admin/revenue-dashboard" className="text-emerald-400 hover:text-emerald-300">
              BNHUB revenue dashboard →
            </Link>
            <Link href="/admin/finance" className="text-emerald-400 hover:text-emerald-300">
              Finance hub →
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#111]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gross (paid)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtCad(grossCents)}</p>
            <p className="mt-1 text-xs text-slate-500">{paidTotals._count} transactions</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform fees recorded</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtCad(platformFeeCentsTotal)}</p>
            <p className="mt-1 text-xs text-slate-500">Sum of platform_fee_cents on paid rows</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">BNHub booking fees (subset)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtCad(bnhubBookingPlatformFees)}</p>
            <p className="mt-1 text-xs text-slate-500">paymentType = booking, last {days}d</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed / completed stays</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{confirmedBookings}</p>
            <p className="mt-1 text-xs text-slate-500">Bookings updated in range (proxy for paid flow)</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111]/90 p-5">
          <p className="text-sm font-semibold text-white">By payment type (gross)</p>
          <ul className="mt-3 space-y-2 text-sm">
            {byType.length === 0 ? (
              <li className="text-slate-500">No paid platform payments in window.</li>
            ) : (
              byType
                .slice()
                .sort((a, b) => (b._sum.amountCents ?? 0) - (a._sum.amountCents ?? 0))
                .map((row) => (
                  <li key={row.paymentType} className="flex justify-between gap-4 border-b border-white/5 py-2 last:border-0">
                    <span className="font-mono text-slate-300">{row.paymentType}</span>
                    <span className="tabular-nums text-slate-200">
                      {fmtCad(row._sum.amountCents)} <span className="text-slate-500">({row._count})</span>
                    </span>
                  </li>
                ))
            )}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Source: <code className="rounded bg-white/10 px-1">PlatformPayment</code> where status = paid. BNHub Stripe Connect
          application fees are also stored on the legacy <code className="rounded bg-white/10 px-1">Payment</code> row for
          bookings. See <code className="rounded bg-white/10 px-1">docs/REVENUE-FLOWS.md</code>.
        </p>
      </div>
    </HubLayout>
  );
}
