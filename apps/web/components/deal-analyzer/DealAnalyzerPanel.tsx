"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeDeal, type DealAnalyzerMode } from "@/lib/ai/deal-analyzer";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/trackEvent";

const STORAGE_PREFIX = "lecipm-deal-analysis";

export type DealAnalyzerPanelProps = {
  listingId: string;
  priceCents: number;
  city: string;
  /** Display label e.g. FSBO / condo */
  propertyType?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  /** Pre-computed welcome tax (CAD), same source as compare snapshot */
  welcomeTaxDollars: number;
};

function buyerFeatureScore(beds: number | null, baths: number | null, sq: number | null): number {
  const b = beds ?? 0;
  const ba = baths ?? 0;
  const s = sq ?? 0;
  const raw = b + ba * 0.5 + s / 800;
  return Math.min(1, Math.max(0, raw / 8));
}

function classificationBadgeClass(id: string): string {
  switch (id) {
    case "excellent":
      return "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";
    case "good":
      return "border-[#C9A646]/50 bg-[#C9A646]/10 text-[#E8C547]";
    case "average":
      return "border-white/20 bg-white/5 text-slate-200";
    case "risky":
      return "border-red-500/40 bg-red-950/30 text-red-200";
    default:
      return "border-white/15 bg-black/40 text-slate-300";
  }
}

export function DealAnalyzerPanel({
  listingId,
  priceCents,
  city,
  propertyType = "FSBO / private sale",
  bedrooms,
  bathrooms,
  surfaceSqft,
  welcomeTaxDollars,
}: DealAnalyzerPanelProps) {
  const price = priceCents / 100;
  const [mode, setMode] = useState<DealAnalyzerMode>("investor");
  const [rent, setRent] = useState(Math.max(100, Math.round(price * 0.004)));
  const [rate, setRate] = useState(5.49);
  const [downPct, setDownPct] = useState(20);
  const [amort, setAmort] = useState(25);
  const [vacancy, setVacancy] = useState(5);

  const storageKey = `${STORAGE_PREFIX}:${listingId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const j = JSON.parse(raw) as Record<string, unknown>;
      if (typeof j.rent === "number") setRent(j.rent);
      if (typeof j.rate === "number") setRate(j.rate);
      if (typeof j.downPct === "number") setDownPct(j.downPct);
      if (typeof j.amort === "number") setAmort(j.amort);
      if (typeof j.vacancy === "number") setVacancy(j.vacancy);
      if (j.mode === "buyer" || j.mode === "investor") setMode(j.mode);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const down = (price * downPct) / 100;

  const analysis = useMemo(() => {
    return analyzeDeal({
      purchasePrice: price,
      rentEstimate: rent,
      propertyTaxAnnual: price * 0.012,
      condoFeesAnnual: 0,
      insuranceAnnual: 1200,
      managementAnnual: 0,
      repairsReserveAnnual: price * 0.01,
      otherAnnualExpenses: 0,
      otherMonthlyExpenses: 0,
      interestRate: rate,
      downPayment: down,
      amortizationYears: amort,
      vacancyRatePercent: vacancy,
      closingCosts: 7500,
      welcomeTax: welcomeTaxDollars,
      locationCity: city,
      propertyType,
      mode,
      buyerFeatureScore: buyerFeatureScore(bedrooms, bathrooms, surfaceSqft),
    });
  }, [
    price,
    rent,
    rate,
    down,
    amort,
    vacancy,
    welcomeTaxDollars,
    city,
    propertyType,
    mode,
    bedrooms,
    bathrooms,
    surfaceSqft,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      trackEvent(AnalyticsEvents.DEAL_ANALYSIS_RUN, {
        listingId,
        score: analysis.dealScore,
        recommendation: analysis.classificationLabel,
        surface: "listing_panel",
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [listingId, analysis.dealScore, analysis.classificationLabel]);

  const save = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rent,
          rate,
          downPct,
          amort,
          vacancy,
          mode,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [storageKey, rent, rate, downPct, amort, vacancy, mode]);

  const { metrics, classification, classificationLabel, dealScore, explanation, disclaimer, opportunities, riskLevel } =
    analysis;

  return (
    <section className="rounded-2xl border border-[#C9A646]/25 bg-gradient-to-b from-[#121212] to-black p-6 shadow-lg shadow-black/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A646]">AI Deal Analysis</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Investment snapshot</h2>
          <p className="mt-1 text-xs text-slate-500">Rule-based estimate — not advice.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("investor")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === "investor" ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"
            }`}
          >
            Investor
          </button>
          <button
            type="button"
            onClick={() => setMode("buyer")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === "buyer" ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"
            }`}
          >
            Buyer
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-400">
          Rent (mo) — estimate
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-400">
          Rate % — estimate
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-400">
          Down payment %
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-400">
          Amortization (years)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
            value={amort}
            onChange={(e) => setAmort(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-400 sm:col-span-2">
          Vacancy % (estimate)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
            value={vacancy}
            onChange={(e) => setVacancy(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#C9A646]/30 bg-black/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Deal score (estimate)</p>
          <p className="mt-1 text-2xl font-bold text-[#C9A646]">{dealScore}/100</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">ROI % (Y1 est.)</p>
          <p className="mt-1 text-2xl font-bold text-white">{metrics.roiPercent.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Cash flow / mo (est.)</p>
          <p className="mt-1 text-2xl font-bold text-white">${metrics.monthlyCashFlow.toFixed(0)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classificationBadgeClass(classification)}`}
        >
          {classificationLabel}
        </span>
        <span className="text-xs text-slate-500">
          Cap rate (est.): <strong className="text-slate-300">{metrics.capRatePercent.toFixed(2)}%</strong> · CoC (est.):{" "}
          <strong className="text-slate-300">{metrics.cashOnCashPercent.toFixed(2)}%</strong>
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">{explanation.summary}</p>

      {explanation.strengths.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-200/90">
          {explanation.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}
      {explanation.risks.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200/90">
          {explanation.risks.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">
        Risk level (heuristic):{" "}
        <span className="font-semibold capitalize text-slate-300">{riskLevel}</span>
      </p>

      {opportunities.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-[#C9A646]">Opportunity insights (illustrative)</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {opportunities.map((o) => (
              <li key={o.id}>
                <span className="font-medium text-white">{o.label}</span> — {o.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-lg border border-[#C9A646]/60 bg-[#C9A646]/10 px-4 py-2 text-sm font-semibold text-[#E8C547] hover:bg-[#C9A646]/20"
        >
          Save assumptions
        </button>
        <p className="text-xs text-slate-500 self-center">Revisit anytime on this device.</p>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-black/30 px-3 py-2 text-xs text-slate-500">
        <strong className="text-slate-400">Deal alerts (coming soon):</strong> notify when a listing matches your ROI
        and cash-flow criteria — infrastructure placeholder only.
      </div>

      <p className="mt-4 text-[11px] leading-snug text-slate-500">{disclaimer}</p>
    </section>
  );
}
