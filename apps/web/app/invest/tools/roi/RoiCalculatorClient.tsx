"use client";

import { useEffect, useMemo, useState } from "react";
import { computeRoi, type RoiInputs } from "@/lib/invest/roi";
import { ToolLeadForm } from "@/components/tools/ToolLeadForm";
import { LegalDisclaimerBlock } from "@/components/tools/ToolShell";

function Tip({ label, text }: { label: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <span title={text} className="cursor-help text-premium-gold" aria-label={text}>
        ⓘ
      </span>
    </span>
  );
}

const DEFAULTS: RoiInputs = {
  purchasePrice: 450_000,
  downPayment: 90_000,
  mortgageInterestRate: 5.49,
  amortizationYears: 25,
  monthlyRent: 2400,
  vacancyRatePercent: 5,
  propertyTaxAnnual: 3200,
  condoFeesAnnual: 3600,
  insuranceAnnual: 1200,
  managementAnnual: 0,
  repairsReserveAnnual: 1800,
  closingCosts: 8000,
  welcomeTax: 6000,
  otherMonthlyExpenses: 0,
  otherAnnualExpenses: 0,
};

export function RoiCalculatorClient() {
  const [inputs, setInputs] = useState<RoiInputs>(DEFAULTS);

  useEffect(() => {
    void fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "roi", eventType: "view" }),
    }).catch(() => {});
  }, []);

  const out = useMemo(() => computeRoi(inputs), [inputs]);

  const toolInputs = useMemo(
    () => ({
      ...inputs,
    }),
    [inputs]
  );

  const toolOutputs = useMemo(
    () => ({
      grossAnnualIncome: out.grossAnnualIncome,
      grossYieldPercent: out.grossYieldPercent,
      capRatePercent: out.capRatePercent,
      cashOnCashPercent: out.cashOnCashPercent,
      annualCashFlow: out.annualCashFlow,
      monthlyCashFlow: out.monthlyCashFlow,
      roiPercent: out.roiPercent,
    }),
    [out]
  );

  function patch<K extends keyof RoiInputs>(key: K, v: number) {
    setInputs((s) => ({ ...s, [key]: v }));
  }

  async function trackCta(kind: string) {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "roi", eventType: kind, payload: { ts: Date.now() } }),
    }).catch(() => {});
  }

  async function downloadPdf() {
    const rows = [
      { label: "Purchase price", value: `$${inputs.purchasePrice.toLocaleString()}` },
      { label: "Down payment", value: `$${inputs.downPayment.toLocaleString()}` },
      { label: "Gross annual income (effective rent)", value: `$${out.grossAnnualIncome.toFixed(0)}` },
      { label: "Gross yield", value: `${out.grossYieldPercent.toFixed(2)}%` },
      { label: "Annual operating expenses", value: `$${out.annualOperatingExpenses.toFixed(0)}` },
      { label: "Annual debt service", value: `$${out.annualDebtService.toFixed(0)}` },
      { label: "Annual cash flow", value: `$${out.annualCashFlow.toFixed(0)}` },
      { label: "Monthly cash flow", value: `$${out.monthlyCashFlow.toFixed(0)}` },
      { label: "Cap rate (NOI / price)", value: `${out.capRatePercent.toFixed(2)}%` },
      { label: "Cash-on-cash return", value: `${out.cashOnCashPercent.toFixed(2)}%` },
      { label: "ROI (year 1, cash-on-cash)", value: `${out.roiPercent.toFixed(2)}%` },
    ];
    const res = await fetch("/api/tools/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "ROI calculator — estimate summary",
        rows,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecipm-roi-estimate.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Inputs</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {(
            [
              ["purchasePrice", "Purchase price", inputs.purchasePrice],
              ["downPayment", "Down payment", inputs.downPayment],
              ["mortgageInterestRate", "Mortgage rate % (annual)", inputs.mortgageInterestRate],
              ["amortizationYears", "Amortization (years)", inputs.amortizationYears],
              ["monthlyRent", "Monthly rent", inputs.monthlyRent],
              ["vacancyRatePercent", "Vacancy %", inputs.vacancyRatePercent],
              ["propertyTaxAnnual", "Property tax (annual)", inputs.propertyTaxAnnual],
              ["condoFeesAnnual", "Condo / maintenance (annual)", inputs.condoFeesAnnual],
              ["insuranceAnnual", "Insurance (annual)", inputs.insuranceAnnual],
              ["managementAnnual", "Management (annual)", inputs.managementAnnual],
              ["repairsReserveAnnual", "Repairs reserve (annual)", inputs.repairsReserveAnnual],
              ["closingCosts", "Closing costs (one-time)", inputs.closingCosts],
              ["welcomeTax", "Welcome tax (one-time)", inputs.welcomeTax],
              ["otherMonthlyExpenses", "Other monthly expenses", inputs.otherMonthlyExpenses],
              ["otherAnnualExpenses", "Other annual expenses", inputs.otherAnnualExpenses],
            ] as const
          ).map(([key, label, val]) => (
            <label key={key} className="block text-slate-400">
              {label}
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                value={val}
                onChange={(e) => patch(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-black/80 to-[#1a1508] p-6">
          <h2 className="text-lg font-semibold text-premium-gold">Results</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>Gross annual income</dt>
              <dd className="font-semibold text-white">${out.grossAnnualIncome.toFixed(0)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>
                <Tip label="Gross yield" text="Annual gross rent divided by purchase price — before expenses." />
              </dt>
              <dd className="font-semibold text-white">{out.grossYieldPercent.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>Annual operating expenses</dt>
              <dd className="font-semibold text-white">${out.annualOperatingExpenses.toFixed(0)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>Annual debt service</dt>
              <dd className="font-semibold text-white">${out.annualDebtService.toFixed(0)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>
                <Tip label="Cap rate" text="NOI (rent minus operating costs) divided by price — before financing." />
              </dt>
              <dd className="font-semibold text-white">{out.capRatePercent.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>
                <Tip
                  label="Cash flow"
                  text="NOI minus mortgage payments — what you keep before tax in this simplified model."
                />
              </dt>
              <dd className="font-semibold text-emerald-400">${out.annualCashFlow.toFixed(0)} / yr</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>Monthly cash flow</dt>
              <dd className="font-semibold text-emerald-400">${out.monthlyCashFlow.toFixed(0)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt>
                <Tip
                  label="Cash-on-cash return"
                  text="Annual pre-tax cash flow divided by total cash invested (down + closing + welcome tax here)."
                />
              </dt>
              <dd className="font-semibold text-white">{out.cashOnCashPercent.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4 pb-2">
              <dt>
                <Tip label="ROI % (year 1)" text="Shown as cash-on-cash return for the first year in this tool." />
              </dt>
              <dd className="text-xl font-bold text-premium-gold">{out.roiPercent.toFixed(2)}%</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Monthly mortgage: ${out.monthlyMortgagePayment.toFixed(2)} · Loan ${out.loanAmount.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadPdf()}
            className="rounded-lg border border-premium-gold/50 px-4 py-2 text-sm text-premium-gold"
          >
            Download PDF
          </button>
        </div>

        <ToolLeadForm leadType="investor_lead" toolInputs={toolInputs} toolOutputs={toolOutputs} />

        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-sm font-medium text-white">Talk to an expert</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/mortgage"
              onClick={() => void trackCta("cta_mortgage")}
              className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
            >
              Talk to mortgage expert
            </a>
            <a
              href="/contact"
              onClick={() => void trackCta("cta_callback")}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Request callback
            </a>
            <a
              href="/dashboard/broker"
              onClick={() => void trackCta("cta_broker")}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Talk to broker
            </a>
          </div>
        </div>

        <LegalDisclaimerBlock />
      </div>
    </div>
  );
}
