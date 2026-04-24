"use client";

import * as React from "react";

type Latest = {
  id: string;
  score: number;
  category: string;
  riskLevel: string;
  strengths: string[];
  risks: string[];
  factors: Record<string, number>;
  recommendation: string;
  createdAt: string;
};

const FACTOR_LABELS: Record<string, string> = {
  priceVsMarket: "Price vs market",
  locationQuality: "Location quality",
  propertyCondition: "Property condition",
  financingStrength: "Financing strength",
  inspectionRisk: "Inspection / diligence",
  timeToClose: "Timeline to close",
  esg: "ESG",
  investorReturn: "Investor return",
};

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "EXCELLENT":
      return "border-emerald-500/50 bg-emerald-950/50 text-emerald-100";
    case "GOOD":
      return "border-sky-500/50 bg-sky-950/40 text-sky-100";
    case "RISKY":
      return "border-amber-500/50 bg-amber-950/40 text-amber-100";
    case "REJECT":
      return "border-rose-500/50 bg-rose-950/50 text-rose-100";
    default:
      return "border-zinc-600 bg-zinc-900 text-zinc-200";
  }
}

function recommendationClass(rec: string): string {
  if (rec === "ACCEPT") return "bg-emerald-600 text-white";
  if (rec === "REVIEW") return "bg-amber-600 text-white";
  if (rec === "REJECT") return "bg-rose-700 text-white";
  return "bg-zinc-600 text-white";
}

export function DealScoringInsightPanel(props: { dealId: string; allowRefresh: boolean }) {
  const { dealId, allowRefresh } = props;
  const [latest, setLatest] = React.useState<Latest | null>(null);
  const [advisory, setAdvisory] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/score`, { credentials: "include" });
      const data = (await res.json()) as {
        ok?: boolean;
        latest?: Latest | null;
        advisory?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load deal score");
      setLatest(data.latest ?? null);
      setAdvisory(typeof data.advisory === "string" ? data.advisory : null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
    }
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/score`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        snapshot?: Latest;
        error?: string;
        advisory?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not refresh score");
      if (data.snapshot) setLatest(data.snapshot);
      if (typeof data.advisory === "string") setAdvisory(data.advisory);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  const factorEntries = latest ? Object.entries(latest.factors).sort((a, b) => b[1] - a[1]) : [];

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-violet-100">Deal score (pre-signature)</h2>
          <p className="mt-1 text-xs text-violet-100/65">
            Accept / review / reject guidance from rule-based factors — refresh after material file changes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowRefresh ?
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="rounded-lg border border-violet-400/40 bg-violet-900/50 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-800/50 disabled:opacity-40"
            >
              {busy ? "Scoring…" : "Refresh score"}
            </button>
          : null}
        </div>
      </div>

      {advisory ? <p className="mt-3 text-[10px] leading-snug text-zinc-500">{advisory}</p> : null}

      {msg ?
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {msg}
        </p>
      : null}

      {!latest && !msg ?
        <p className="mt-4 text-sm text-zinc-400">
          No score yet.
          {allowRefresh ? " Use refresh to compute the first snapshot." : ""}
        </p>
      : null}

      {latest ?
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`rounded-xl border px-4 py-3 text-center ${categoryBadgeClass(latest.category)}`}
              title="0–100 composite"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">Score</p>
              <p className="font-mono text-3xl font-semibold tabular-nums">{Math.round(latest.score)}</p>
              <p className="mt-0.5 text-[11px] opacity-90">{latest.category}</p>
            </div>
            <div className="min-w-[140px]">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Recommendation</p>
              <p
                className={`mt-1 inline-block rounded-lg px-3 py-1.5 text-sm font-semibold ${recommendationClass(latest.recommendation)}`}
              >
                {latest.recommendation}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Risk band: <span className="text-zinc-200">{latest.riskLevel}</span>
              </p>
              <p className="text-[10px] text-zinc-500">Updated {new Date(latest.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Strengths</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
                {latest.strengths.length ?
                  latest.strengths.map((s) => <li key={s}>{s}</li>)
                : <li className="list-none text-zinc-500">—</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Risks</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
                {latest.risks.length ?
                  latest.risks.map((s) => <li key={s}>{s}</li>)
                : <li className="list-none text-zinc-500">—</li>}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">Factor breakdown</h3>
            <ul className="mt-2 space-y-2">
              {factorEntries.map(([key, val]) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 text-zinc-400">{FACTOR_LABELS[key] ?? key}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-violet-500/80"
                      style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-zinc-300">{Math.round(val)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      : null}
    </section>
  );
}
