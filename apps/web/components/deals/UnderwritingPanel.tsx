"use client";

import * as React from "react";
import { AlertTriangle, TrendingUp, CheckCircle, RefreshCw, Info } from "lucide-react";

interface UnderwritingPanelProps {
  dealId: string;
  initialUnderwriting: {
    underwritingScore: number | null;
    underwritingLabel: string | null;
    underwritingRecommendation: string | null;
    underwritingConfidence: string | null;
    underwritingSummaryJson: any;
    underwritingRisksJson: any;
    underwritingUpsideJson: any;
    underwritingUpdatedAt: string | Date | null;
  };
  allowRefresh?: boolean;
}

export function UnderwritingPanel({ dealId, initialUnderwriting, allowRefresh = true }: UnderwritingPanelProps) {
  const [data, setData] = React.useState(initialUnderwriting);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/underwriting/refresh`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Refresh failed");
      
      // After refresh triggered, fetch new data
      const dataRes = await fetch(`/api/deals/${dealId}/underwriting`);
      const newData = await dataRes.json();
      if (newData.ok) {
        setData(newData.underwriting);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  const score = data.underwritingScore;
  const label = data.underwritingLabel;
  const recommendation = data.underwritingRecommendation;
  const summary = data.underwritingSummaryJson;
  const risks = data.underwritingRisksJson;
  const upside = data.underwritingUpsideJson;

  if (!score && !busy) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <p className="text-sm text-zinc-500">No underwriting data available yet.</p>
        {allowRefresh && (
          <button
            onClick={refresh}
            className="mt-4 flex items-center justify-center gap-2 mx-auto rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Run initial underwriting
          </button>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Investment Intelligence</h2>
        {allowRefresh && (
          <button
            onClick={refresh}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Analyzing..." : "Refresh"}
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* InvestmentScoreCard */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Underwriting Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-serif font-bold text-zinc-100">{score ? Math.round(score) : "—"}</span>
            <span className={`text-xs font-bold ${
              label === "STRONG" ? "text-emerald-400" : 
              label === "MODERATE" ? "text-amber-400" : "text-rose-400"
            }`}>
              {label}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                label === "STRONG" ? "bg-emerald-500" : 
                label === "MODERATE" ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${score || 0}%` }}
            />
          </div>
        </div>

        {/* UnderwritingDecisionPanel */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recommendation Stance</p>
          <div className="mt-3 flex items-start gap-4">
            <div className={`shrink-0 rounded-full p-2 ${
              recommendation === "BUY" ? "bg-emerald-500/10 text-emerald-500" :
              recommendation === "BUY_WITH_RETROFIT_PLAN" ? "bg-amber-500/10 text-amber-500" :
              recommendation === "HOLD" ? "bg-zinc-500/10 text-zinc-400" : "bg-rose-500/10 text-rose-500"
            }`}>
              {recommendation === "BUY" ? <CheckCircle className="h-6 w-6" /> :
               recommendation === "BUY_WITH_RETROFIT_PLAN" ? <TrendingUp className="h-6 w-6" /> :
               recommendation === "HOLD" ? <Info className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-100">
                {recommendation?.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                {summary?.reasoning || "Analyzing investment fundamentals and ESG potential..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* RisksPanel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Risk Assessment</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            "{risks?.description || "Conservative scenario: potential occupancy volatility or interest rate pressure."}"
          </p>
          {risks?.roi !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Stress ROI:</span>
              <span className="text-sm font-mono text-rose-400">{(risks.roi * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* UpsidePanel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Upside Potential</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            "{upside?.description || "Optimistic scenario: ESG certification premium and peak seasonal occupancy."}"
          </p>
          {upside?.roi !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Upside ROI:</span>
              <span className="text-sm font-mono text-emerald-400">{(upside.roi * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ScenarioSummaryPanel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Underwriting Fundamentals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">Cap Rate</p>
            <p className="mt-1 text-lg font-mono text-zinc-200">
              {summary?.capRate ? `${(summary.capRate * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">Target ROI</p>
            <p className="mt-1 text-lg font-mono text-zinc-200">
              {summary?.roi ? `${(summary.roi * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">Monthly Cash Flow</p>
            <p className="mt-1 text-lg font-mono text-zinc-200">
              {summary?.cashFlow ? `$${Math.round(summary.cashFlow).toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">Confidence</p>
            <p className={`mt-1 text-lg font-semibold ${
              data.underwritingConfidence === "high" ? "text-emerald-400" :
              data.underwritingConfidence === "medium" ? "text-amber-400" : "text-zinc-500"
            }`}>
              {data.underwritingConfidence || "low"}
            </p>
          </div>
        </div>
        {data.underwritingUpdatedAt && (
          <p className="mt-4 text-[10px] text-zinc-600 text-right">
            Analysis refreshed {new Date(data.underwritingUpdatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {summary?.esgFactors && summary.esgFactors.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            Investment Scoring Layer Signals
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {summary.esgFactors.map((f: string, i: number) => (
              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
          {msg}
        </div>
      )}
    </div>
  );
}
