"use client";

import { monthlyMortgagePayment, estimatedGrossIncomeRequired } from "@/lib/buyer/mortgage-math";

const DEFAULT_RATE = 5.24;
const AMORT_YEARS = 25;

type Props = {
  priceCents: number;
};

export function ListingFinancialSnapshot({ priceCents }: Props) {
  const price = priceCents / 100;
  const downOptions = [0.05, 0.1, 0.2] as const;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-premium-gold/40 bg-gradient-to-br from-[#1a1508] via-[#0f0f0f] to-[#0B0B0B] p-6 shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.12)]"
      aria-labelledby="financial-snapshot-heading"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-premium-gold/10 blur-3xl" />
      <p id="financial-snapshot-heading" className="text-[11px] font-bold uppercase tracking-[0.2em] text-premium-gold">
        Financial snapshot
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Illustrative only — rate {DEFAULT_RATE}% amortized over {AMORT_YEARS} years. Not a mortgage commitment.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {downOptions.map((pct) => {
          const down = price * pct;
          const principal = Math.max(0, price - down);
          const monthly = monthlyMortgagePayment({
            principal,
            annualInterestPercent: DEFAULT_RATE,
            amortizationYears: AMORT_YEARS,
          });
          const income = estimatedGrossIncomeRequired(monthly);
          return (
            <div key={pct} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold text-slate-400">{Math.round(pct * 100)}% down</p>
              <p className="mt-1 text-lg font-bold text-white">
                ${monthly.toLocaleString("en-CA", { maximumFractionDigits: 0 })}<span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                Est. income ≈ ${Math.round(income).toLocaleString("en-CA")}/yr gross
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
