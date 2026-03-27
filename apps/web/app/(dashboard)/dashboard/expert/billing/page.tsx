import { ExpertBillingClient } from "./expert-billing-client";

const GOLD = "#C9A646";

export const dynamic = "force-dynamic";

export default function ExpertBillingPage() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
        Billing & monetization
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Expert billing</h1>
      <p className="mt-2 max-w-xl text-sm text-neutral-400">
        Subscriptions, pay-per-lead credits, commission tracking, and Stripe Connect payouts — black & gold
        dashboard.
      </p>
      <div className="mt-8">
        <ExpertBillingClient />
      </div>
    </div>
  );
}
