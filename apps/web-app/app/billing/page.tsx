import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getActiveSubscription, getInvoicesForSubscription } from "@/lib/subscription-billing";
import { getSubscriptionPlans } from "@/lib/subscription-billing";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Billing & subscription</h1>
          <p className="mt-4 text-slate-400">Sign in to view your subscription and invoices.</p>
          <Link href="/bnhub/login" className="mt-6 inline-block text-emerald-400 hover:text-emerald-300">
            Sign in →
          </Link>
        </div>
      </main>
    );
  }

  const [subscription, plans] = await Promise.all([
    getActiveSubscription(userId),
    getSubscriptionPlans(),
  ]);
  const invoices = subscription
    ? await getInvoicesForSubscription(subscription.id, 10)
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="text-2xl font-semibold tracking-tight">Billing & subscription</h1>
          <p className="mt-2 text-sm text-slate-400">Manage your plan and view invoices.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-200">Current plan</h2>
        {!subscription ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-slate-400">You are not subscribed to a paid plan.</p>
            {plans.length > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                Available plans: {plans.map((p) => p.name).join(", ")}. Contact support or use admin to subscribe.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="font-medium text-slate-200">{subscription.plan.name}</p>
            <p className="text-sm text-slate-500">
              {(subscription.plan.amountCents / 100).toFixed(2)} / {subscription.plan.billingCycle.toLowerCase()}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Status: {subscription.status} · Period end:{" "}
              {new Date(subscription.currentPeriodEnd).toISOString().slice(0, 10)}
            </p>
          </div>
        )}
      </section>

      {subscription && invoices.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-200">Invoice history</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/80">
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(inv.dueDate).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{(inv.amountCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
