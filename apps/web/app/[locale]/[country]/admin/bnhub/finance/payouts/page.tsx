import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { getAdminPayoutOverview } from "@/modules/bnhub-payments/services/payoutControlService";

export default async function AdminBnhubFinancePayoutsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const rows = await getAdminPayoutOverview();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/bnhub/finance" className="text-sm text-emerald-400">
          ← Hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Payouts</h1>
        <ul className="mt-6 space-y-2 text-sm">
          {rows.map((p) => (
            <li key={p.id} className="rounded border border-slate-800 bg-slate-900/40 p-3">
              {p.payoutStatus} · host {p.host.email ?? p.host.id} · net {(p.netAmountCents / 100).toFixed(2)}{" "}
              {p.currency.toUpperCase()}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
