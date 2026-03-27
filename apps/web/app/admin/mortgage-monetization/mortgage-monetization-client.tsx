"use client";

import { useEffect, useState } from "react";

type MonetizationResponse = {
  totals: {
    totalPlatformRevenueCents: number;
    subscriptionRevenueCents: number;
    leadCreditsRevenueCents: number;
    commissionRevenueCents: number;
    commissionFromMortgageDealsDollars: number;
    commissionInvoicedCents: number;
    activeStripeTrackedExperts: number;
  };
  invoiceCounts: { subscription: number; leadCredits: number; commission: number };
  payoutByStatus: Array<{ status: string; _sum: { expertAmountCents: number | null; platformFeeCents: number | null } }>;
};

function Bar({ label, valueCents, max }: { label: string; valueCents: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((valueCents / max) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>${(valueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-amber-400/90"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MortgageMonetizationAdminClient() {
  const [data, setData] = useState<MonetizationResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/mortgage-monetization", { credentials: "include" });
        if (!res.ok) {
          setErr("Failed to load");
          return;
        }
        setData((await res.json()) as MonetizationResponse);
      } catch {
        setErr("Failed to load");
      }
    })();
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  const t = data.totals;
  const maxBar = Math.max(t.subscriptionRevenueCents, t.leadCreditsRevenueCents, t.commissionRevenueCents, 1);

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Totals</h2>
        <p className="mt-1 text-3xl font-bold text-amber-300">
          ${(t.totalPlatformRevenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-slate-500">Subscriptions + lead credits + deal commission (platform share)</p>
        <p className="mt-2 text-sm text-slate-400">
          Active Stripe-tracked experts: {t.activeStripeTrackedExperts}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Revenue breakdown</h2>
        <Bar label="Subscriptions (invoiced)" valueCents={t.subscriptionRevenueCents} max={maxBar} />
        <Bar label="Lead credits (invoiced)" valueCents={t.leadCreditsRevenueCents} max={maxBar} />
        <Bar
          label="Commission (MortgageDeal platform share)"
          valueCents={t.commissionRevenueCents}
          max={maxBar}
        />
        <p className="mt-4 text-xs text-slate-500">
          Commission from deals (dollars in DB): ${t.commissionFromMortgageDealsDollars.toLocaleString()} ·
          Commission invoice rows (cents): {t.commissionInvoicedCents}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Invoice counts</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
          <li>Subscription: {data.invoiceCounts.subscription}</li>
          <li>Lead credits: {data.invoiceCounts.leadCredits}</li>
          <li>Commission: {data.invoiceCounts.commission}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Payout records by status</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {data.payoutByStatus.map((p) => (
            <li key={p.status}>
              {p.status}: expert ${((p._sum.expertAmountCents ?? 0) / 100).toFixed(2)} · platform fee $
              {((p._sum.platformFeeCents ?? 0) / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
