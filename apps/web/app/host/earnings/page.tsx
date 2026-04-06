import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildHostEarningsSnapshot } from "@/lib/host-earnings/dashboard";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";

export const dynamic = "force-dynamic";

export default async function HostEarningsPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/host/earnings");
  }

  const [snapshot, user, market] = await Promise.all([
    buildHostEarningsSnapshot(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    }),
    getResolvedMarket(),
  ]);

  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";
  const connectIncomplete =
    Boolean(user?.stripeAccountId?.trim()) && !user?.stripeOnboardingComplete;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/dashboard/host" className="text-sm text-emerald-400 hover:underline">
            ← Host dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Earnings</h1>
          <p className="mt-1 text-sm text-slate-500">
            BNHub booking payments and payout queue (CAD, cents-accurate in API).
          </p>
        </div>

        {manualMarket ? (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            This market uses manual payout processing. Your balance may appear here while operations settles outside
            Stripe Connect.
          </div>
        ) : null}

        {!manualMarket && (!user?.stripeAccountId?.trim() || connectIncomplete) ? (
          <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
            Complete Stripe onboarding to receive automatic payouts. Connect status is available from your host payout
            settings.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Gross booking value (paid)</p>
            <p className="mt-1 text-2xl font-semibold">{(snapshot.grossEarningsCents / 100).toFixed(2)} CAD</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Pending Stripe payouts</p>
            <p className="mt-1 text-2xl font-semibold">{(snapshot.pendingPayoutsCents / 100).toFixed(2)} CAD</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Paid out (transfers)</p>
            <p className="mt-1 text-2xl font-semibold">{(snapshot.paidOutCents / 100).toFixed(2)} CAD</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Manual queue</p>
            <p className="mt-1 text-2xl font-semibold">{(snapshot.manualQueuedCents / 100).toFixed(2)} CAD</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs uppercase text-slate-500">Next scheduled payout window</p>
          <p className="mt-1 text-lg text-slate-200">
            {snapshot.nextPayoutAt ? new Date(snapshot.nextPayoutAt).toLocaleString() : "—"}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-medium text-slate-200">Recent bookings</h2>
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800">
            {snapshot.bookings.length === 0 ? (
              <li className="p-4 text-sm text-slate-500">No bookings yet.</li>
            ) : (
              snapshot.bookings.slice(0, 15).map((b) => (
                <li key={b.bookingId} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{b.listingTitle}</p>
                    <p className="text-xs text-slate-500">
                      Payment {b.paymentStatus}
                      {b.payoutRowStatus ? ` · Payout ${b.payoutRowStatus}` : ""}
                      {b.manualPayoutStatus ? ` · Manual ${b.manualPayoutStatus}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Guest paid {(b.totalChargeCents / 100).toFixed(2)} CAD</p>
                    <p>
                      Platform {(b.platformFeeCents ?? 0) / 100} CAD · Expected host{" "}
                      {(b.hostPayoutCents ?? 0) / 100} CAD
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
