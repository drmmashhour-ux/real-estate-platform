"use client";

import { useMemo, useState } from "react";
import type { RenoclimatEligibilityResult } from "@/modules/green-ai/renoclimat/renoclimat.types";
import { GREEN_DOCUMENT_DISCLAIMER } from "@/modules/green-ai/documents/document.types";
import { DownloadGreenReportButton } from "@/components/green/DownloadGreenReportButton";

function badgeClass(level: RenoclimatEligibilityResult["eligibilityLevel"]) {
  switch (level) {
    case "HIGH":
      return "bg-emerald-500/25 text-emerald-100 ring-emerald-400/40";
    case "MEDIUM":
      return "bg-amber-500/20 text-amber-100 ring-amber-400/35";
    default:
      return "bg-slate-600/30 text-slate-300 ring-white/15";
  }
}

export function RenoclimatPotentialChecker({ defaultLocation = "Montreal, Quebec" }: { defaultLocation?: string }) {
  const [propertyType, setPropertyType] = useState("house");
  const [yearBuilt, setYearBuilt] = useState<number | "">("");
  const [heatingType, setHeatingType] = useState("");
  const [insulationQuality, setInsulationQuality] = useState<string>("average");
  const [windowsQuality, setWindowsQuality] = useState<string>("double");
  const [locationRegion, setLocationRegion] = useState(defaultLocation);
  const [surfaceSqft, setSurfaceSqft] = useState<number | "">("");
  const [windowCount, setWindowCount] = useState<number | "">("");
  const [propertyValue, setPropertyValue] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RenoclimatEligibilityResult | null>(null);
  const [financial, setFinancial] = useState<{
    heading: string;
    totalCad: number;
    breakdown: { upgrade: string; amount: string }[];
    disclaimer: string;
    roiNote: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/green/renoclimat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType,
          yearBuilt: yearBuilt === "" ? undefined : yearBuilt,
          heatingType: heatingType || undefined,
          insulationQuality,
          windowsQuality,
          locationRegion,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        setResult(null);
        return;
      }
      setResult(json.renoclimatPotential as RenoclimatEligibilityResult);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/25 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/95">Rénoclimat Potential</p>
          <p className="mt-1 text-sm text-slate-400">
            Modeled incentive headroom for Québec residential retrofits — not an official decision.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-500">
          Property type
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="duplex">Duplex / plex</option>
          </select>
        </label>
        <label className="block text-xs text-slate-500">
          Year built
          <input
            type="number"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 1985"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-500 sm:col-span-2">
          Heating (describe)
          <input
            value={heatingType}
            onChange={(e) => setHeatingType(e.target.value)}
            placeholder="e.g. oil furnace, electric baseboard, heat pump"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-500">
          Insulation
          <select
            value={insulationQuality}
            onChange={(e) => setInsulationQuality(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="poor">Poor</option>
            <option value="average">Average</option>
            <option value="good">Good</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="block text-xs text-slate-500">
          Windows
          <select
            value={windowsQuality}
            onChange={(e) => setWindowsQuality(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple_high_performance">Triple / high-performance</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="block text-xs text-slate-500 sm:col-span-2">
          Location (Québec)
          <input
            value={locationRegion}
            onChange={(e) => setLocationRegion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={busy}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Estimate potential"}
        </button>
        <DownloadGreenReportButton tier="basic" payload={reportPayload} />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{GREEN_DOCUMENT_DISCLAIMER}</p>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      {result ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(result.eligibilityLevel)}`}>
              {result.eligibilityLevel} potential
            </span>
            <span className="text-sm text-slate-400">
              Modeled pathway:{" "}
              <span className="font-medium text-white">{result.eligible ? "May align with evaluation" : "Limited modeled scope"}</span>
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-cyan-100/95">{result.headline}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
            {result.reasons.map((r, i) => (
              <li key={`${i}-${r.slice(0, 48)}`}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">Suggested next steps</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-slate-400">
            {result.recommendedActions.map((r, i) => (
              <li key={`${i}-${r.slice(0, 40)}`}>{r}</li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{result.disclaimer}</p>

          {financial ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/95">{financial.heading}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-emerald-100">
                ~${financial.totalCad.toLocaleString("en-CA")} CAD
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Sum of illustrative midpoints — not a quote.</p>
              <ul className="mt-4 space-y-2">
                {financial.breakdown.map((row) => (
                  <li
                    key={row.upgrade}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-2 text-sm last:border-0"
                  >
                    <span className="text-slate-300">{row.upgrade}</span>
                    <span className="font-medium text-emerald-200/95">{row.amount}</span>
                  </li>
                ))}
              </ul>
              {financial.roiNote ? <p className="mt-3 text-xs text-slate-500">{financial.roiNote}</p> : null}
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{financial.disclaimer}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
