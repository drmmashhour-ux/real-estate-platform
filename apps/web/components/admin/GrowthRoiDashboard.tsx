"use client";

import { useCallback, useEffect, useState } from "react";

type FunnelRow = { step: string; count: number; retentionFromPrior: number | null };

type Payload = {
  range: { days: number; start: string; end: string };
  inputs: { manualAdSpendCad: number; note: string };
  totals: {
    lpViews: number;
    adClicks: number;
    ctaClicks: number;
    signups: number;
    hostSignups: number;
    brokerLeads: number;
    bookingStarted: number;
    bookingCompleted: number;
    revenueCents: number;
    leadEvents: number;
    growthSignupsVerified?: number;
    growthBookingsCompletedVerified?: number;
    paidBnhubBookingPayments?: number;
    bookingRevenueCents?: number;
  };
  costs: { costPerLeadCents: number | null; costPerBookingCents: number | null };
  rates: { signupPerLpView: number; bookingPerSignup: number; conversionBookingPerStarted: number };
  revenueVsSpend: { revenueCents: number; adSpendCents: number; roas: number | null };
  funnel: FunnelRow[];
  growthFunnel?: { range: { days: number; start: string; end: string }; funnel: FunnelRow[] };
  unitEconomics?: {
    avgRevenuePerBookingCents: number | null;
    revenuePerSignupCents: number | null;
    cacVsLtvProxyRatio: number | null;
  };
};

function cadFromCents(c: number | null): string {
  if (c == null) return "—";
  return `$${(c / 100).toFixed(2)}`;
}

export function GrowthRoiDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { error?: string } & Partial<Payload>;
      if (!res.ok) {
        setErr(j.error ?? "Could not load analytics");
        setData(null);
        return;
      }
      setData(j as Payload);
    } catch {
      setErr("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-sm text-zinc-500">
        Loading growth ROI…
      </section>
    );
  }

  if (err || !data) {
    return (
      <section className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">
        {err ?? "No data"}
      </section>
    );
  }

  const t = data.totals;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">LECIPM Growth System · ROI</h2>
          <p className="mt-1 text-xs text-zinc-500">{data.inputs.note}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Period (days)
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        Range: {new Date(data.range.start).toLocaleDateString()} → {new Date(data.range.end).toLocaleDateString()}{" "}
        · Manual ad spend (CAD): {data.inputs.manualAdSpendCad.toLocaleString()} — update via{" "}
        <span className="text-zinc-400">Marketing settings</span> API / admin tools.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cost / lead" value={cadFromCents(data.costs.costPerLeadCents)} hint="Signups + broker leads" />
        <Metric label="Cost / booking" value={cadFromCents(data.costs.costPerBookingCents)} hint="Completed stays" />
        <Metric
          label="Signup rate (vs LP views)"
          value={`${data.rates.signupPerLpView.toFixed(1)}%`}
          hint="traffic_events"
        />
        <Metric label="ROAS (revenue / spend)" value={data.revenueVsSpend.roas != null ? `${data.revenueVsSpend.roas}×` : "—"} hint="Paid platform revenue" />
      </div>

      {data.unitEconomics ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Avg revenue / BNHub booking"
            value={cadFromCents(data.unitEconomics.avgRevenuePerBookingCents)}
            hint="paid platform_payment type=booking"
          />
          <Metric
            label="Revenue / signup (proxy)"
            value={cadFromCents(data.unitEconomics.revenuePerSignupCents)}
            hint="period revenue ÷ traffic signups — not cohort LTV"
          />
          <Metric
            label="CAC vs LTV proxy"
            value={data.unitEconomics.cacVsLtvProxyRatio != null ? `${data.unitEconomics.cacVsLtvProxyRatio}×` : "—"}
            hint="revenue/signup ÷ CPL — use for direction only"
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Totals (period)</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-400">
            <li>LP page views: {t.lpViews}</li>
            <li>Ad clicks: {t.adClicks}</li>
            <li>CTA clicks: {t.ctaClicks}</li>
            <li>Signups: {t.signups}</li>
            <li>Host signups: {t.hostSignups}</li>
            <li>Broker lead intents: {t.brokerLeads}</li>
            <li>Bookings started: {t.bookingStarted}</li>
            <li>Bookings completed: {t.bookingCompleted}</li>
            <li>Revenue (paid): {cadFromCents(t.revenueCents)}</li>
            {t.growthSignupsVerified != null ? (
              <li>growth_events signups (verified): {t.growthSignupsVerified}</li>
            ) : null}
            {t.growthBookingsCompletedVerified != null ? (
              <li>growth_events bookings (Stripe): {t.growthBookingsCompletedVerified}</li>
            ) : null}
            {t.paidBnhubBookingPayments != null ? (
              <li>BNHub booking payments (count): {t.paidBnhubBookingPayments}</li>
            ) : null}
            {t.bookingRevenueCents != null ? (
              <li>BNHub booking revenue: {cadFromCents(t.bookingRevenueCents)}</li>
            ) : null}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Funnel — traffic_events (retention)</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.funnel.map((row) => (
              <li key={row.step} className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2 text-zinc-400">
                <span className="font-mono text-xs text-premium-gold/90">{row.step}</span>
                <span>
                  {row.count.toLocaleString()}
                  {row.retentionFromPrior != null ? (
                    <span className="ml-2 text-zinc-600">({row.retentionFromPrior.toFixed(1)}%)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.growthFunnel?.funnel?.length ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-black/30 p-4">
          <h3 className="text-sm font-medium text-zinc-300">Funnel — growth_events (deterministic DB)</h3>
          <p className="mt-1 text-xs text-zinc-600">
            Signups & paid bookings are server-written; LP views come from client allowlisted events.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {data.growthFunnel.funnel.map((row) => (
              <li key={row.step} className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2 text-zinc-400">
                <span className="font-mono text-xs text-emerald-400/90">{row.step}</span>
                <span>
                  {row.count.toLocaleString()}
                  {row.retentionFromPrior != null ? (
                    <span className="ml-2 text-zinc-600">({row.retentionFromPrior.toFixed(1)}%)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}
