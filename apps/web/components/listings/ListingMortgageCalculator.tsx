"use client";

import { useMemo, useState } from "react";
import { monthlyMortgagePayment, totalInterestPaid } from "@/lib/buyer/mortgage-math";

type Props = {
  listPriceCents: number;
};

export function ListingMortgageCalculator({ listPriceCents }: Props) {
  const listPrice = listPriceCents / 100;
  const [downPct, setDownPct] = useState(10);
  const [rate, setRate] = useState(5.24);
  const [years, setYears] = useState(25);

  const principal = useMemo(() => {
    const d = Math.min(95, Math.max(5, downPct));
    return Math.max(0, listPrice * (1 - d / 100));
  }, [listPrice, downPct]);

  const monthly = useMemo(
    () =>
      monthlyMortgagePayment({
        principal,
        annualInterestPercent: rate,
        amortizationYears: years,
      }),
    [principal, rate, years]
  );

  const interestTotal = useMemo(
    () => totalInterestPaid(principal, rate, years),
    [principal, rate, years]
  );

  const totalCost = principal + interestTotal;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-6" aria-labelledby="mortgage-calc-heading">
      <h2 id="mortgage-calc-heading" className="text-lg font-semibold text-white">
        Mortgage calculator
      </h2>
      <p className="mt-1 text-xs text-slate-500">Adjust inputs — numbers update instantly.</p>

      <div className="mt-6 space-y-5">
        <label className="block text-sm">
          <span className="text-slate-400">Down payment (%)</span>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-2 w-full accent-premium-gold"
          />
          <div className="mt-1 text-xs text-slate-500">{downPct}% · ${(listPrice * (downPct / 100)).toLocaleString("en-CA", { maximumFractionDigits: 0 })} down</div>
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Interest rate (% per year)</span>
          <input
            type="number"
            step={0.01}
            min={0}
            max={25}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Amortization (years)</span>
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          >
            {[15, 20, 25, 30].map((y) => (
              <option key={y} value={y}>
                {y} years
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-8 grid gap-3 rounded-xl border border-slate-800 bg-black/30 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Loan amount</dt>
          <dd className="font-semibold text-white">${principal.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Monthly payment</dt>
          <dd className="font-semibold text-premium-gold">${monthly.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Total interest (approx.)</dt>
          <dd className="text-slate-200">${Math.round(interestTotal).toLocaleString("en-CA")}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="text-slate-400">Total cost (principal + interest)</dt>
          <dd className="font-medium text-slate-100">${Math.round(totalCost).toLocaleString("en-CA")}</dd>
        </div>
      </dl>
    </section>
  );
}
