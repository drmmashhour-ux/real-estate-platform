"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  calculateDownPayment,
  calculateLoanAmount,
  calculateMonthlyMortgage,
  estimateMonthlyInsurance,
  estimateMonthlyTaxes,
  estimateTotalMonthlyCost,
} from "@/modules/mortgage/services/calculate-mortgage";
import { MAX_SCENARIOS, SCENARIO_PRESETS, type OfferScenario } from "@/modules/mortgage/services/types";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoClient } from "@/lib/demo-track-client";

const GOLD = "#C9A96E";
const DARK = "#0f0f0f";

function newScenarioId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function safePrice(n: number | null | undefined, fallback: number): number {
  if (n != null && Number.isFinite(n) && n > 0) return n;
  return fallback;
}

type Props = {
  listingId: string;
  /** Illustrative offer / list price in USD (same basis as Deal Analyzer when available). */
  defaultOfferPriceUsd: number | null | undefined;
};

export function MortgageSimulator({ listingId, defaultOfferPriceUsd }: Props) {
  const fallbackPrice = 500_000;
  const [offerPriceUsd, setOfferPriceUsd] = useState(() => safePrice(defaultOfferPriceUsd, fallbackPrice));
  const [annualPropertyTax, setAnnualPropertyTax] = useState("");
  const [monthlyCondoFees, setMonthlyCondoFees] = useState("");

  const [draftDown, setDraftDown] = useState(String(SCENARIO_PRESETS.conservative.downPaymentPercent));
  const [draftRate, setDraftRate] = useState(String(SCENARIO_PRESETS.conservative.interestRate));
  const [draftYears, setDraftYears] = useState(String(SCENARIO_PRESETS.conservative.amortizationYears));

  const [scenarios, setScenarios] = useState<OfferScenario[]>(() => [
    {
      id: newScenarioId(),
      downPaymentPercent: SCENARIO_PRESETS.conservative.downPaymentPercent,
      interestRate: SCENARIO_PRESETS.conservative.interestRate,
      amortizationYears: SCENARIO_PRESETS.conservative.amortizationYears,
    },
  ]);

  const usedTracked = useRef(false);

  useEffect(() => {
    setOfferPriceUsd(safePrice(defaultOfferPriceUsd, fallbackPrice));
  }, [defaultOfferPriceUsd]);

  useEffect(() => {
    if (usedTracked.current) return;
    usedTracked.current = true;
    trackDemoClient(DemoEvents.MORTGAGE_SIMULATOR_USED, { listingId });
  }, [listingId]);

  const annualTaxNum = useMemo(() => {
    const v = parseFloat(annualPropertyTax);
    return !Number.isNaN(v) && v >= 0 ? v : null;
  }, [annualPropertyTax]);

  const condoNum = useMemo(() => {
    const v = parseFloat(monthlyCondoFees);
    return !Number.isNaN(v) && v >= 0 ? v : null;
  }, [monthlyCondoFees]);

  type RowMetrics = {
    price: number;
    down: number | null;
    loan: number | null;
    mortgage: number | null;
    total: number | null;
  };

  const metricsById = useMemo(() => {
    const map = new Map<string, RowMetrics>();
    for (const s of scenarios) {
      const price = s.offerPrice ?? offerPriceUsd;
      const down = calculateDownPayment(price, s.downPaymentPercent);
      const loan = down != null ? calculateLoanAmount(price, down) : null;
      const mortgage =
        loan != null
          ? calculateMonthlyMortgage({
              principal: loan,
              annualRate: s.interestRate,
              amortizationYears: s.amortizationYears,
            })
          : null;
      const taxM = estimateMonthlyTaxes(annualTaxNum);
      const ins = estimateMonthlyInsurance(price);
      const total =
        mortgage != null
          ? estimateTotalMonthlyCost({
              monthlyMortgage: mortgage,
              monthlyPropertyTax: taxM,
              monthlyInsurance: ins,
              monthlyCondoFees: condoNum,
            })
          : null;
      map.set(s.id, { price, down, loan, mortgage, total });
    }
    return map;
  }, [scenarios, offerPriceUsd, annualTaxNum, condoNum]);

  const bestId = useMemo(() => {
    let best: { id: string; total: number } | null = null;
    for (const s of scenarios) {
      const m = metricsById.get(s.id);
      const t = m?.total;
      if (t != null && Number.isFinite(t)) {
        if (!best || t < best.total) best = { id: s.id, total: t };
      }
    }
    return best?.id ?? null;
  }, [scenarios, metricsById]);

  const applyPreset = (key: keyof typeof SCENARIO_PRESETS) => {
    const p = SCENARIO_PRESETS[key];
    setDraftDown(String(p.downPaymentPercent));
    setDraftRate(String(p.interestRate));
    setDraftYears(String(p.amortizationYears));
  };

  const addScenario = useCallback(() => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const dp = parseFloat(draftDown);
    const rate = parseFloat(draftRate);
    const years = parseFloat(draftYears);
    if (Number.isNaN(dp) || dp < 0 || dp > 100) return;
    if (Number.isNaN(rate) || rate < 0) return;
    if (Number.isNaN(years) || years <= 0) return;

    setScenarios((prev) => [
      ...prev,
      {
        id: newScenarioId(),
        downPaymentPercent: dp,
        interestRate: rate,
        amortizationYears: years,
      },
    ]);
    trackDemoClient(DemoEvents.SCENARIO_ADDED, {
      downPaymentPercent: dp,
      interestRate: rate,
    });
  }, [draftDown, draftRate, draftYears, scenarios.length]);

  const comparedRef = useRef<number>(0);
  useEffect(() => {
    const n = scenarios.length;
    if (n < 2) {
      comparedRef.current = n;
      return;
    }
    if (n !== comparedRef.current) {
      comparedRef.current = n;
      trackDemoClient(DemoEvents.SCENARIO_COMPARED, { scenarioCount: n });
    }
  }, [scenarios.length]);

  const updateScenario = (id: string, patch: Partial<OfferScenario>) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeScenario = (id: string) => {
    setScenarios((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const inputCls =
    "mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        padding: 24,
        border: "1px solid rgba(201, 169, 110, 0.25)",
        backgroundImage: "linear-gradient(145deg, rgba(201,169,110,0.06) 0%, rgba(15,15,15,0.95) 50%)",
      }}
    >
      <h3 style={{ color: GOLD, marginBottom: 8, fontSize: "1.125rem", fontWeight: 700 }}>Mortgage &amp; offer simulator</h3>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 16, maxWidth: 560 }}>
        Model monthly payments and compare a few offer structures side by side. Uses the same amortization math as the AI Deal
        Analyzer.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Offer price (USD)
          <input
            type="number"
            min={1}
            step={1000}
            value={offerPriceUsd}
            onChange={(e) => setOfferPriceUsd(safePrice(parseFloat(e.target.value), fallbackPrice))}
            className={inputCls}
          />
        </label>
        <label className="block text-xs text-slate-400" title="Spread annual property tax over 12 months for total carrying cost.">
          Annual property tax (optional)
          <input
            type="number"
            min={0}
            step={100}
            value={annualPropertyTax}
            onChange={(e) => setAnnualPropertyTax(e.target.value)}
            placeholder="e.g. 4800"
            className={inputCls}
          />
        </label>
        <label className="block text-xs text-slate-400">
          Monthly condo / HOA (optional)
          <input
            type="number"
            min={0}
            step={50}
            value={monthlyCondoFees}
            onChange={(e) => setMonthlyCondoFees(e.target.value)}
            placeholder="e.g. 350"
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Next scenario (draft)</p>
        <p className="mt-1 text-xs text-slate-500">
          <span title="Down payment affects your loan size.">Down payment %</span> ·{" "}
          <span title="Interest rate impacts your monthly cost.">Interest rate</span> · Amortization
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs text-slate-400">
            Down %
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={draftDown}
              onChange={(e) => setDraftDown(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Rate %
            <input
              type="number"
              min={0}
              step={0.05}
              value={draftRate}
              onChange={(e) => setDraftRate(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Years
            <input
              type="number"
              min={5}
              max={40}
              step={1}
              value={draftYears}
              onChange={(e) => setDraftYears(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("conservative")}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-slate-200 hover:border-[#C9A96E]/50"
          >
            {SCENARIO_PRESETS.conservative.label}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("aggressive")}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-slate-200 hover:border-[#C9A96E]/50"
          >
            {SCENARIO_PRESETS.aggressive.label}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("investor")}
            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-slate-200 hover:border-[#C9A96E]/50"
          >
            {SCENARIO_PRESETS.investor.label}
          </button>
          <span className="text-[10px] text-slate-600 self-center">— or quick fills:</span>
          <button
            type="button"
            onClick={() => {
              setDraftDown("20");
              setDraftRate("5.5");
              setDraftYears("25");
            }}
            className="rounded-lg border border-[#C9A96E]/30 px-3 py-1.5 text-xs text-[#C9A96E]"
          >
            20% Down
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftDown("10");
              setDraftRate("5.5");
              setDraftYears("25");
            }}
            className="rounded-lg border border-[#C9A96E]/30 px-3 py-1.5 text-xs text-[#C9A96E]"
          >
            10% Down
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftDown("25");
              setDraftRate("6");
              setDraftYears("30");
            }}
            className="rounded-lg border border-[#C9A96E]/30 px-3 py-1.5 text-xs text-[#C9A96E]"
          >
            Investor mode
          </button>
        </div>

        <button
          type="button"
          onClick={addScenario}
          disabled={scenarios.length >= MAX_SCENARIOS}
          style={{
            ...buttonStyle,
            marginTop: 12,
            opacity: scenarios.length >= MAX_SCENARIOS ? 0.45 : 1,
            cursor: scenarios.length >= MAX_SCENARIOS ? "not-allowed" : "pointer",
          }}
        >
          {scenarios.length >= MAX_SCENARIOS ? `Max ${MAX_SCENARIOS} scenarios` : "Add scenario"}
        </button>
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2">Scenario</th>
              <th className="py-2 pr-2">Down %</th>
              <th className="py-2 pr-2">Rate</th>
              <th className="py-2 pr-2">Yrs</th>
              <th className="py-2 pr-2">Monthly</th>
              <th className="py-2 pr-2">Total / mo</th>
              <th className="py-2 pr-2">Down $</th>
              <th className="py-2 pr-2">Loan</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, idx) => {
              const m = metricsById.get(s.id);
              const isBest = s.id === bestId && scenarios.length > 1;
              return (
                <tr
                  key={s.id}
                  className={`border-b border-white/5 ${isBest ? "bg-emerald-950/25" : ""}`}
                  style={
                    isBest
                      ? { boxShadow: `inset 0 0 0 1px rgba(201, 169, 110, 0.45)` }
                      : undefined
                  }
                >
                  <td className="py-2 pr-2 font-medium text-slate-200">
                    {idx + 1}
                    {isBest ? (
                      <span className="ml-2 rounded bg-[#C9A96E]/20 px-1.5 py-0.5 text-[10px] text-[#C9A96E]">Lowest total</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-16 rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.downPaymentPercent}
                      onChange={(e) =>
                        updateScenario(s.id, { downPaymentPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      className="w-16 rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.interestRate}
                      onChange={(e) =>
                        updateScenario(s.id, { interestRate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={5}
                      max={40}
                      step={1}
                      className="w-14 rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.amortizationYears}
                      onChange={(e) =>
                        updateScenario(s.id, { amortizationYears: parseFloat(e.target.value) || 1 })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2 font-mono text-slate-100">
                    {m?.mortgage != null ? `$${m.mortgage.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="py-2 pr-2 font-mono text-slate-100">
                    {m?.total != null ? `$${m.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="py-2 pr-2 font-mono text-slate-400">
                    {m?.down != null ? `$${m.down.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="py-2 pr-2 font-mono text-slate-400">
                    {m?.loan != null ? `$${m.loan.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      disabled={scenarios.length <= 1}
                      onClick={() => removeScenario(s.id)}
                      className="text-xs text-red-300/90 disabled:opacity-30 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {scenarios.map((s, idx) => {
          const m = metricsById.get(s.id);
          const isBest = s.id === bestId && scenarios.length > 1;
          return (
            <div
              key={`m-${s.id}`}
              className={`rounded-xl border p-4 ${isBest ? "border-[#C9A96E]/50 bg-black/35" : "border-white/10 bg-black/25"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">Scenario {idx + 1}</p>
                {isBest ? (
                  <span className="rounded bg-[#C9A96E]/20 px-2 py-0.5 text-[10px] text-[#C9A96E]">Lowest total</span>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Down %</dt>
                  <dd className="mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.downPaymentPercent}
                      onChange={(e) =>
                        updateScenario(s.id, { downPaymentPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rate %</dt>
                  <dd className="mt-1">
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      className="w-full rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.interestRate}
                      onChange={(e) =>
                        updateScenario(s.id, { interestRate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Years</dt>
                  <dd className="mt-1">
                    <input
                      type="number"
                      min={5}
                      max={40}
                      step={1}
                      className="w-full rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                      value={s.amortizationYears}
                      onChange={(e) =>
                        updateScenario(s.id, { amortizationYears: parseFloat(e.target.value) || 1 })
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Monthly</dt>
                  <dd className="font-mono text-white">
                    {m?.mortgage != null ? `$${m.mortgage.toFixed(0)}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Total / mo</dt>
                  <dd className="font-mono text-emerald-200/90">
                    {m?.total != null ? `$${m.total.toFixed(0)}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Down $</dt>
                  <dd className="font-mono text-slate-300">{m?.down != null ? `$${m.down.toFixed(0)}` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Loan</dt>
                  <dd className="font-mono text-slate-300">{m?.loan != null ? `$${m.loan.toFixed(0)}` : "—"}</dd>
                </div>
              </dl>
              <button
                type="button"
                disabled={scenarios.length <= 1}
                onClick={() => removeScenario(s.id)}
                className="mt-3 text-xs text-red-300/90 disabled:opacity-30"
              >
                Remove scenario
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/listings/${listingId}/offer`}
          onClick={() => {
            try {
              sessionStorage.setItem(
                `lcipm_offer_prefill_${listingId}`,
                JSON.stringify({
                  offeredPrice: offerPriceUsd,
                  scenario: {
                    offerPriceUsd,
                    annualPropertyTax,
                    monthlyCondoFees,
                    scenarios: scenarios.map((s) => ({
                      downPaymentPercent: s.downPaymentPercent,
                      interestRate: s.interestRate,
                      amortizationYears: s.amortizationYears,
                    })),
                  },
                })
              );
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center rounded-lg border border-[#C9A96E]/40 bg-black/30 px-4 py-2 text-sm font-semibold text-[#C9A96E] hover:border-[#C9A96E]/70"
        >
          Use in offer (prefill)
        </Link>
      </div>

      <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">
        Estimates are illustrative only and may vary based on lender terms, taxes, and insurance. Not financial advice.
      </p>
    </div>
  );
}

const buttonStyle: CSSProperties = {
  padding: "12px 18px",
  background: GOLD,
  color: DARK,
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  maxWidth: 280,
  fontSize: 14,
};
