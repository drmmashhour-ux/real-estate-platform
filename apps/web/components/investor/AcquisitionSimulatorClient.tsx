"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type UnderwritingResultShape = {
  monthlyRevenue: number;
  annualRevenue: number;
  annualCost: number;
  cashFlowMonthly: number;
  roi: number;
  capRate: number;
  breakEvenOccupancy: number;
  methodologyNote: string;
};

export type AcquisitionAnalysisResponse = {
  assumptions: Record<string, unknown>;
  result: UnderwritingResultShape;
  scenarios: Record<
    string,
    {
      label: string;
      description: string;
      deltas: Record<string, number>;
      result: UnderwritingResultShape;
    }
  >;
  score: number;
  recommendation: string;
  confidenceScore: number;
  disclaimer: string;
};

type Props = {
  variant?: "dashboard" | "portal";
};

function scenarioRisk(result: UnderwritingResultShape) {
  return result.cashFlowMonthly < 0 || result.roi < 0;
}

export function AcquisitionSimulatorClient({ variant = "dashboard" }: Props) {
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
  const [data, setData] = useState<AcquisitionAnalysisResponse | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const shell = variant === "portal" ? "mx-auto max-w-4xl" : "mx-auto max-w-4xl";
  const panel = variant === "portal" ? "border-white/10 bg-white/[0.03]" : "border-zinc-800 bg-zinc-950/50";
  const input = variant === "portal" ? "border-white/15 bg-black/40 text-white" : "border-zinc-700 bg-black px-3 py-2 text-white";

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

      const json = (await res.json()) as {
        success?: boolean;
        analysis?: AcquisitionAnalysisResponse;
        id?: string;
        error?: string;
      };
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
    <div className={`${shell} space-y-6 p-0`}>
      {variant === "dashboard" ? (
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
      ) : null}

      <div
        className={`rounded-xl border p-4 text-sm ${
          variant === "portal" ? "border-amber-900/35 bg-amber-950/15 text-amber-100/90" : "border-amber-900/40 bg-amber-950/20 text-amber-100/90"
        }`}
      >
        <p className={variant === "portal" ? "font-medium text-amber-200" : "font-medium text-amber-200"}>
          Assumptions vs outputs
        </p>
        <p className="mt-2 opacity-90">
          You supply purchase price, ADR, occupancy, and operating cost. Revenue uses{" "}
          <code className="rounded bg-black/30 px-1">ADR × occupancy × 30</code> per month (static proxy). Scenario bands apply
          fixed deltas — no AI, no hidden comps. Financing fields are stored for audit only until debt service is modeled.
        </p>
      </div>

      <div className={`grid gap-4 rounded-xl border p-4 md:grid-cols-2 ${panel}`}>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Title (optional)</span>
          <input className={`mt-1 w-full rounded border px-3 py-2 ${input}`} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Location (optional)</span>
          <input
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Purchase price</span>
          <input
            type="number"
            min={0}
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>ADR (avg nightly, same currency)</span>
          <input type="number" min={0} className={`mt-1 w-full rounded border px-3 py-2 ${input}`} value={adr} onChange={(e) => setAdr(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Occupancy (0–100 or 0–1)</span>
          <input
            type="number"
            min={0}
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={occupancyPct}
            onChange={(e) => setOccupancyPct(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Monthly operating cost</span>
          <input
            type="number"
            min={0}
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>
            Financing rate (optional APR — informational only today)
          </span>
          <input
            type="number"
            min={0}
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={financingAprPct}
            onChange={(e) => setFinancingAprPct(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>Down payment (optional)</span>
          <input
            type="number"
            min={0}
            className={`mt-1 w-full rounded border px-3 py-2 ${input}`}
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
          variant === "portal"
            ? "border border-premium-gold/40 bg-premium-gold/15 text-premium-gold hover:bg-premium-gold/25"
            : "bg-white text-black"
        }`}
      >
        {loading ? "Running…" : "Run analysis & save"}
      </button>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {savedId ? (
        <p className={`text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>
          Saved analysis id: <code className={variant === "portal" ? "text-slate-400" : "text-zinc-400"}>{savedId}</code>
        </p>
      ) : null}

      {data ? (
        <div className={`space-y-6 border p-4 ${variant === "portal" ? "border-white/10 bg-black/25" : "border-zinc-800 bg-zinc-950/40"}`}>
          <p className={`text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>{data.disclaimer}</p>

          {data.result.cashFlowMonthly < 0 ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-100">
              <p className="font-semibold">Negative monthly cash flow under your baseline assumptions</p>
              <p className="mt-1 opacity-90">
                Operating costs exceed modeled gross for this occupancy/ADR — results are shown transparently and are not hidden.
              </p>
            </div>
          ) : null}

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
            <span className={`text-sm ${variant === "portal" ? "text-slate-400" : "text-zinc-400"}`}>
              Score {data.score} · Confidence {Math.round(data.confidenceScore * 100)}%
            </span>
          </div>

          <div>
            <h2 className={`text-sm font-semibold ${variant === "portal" ? "text-white" : "text-white"}`}>Baseline outputs</h2>
            <p className={`mt-1 text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>{data.result.methodologyNote}</p>
            <ul className={`mt-3 grid gap-2 text-sm md:grid-cols-2 ${variant === "portal" ? "text-slate-300" : "text-zinc-300"}`}>
              <li>Monthly revenue (proxy): {data.result.monthlyRevenue}</li>
              <li>Annual revenue (proxy): {data.result.annualRevenue}</li>
              <li>Annual operating cost (your input ×12): {data.result.annualCost}</li>
              <li className={data.result.cashFlowMonthly < 0 ? "font-semibold text-red-300" : ""}>
                Cash flow / month: {data.result.cashFlowMonthly}
              </li>
              <li>ROI (simple, vs purchase): {(data.result.roi * 100).toFixed(2)}%</li>
              <li>Cap rate (simple): {(data.result.capRate * 100).toFixed(2)}%</li>
              <li>Break-even occupancy (model): {(data.result.breakEvenOccupancy * 100).toFixed(1)}%</li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Scenarios (transparent deltas)</h2>
            <p className={`mt-1 text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>
              Compare rule-based sensitivities. Red outline indicates modeled cash-flow or ROI stress.
            </p>
            <div className="mt-3 space-y-4">
              {Object.entries(data.scenarios).map(([key, sc]) => {
                const stressed = scenarioRisk(sc.result);
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${
                      stressed
                        ? "border-red-900/55 bg-red-950/20"
                        : variant === "portal"
                          ? "border-white/10 bg-black/40"
                          : "border-zinc-800 bg-black/40"
                    }`}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{sc.label}</p>
                        <p className={`text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>{sc.description}</p>
                      </div>
                      <div className={`text-right text-xs ${variant === "portal" ? "text-slate-400" : "text-zinc-400"}`}>
                        ROI {(sc.result.roi * 100).toFixed(2)}% · CF/mo {sc.result.cashFlowMonthly}
                      </div>
                    </div>
                    <ul className={`mt-2 grid gap-1 text-xs md:grid-cols-3 ${variant === "portal" ? "text-slate-400" : "text-zinc-400"}`}>
                      <li>Annual revenue: {sc.result.annualRevenue}</li>
                      <li>Break-even occ.: {(sc.result.breakEvenOccupancy * 100).toFixed(1)}%</li>
                      <li className={sc.result.cashFlowMonthly < 0 ? "text-red-300" : ""}>
                        Cash flow / mo: {sc.result.cashFlowMonthly}
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <details className={`text-xs ${variant === "portal" ? "text-slate-500" : "text-zinc-500"}`}>
            <summary className={`cursor-pointer ${variant === "portal" ? "text-slate-400" : "text-zinc-400"}`}>
              Raw assumptions JSON
            </summary>
            <pre className={`mt-2 overflow-x-auto rounded p-3 ${variant === "portal" ? "bg-black/50 text-slate-400" : "bg-black text-zinc-400"}`}>
              {JSON.stringify(data.assumptions, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
