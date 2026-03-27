"use client";

import { useState, type CSSProperties } from "react";

const GOLD = "#C9A96E";
const DARK = "#0f0f0f";

type AnalyzeResponse = {
  ok?: boolean;
  error?: string;
  result?: {
    score: number;
    confidence: "low" | "medium" | "high";
    summary: string;
    strengths: string[];
    riskFlags: string[];
    metrics: {
      monthlyMortgagePayment: number | null;
      estimatedMonthlyExpenses: number | null;
      estimatedMonthlyCashFlow: number | null;
      grossYield: number | null;
      estimatedDownPayment: number | null;
    };
  };
  assumptions?: { price: number; priceIsIllustrative: boolean };
};

type Props = { listingId: string };

export function AIDealAnalyzerCard({ listingId }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const [estimatedRent, setEstimatedRent] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState("");
  const [mortgageRate, setMortgageRate] = useState("");
  const [amortizationYears, setAmortizationYears] = useState("");

  async function runAnalyze() {
    setErr(null);
    setLoading(true);
    try {
      const body: Record<string, number> = {};
      const er = parseFloat(estimatedRent);
      if (!Number.isNaN(er) && er >= 0) body.estimatedRent = er;
      const dp = parseFloat(downPaymentPercent);
      if (!Number.isNaN(dp) && dp >= 0) body.downPaymentPercent = dp;
      const mr = parseFloat(mortgageRate);
      if (!Number.isNaN(mr) && mr >= 0) body.mortgageRate = mr;
      const ay = parseFloat(amortizationYears);
      if (!Number.isNaN(ay) && ay >= 0) body.amortizationYears = ay;

      const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as AnalyzeResponse;
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Analysis failed");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setErr("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const r = data?.result;
  const conf = r?.confidence;
  const confColor =
    conf === "high" ? "text-emerald-300" : conf === "medium" ? "text-amber-200" : "text-slate-400";

  return (
    <div
      style={{
        ...cardStyle,
        border: `1px solid rgba(201, 169, 110, 0.25)`,
        background: "linear-gradient(145deg, rgba(201,169,110,0.08) 0%, rgba(15,15,15,0.95) 45%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 style={{ color: GOLD, marginBottom: 8, fontSize: "1.125rem", fontWeight: 700 }}>AI Deal Analyzer</h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, maxWidth: 520 }}>
            Get instant insights on affordability, potential returns, and deal quality.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Estimated monthly rent (optional)
          <input
            type="number"
            min={0}
            step={50}
            value={estimatedRent}
            onChange={(e) => setEstimatedRent(e.target.value)}
            placeholder="e.g. 2400"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Down payment % (optional)
          <input
            type="number"
            min={0}
            max={95}
            step={1}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(e.target.value)}
            placeholder="default 20"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Mortgage rate % (optional)
          <input
            type="number"
            min={0}
            step={0.1}
            value={mortgageRate}
            onChange={(e) => setMortgageRate(e.target.value)}
            placeholder="default 5.5"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Amortization years (optional)
          <input
            type="number"
            min={5}
            max={40}
            step={1}
            value={amortizationYears}
            onChange={(e) => setAmortizationYears(e.target.value)}
            placeholder="default 25"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={runAnalyze}
        disabled={loading}
        style={{
          ...buttonStyle,
          marginTop: 16,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Analyzing…" : "Analyze this deal"}
      </button>

      {err ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {err}
        </p>
      ) : null}

      {r ? (
        <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Deal insight score</p>
              <p className="text-3xl font-bold text-white">{r.score}</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
              <p className={`text-sm font-semibold capitalize ${confColor}`}>{r.confidence}</p>
            </div>
            <div className="min-w-[120px] flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${r.score}%`,
                    background: `linear-gradient(90deg, ${GOLD}, #e8d5a8)`,
                  }}
                />
              </div>
            </div>
          </div>

          {data?.assumptions?.priceIsIllustrative ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/90">
              Modeled price is illustrative (derived from listing data), not an appraisal.
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-slate-200">{r.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Est. down payment" value={r.metrics.estimatedDownPayment} prefix="$" />
            <Metric label="Monthly mortgage (est.)" value={r.metrics.monthlyMortgagePayment} prefix="$" />
            <Metric label="Monthly expenses (est.)" value={r.metrics.estimatedMonthlyExpenses} prefix="$" />
            <Metric label="Monthly cash flow (est.)" value={r.metrics.estimatedMonthlyCashFlow} prefix="$" signed />
            <Metric label="Gross yield (est.)" value={r.metrics.grossYield} suffix="%" />
          </div>

          {r.strengths.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">Strengths</p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-300">
                {r.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {r.riskFlags.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">Risk notes</p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-300">
                {r.riskFlags.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">
        Estimates are illustrative only and do not constitute financial, legal, or investment advice.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  prefix = "",
  suffix = "",
  signed = false,
}: {
  label: string;
  value: number | null;
  prefix?: string;
  suffix?: string;
  signed?: boolean;
}) {
  const display =
    value == null || !Number.isFinite(value)
      ? "—"
      : signed
        ? `${value > 0 ? "+" : ""}${prefix}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`
        : `${prefix}${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-white">{display}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 12,
  padding: 24,
};

const buttonStyle: CSSProperties = {
  padding: "14px 20px",
  background: GOLD,
  color: DARK,
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  maxWidth: 320,
  fontSize: 16,
};
