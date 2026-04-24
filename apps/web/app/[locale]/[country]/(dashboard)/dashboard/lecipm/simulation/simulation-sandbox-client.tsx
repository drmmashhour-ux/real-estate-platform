"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

import { SignalCard, SignalCardSkeleton } from "@/components/lecipm-ui/SignalCard";
import type { AutopilotLevel, SavedScenarioListItem, ScenarioInput, WhatIfResult } from "@/modules/simulation/simulation.types";

const defaultScenario: ScenarioInput = {
  leadVolumeMultiplier: 1,
  responseSpeedChange: 0,
  pricingAdjustment: 0,
  marketingBoost: 0,
  trustThresholdChange: 0,
  autopilotLevel: 1,
  regionKey: null,
};

export function SimulationSandboxClient(props: { cityOptions: Array<{ id: string; name: string }> }) {
  const { cityOptions } = props;
  const [scenario, setScenario] = useState<ScenarioInput>(defaultScenario);
  const [name, setName] = useState("My scenario");
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [scenarios, setScenarios] = useState<SavedScenarioListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/simulation/scenarios", { credentials: "same-origin" });
      const data = (await res.json()) as { scenarios?: SavedScenarioListItem[] };
      if (res.ok && data.scenarios) setScenarios(data.scenarios);
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(scenario),
      });
      const data = (await res.json()) as { error?: string } & WhatIfResult;
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setError(null);
    const res = await fetch("/api/admin/simulation/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, ...scenario }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      setError(b.error ?? "Save failed");
      return;
    }
    await loadList();
  };

  const compareOther = useMemo(
    () => scenarios.find((s) => s.id === compareId)?.lastResult ?? null,
    [scenarios, compareId],
  );

  return (
    <div className="min-h-screen bg-[#030303] px-4 py-8 text-[#f4efe4]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-[#1c1c1c] pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/90">What-if engine</p>
          <h1 className="mt-2 font-serif text-3xl">Marketplace simulation sandbox</h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-500">
            All numbers below are <strong className="text-[#D4AF37]">simulated</strong> from read-only baselines. Nothing
            here changes live marketplace rules, prices, or CRM rows until adopted through governed flows (e.g. AI CEO
            queue).
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <section className="rounded-xl border border-[#1e1e1e] bg-[#080808] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Scenario controls</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Slider
                  label="Lead volume multiplier"
                  hint="Models demand into pipeline (read-only base)."
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={scenario.leadVolumeMultiplier}
                  onChange={(n) => setScenario((s) => ({ ...s, leadVolumeMultiplier: n }))}
                />
                <Slider
                  label="Response speed (negative = faster)"
                  hint="Effect on conversion and dispute risk."
                  min={-0.5}
                  max={0.5}
                  step={0.02}
                  value={scenario.responseSpeedChange}
                  onChange={(n) => setScenario((s) => ({ ...s, responseSpeedChange: n }))}
                />
                <Slider
                  label="Pricing / take adjustment"
                  hint="Fractional change to modeled revenue mix."
                  min={-0.2}
                  max={0.2}
                  step={0.01}
                  value={scenario.pricingAdjustment}
                  onChange={(n) => setScenario((s) => ({ ...s, pricingAdjustment: n }))}
                />
                <Slider
                  label="Marketing boost"
                  min={0}
                  max={1}
                  step={0.02}
                  value={scenario.marketingBoost}
                  onChange={(n) => setScenario((s) => ({ ...s, marketingBoost: n }))}
                />
                <Slider
                  label="Trust threshold shift (points)"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={scenario.trustThresholdChange}
                  onChange={(n) => setScenario((s) => ({ ...s, trustThresholdChange: n }))}
                />
                <div>
                  <p className="text-xs text-neutral-500">Autopilot level (0–3)</p>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={scenario.autopilotLevel}
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, autopilotLevel: Number(e.target.value) as AutopilotLevel }))
                    }
                    className="mt-2 w-full accent-[#D4AF37]"
                  />
                  <p className="text-sm text-neutral-300">{scenario.autopilotLevel}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-500" htmlFor="region">
                    Region / city (optional — filters label; uses your baseline)
                  </label>
                  <select
                    id="region"
                    className="mt-2 w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-[#f4efe4]"
                    value={scenario.regionKey ?? ""}
                    onChange={(e) => setScenario((s) => ({ ...s, regionKey: e.target.value || null }))}
                  >
                    <option value="">— Default (profile city) —</option>
                    {cityOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void run()}
                  disabled={loading}
                  className="rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Running…" : "Run simulation"}
                </button>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-w-[12rem] rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-2 text-sm"
                  placeholder="Scenario name"
                />
                <button
                  type="button"
                  onClick={() => void save()}
                  className="rounded-full border border-[#D4AF37]/40 px-5 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Save scenario
                </button>
              </div>
            </section>

            {error ?
              <p className="text-sm text-red-400">{error}</p>
            : null}

            {loading ?
              <div className="grid gap-4 md:grid-cols-2">
                <SignalCardSkeleton />
                <SignalCardSkeleton />
              </div>
            : result ?
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Predicted results (simulated)</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <SignalCard
                    title="Revenue (modeled % change)"
                    value={`${result.predictedMetrics.revenueChangePct > 0 ? "+" : ""}${result.predictedMetrics.revenueChangePct}%`}
                    delta={`Confidence: ${result.confidenceLevel}`}
                    deltaDirection={result.predictedMetrics.revenueChangePct >= 0 ? "up" : "down"}
                    severity="INFO"
                    explanation={result.predictedMetrics.narrative}
                    domain="SIMULATION"
                  />
                  <SignalCard
                    title="Conversion (points)"
                    value={`${result.predictedMetrics.conversionChangePts > 0 ? "+" : ""}${result.predictedMetrics.conversionChangePts}`}
                    delta="vs baseline window"
                    deltaDirection={result.predictedMetrics.conversionChangePts >= 0 ? "up" : "down"}
                    severity={result.predictedMetrics.conversionChangePts < -2 ? "WARNING" : "INFO"}
                    explanation="Heuristic change to modeled conversion; validate with A/B or cohort pilot before live SLAs."
                    domain="LEAD"
                  />
                  <SignalCard
                    title="Dispute risk (points)"
                    value={`${result.predictedMetrics.disputeRiskChangePts > 0 ? "+" : ""}${result.predictedMetrics.disputeRiskChangePts}`}
                    delta="0–100 scale"
                    deltaDirection={result.predictedMetrics.disputeRiskChangePts > 0 ? "down" : "up"}
                    severity={result.predictedMetrics.disputeRiskChangePts > 3 ? "CRITICAL" : "WARNING"}
                    explanation="Higher is worse — price pressure and low oversight increase modeled dispute load."
                    domain="RISK"
                  />
                  <SignalCard
                    title="Trust (points) / workload (%)"
                    value={`${result.predictedMetrics.trustChangePts > 0 ? "+" : ""}${result.predictedMetrics.trustChangePts} / ${result.predictedMetrics.workloadChangePct > 0 ? "+" : ""}${result.predictedMetrics.workloadChangePct}%`}
                    delta="Trust ↑ good · workload %"
                    deltaDirection="neutral"
                    severity="INFO"
                    explanation="Trust models governance perception; workload is a relative index, not headcount."
                    domain="TRUST"
                  />
                </div>

                <section className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-5">
                  <h3 className="text-sm font-semibold text-amber-100/90">Risk warnings (simulated)</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80">
                    {result.riskWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-400">Suggested actions</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {result.recommendedActions.map((a) => (
                      <Link
                        key={a.id}
                        href={a.href}
                        className="flex flex-col rounded-lg border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-3 transition hover:border-[#D4AF37]/40"
                      >
                        <span className="font-medium text-[#f4efe4]">{a.label}</span>
                        <span className="text-xs text-neutral-500">{a.rationale}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-[#2a2a2a] p-4 text-xs text-neutral-500">
                  <p className="font-semibold text-neutral-400">Model assumptions (auditability)</p>
                  <ul className="mt-2 list-decimal pl-4">
                    {result.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4 text-sm text-neutral-300">
                  <p>
                    <strong className="text-[#D4AF37]">AI CEO link:</strong> export this run as a narrative for the AI CEO
                    queue — strategic adjustments stay simulated until a reviewer approves.{" "}
                    <Link href="/dashboard/admin/ai-ceo/system-adjustments" className="text-[#D4AF37] underline">
                      Open system adjustments
                    </Link>
                  </p>
                </section>
              </section>
            : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Saved scenarios</h2>
            {listLoading ?
              <p className="text-sm text-neutral-600">Loading…</p>
            : scenarios.length === 0 ?
              <p className="text-sm text-neutral-600">No saved scenarios yet.</p>
            : (
              <ul className="space-y-3">
                {scenarios.map((s) => (
                  <li key={s.id} className="rounded-lg border border-[#232323] bg-[#0a0a0a] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScenario(s.params);
                          setName(s.name);
                          setResult(s.lastResult);
                          setCompareId(null);
                        }}
                        className="text-left text-sm font-medium text-[#f0ebe0] hover:text-[#D4AF37]"
                      >
                        {s.name}
                      </button>
                      {s.isRecommended ?
                        <span className="shrink-0 text-[10px] uppercase text-[#D4AF37]">Recommended</span>
                      : null}
                    </div>
                    <p className="text-[10px] text-neutral-600">{new Date(s.updatedAt).toLocaleString()}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs text-[#D4AF37] hover:underline"
                        onClick={async () => {
                          await fetch(`/api/admin/simulation/scenarios/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "same-origin",
                            body: JSON.stringify({ isRecommended: true }),
                          });
                          await loadList();
                        }}
                      >
                        Mark recommended
                      </button>
                      <button
                        type="button"
                        className="text-xs text-neutral-500 hover:underline"
                        onClick={() => setCompareId(s.id === compareId ? null : s.id)}
                      >
                        {compareId === s.id ? "Clear compare" : "Compare result"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {compareOther && result ?
              <div className="rounded-lg border border-[#333] p-3 text-xs text-neutral-400">
                <p className="font-semibold text-neutral-300">Compare (saved vs current run)</p>
                <p className="mt-2">
                  Δ Revenue (saved sim): {compareOther.predictedMetrics.revenueChangePct}% → current:{" "}
                  {result.predictedMetrics.revenueChangePct}%
                </p>
              </div>
            : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Slider(props: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{props.label}</p>
      {props.hint ?
        <p className="text-[10px] text-neutral-600">{props.hint}</p>
      : null}
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#D4AF37]"
      />
      <p className="text-sm text-[#D4AF37]">{props.value.toFixed(2)}</p>
    </div>
  );
}
