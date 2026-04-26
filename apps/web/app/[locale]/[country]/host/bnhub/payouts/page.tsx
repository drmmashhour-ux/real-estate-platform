import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getHostPayoutSummary } from "@/modules/bnhub-payments/services/payoutControlService";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { syncHostAccountFromUserStripe } from "@/modules/bnhub-payments/services/connectedAccountService";

export default async function HostBnhubPayoutsPage() {
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <Link href="/bnhub/login" className="text-emerald-400">
          Sign in
        </Link>
      </main>
    );
  }

  const listing = await prisma.shortTermListing.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <p className="text-slate-400">No listings on this account.</p>
      </main>
    );
  }

  await syncHostAccountFromUserStripe(userId).catch(() => {});
  const payouts = await getHostPayoutSummary(userId);
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeOnboardingComplete: true, stripeAccountId: true },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="mt-2 text-sm text-slate-400">
          Onboarding: {me?.stripeOnboardingComplete ? "complete" : "pending"} · Stripe account{" "}
          {me?.stripeAccountId ? "linked" : "missing"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Held payouts may reflect booking timing, risk review, or disputes — payout control policy, not legal escrow.
        </p>
        <Link
          href={`/host/bnhub/payouts/${listing.id}`}
          className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          Filter by listing →
        </Link>
        <ul className="mt-8 space-y-2">
          {payouts.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm">
              <span className="font-mono text-xs text-slate-500">{p.bookingId.slice(0, 8)}…</span> · {p.payoutStatus} ·
              net {(p.netAmountCents / 100).toFixed(2)} {p.currency.toUpperCase()}
              {p.releaseReason ? <span className="block text-xs text-slate-500">{p.releaseReason}</span> : null}
            </li>
          ))}
        </ul>
        <Link href="/host/bnhub/payments/onboarding" className="mt-8 inline-block text-sm text-emerald-400">
          Payout onboarding →
        </Link>
      </div>
    </main>
  );
}
