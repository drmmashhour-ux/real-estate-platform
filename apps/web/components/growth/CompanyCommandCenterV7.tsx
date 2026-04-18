"use client";

import * as React from "react";

type Payload = {
  marketplace: {
    leadsLast7d: number;
    activeBrokers: number;
    leadsPerBroker: number;
    balance: string;
    recommendations: string[];
  };
  pricingAdvanced: {
    recommendedPriceCad: number;
    baseRecommendedCad: number;
    note: string;
    balance: string;
    conversionRate7d: number;
  };
  brokerTiers: Array<{
    userId: string;
    email: string | null;
    brokerTier: string;
    monthlySpendCad: number;
  }>;
  lifecycle: Array<{
    userId: string;
    email: string | null;
    stage: string;
    churnRisk: string;
    suggestedPlaybook: string;
  }>;
  acquisition: { channels: Array<{ channel: string; leads30d: number; note: string }>; disclaimer: string };
  forecast30d: { projectedNext30dCad: number; avgDailyCad: number; trailing7dRevenueCad: number; method: string };
  monthForecast: {
    currentRevenueCad: number;
    projectedMonthEndCad: number;
    monthlyTargetCad: number;
    progressPercent: number;
  };
  governance: {
    overpricingRisk: string | null;
    lowQualityLeadSignals: string[];
    brokerChurnSummary: string | null;
    freezeOrAdjust: string[];
  };
  topActions: Array<{ id: string; title: string; description: string; source: string; impact: string }>;
  alerts: string[];
};

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function CompanyCommandCenterV7() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/command-center-v7", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.marketplace && j.topActions) setData(j as Payload);
        else setErr("Invalid response");
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading command center…</p>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err ?? "Unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-900/50 bg-indigo-950/20 p-4" data-company-command-center-v7>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">LECIPM · v7</p>
        <h2 className="mt-1 text-xl font-bold text-white">Company command center</h2>
        <p className="mt-1 text-xs text-zinc-500">
          $100K scale layer — advisory only; sensitive execution stays manual / approval-gated elsewhere.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Revenue (MTD)</p>
          <p className="mt-1 text-lg font-bold text-white">{fmtCad(data.monthForecast.currentRevenueCad)}</p>
          <p className="text-xs text-zinc-500">Target {fmtCad(data.monthForecast.monthlyTargetCad)} · {data.monthForecast.progressPercent.toFixed(0)}%</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">30d projection</p>
          <p className="mt-1 text-lg font-bold text-indigo-200">{fmtCad(data.forecast30d.projectedNext30dCad)}</p>
          <p className="text-xs text-zinc-500">~{fmtCad(data.forecast30d.avgDailyCad)}/day trail</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Month run-rate</p>
          <p className="mt-1 text-lg font-bold text-emerald-200">{fmtCad(data.monthForecast.projectedMonthEndCad)}</p>
          <p className="text-xs text-zinc-500">UTC calendar month</p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <h3 className="text-sm font-semibold text-white">Marketplace health</h3>
        <p className="mt-2 text-sm text-zinc-400">
          {data.marketplace.leadsLast7d} leads (7d) · {data.marketplace.activeBrokers} brokers · {data.marketplace.leadsPerBroker}{" "}
          L/B · <span className="font-medium text-indigo-200">{data.marketplace.balance}</span>
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
          {data.marketplace.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <h3 className="text-sm font-semibold text-white">Dynamic pricing (advanced)</h3>
        <p className="mt-2 text-sm text-zinc-300">{data.pricingAdvanced.note}</p>
        <p className="mt-1 text-sm">
          Suggested <strong className="text-teal-300">${data.pricingAdvanced.recommendedPriceCad.toFixed(2)} CAD</strong> (base $
          {data.pricingAdvanced.baseRecommendedCad.toFixed(2)}) · conv {(data.pricingAdvanced.conversionRate7d * 100).toFixed(1)}%
        </p>
      </section>

      <section className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4">
        <h3 className="text-sm font-semibold text-amber-100">Alerts & governance</h3>
        {data.alerts.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">No critical hints.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-amber-100/95">
            {data.alerts.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        )}
        {data.governance.freezeOrAdjust.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
            {data.governance.freezeOrAdjust.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-violet-900/35 bg-violet-950/20 p-4">
        <h3 className="text-sm font-semibold text-violet-100">Top 3 growth actions (today)</h3>
        <ol className="mt-3 space-y-2 text-sm">
          {data.topActions.map((a, i) => (
            <li key={a.id} className="rounded-lg border border-zinc-800 bg-black/30 p-3">
              <span className="text-xs font-bold text-zinc-500">{i + 1}.</span>{" "}
              <span className="font-medium text-white">{a.title}</span>
              <p className="mt-1 text-xs text-zinc-400">{a.description}</p>
              <p className="mt-1 text-[10px] uppercase text-zinc-600">
                {a.source} · {a.impact}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 p-3">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Broker tiers</h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-400">
            {data.brokerTiers.length === 0 ? (
              <li>No monthly monetization rows.</li>
            ) : (
              data.brokerTiers.map((b) => (
                <li key={b.userId}>
                  {b.email ?? "—"} · <span className="text-zinc-200">{b.brokerTier}</span> · {fmtCad(b.monthlySpendCad)}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-zinc-800 p-3">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Lifecycle (sample)</h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-400">
            {data.lifecycle.map((l) => (
              <li key={l.userId}>
                {l.email ?? "—"} · {l.stage} · risk {l.churnRisk}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 p-3">
        <h3 className="text-xs font-semibold uppercase text-zinc-500">Acquisition channels (30d)</h3>
        <p className="mt-1 text-[11px] text-zinc-600">{data.acquisition.disclaimer}</p>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
          {data.acquisition.channels.map((c) => (
            <li key={c.channel} className="rounded border border-zinc-800 px-2 py-1 text-zinc-400">
              {c.channel}: {c.leads30d}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
