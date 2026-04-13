import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function AdminPaymentsControlPage() {
  await requireAdminControlUserId();

  const [rows, agg, riskAlerts] = await Promise.all([
    prisma.platformPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        user: { select: { email: true, name: true } },
        deal: { select: { dealCode: true, id: true } },
      },
    }),
    prisma.platformPayment.aggregate({
      where: { status: "paid" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform checkouts (Stripe sessions / intents). For full finance model and taxes, use Finance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Paid rows (all time)</p>
            <p className="mt-1 text-2xl font-bold text-white">{agg._count._all.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Gross paid (platform)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{cad(agg._sum.amountCents ?? 0)}</p>
          </div>
          <Link
            href="/admin/finance/overview"
            className="rounded-2xl border border-zinc-700 bg-[#111] p-4 transition hover:border-zinc-500"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">Finance hub</p>
            <p className="mt-2 text-sm text-zinc-300">Open financial model, commissions, invoices →</p>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Links</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No platform payments yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-800/80">
                      <td className="px-4 py-3 text-xs text-zinc-400">{p.createdAt.toISOString().slice(0, 19)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{p.user.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.paymentType}</td>
                      <td className="px-4 py-3 text-white">{cad(p.amountCents)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            p.status === "paid"
                              ? "text-emerald-400"
                              : p.status === "failed"
                                ? "text-rose-400"
                                : "text-amber-300"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {p.deal ? (
                          <Link href={`/dashboard/deals/${p.deal.id}`} className="text-amber-400 hover:underline">
                            {p.deal.dealCode ?? "Deal"}
                          </Link>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LecipmControlShell>
  );
}
