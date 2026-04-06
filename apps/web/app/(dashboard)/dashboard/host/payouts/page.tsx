import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBnhubCommissionRate } from "@/lib/stripe/bnhub-connect";
import { HostPayoutsClient } from "./host-payouts-client";

export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function HostPayoutsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/host/payouts");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeOnboardingComplete: true,
      role: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!user) redirect("/auth/login");

  const isHostish =
    user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  if (!isHostish) {
    redirect("/dashboard");
  }

  const rate = getBnhubCommissionRate();
  const commissionPercentLabel = `${Math.round(rate * 1000) / 10}%`;

  const payments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      booking: { listing: { ownerId: userId } },
    },
    select: {
      hostPayoutCents: true,
      platformFeeCents: true,
      amountCents: true,
      stripeConnectAccountId: true,
      updatedAt: true,
      bookingId: true,
      scheduledHostPayoutAt: true,
      hostPayoutReleasedAt: true,
      payoutHoldReason: true,
      booking: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const pending = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      booking: { listing: { ownerId: userId }, status: "PENDING" },
    },
    select: { amountCents: true, bookingId: true },
  });
  const completedCount = await prisma.payment.count({
    where: { status: "COMPLETED", booking: { listing: { ownerId: userId } } },
  });
  const pendingCount = await prisma.payment.count({
    where: {
      status: "PENDING",
      booking: { listing: { ownerId: userId }, status: "PENDING" },
    },
  });

  let totalHostPayout = 0;
  let totalPlatformFees = 0;
  let grossGuestPaid = 0;
  for (const p of payments) {
    totalHostPayout += p.hostPayoutCents ?? 0;
    totalPlatformFees += p.platformFeeCents ?? 0;
    grossGuestPaid += p.amountCents;
  }

  const pendingCents = pending.reduce((s, p) => s + p.amountCents, 0);
  const releasedPayments = payments.filter((p) => Boolean(p.hostPayoutReleasedAt));
  const scheduledPayments = payments.filter((p) => !p.hostPayoutReleasedAt);
  const releasedCount = releasedPayments.length;
  const scheduledCount = scheduledPayments.length;
  const releasedCents = releasedPayments.reduce((sum, p) => sum + (p.hostPayoutCents ?? 0), 0);
  const scheduledCents = scheduledPayments.reduce((sum, p) => sum + (p.hostPayoutCents ?? 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">BNHub host</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Payouts & earnings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Stripe Connect handles settlements to your bank per Stripe&apos;s payout schedule. Amounts below
          reflect successful booking charges on your listings.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Guest paid bookings</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{completedCount}</p>
            <p className="mt-1 text-[11px] text-slate-600">Charge captured successfully. Payout release may still be pending.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled / held payouts</p>
            <p className="mt-1 text-2xl font-semibold text-sky-300">{scheduledCount}</p>
            <p className="mt-1 text-[11px] text-slate-600">Guest paid, but host transfer has not been marked released yet.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Released payouts</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{releasedCount}</p>
            <p className="mt-1 text-[11px] text-slate-600">Rows with a recorded payout release date.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Awaiting payment</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{pendingCount}</p>
            <p className="mt-1 text-[11px] text-slate-600">Open bookings where guest has not paid yet.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled payout amount</p>
            <p className="mt-1 text-2xl font-semibold text-sky-300">{fmt(scheduledCents)}</p>
            <p className="mt-1 text-[11px] text-slate-600">Expected host payout still waiting for release.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Released host earnings</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{fmt(releasedCents)}</p>
            <p className="mt-1 text-[11px] text-slate-600">Recorded as released to the host payout flow.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Gross from guests</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{fmt(grossGuestPaid)}</p>
            <p className="mt-1 text-[11px] text-slate-600">Completed booking charges (your listings).</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Platform commission paid</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{fmt(totalPlatformFees)}</p>
            <p className="mt-1 text-[11px] text-slate-600">BNHub application fee ({commissionPercentLabel}).</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending booking total (face value)</p>
            <p className="mt-1 text-xl font-semibold text-slate-200">{fmt(pendingCents)}</p>
            <p className="mt-1 text-[11px] text-slate-600">
              Sum of payment amounts for {pendingCount} unpaid booking(s); not yet earned.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <HostPayoutsClient
            initialStripe={{
              stripeAccountId: user.stripeAccountId,
              stripeOnboardingComplete: user.stripeOnboardingComplete,
            }}
            commissionPercentLabel={commissionPercentLabel}
          />
        </div>

        {scheduledPayments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-200">Scheduled or held payouts</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-xs text-slate-400">
                <thead className="bg-slate-900/80 text-slate-500">
                  <tr>
                    <th className="p-2">Updated</th>
                    <th className="p-2">Release target</th>
                    <th className="p-2">Guest paid</th>
                    <th className="p-2">Your payout</th>
                    <th className="p-2">Hold reason</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledPayments.map((p) => (
                    <tr key={p.bookingId} className="border-t border-slate-800">
                      <td className="p-2 whitespace-nowrap">{p.updatedAt.toISOString().slice(0, 19)}</td>
                      <td className="p-2 whitespace-nowrap">
                        {p.scheduledHostPayoutAt ? p.scheduledHostPayoutAt.toISOString().slice(0, 10) : "—"}
                      </td>
                      <td className="p-2">{fmt(p.amountCents)}</td>
                      <td className="p-2 text-emerald-300">{fmt(p.hostPayoutCents ?? 0)}</td>
                      <td className="p-2 text-amber-200/90">
                        {p.payoutHoldReason ? p.payoutHoldReason.replace(/_/g, " ") : "scheduled"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {releasedPayments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-200">Released payouts</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-xs text-slate-400">
                <thead className="bg-slate-900/80 text-slate-500">
                  <tr>
                    <th className="p-2">Released</th>
                    <th className="p-2">Guest paid</th>
                    <th className="p-2">Your payout</th>
                    <th className="p-2">Platform fee ({commissionPercentLabel})</th>
                    <th className="p-2">Connect acct</th>
                  </tr>
                </thead>
                <tbody>
                  {releasedPayments.map((p) => (
                    <tr key={p.bookingId} className="border-t border-slate-800">
                      <td className="p-2 whitespace-nowrap">{p.hostPayoutReleasedAt?.toISOString().slice(0, 19) ?? "—"}</td>
                      <td className="p-2">{fmt(p.amountCents)}</td>
                      <td className="p-2 text-emerald-300">{fmt(p.hostPayoutCents ?? 0)}</td>
                      <td className="p-2 text-amber-200/90">{fmt(p.platformFeeCents ?? 0)}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-500">
                        {p.stripeConnectAccountId ? `${p.stripeConnectAccountId.slice(0, 14)}…` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
