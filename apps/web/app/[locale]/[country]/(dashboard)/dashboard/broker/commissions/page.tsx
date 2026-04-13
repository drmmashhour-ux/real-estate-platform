import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BrokerCommissionsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, brokerStatus: true },
  });
  const isBroker = user?.role === "BROKER" && user?.brokerStatus === "VERIFIED";
  const isAdmin = user?.role === "ADMIN";
  if (!isBroker && !isAdmin) redirect("/dashboard/broker");

  const commissions = await prisma.brokerCommission.findMany({
    where: { brokerId: userId },
    include: {
      payment: {
        select: {
          id: true,
          paymentType: true,
          amountCents: true,
          currency: true,
          status: true,
          createdAt: true,
          dealId: true,
          bookingId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalEarnings = commissions.reduce((s, c) => s + c.brokerAmountCents, 0);
  const pending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.brokerAmountCents, 0);
  const paid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.brokerAmountCents, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard/broker" className="text-sm text-amber-400 hover:text-amber-300">
          ← Broker dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Commissions</h1>
        <p className="mt-1 text-slate-400">
          Your earnings from deals, leads, and sales. Pending commissions are paid out according to platform policy.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Total earnings</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">
              ${(pending / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Paid</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">
              ${(paid / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">Breakdown</h2>
          {commissions.length === 0 ? (
            <p className="mt-2 text-slate-500">No commissions yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {commissions.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <span className="text-slate-200">{c.payment.paymentType}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {c.payment.dealId && `Deal ${c.payment.dealId.slice(0, 8)}`}
                      {c.payment.bookingId && `Booking ${c.payment.bookingId.slice(0, 8)}`}
                      {" · "}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-100">
                      ${(c.brokerAmountCents / 100).toFixed(2)}
                    </span>
                    <span className={`text-xs ${c.status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                      {c.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
