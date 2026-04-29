"use client";

import { useCallback, useEffect, useState } from "react";
import { OPTIMIZATION_SCENARIOS } from "@/modules/roi/assumptions.constants";
import { RoiScenarioSelector } from "./RoiScenarioSelector";
import { RoiComparisonTable } from "./RoiComparisonTable";
import { RoiResultsCard } from "./RoiResultsCard";
import { RoiConfidenceNote } from "./RoiConfidenceNote";
import Link from "next/link";
import { trackFunnelEvent } from "@/lib/funnel/tracker-client";

type ApiResult = {
  ok: boolean;
  result?: {
    currentPlatform: { grossRevenueCents: number; feesPaidCents: number; netRevenueCents: number; feePercent: number };
    lecipm: {
      optimizedGrossRevenueCents: number;
      feesPaidCents: number;
      netRevenueCents: number;
      bookingFeePercent: number;
      subscriptionSpendAnnualCents: number;
      featuredSpendAnnualCents: number;
    };
    gain: { absoluteCents: number; percent: number | null };
    assumptions: { optimizationGainPercent: number; notes: string[] };
    confidence: string;
    disclaimers: string[];
  };
  error?: string;
};

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RoiCalculatorForm() {
  useEffect(() => {
    void trackFunnelEvent("roi_calculator_viewed", { surface: "host_roi_calculator" });
  }, []);

  const [nightly, setNightly] = useState("180");
  const [booked, setBooked] = useState("120");
  const [compFee, setCompFee] = useState("0.14");
  const [plan, setPlan] = useState<"free" | "pro" | "growth">("pro");
  const [scenario, setScenario] = useState<keyof typeof OPTIMIZATION_SCENARIOS>("standard");
  const [platformName, setPlatformName] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResult["result"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/roi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightlyRate: Number(nightly),
          bookedNightsPerYear: Number(booked),
          currentPlatformFeePercent: Number(compFee),
          lecipmPlanKey: plan,
          scenarioPreset: scenario,
          currentPlatformName: platformName.trim() || undefined,
        }),
      });
      const j = (await res.json()) as ApiResult;
      if (!res.ok || !j.ok || !j.result) {
        setErr(j.error ?? "Could not calculate");
        setData(null);
      } else {
        setData(j.result);
      }
    } catch {
      setErr("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [nightly, booked, compFee, plan, scenario, platformName]);

  const rows =
    data ?
      [
        { label: "Gross revenue (modeled year)", current: fmtMoney(data.currentPlatform.grossRevenueCents), lecipm: fmtMoney(data.lecipm.optimizedGrossRevenueCents) },
        { label: "Platform fees", current: fmtMoney(data.currentPlatform.feesPaidCents), lecipm: fmtMoney(data.lecipm.feesPaidCents) },
        { label: "Subscriptions + featured (annual)", current: "—", lecipm: fmtMoney(data.lecipm.subscriptionSpendAnnualCents + data.lecipm.featuredSpendAnnualCents) },
        { label: "Net to host (modeled)", current: fmtMoney(data.currentPlatform.netRevenueCents), lecipm: fmtMoney(data.lecipm.netRevenueCents) },
      ]
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-serif text-xl text-white">Your inputs</h2>
        <p className="text-sm text-slate-400">
          Estimate your net revenue difference — not a guarantee. Use your real OTA fee if known.
        </p>
        <label className="block text-sm text-slate-300">
          Average nightly rate (CAD)
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={nightly}
            onChange={(e) => setNightly(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Booked nights / year
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={booked}
            onChange={(e) => setBooked(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Current platform fee (decimal, e.g. 0.14 for 14%)
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={compFee}
            onChange={(e) => setCompFee(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Current platform name (optional)
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            placeholder="e.g. Airbnb"
          />
        </label>
        <label className="block text-sm text-slate-300">
          LECIPM plan
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={plan}
            onChange={(e) => setPlan(e.target.value as typeof plan)}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="growth">Growth</option>
          </select>
        </label>
        <div>
          <p className="text-sm text-slate-300">Optimization scenario (illustrative)</p>
          <div className="mt-2">
            <RoiScenarioSelector value={scenario} onChange={setScenario} />
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={run}
          className="w-full rounded-full bg-premium-gold py-3 font-semibold text-black transition hover:bg-[#E8D589] disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Estimate my net revenue difference"}
        </button>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
      </div>

      <div className="space-y-6">
        {data ? (
          <>
            <RoiResultsCard
              title="Modeled net gain (annual)"
              subtitle="Versus your modeled current platform net"
              gainLabel="Difference in host net (CAD)"
              gainAmount={fmtMoney(data.gain.absoluteCents)}
              gainPercent={
                data.gain.percent != null ? `${(data.gain.percent * 100).toFixed(1)}% vs current net` : null
              }
            />
            <RoiComparisonTable rows={rows} />
            <RoiConfidenceNote confidence={data.confidence} disclaimers={data.disclaimers} />
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-full border border-premium-gold/50 py-3 text-center text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
            >
              Continue to host onboarding
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Run the calculator to see a side-by-side modeled comparison. All figures are illustrative.
          </p>
        )}
      </div>
    </div>
  );
}
