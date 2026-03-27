"use client";

import { useMemo, useState } from "react";
import { LegalDisclaimerBlock } from "@/components/tools/ToolShell";

function parseNum(raw: string): number {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Monthly payment (Canadian-style monthly compounding is approximate). */
function monthlyMortgagePayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r <= 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function RoiCalculatorClient() {
  const [price, setPrice] = useState("450000");
  const [monthlyRent, setMonthlyRent] = useState("2200");
  const [monthlyExpenses, setMonthlyExpenses] = useState("450");
  const [downPct, setDownPct] = useState("20");
  const [ratePct, setRatePct] = useState("5.25");
  const [amortYears, setAmortYears] = useState("25");

  const metrics = useMemo(() => {
    const p = parseNum(price);
    const rent = parseNum(monthlyRent);
    const exp = parseNum(monthlyExpenses);
    const down = Math.min(100, Math.max(0, parseNum(downPct)));
    const r = parseNum(ratePct);
    const yrs = Math.max(1, Math.min(40, parseNum(amortYears)));

    if (p <= 0) {
      return {
        grossYield: null as number | null,
        capRate: null as number | null,
        cashOnCash: null as number | null,
        annualMortgage: 0,
        annualNoi: 0,
        cashDown: 0,
      };
    }

    const cashDown = (p * down) / 100;
    const loan = Math.max(0, p - cashDown);
    const pmt = monthlyMortgagePayment(loan, r, yrs);
    const annualRent = rent * 12;
    const annualExp = exp * 12;
    const annualMortgage = pmt * 12;
    const noi = annualRent - annualExp;
    const grossYield = (annualRent / p) * 100;
    const capRate = (noi / p) * 100;
    const annualCashFlow = noi - annualMortgage;
    const cashOnCash = cashDown > 0 ? (annualCashFlow / cashDown) * 100 : null;

    return {
      grossYield,
      capRate,
      cashOnCash,
      annualMortgage,
      annualNoi: noi,
      cashDown,
    };
  }, [price, monthlyRent, monthlyExpenses, downPct, ratePct, amortYears]);

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-400">
        Decision-intent calculator for rental-style math — cap rate, gross yield, and rough cash-on-cash after a simple
        mortgage model. Tune inputs to match your market.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Purchase price (CAD)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Monthly rent (CAD)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Monthly operating expenses (tax, insurance, condo, repairs — CAD)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Down payment (%)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={downPct}
            onChange={(e) => setDownPct(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Mortgage rate (% annual)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={ratePct}
            onChange={(e) => setRatePct(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Amortization (years)</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#C9A646]/50"
            value={amortYears}
            onChange={(e) => setAmortYears(e.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="rounded-xl border border-[#C9A646]/25 bg-black/30 p-6">
        <h2 className="text-lg font-medium text-white">Results</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li>
            Gross yield:{" "}
            <strong className="text-[#C9A646]">
              {metrics.grossYield != null ? `${metrics.grossYield.toFixed(2)}%` : "—"}
            </strong>
          </li>
          <li>
            Cap rate (NOI / price):{" "}
            <strong className="text-[#C9A646]">
              {metrics.capRate != null ? `${metrics.capRate.toFixed(2)}%` : "—"}
            </strong>
          </li>
          <li>
            Cash-on-cash (after mortgage):{" "}
            <strong className="text-[#C9A646]">
              {metrics.cashOnCash != null ? `${metrics.cashOnCash.toFixed(2)}%` : "—"}
            </strong>
          </li>
          <li className="text-slate-500">
            NOI (annual): ${metrics.annualNoi.toFixed(0)} · Mortgage (annual): ${metrics.annualMortgage.toFixed(0)} ·
            Cash down: ${metrics.cashDown.toFixed(0)}
          </li>
        </ul>
      </div>

      <LegalDisclaimerBlock />
    </div>
  );
}
