import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBrokerBillingPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?returnUrl=/admin/broker-billing");

  const user = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE" || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const role = await getUserRole();

  return (
    <HubLayout
      title="Broker billing — how LECIPM gets paid"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="mx-auto max-w-3xl space-y-8 text-sm text-slate-200">
        <div>
          <Link href="/admin/finance" className="text-amber-400 hover:text-amber-300">
            ← Finance hub
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">Broker billing system</h1>
          <p className="mt-2 text-slate-400">
            Operational map: where broker money hits Stripe, unlocks data, and shows up in finance — so you can scale
            knowing the pipes are real.
          </p>
        </div>

        <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-5">
          <h2 className="text-base font-semibold text-emerald-200">1) Pay per lead (marketplace)</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-slate-300">
            <li>
              Brokers browse scored leads via <code className="text-slate-400">GET /api/lead-marketplace/listings</code>{" "}
              (masked contact until purchase).
            </li>
            <li>
              Checkout: <code className="text-slate-400">POST /api/lead-marketplace/checkout</code> creates a Stripe
              session with <code className="text-slate-400">paymentType: lead_marketplace</code>.
            </li>
            <li>
              <code className="text-slate-400">checkout.session.completed</code> →{" "}
              <code className="text-slate-400">completeLeadMarketplacePurchase</code> → lead assigned, contact
              unlocked, <code className="text-slate-400">RevenueEvent.lead_purchased</code> recorded.
            </li>
            <li>Admin publishes leads: <code className="text-slate-400">POST /api/lead-marketplace/publish</code>.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Onboarding CTA in product points to <code className="text-slate-400">/lead-marketplace</code> — ensure that
            route or broker dashboard entry lists the same flow.
          </p>
        </section>

        <section className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-5">
          <h2 className="text-base font-semibold text-sky-200">2) Broker subscription (SaaS)</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-slate-300">
            <li>
              Stripe subscription checkout for LECIPM broker plans — handled in{" "}
              <code className="text-slate-400">handleBrokerLecipmSubscriptionCheckoutCompleted</code> and subscription
              webhooks (<code className="text-slate-400">brokerLecipmSubscription</code> rows).
            </li>
            <li>
              <code className="text-slate-400">RevenueEvent.premium_upgrade</code> on successful checkout (amount from
              session).
            </li>
            <li>
              Broker-facing pricing surface:{" "}
              <Link href="/broker/pricing" className="text-sky-300 underline hover:text-sky-200">
                /broker/pricing
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-5">
          <h2 className="text-base font-semibold text-amber-200">3) Deal commissions (closings)</h2>
          <p className="mt-2 text-slate-300">
            Closed-deal economics flow through platform commission / broker commission records (see finance tools — not
            the same as lead purchase).
          </p>
          <Link href="/admin/finance/brokers" className="mt-3 inline-block text-amber-300 underline hover:text-amber-200">
            Broker earnings summaries →
          </Link>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-base font-semibold text-white">4) Reporting &amp; investor line</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>
              <Link href="/admin/revenue" className="text-emerald-400 hover:text-emerald-300">
                Revenue &amp; ledger
              </Link>{" "}
              — platform + monetization events.
            </li>
            <li>
              <Link href="/admin/investor" className="text-emerald-400 hover:text-emerald-300">
                Investor metrics
              </Link>{" "}
              — snapshots and KPIs.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-violet-500/25 bg-violet-950/10 p-5">
          <h2 className="text-base font-semibold text-violet-200">Ops checklist</h2>
          <ul className="mt-2 list-inside list-decimal space-y-1 text-slate-400 text-xs">
            <li>Stripe live keys + webhook endpoint deployed; events delivered for checkout + subscriptions.</li>
            <li>
              <code className="text-slate-500">CRON_SECRET</code> set if using scheduled jobs (revenue / metrics).
            </li>
            <li>Lead marketplace: prices set on publish; test one purchase end-to-end in staging.</li>
          </ul>
        </section>

        <p className="text-center text-xs font-medium tracking-wide text-emerald-500/90">
          Broker billing mapped — scale on pay-per-lead + subscription, then deal commissions.
        </p>
      </div>
    </HubLayout>
  );
}
