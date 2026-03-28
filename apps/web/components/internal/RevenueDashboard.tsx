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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/internal/revenue", { credentials: "include" });
        const j = (await res.json()) as { error?: string; mrr?: unknown };
        if (!res.ok) {
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setData(j as typeof data);
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
