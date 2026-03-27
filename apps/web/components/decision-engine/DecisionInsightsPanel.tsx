"use client";

import { useState } from "react";
import type { DecisionSnapshot } from "@/lib/decision-engine/buildDecisionSnapshot";

type Props = {
  listingId: string;
  initial: DecisionSnapshot | null;
};

export function DecisionInsightsPanel({ listingId, initial }: Props) {
  const [data, setData] = useState<DecisionSnapshot | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runFullEngine() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decision-engine/${listingId}`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; error?: string; trust?: DecisionSnapshot["trust"]; deal?: DecisionSnapshot["deal"]; explanation?: DecisionSnapshot["explanation"] };
      if (!res.ok || !json.trust || !json.deal || !json.explanation) {
        throw new Error(json.error ?? "Could not refresh");
      }
      setData({ trust: json.trust, deal: json.deal, explanation: json.explanation });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#C9A646]/20 bg-[#121212] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Decision engine</p>
          <p className="mt-1 text-sm text-slate-400">
            Trust and deal scores are rules-based. Text below may be AI-assisted — it never overrides scores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runFullEngine()}
          disabled={loading}
          className="shrink-0 rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2 text-xs font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/20 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Recompute all"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      {!data ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-[#0D0D0D] p-4">
          <p className="text-sm text-slate-300">No snapshot yet — run the engine to populate trust, deal, and insights.</p>
          <button
            type="button"
            onClick={() => void runFullEngine()}
            disabled={loading}
            className="mt-3 rounded-full bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
          >
            Run decision engine
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#0D0D0D] p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Trust score</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-white">{data.trust.trustScore}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">{data.trust.level}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Confidence <span className="tabular-nums text-slate-300">{data.trust.trustConfidence}</span>/100
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0D0D0D] p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Deal score</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-white">{data.deal.dealScore}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">{data.deal.category}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Confidence <span className="tabular-nums text-slate-300">{data.deal.dealConfidence}</span>/100
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0D0D0D] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Recommendation</p>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-100">{data.deal.recommendation.replace(/_/g, " ")}</p>
          </div>

          {data.trust.issues.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Key issues</p>
              {data.trust.issueCodes.length > 0 ? (
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  {data.trust.issueCodes.slice(0, 6).join(" · ")}
                </p>
              ) : null}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {data.trust.issues.slice(0, 6).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">AI insights</p>
            {data.explanation.aiEnhanced ? (
              <p className="mt-1 text-[10px] text-emerald-400/90">Summary enhanced with AI (scores unchanged)</p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{data.explanation.summary}</p>
            {data.explanation.keyInsights.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                {data.explanation.keyInsights.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            ) : null}
            {data.explanation.warnings.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-amber-200/90">
                {data.explanation.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}
            {data.explanation.nextActions.length > 0 ? (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Next actions</p>
                <ul className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                  {data.explanation.nextActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
