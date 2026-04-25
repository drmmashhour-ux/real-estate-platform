"use client";

import { useEffect, useState } from "react";

type Props = { className?: string };

export function RevenueDashboard({ className }: Props) {
  const [data, setData] = useState<{
    mrr: { mrr: number | null; activeSubscriptionCount: number; subscriptionsMissingMrrCount: number };
    churn: { churnRate: number | null; canceledInWindowCount: number; activePayingCount: number };
    ltv: {
      ltv: number | null;
      arpu: number | null;
      averageSubscriberLifetimeMonths: number | null;
      canceledSampleCount: number;
    };
  } | null>(null);
  const [brokerLtv, setBrokerLtv] = useState<{
    repeatPurchaseRate: number | null;
    avgRevenuePerActiveBroker: number | null;
    topSpenders: { userId: string; name: string | null; email: string | null; totalCad: number; purchaseCount: number }[];
    windowDays: number;
    note: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [res, resLtv] = await Promise.all([
          fetch("/api/internal/revenue", { credentials: "include" }),
          fetch("/api/internal/broker-ltv", { credentials: "include" }),
        ]);
        const j = (await res.json()) as { error?: string; mrr?: unknown };
        if (!res.ok) {
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setData(j as typeof data);
        if (resLtv.ok) {
          const jl = (await resLtv.json()) as (typeof brokerLtv) & { error?: string };
          if (!("error" in jl) && jl.repeatPurchaseRate !== undefined) {
            if (!cancelled) {
              setBrokerLtv({
                repeatPurchaseRate: jl.repeatPurchaseRate,
                avgRevenuePerActiveBroker: jl.avgRevenuePerActiveBroker,
                topSpenders: jl.topSpenders ?? [],
                windowDays: jl.windowDays ?? 90,
                note: jl.note ?? "",
              });
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 text-sm text-slate-400 ${className ?? ""}`}>Loading revenue…</div>;
  }
  if (error) {
    return (
      <div className={`rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-200 ${className ?? ""}`}>
        Revenue metrics unavailable: {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-premium-gold/90">Revenue (Stripe-backed)</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric label="MRR" value={data.mrr.mrr != null ? `$${data.mrr.mrr.toFixed(2)}` : "—"} hint={`${data.mrr.activeSubscriptionCount} active`} />
        <Metric
          label="Churn (30d)"
          value={data.churn.churnRate != null ? `${(data.churn.churnRate * 100).toFixed(2)}%` : "—"}
          hint={`${data.churn.canceledInWindowCount} canceled vs ${data.churn.activePayingCount} paying`}
        />
        <Metric
          label="LTV (est.)"
          value={data.ltv.ltv != null ? `$${data.ltv.ltv.toFixed(2)}` : "—"}
          hint={data.ltv.arpu != null ? `ARPU $${data.ltv.arpu.toFixed(2)} × ${data.ltv.averageSubscriberLifetimeMonths?.toFixed(1) ?? "—"} mo` : "Need canceled cohort + MRR"}
        />
      </div>
      {data.mrr.subscriptionsMissingMrrCount > 0 ? (
        <p className="mt-3 text-xs text-amber-200/90">
          {data.mrr.subscriptionsMissingMrrCount} active subscription(s) missing MRR from Stripe sync — MRR may be understated until the next webhook sync.
        </p>
      ) : null}

      {brokerLtv ? (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Broker lead LTV (ledger)</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Metric
              label="Repeat purchase rate (brokers w/ 2+ unlocks in window)"
              value={brokerLtv.repeatPurchaseRate != null ? `${(brokerLtv.repeatPurchaseRate * 100).toFixed(1)}%` : "—"}
              hint={`${brokerLtv.windowDays}d; internal events`}
            />
            <Metric
              label="Avg revenue / active lead buyer"
              value={brokerLtv.avgRevenuePerActiveBroker != null ? `$${brokerLtv.avgRevenuePerActiveBroker.toFixed(2)}` : "—"}
              hint="Among users with lead unlock/purchase in window"
            />
          </div>
          {brokerLtv.topSpenders.length > 0 ? (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-white/5 p-2 text-xs text-slate-400">
              <p className="font-medium text-slate-500">Top by realized lead revenue (window)</p>
              <ul className="mt-2 space-y-1">
                {brokerLtv.topSpenders.map((r) => (
                  <li key={r.userId} className="flex justify-between gap-2 text-slate-300">
                    <span className="truncate">{r.name || r.email || r.userId.slice(0, 8)}</span>
                    <span>
                      ${r.totalCad.toFixed(2)} · {r.purchaseCount} event{r.purchaseCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-slate-600">{brokerLtv.note}</p>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
