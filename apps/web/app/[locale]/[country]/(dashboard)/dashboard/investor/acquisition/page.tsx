"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type AnalysisResponse = {
  assumptions: Record<string, unknown>;
  result: {
    monthlyRevenue: number;
    annualRevenue: number;
    annualCost: number;
    cashFlowMonthly: number;
    roi: number;
    capRate: number;
    breakEvenOccupancy: number;
    methodologyNote: string;
  };
  scenarios: Record<
    string,
    {
      label: string;
      description: string;
      deltas: Record<string, number>;
      result: AnalysisResponse["result"];
    }
  >;
  score: number;
  recommendation: string;
  confidenceScore: number;
  disclaimer: string;
};

export default function AcquisitionSimulatorPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const country = typeof params?.country === "string" ? params.country : "ca";
  const [purchasePrice, setPurchasePrice] = useState("400000");
  const [adr, setAdr] = useState("180");
  const [occupancyPct, setOccupancyPct] = useState("70");
  const [monthlyCost, setMonthlyCost] = useState("2000");
  const [financingAprPct, setFinancingAprPct] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setSavedId(null);
    try {
      const occ = Number(occupancyPct);
      const occupancyRate = occ > 1 ? occ / 100 : occ;

      const payload: Record<string, unknown> = {
        purchasePrice: Number(purchasePrice),
        adr: Number(adr),
        occupancyRate,
        monthlyCost: Number(monthlyCost),
        title: title || undefined,
        location: location || undefined,
      };

      if (financingAprPct.trim()) {
        const apr = Number(financingAprPct);
        payload.financingRate = apr > 1 ? apr / 100 : apr;
      }
      if (downPayment.trim()) {
        payload.downPayment = Number(downPayment);
      }

      const res = await fetch("/api/investment/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { success?: boolean; analysis?: AnalysisResponse; id?: string; error?: string };
      if (!res.ok) {
        throw new Error(json.error || res.statusText);
      }
      if (json.analysis) {
        setData(json.analysis);
        setSavedId(json.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Acquisition simulator</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Deterministic BNHub-style math from <strong className="text-zinc-400">your assumptions only</strong>. Not a
            forecast, not guaranteed returns.
          </p>
        </div>
        <Link href={`/${locale}/${country}/dashboard/investor`} className="text-sm text-amber-500 hover:underline">
          ← Investor dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">Assumptions vs outputs</p>
        <p className="mt-2 text-amber-100/80">
          You supply purchase price, ADR, occupancy, and operating cost. The engine applies a fixed formula (ADR × occupancy ×
          30 for monthly revenue). Scenario bands apply transparent deltas — no hidden AI or market comps.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-400">Title (optional)</span>
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Location (optional)</span>
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Purchase price</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">ADR (avg nightly, same currency as price)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={adr}
            onChange={(e) => setAdr(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Occupancy (0–100 or 0–1)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={occupancyPct}
            onChange={(e) => setOccupancyPct(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Monthly operating cost</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Financing rate (optional APR, e.g. 6.5 or 0.065 — stored only for now)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={financingAprPct}
            onChange={(e) => setFinancingAprPct(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Down payment (optional)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-3 py-2 text-white"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Running…" : "Run analysis & save"}
      </button>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {savedId ? (
        <p className="text-xs text-zinc-500">
          Saved analysis id: <code className="text-zinc-400">{savedId}</code>
        </p>
      ) : null}

      {data ? (
        <div className="space-y-6 border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs text-zinc-500">{data.disclaimer}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                data.recommendation === "buy"
                  ? "bg-emerald-900/40 text-emerald-300"
                  : data.recommendation === "reject"
                    ? "bg-red-900/40 text-red-300"
                    : "bg-amber-900/40 text-amber-200"
              }`}
            >
              {data.recommendation}
            </span>
            <span className="text-sm text-zinc-400">
              Score {data.score} · Confidence {Math.round(data.confidenceScore * 100)}%
            </span>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Baseline outputs</h2>
            <p className="mt-1 text-xs text-zinc-500">{data.result.methodologyNote}</p>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
              <li>Monthly revenue (proxy): {data.result.monthlyRevenue}</li>
              <li>Annual revenue (proxy): {data.result.annualRevenue}</li>
              <li>Annual operating cost (your input ×12): {data.result.annualCost}</li>
              <li>Cash flow / month: {data.result.cashFlowMonthly}</li>
              <li>ROI (simple, vs purchase): {(data.result.roi * 100).toFixed(2)}%</li>
              <li>Cap rate (simple): {(data.result.capRate * 100).toFixed(2)}%</li>
              <li>Break-even occupancy (model): {(data.result.breakEvenOccupancy * 100).toFixed(1)}%</li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Scenarios (transparent deltas)</h2>
            <div className="mt-3 space-y-4">
              {Object.entries(data.scenarios).map(([key, sc]) => (
                <div key={key} className="rounded-lg border border-zinc-800 bg-black/40 p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{sc.label}</p>
                      <p className="text-xs text-zinc-500">{sc.description}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-400">
                      ROI {(sc.result.roi * 100).toFixed(2)}% · CF/mo {sc.result.cashFlowMonthly}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer text-zinc-400">Raw assumptions JSON</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-black p-3 text-zinc-400">
              {JSON.stringify(data.assumptions, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
