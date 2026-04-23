import Link from "next/link";
import { getSubscriptionPlans } from "@/lib/subscription-billing";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const [plans, subs] = await Promise.all([
    getSubscriptionPlans(),
    prisma.planSubscription.findMany({
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Billing
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Subscription management
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Plans, subscriptions, and entitlements.
          </p>
          <div className="mt-4">
            <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Plans</h2>
          {plans.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No plans. Create via API POST /api/admin/subscriptions/plans.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.slug} · {p.module}</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">
                    {(p.amountCents / 100).toFixed(2)} {p.billingCycle === "YEARLY" ? "/yr" : "/mo"}
                  </p>
                  {p.trialDays > 0 && (
                    <p className="text-xs text-slate-400">{p.trialDays} days trial</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Recent subscriptions</h2>
          {subs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No subscriptions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">User</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Period end</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-200">{s.userId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-300">{s.plan.name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.status}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(s.currentPeriodEnd).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
