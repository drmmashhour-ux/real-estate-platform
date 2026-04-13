"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolLeadForm } from "@/components/tools/ToolLeadForm";
import { LegalDisclaimerBlock } from "@/components/tools/ToolShell";

/** Annual tax from Quebec-style rates: dollars per $100 of municipal assessment. */
function annualFromRatePer100(assessed: number, ratePer100: number): number {
  if (!Number.isFinite(assessed) || assessed <= 0 || !Number.isFinite(ratePer100) || ratePer100 < 0) return 0;
  return (assessed / 100) * ratePer100;
}

export function MunicipalitySchoolTaxClient() {
  const [city, setCity] = useState("");
  const [assessedValue, setAssessedValue] = useState(400_000);
  const [municipalPer100, setMunicipalPer100] = useState(0);
  const [schoolPer100, setSchoolPer100] = useState(0);

  useEffect(() => {
    void fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "municipality_school_tax", eventType: "view" }),
    }).catch(() => {});
  }, []);

  const municipalAnnual = useMemo(
    () => annualFromRatePer100(assessedValue, municipalPer100),
    [assessedValue, municipalPer100]
  );
  const schoolAnnual = useMemo(
    () => annualFromRatePer100(assessedValue, schoolPer100),
    [assessedValue, schoolPer100]
  );
  const totalAnnual = municipalAnnual + schoolAnnual;
  const monthly = totalAnnual / 12;

  const toolInputs = useMemo(
    () => ({
      city: city.trim() || undefined,
      assessedValue,
      municipalRatePer100: municipalPer100,
      schoolRatePer100: schoolPer100,
    }),
    [city, assessedValue, municipalPer100, schoolPer100]
  );

  const toolOutputs = useMemo(
    () => ({
      municipalAnnualCents: Math.round(municipalAnnual * 100),
      schoolAnnualCents: Math.round(schoolAnnual * 100),
      totalAnnualCents: Math.round(totalAnnual * 100),
    }),
    [municipalAnnual, schoolAnnual, totalAnnual]
  );

  async function trackCta(kind: string) {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "municipality_school_tax", eventType: kind, city: city.trim() || undefined }),
    }).catch(() => {});
  }

  async function downloadPdf() {
    const rows = [
      { label: "Municipality / area", value: city.trim() || "—" },
      { label: "Assessed value (municipal roll)", value: `$${assessedValue.toLocaleString()}` },
      { label: "Municipal rate ($ / $100)", value: municipalPer100.toFixed(4) },
      { label: "School tax rate ($ / $100)", value: schoolPer100.toFixed(4) },
      { label: "Estimated municipal tax (annual)", value: `$${municipalAnnual.toFixed(2)}` },
      { label: "Estimated school tax (annual)", value: `$${schoolAnnual.toFixed(2)}` },
      { label: "Total property taxes (annual)", value: `$${totalAnnual.toFixed(2)}` },
      { label: "Average per month (approx.)", value: `$${monthly.toFixed(2)}` },
    ];
    const res = await fetch("/api/tools/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Municipality & school tax — estimate",
        rows,
        disclaimer:
          "Estimate only. Use the rates shown on your municipal tax bill or city website. Not legal or tax advice.",
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecipm-municipality-school-tax-estimate.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Inputs</h2>
        <p className="text-xs leading-relaxed text-slate-400">
          In Québec, tax bills often show rates as <strong className="text-slate-300">dollars per $100 of assessment</strong>{" "}
          (valeur au rôle). Enter the municipal and school portions from your bill or your city&apos;s schedule — they
          change by year and sector.
        </p>
        <label className="block text-sm text-slate-400">
          Municipality / area (optional)
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Laval, Montréal — Ahuntsic"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Municipal assessment ($)
          <input
            type="number"
            min={0}
            step={1000}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={assessedValue}
            onChange={(e) => setAssessedValue(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Municipal tax rate ($ per $100 of assessment)
          <input
            type="number"
            min={0}
            step={0.0001}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={municipalPer100}
            onChange={(e) => setMunicipalPer100(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm text-slate-400">
          School tax rate ($ per $100 of assessment)
          <input
            type="number"
            min={0}
            step={0.0001}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={schoolPer100}
            onChange={(e) => setSchoolPer100(Number(e.target.value))}
          />
        </label>
        <p className="text-xs text-amber-200/80">
          Water, stormwater, or special borough charges are not included. Verify totals with your municipality or school
          service centre.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-black/80 to-[#1a1508] p-6">
          <h2 className="text-lg font-semibold text-premium-gold">Estimated annual taxes</h2>
          <p className="mt-4 text-4xl font-bold text-white">${totalAnnual.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">
            ~${monthly.toFixed(2)} / month (simple ÷12 — your city may bill in instalments differently)
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <span>Municipal portion</span>
              <span className="font-medium text-white">${municipalAnnual.toFixed(2)}</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <span>School tax portion</span>
              <span className="font-medium text-white">${schoolAnnual.toFixed(2)}</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void downloadPdf()}
          className="rounded-lg border border-premium-gold/50 px-4 py-2 text-sm text-premium-gold"
        >
          Download PDF
        </button>

        <ToolLeadForm leadType="municipality_tax_lead" toolInputs={toolInputs} toolOutputs={toolOutputs} />

        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-sm font-medium text-white">Next steps</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/contact"
              onClick={() => void trackCta("cta_callback")}
              className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
            >
              Talk to an expert
            </a>
            <a
              href="/tools/welcome-tax"
              onClick={() => void trackCta("cta_welcome_tax")}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Welcome tax estimator
            </a>
          </div>
        </div>
        <LegalDisclaimerBlock />
      </div>
    </div>
  );
}
