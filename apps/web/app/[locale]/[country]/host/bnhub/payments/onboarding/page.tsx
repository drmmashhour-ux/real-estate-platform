import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function HostPaymentsOnboardingPage() {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeOnboardingComplete: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-xl">
        <Link href="/host/bnhub/payouts" className="text-sm text-emerald-400">
          ← Payouts
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Payout account</h1>
        <p className="mt-3 text-sm text-slate-400">
          BNHUB uses Stripe Connect for host payouts. Complete onboarding in your host dashboard if prompted when
          publishing or receiving bookings.
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Stripe Connect</dt>
            <dd>{user?.stripeAccountId ? "Linked" : "Not linked"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Onboarding</dt>
            <dd>{user?.stripeOnboardingComplete ? "Complete" : "Incomplete"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-600">
          Identity verification (e.g. Stripe Identity) can be layered on this flow — not fully wired in this build.
        </p>
      </div>
    </main>
  );
}
