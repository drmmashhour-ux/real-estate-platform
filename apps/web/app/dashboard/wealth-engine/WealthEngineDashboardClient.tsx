"use client";

import { useMemo, useState } from "react";
import type { AllocationBucketKey, RiskBand, WealthProfile } from "@/modules/wealth-engine/wealth.types";
import {
  compareCurrentVsTarget,
  DEFAULT_BUCKET_LABELS,
  identifyOverconcentration,
  suggestTargetAllocation,
} from "@/modules/wealth-engine/allocation.service";
import { createDefaultWealthProfile } from "@/modules/wealth-engine/default-wealth-profile";
import { allocateNewLiquidity, generateReinvestmentPlan } from "@/modules/wealth-engine/reinvestment.service";
import { buildPreservationSnapshot } from "@/modules/wealth-engine/preservation.service";
import { simulateWealthScenarios } from "@/modules/wealth-engine/scenario.service";
import { ALLOCATION_BUCKET_KEYS } from "@/modules/wealth-engine/wealth.types";

function formatMoney(cents: number): string {
  if (!Number.isFinite(cents)) return "—";
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    dollars
  );
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function WealthEngineDashboardClient() {
  const [profile, setProfile] = useState<WealthProfile>(() => createDefaultWealthProfile());
  const [newLiquidityDollars, setNewLiquidityDollars] = useState("250000");
  const [scenarioTab, setScenarioTab] = useState<"CONSERVATIVE" | "BALANCED" | "AGGRESSIVE">("BALANCED");

  const comparisons = useMemo(() => compareCurrentVsTarget(profile), [profile]);
  const targets = useMemo(() => suggestTargetAllocation(profile), [profile]);
  const over = useMemo(() => identifyOverconcentration(profile), [profile]);
  const preservation = useMemo(() => buildPreservationSnapshot(profile), [profile]);
  const plan = useMemo(() => generateReinvestmentPlan(profile), [profile]);
  const scenarios = useMemo(() => simulateWealthScenarios(profile), [profile]);
  const activeScenario = scenarios.find((s) => s.mode === scenarioTab) ?? scenarios[1];

  const liquiditySteps = useMemo(() => {
    const n = Number.parseFloat(newLiquidityDollars.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return [];
    return allocateNewLiquidity(Math.round(n * 100), profile);
  }, [newLiquidityDollars, profile]);

  const updateBucket = (key: AllocationBucketKey, field: "currentWeight" | "targetWeight", value: number) => {
    setProfile((p) => ({
      ...p,
      buckets: p.buckets.map((b) => (b.key === key ? { ...b, [field]: Math.max(0, Math.min(1, value)) } : b)),
    }));
  };

  const normalizeCurrent = () => {
    setProfile((p) => {
      const sum = p.buckets.reduce((s, b) => s + b.currentWeight, 0);
      if (sum <= 0) return p;
      return {
        ...p,
        buckets: p.buckets.map((b) => ({ ...b, currentWeight: b.currentWeight / sum })),
      };
    });
  };

  const setRiskBand = (riskBand: RiskBand) => {
    setProfile((p) => ({ ...p, riskBand }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-amber-500/20 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Educational scenario lab</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Multi-decade wealth engine</h1>
        <div
          role="note"
          className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm leading-relaxed text-amber-100/90"
        >
          <strong className="text-amber-200">Not financial advice.</strong> This dashboard runs illustrative,
          user-configured scenarios only. It does not recommend securities, predict returns, or replace tax, legal, or
          investment professionals.
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
          <h2 className="text-lg font-medium text-white">Capital allocation (configurable)</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Adjust current weights; use <span className="text-zinc-300">Normalize current</span> so they sum to 100%.
            Targets follow your risk band unless you select Custom.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["CONSERVATIVE", "BALANCED", "AGGRESSIVE", "CUSTOM"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setRiskBand(b)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  profile.riskBand === b
                    ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/50"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {b === "CUSTOM" ? "Custom targets" : b.toLowerCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={normalizeCurrent}
              className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Normalize current
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {ALLOCATION_BUCKET_KEYS.map((key) => {
              const bucket = profile.buckets.find((b) => b.key === key)!;
              const targetRow = targets.find((t) => t.key === key)!;
              return (
                <div key={key} className="grid gap-2 sm:grid-cols-[1fr,1fr] sm:items-center">
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{bucket.label ?? DEFAULT_BUCKET_LABELS[key]}</div>
                    <div className="text-xs text-zinc-500">Target (strategic): {pct(targetRow.targetWeight)}</div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex flex-1 items-center gap-2 text-xs text-zinc-400">
                      Current
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={bucket.currentWeight * 100}
                        onChange={(e) => updateBucket(key, "currentWeight", Number(e.target.value) / 100)}
                        className="h-1 flex-1 accent-amber-500"
                      />
                      <span className="w-14 tabular-nums text-zinc-200">{pct(bucket.currentWeight)}</span>
                    </label>
                    {profile.riskBand === "CUSTOM" && (
                      <label className="flex flex-1 items-center gap-2 text-xs text-zinc-400">
                        Target
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={bucket.targetWeight * 100}
                          onChange={(e) => updateBucket(key, "targetWeight", Number(e.target.value) / 100)}
                          className="h-1 flex-1 accent-zinc-400"
                        />
                        <span className="w-14 tabular-nums text-zinc-200">{pct(bucket.targetWeight)}</span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium text-white">Profile context</h2>
            <label className="mt-3 block text-xs text-zinc-500">
              Total wealth (USD, illustrative)
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.totalWealthCents / 100}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    totalWealthCents: Math.max(0, Math.round(Number(e.target.value) * 100)),
                  }))
                }
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-500">
              Reserve runway (months, self-reported)
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.liquidity.monthsOfReserveCoverage}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    liquidity: { ...p.liquidity, monthsOfReserveCoverage: Math.max(0, Number(e.target.value)) },
                  }))
                }
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-500">
              Liquid fraction (0–1)
              <input
                type="number"
                step={0.01}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.liquidity.liquidFraction}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    liquidity: {
                      ...p.liquidity,
                      liquidFraction: Math.max(0, Math.min(1, Number(e.target.value))),
                    },
                  }))
                }
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-500">
              Primary venture weight (0–1, optional)
              <input
                type="number"
                step={0.01}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.primaryVentureWeight ?? ""}
                placeholder="e.g. 0.35"
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    primaryVentureWeight:
                      e.target.value === "" ? undefined : Math.max(0, Math.min(1, Number(e.target.value))),
                  }))
                }
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-500">
              Primary market / region (awareness only)
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.primaryMarketRegion ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, primaryMarketRegion: e.target.value || undefined }))}
              />
            </label>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium text-white">Reserve & preservation</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>
                Runway (reported):{" "}
                <span className="tabular-nums text-amber-200/90">{preservation.liquidityRunwayMonths} mo</span>
              </li>
              <li>
                Liquid share: <span className="tabular-nums text-amber-200/90">{pct(preservation.liquidFraction)}</span>
              </li>
              <li>
                Downside sensitivity (band):{" "}
                <span className="text-amber-200/90">{preservation.downsideSensitivityLabel}</span>
              </li>
              <li>Single-company dependency flag: {preservation.dependencyOnSingleCompany ? "Yes" : "No"}</li>
              <li>Single-market label supplied: {preservation.dependencyOnSingleMarket ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Current vs illustrative target</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">Bucket</th>
                <th className="pb-2 pr-4">Target</th>
                <th className="pb-2 pr-4">Current</th>
                <th className="pb-2">Gap (current − target)</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {comparisons.map((row) => (
                <tr key={row.bucketKey} className="border-t border-zinc-800/80">
                  <td className="py-2 pr-4">{DEFAULT_BUCKET_LABELS[row.bucketKey]}</td>
                  <td className="py-2 pr-4 tabular-nums">{pct(row.targetWeight)}</td>
                  <td className="py-2 pr-4 tabular-nums">{pct(row.currentWeight)}</td>
                  <td className={`py-2 tabular-nums ${row.gap > 0.05 ? "text-amber-300" : "text-zinc-400"}`}>
                    {pct(row.gap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Concentration awareness</h2>
        {over.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No illustrative concentration flags at current thresholds.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {over.map((f, i) => (
              <li
                key={`${f.bucketKey}-${i}`}
                className={`rounded-lg border px-3 py-2 ${
                  f.severity === "ELEVATED"
                    ? "border-amber-500/40 bg-amber-950/30 text-amber-100"
                    : "border-zinc-700 bg-zinc-950/50 text-zinc-300"
                }`}
              >
                <span className="text-xs font-semibold uppercase text-zinc-500">{f.severity}</span>
                <p className="mt-1">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">Illustrative reinvestment plan</h2>
          <p className="mt-1 text-xs text-zinc-500">Ordering only: reserve → operating → diversification sleeves.</p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-300">
            {plan.steps.map((s) => (
              <li key={s.priority}>
                <span className="font-medium text-zinc-200">{DEFAULT_BUCKET_LABELS[s.bucketKey]}:</span> {s.label}
                {s.suggestedWeightDelta != null && (
                  <span className="ml-2 text-xs text-zinc-500">(~{pct(s.suggestedWeightDelta)} shift)</span>
                )}
              </li>
            ))}
          </ol>
          <ul className="mt-4 space-y-1 text-xs text-zinc-500">
            {plan.rationaleNotes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-white">New liquidity (hypothetical)</h2>
          <label className="mt-2 block text-xs text-zinc-500">
            Amount (USD)
            <input
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              value={newLiquidityDollars}
              onChange={(e) => setNewLiquidityDollars(e.target.value)}
            />
          </label>
          {liquiditySteps.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Enter a positive amount to see an illustrative split.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {liquiditySteps.map((s) => (
                <li key={s.priority} className="flex justify-between gap-4 border-b border-zinc-800/80 py-2">
                  <span>
                    {s.priority}. {DEFAULT_BUCKET_LABELS[s.bucketKey]} — {s.label}
                  </span>
                  {s.suggestedAmountCents != null && (
                    <span className="shrink-0 tabular-nums text-amber-200/90">
                      {formatMoney(s.suggestedAmountCents)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-white">Long-horizon scenarios (narrative)</h2>
        <p className="mt-1 text-sm text-zinc-500">No simulated returns — assumptions and discussion prompts only.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.mode}
              type="button"
              onClick={() => setScenarioTab(s.mode)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                scenarioTab === s.mode
                  ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/50"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {s.mode.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Assumptions</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {activeScenario.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-200">Allocation discussion themes</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              {activeScenario.allocationImpacts.map((l) => (
                <li key={l.bucketKey}>
                  <span className="font-medium text-zinc-300">{DEFAULT_BUCKET_LABELS[l.bucketKey]}:</span>{" "}
                  {l.illustrativeShiftDescription}
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold text-zinc-200">Resilience notes</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {activeScenario.resilienceNotes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
