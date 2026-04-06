"use client";

import { useMemo, useState } from "react";
import {
  estimatedGrossIncomeRequired,
  monthlyMortgagePayment,
  totalInterestPaid,
} from "@/lib/buyer/mortgage-math";

function money(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-CA")}`;
}

export function StandaloneMortgageCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(550000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(5.24);
  const [years, setYears] = useState(25);

  const metrics = useMemo(() => {
    const normalizedPrice = Math.max(0, purchasePrice);
    const normalizedDownPct = Math.min(95, Math.max(5, downPct));
    const principal = normalizedPrice * (1 - normalizedDownPct / 100);
    const monthly = monthlyMortgagePayment({
      principal,
      annualInterestPercent: rate,
      amortizationYears: years,
    });
    const totalInterest = totalInterestPaid(principal, rate, years);
    const annualIncomeNeeded = estimatedGrossIncomeRequired(monthly);

    return {
      principal,
      monthly,
      totalInterest,
      annualIncomeNeeded,
      cashDown: normalizedPrice * (normalizedDownPct / 100),
    };
  }, [purchasePrice, downPct, rate, years]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="finance-mortgage-calc">
      <h2 id="finance-mortgage-calc" className="text-xl font-semibold text-white">
        Mortgage calculator
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Estimate monthly payments, loan size, and rough income needed before you speak with a mortgage expert.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Purchase price (CAD)</span>
          <input
            type="number"
            min={0}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Down payment (%)</span>
          <input
            type="number"
            min={5}
            max={95}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Interest rate (%)</span>
          <input
            type="number"
            min={0}
            max={25}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Amortization (years)</span>
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          >
            {[15, 20, 25, 30].map((value) => (
              <option key={value} value={value}>
                {value} years
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Loan amount</p>
          <p className="mt-2 text-xl font-semibold text-white">{money(metrics.principal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Monthly payment</p>
          <p className="mt-2 text-xl font-semibold text-premium-gold">{money(metrics.monthly)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total interest</p>
          <p className="mt-2 text-xl font-semibold text-white">{money(metrics.totalInterest)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Estimated income needed</p>
          <p className="mt-2 text-xl font-semibold text-white">{money(metrics.annualIncomeNeeded)}/yr</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Illustrative only. Does not include taxes, condo fees, heating, insurance, or lender-specific underwriting.
      </p>
    </section>
  );
}
