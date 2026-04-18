"use client";

import { useState } from "react";

export function ROIWidget() {
  const [nightly, setNightly] = useState(150);
  const [occ, setOcc] = useState(0.65);
  const [nightsAvail] = useState(365);
  const [compFee, setCompFee] = useState(0.15);
  const [plan, setPlan] = useState<"free" | "pro" | "growth">("pro");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/roi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightlyRate: nightly,
          occupancyRate: occ,
          availableNightsPerYear: nightsAvail,
          currentPlatformFeePercent: compFee,
          lecipmPlanKey: plan,
          currentPlatformName: "Other platform (your input)",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOut(data.result);
    } catch (e) {
      setOut(null);
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-slate-200">
      <h2 className="text-lg font-semibold text-white">Host ROI (model)</h2>
      <p className="mt-1 text-xs text-slate-500">Estimates only — not a guarantee. Competitor fee is your input.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-500">
          Nightly ($)
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            value={nightly}
            onChange={(e) => setNightly(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-500">
          Occupancy (0–1)
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            value={occ}
            onChange={(e) => setOcc(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-500">
          Competitor fee (0–0.5)
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            value={compFee}
            onChange={(e) => setCompFee(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-500">
          LECIPM plan
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            value={plan}
            onChange={(e) => setPlan(e.target.value as "free" | "pro" | "growth")}
          >
            <option value="free">free</option>
            <option value="pro">pro</option>
            <option value="growth">growth</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "…" : "Calculate"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
      {out ? (
        <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
