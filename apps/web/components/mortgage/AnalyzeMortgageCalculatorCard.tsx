"use client";

import { useMemo, useState } from "react";
import { approximateMonthlyMortgagePayment } from "@/lib/investment/approx-mortgage";
import { formatCurrencyCAD } from "@/lib/investment/format";

function parsePrice(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Interactive P&amp;I ballpark for the analyze page — syncs purchase price from deal inputs.
 */
export function AnalyzeMortgageCalculatorCard({ propertyPrice }: { propertyPrice: string }) {
  const [ltvPercent, setLtvPercent] = useState(80);
  const [annualRatePercent, setAnnualRatePercent] = useState(5.5);
  const [years, setYears] = useState(25);

  const price = useMemo(() => parsePrice(propertyPrice), [propertyPrice]);

  const { monthly, loanAmount } = useMemo(() => {
    if (price === null) return { monthly: null as number | null, loanAmount: null as number | null };
    const ltv = Math.min(95, Math.max(1, ltvPercent)) / 100;
    const annualRate = Math.min(20, Math.max(0.1, annualRatePercent)) / 100;
    const y = Math.min(40, Math.max(5, Math.round(years)));
    const loan = price * ltv;
    return {
      monthly: approximateMonthlyMortgagePayment(price, { ltv, annualRate, years: y }),
      loanAmount: loan,
    };
  }, [price, ltvPercent, annualRatePercent, years]);

  const inputClass =
    "mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/45";

  return (
    <section
      id="mortgage-calculator"
      className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6"
      aria-labelledby="mortgage-calculator-heading"
    >
      <h2 id="mortgage-calculator-heading" className="text-lg font-semibold text-white">
        Mortgage payment calculator
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Principal &amp; interest only — uses your <strong className="text-slate-300">property price</strong> from deal
        inputs above. Not a rate guarantee or pre-approval.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="calc-ltv" className="text-sm font-medium text-slate-200">
            Loan-to-value (%)
          </label>
          <input
            id="calc-ltv"
            type="number"
            inputMode="decimal"
            min={1}
            max={95}
            step={1}
            value={ltvPercent}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLtvPercent(Number.isFinite(v) ? v : 80);
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="calc-rate" className="text-sm font-medium text-slate-200">
            Interest rate (% / year)
          </label>
          <input
            id="calc-rate"
            type="number"
            inputMode="decimal"
            min={0.1}
            max={20}
            step={0.05}
            value={annualRatePercent}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAnnualRatePercent(Number.isFinite(v) ? v : 5.5);
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="calc-amort" className="text-sm font-medium text-slate-200">
            Amortization (years)
          </label>
          <input
            id="calc-amort"
            type="number"
            inputMode="decimal"
            min={5}
            max={40}
            step={1}
            value={years}
            onChange={(e) => {
              const v = Number(e.target.value);
              setYears(Number.isFinite(v) ? v : 25);
            }}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-[#0B0B0B] p-5 text-center sm:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">Estimated P&amp;I / month</p>
        <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
          {monthly !== null ? formatCurrencyCAD(monthly) : "—"}
        </p>
        {loanAmount !== null && price !== null ? (
          <p className="mt-2 text-xs text-slate-400">
            Loan ≈ {formatCurrencyCAD(loanAmount)} on {formatCurrencyCAD(price)} purchase
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Enter a property price in deal inputs to see a payment estimate.</p>
        )}
      </div>
    </section>
  );
}
