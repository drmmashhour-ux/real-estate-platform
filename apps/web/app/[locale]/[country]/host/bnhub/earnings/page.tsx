import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getHostPayoutSummary } from "@/modules/bnhub-payments/services/payoutControlService";

export default async function HostBnhubEarningsPage() {
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

  const payouts = await getHostPayoutSummary(userId);
  const paid = payouts.filter((p) => p.payoutStatus === "PAID");
  const held = payouts.filter((p) => p.payoutStatus === "HELD" || p.payoutStatus === "PENDING");

  const sum = (rows: typeof payouts) => rows.reduce((s, p) => s + p.netAmountCents, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-xl">
        <Link href="/host/bnhub/payouts" className="text-sm text-emerald-400">
          ← Payouts
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Earnings snapshot</h1>
        <p className="mt-2 text-xs text-slate-500">Internal BNHUB marketplace records only; not tax advice.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Paid out (status)</p>
            <p className="mt-1 text-2xl font-semibold">{(sum(paid) / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Pending / held</p>
            <p className="mt-1 text-2xl font-semibold">{(sum(held) / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
