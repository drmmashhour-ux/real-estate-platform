"use client";

import * as React from "react";

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

type Payload = {
  expansion: {
    markets: Array<{
      marketKey: string;
      leads30d: number;
      brokersAllocated: number;
      revenueCad30dEstimated: number;
      performance: string;
    }>;
    globalRevenueCad30d: number;
    activeBrokersTotal: number;
    underperforming: string[];
    highPerforming: string[];
    note: string;
  };
  pricingMatrix: Array<{ region: string; currencyLabel: string; suggestedLeadPriceCadEquivalent: number; note: string }>;
  brokerNetwork: Array<{ userId: string; email: string | null; brokerTier: string; monthlySpendCad: number }>;
  retention: { atRisk: unknown[]; reactivationPlays: string[] };
  acquisition: {
    referralEvents30d: number;
    blendedCacCad: number | null;
    note: string;
    channels: { channels: Array<{ channel: string; leads30d: number }> };
  };
  finance: {
    revenueCad30d: number;
    estimatedCostCad30d: number | null;
    profitCad30dEstimated: number | null;
    marginPercent: number | null;
    note: string;
  };
  risk: { duplicateContactSignals: number; recommendations: string[] };
  forecast30d: { projectedNext30dCad: number; avgDailyCad: number; method: string };
  monthRunRate: {
    currentRevenueCad: number;
    projectedMonthEndCad: number;
    monthlyTargetCad: number;
    progressPercent: number;
  };
  topActions: Array<{ id: string; title: string; description: string; source: string }>;
  alerts: string[];
};

export function CompanyCommandCenterV8() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/command-center-v8", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.expansion && j.topActions) setData(j as Payload);
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
        <p className="text-sm text-zinc-500">Loading global command center…</p>
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
    <div
      className="space-y-4 rounded-2xl border border-sky-900/45 bg-gradient-to-b from-sky-950/25 to-zinc-950/80 p-4"
      data-company-command-center-v8
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/90">LECIPM · Global v8</p>
        <h2 className="mt-1 text-xl font-bold text-white">Company command center</h2>
        <p className="mt-1 text-xs text-zinc-500">
          $1M scale layer — multi-market, finance, risk, acquisition. Execution stays manual / approval-gated.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-black/35 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">30d revenue</p>
          <p className="mt-1 text-lg font-bold text-white">{fmtCad(data.finance.revenueCad30d)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/35 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">30d profit (est.)</p>
          <p className="mt-1 text-lg font-bold text-emerald-200">
            {data.finance.profitCad30dEstimated != null ? fmtCad(data.finance.profitCad30dEstimated) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/35 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Forecast 30d</p>
          <p className="mt-1 text-lg font-bold text-sky-200">{fmtCad(data.forecast30d.projectedNext30dCad)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/35 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">Month run-rate</p>
          <p className="mt-1 text-lg font-bold text-amber-200">{fmtCad(data.monthRunRate.projectedMonthEndCad)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-rose-900/35 bg-rose-950/20 p-4">
        <h3 className="text-sm font-semibold text-rose-100">Alerts</h3>
        {data.alerts.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">No critical alerts.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-rose-100/95">
            {data.alerts.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="text-sm font-semibold text-white">Market expansion</h3>
        <p className="mt-1 text-[11px] text-zinc-500">{data.expansion.note}</p>
        <p className="mt-2 text-xs text-zinc-400">
          Global 30d revenue: {fmtCad(data.expansion.globalRevenueCad30d)} · Brokers: {data.expansion.activeBrokersTotal}
        </p>
        <div className="mt-3 max-h-48 overflow-y-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-1">Market</th>
                <th className="py-1">Leads</th>
                <th className="py-1">Rev (est.)</th>
                <th className="py-1">Perf</th>
              </tr>
            </thead>
            <tbody>
              {data.expansion.markets.slice(0, 12).map((m) => (
                <tr key={m.marketKey} className="border-b border-zinc-800/60 text-zinc-300">
                  <td className="py-1.5 pr-2">{m.marketKey}</td>
                  <td>{m.leads30d}</td>
                  <td>{fmtCad(m.revenueCad30dEstimated)}</td>
                  <td className="capitalize">{m.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-white">Global pricing matrix (hints)</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 text-xs text-zinc-400">
          {data.pricingMatrix.map((p) => (
            <li key={p.region} className="rounded border border-zinc-800 bg-black/30 px-2 py-2">
              <span className="font-semibold text-zinc-200">{p.region}</span> · {p.currencyLabel} · ~
              {fmtCad(p.suggestedLeadPriceCadEquivalent)}
              <p className="mt-1 text-[10px] text-zinc-600">{p.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-violet-900/35 bg-violet-950/20 p-4">
        <h3 className="text-sm font-semibold text-violet-100">Strategic actions (AI fusion)</h3>
        <ol className="mt-3 space-y-2 text-sm">
          {data.topActions.map((a, i) => (
            <li key={a.id} className="rounded-lg border border-zinc-800 bg-black/30 p-3">
              <span className="text-xs font-bold text-zinc-500">{i + 1}.</span>{" "}
              <span className="font-medium text-white">{a.title}</span>
              <p className="mt-1 text-xs text-zinc-400">{a.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 p-3">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Broker network</h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-400">
            {data.brokerNetwork.map((b) => (
              <li key={b.userId}>
                {b.email ?? b.userId.slice(0, 8)} · <span className="text-zinc-200">{b.brokerTier}</span> ·{" "}
                {fmtCad(b.monthlySpendCad)}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-zinc-800 p-3">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Acquisition scale</h3>
          <p className="mt-2 text-xs text-zinc-400">{data.acquisition.note}</p>
          <p className="mt-1 text-xs">
            Referral events (30d): <strong className="text-white">{data.acquisition.referralEvents30d}</strong> · Blended
            CAC:{" "}
            <strong className="text-white">
              {data.acquisition.blendedCacCad != null ? fmtCad(data.acquisition.blendedCacCad) : "—"}
            </strong>
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 p-3">
        <h3 className="text-xs font-semibold uppercase text-zinc-500">Risk management</h3>
        <p className="mt-2 text-xs text-zinc-400">
          Duplicate-email clusters (7d): <strong className="text-amber-200">{data.risk.duplicateContactSignals}</strong>
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
          {data.risk.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 p-3">
        <h3 className="text-xs font-semibold uppercase text-zinc-500">Retention intelligence</h3>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
          {data.retention.reactivationPlays.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
