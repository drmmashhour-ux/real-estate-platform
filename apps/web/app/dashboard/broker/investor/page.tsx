"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import ScenarioPanel from "@/components/investor/ScenarioPanel";

/** Client-safe slice of analysis row returned from API */
type AnalysisResult = {
  id: string;
  monthlyRentCents: number | null;
  otherMonthlyIncomeCents: number | null;
  monthlyTaxesCents: number | null;
  monthlyInsuranceCents: number | null;
  monthlyMaintenanceCents: number | null;
  monthlyVacancyCents: number | null;
  monthlyManagementCents: number | null;
  monthlyUtilitiesCents: number | null;
  monthlyOtherExpensesCents: number | null;
  monthlyMortgageCents: number | null;
  monthlyCashflowCents: number | null;
  annualCashflowCents: number | null;
  capRate: number | null;
  grossRentMultiplier: number | null;
  cashOnCashReturn: number | null;
  roiPercent: number | null;
  dscr: number | null;
  breakEvenOccupancy: number | null;
  aiSummary: string | null;
};

export default function InvestorCalculatorPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAnalysis() {
    setBusy(true);
    setError(null);
    try {
      const created = await fetch("/api/investor/cases/create", {
        method: "POST",
        body: JSON.stringify({
          title: "Sample Investment Analysis",
          city: "Laval",
          propertyType: "multi_unit",
          purchasePriceCents: 65_000_000,
          downPaymentCents: 13_000_000,
          loanAmountCents: 52_000_000,
          annualInterestRate: 0.055,
          amortizationYears: 25,
          monthlyRentCents: 520_000,
          monthlyTaxesCents: 70_000,
          monthlyInsuranceCents: 15_000,
          monthlyMaintenanceCents: 35_000,
          monthlyVacancyCents: 25_000,
          monthlyManagementCents: 30_000,
        }),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());

      if (!created?.item?.id) {
        setError(created?.error ?? "Create failed");
        return;
      }

      const computed = await fetch("/api/investor/cases/compute", {
        method: "POST",
        body: JSON.stringify({ caseId: created.item.id }),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());

      if (!computed?.item) {
        setError(computed?.error ?? "Compute failed");
        return;
      }

      setResult(computed.item as AnalysisResult);
    } finally {
      setBusy(false);
    }
  }

  const chartData = result
    ? [
        { name: "Monthly Income", value: ((result.monthlyRentCents ?? 0) + (result.otherMonthlyIncomeCents ?? 0)) / 100 },
        {
          name: "Monthly Expenses",
          value:
            ((result.monthlyTaxesCents ?? 0) +
              (result.monthlyInsuranceCents ?? 0) +
              (result.monthlyMaintenanceCents ?? 0) +
              (result.monthlyVacancyCents ?? 0) +
              (result.monthlyManagementCents ?? 0) +
              (result.monthlyUtilitiesCents ?? 0) +
              (result.monthlyOtherExpensesCents ?? 0)) /
            100,
        },
        { name: "Mortgage", value: (result.monthlyMortgageCents ?? 0) / 100 },
        { name: "Cashflow", value: (result.monthlyCashflowCents ?? 0) / 100 },
      ]
    : [];

  const radarData = result
    ? [
        { metric: "Cap %", value: Math.min(100, Math.max(0, (result.capRate ?? 0) * 100)) },
        { metric: "CoC %", value: Math.min(100, Math.max(0, (result.cashOnCashReturn ?? 0) * 100)) },
        { metric: "ROI %", value: Math.min(100, Math.max(0, (result.roiPercent ?? 0) * 100)) },
        { metric: "DSCR×25", value: Math.min(100, Math.max(0, (result.dscr ?? 0) * 25)) },
        { metric: "Headroom %", value: Math.min(100, Math.max(0, (1 - (result.breakEvenOccupancy ?? 0)) * 100)) },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div>
        <h1 className="text-3xl font-bold text-[#D4AF37]">Investor Calculator Suite</h1>
        <p className="text-white/60 max-w-2xl">
          Cashflow, ROI, cap rate, DSCR, break-even occupancy, and AI investment interpretation. Advisory only — not investment
          advice.
        </p>
        <div className="mt-2 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500 border border-amber-500/20">
          Private investment opportunity (not a regulated fund)
        </div>
      </div>

      <button
        type="button"
        onClick={() => void runAnalysis()}
        disabled={busy}
        className="px-4 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold disabled:opacity-50"
      >
        {busy ? "Running…" : "Run Sample Analysis"}
      </button>

      {error ? <p className="text-amber-200/90 text-sm">{error}</p> : null}

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Monthly Cashflow"
              value={((result.monthlyCashflowCents ?? 0) / 100).toFixed(2)}
            />
            <MetricCard
              title="Annual Cashflow"
              value={((result.annualCashflowCents ?? 0) / 100).toFixed(2)}
            />
            <MetricCard title="Cap Rate" value={`${((result.capRate ?? 0) * 100).toFixed(2)}%`} />
            <MetricCard title="GRM" value={(result.grossRentMultiplier ?? 0).toFixed(2)} />
            <MetricCard
              title="Cash-on-Cash"
              value={`${((result.cashOnCashReturn ?? 0) * 100).toFixed(2)}%`}
            />
            <MetricCard title="DSCR" value={(result.dscr ?? 0).toFixed(2)} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-lg text-[#D4AF37] mb-3">Monthly Structure</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a1a1aa" }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-lg text-[#D4AF37] mb-3">Investment Metric Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#71717a" }} />
                  <Radar name="Score" dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.35} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ScenarioPanel caseId={result.id} />

          <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
            <div className="text-lg font-semibold text-[#D4AF37]">AI Investor Summary</div>
            <div className="mt-3 text-sm text-white/70 whitespace-pre-wrap">
              {result.aiSummary ?? "No summary generated yet."}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-2 text-xl font-semibold text-[#D4AF37]">{value}</div>
    </div>
  );
}
