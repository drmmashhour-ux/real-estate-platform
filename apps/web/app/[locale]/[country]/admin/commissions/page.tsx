import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isFinancialStaff(user?.role)) redirect("/admin");

  const [commissions, platformPayments] = await Promise.all([
    prisma.brokerCommission.findMany({
      include: {
        payment: { select: { paymentType: true, amountCents: true, createdAt: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid" },
      select: { amountCents: true },
    }),
  ]);

  const platformRevenue = commissions.reduce((s, c) => s + c.platformAmountCents, 0);
  const brokerPayouts = commissions.reduce((s, c) => s + c.brokerAmountCents, 0);
  const totalPaid = platformPayments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Commissions & revenue</h1>
        <p className="mt-1 text-slate-400">
          All broker commissions and platform revenue. Do not validate payment on redirect; only webhook updates.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Platform revenue (commissions)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              ${(platformRevenue / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Broker payouts</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">
              ${(brokerPayouts / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Total payments (paid)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">
              ${(totalPaid / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">All commissions</h2>
          {commissions.length === 0 ? (
            <p className="mt-2 text-slate-500">No commissions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Broker</th>
                    <th className="py-2 pr-4">Gross</th>
                    <th className="py-2 pr-4">Broker share</th>
                    <th className="py-2 pr-4">Platform share</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800">
                      <td className="py-2 pr-4 text-slate-300">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{c.payment.paymentType}</td>
                      <td className="py-2 pr-4 text-slate-300">
                        {c.broker?.name ?? c.broker?.email ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">
                        ${(c.grossAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-amber-400">
                        ${(c.brokerAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-emerald-400">
                        ${(c.platformAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 text-slate-400">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
