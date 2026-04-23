"use client";

import { analyzeDealDeterministic } from "@/lib/investor/deal-analyzer";
import { getAnalyzerAppUrl, getPlatformAppUrl } from "@/lib/platform-url";
import { useState } from "react";

export function AIDealAnalyzerSection() {
  const [price, setPrice] = useState("1250000");
  const [rent, setRent] = useState("4200");
  const [expenses, setExpenses] = useState("18000");
  const [show, setShow] = useState(false);
  const analyzerUrl = getAnalyzerAppUrl();
  const platformUrl = getPlatformAppUrl();

  const result =
    show &&
    analyzeDealDeterministic({
      purchasePrice: Number(price) || 0,
      monthlyRent: Number(rent) || 0,
      annualExpenses: Number(expenses) || 0,
      vacancyRatePct: 5,
    });

  return (
    <section id="ai-deal-analyzer" className="border-y border-white/[0.06] bg-[#0c0c0c] py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-serif text-3xl text-white md:text-4xl">AI Deal Analyzer</h2>
        <p className="mt-4 text-[#CCCCCC]">
          Analyze ROI, cash flow, and investment potential instantly
        </p>
        <p className="mt-2 text-sm text-[#CCCCCC]/60">
          Illustrative estimates only — not financial advice.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-xl rounded-2xl border border-white/[0.08] bg-[#111] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[#CCCCCC]/70">Property Price</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0B0B0B] px-4 py-3 text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[#CCCCCC]/70">Monthly Rent</span>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0B0B0B] px-4 py-3 text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[#CCCCCC]/70">Estimated Expenses (annual)</span>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0B0B0B] px-4 py-3 text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => setShow(true)}
            className="w-full rounded-lg bg-[#D4AF37] py-3.5 text-sm font-semibold text-[#0B0B0B] transition hover:bg-[#D4AF37]"
          >
            Analyze Deal
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-xl border border-[#0F3D2E]/60 bg-[#0F3D2E]/20 p-6 text-left">
            <p className="text-xs uppercase tracking-wider text-[#D4AF37]">Results (illustrative)</p>
            <ul className="mt-4 space-y-2 text-sm text-[#CCCCCC]">
              <li>
                ROI (yield-style): <span className="text-white">{result.roiPct.toFixed(2)}%</span>
              </li>
              <li>
                Cash flow (annual):{" "}
                <span className="text-white">${Math.round(result.cashFlowAnnual).toLocaleString()}</span>
              </li>
              <li>
                Investment rating:{" "}
                <span className="text-[#D4AF37] capitalize">{result.verdict}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-[#CCCCCC]/50">Powered by advanced analytics</p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-xl px-6 text-center">
        <a
          href={analyzerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-lg border border-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          Open Full Analyzer
          <span className="ml-2 text-[10px] uppercase tracking-widest text-[#CCCCCC]/70">External app ↗</span>
        </a>
        <p className="mt-3 text-xs text-[#CCCCCC]/50">
          Opens our full investor workspace on the platform:{" "}
          <span className="break-all text-[#CCCCCC]/70">{platformUrl}</span>
        </p>
      </div>
    </section>
  );
}
