"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type RetrofitAction = {
  id: string;
  actionId: string | null;
  title: string;
  category: string;
  phase: number;
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  paybackBand: string | null;
  dependenciesJson: unknown;
  notes: string | null;
};

type FinancingOpt = {
  type: string;
  name: string;
  applicability?: string | null;
  coverageBand?: string | null;
  benefit?: string;
  priority?: string | null;
  reasoning?: string | null;
};

type Plan = {
  id: string;
  strategyType: string;
  planName: string;
  summaryText: string | null;
  totalEstimatedCostBand: string | null;
  totalEstimatedImpactBand: string | null;
  totalTimelineBand: string | null;
  expectedScoreBand: string | null;
  expectedCarbonReductionBand: string | null;
  expectedConfidenceImprovement: string | null;
  retrofitActions: RetrofitAction[];
};

type SavedScenario = {
  id: string;
  scenarioName: string;
  totalCostBand: string | null;
  totalImpactBand: string | null;
  timelineBand: string | null;
  expectedScoreBand: string | null;
  expectedCarbonBand: string | null;
  financingFit: string | null;
  createdAt: string;
};

const PHASE_LABELS: Record<number, string> = {
  1: "Data & disclosure",
  2: "Low-cost improvements",
  3: "Operational optimization",
  4: "Capex upgrades",
  5: "Strategic transformation",
};

export function EsgRetrofitListingClient({ listingId }: { listingId: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [financing, setFinancing] = useState<FinancingOpt[]>([]);
  const [strategy, setStrategy] = useState<string>("OPTIMIZED");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scenarioName, setScenarioName] = useState("Custom scenario");
  const [scenarioResult, setScenarioResult] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const activePlan = useMemo(
    () => plans.find((p) => p.strategyType === strategy) ?? plans[0] ?? null,
    [plans, strategy]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [pr, fin, sc] = await Promise.all([
        fetch(`/api/esg/retrofit/${encodeURIComponent(listingId)}`, { credentials: "same-origin" }),
        fetch(`/api/esg/retrofit/${encodeURIComponent(listingId)}/financing?strategy=${encodeURIComponent(strategy)}`, {
          credentials: "same-origin",
        }),
        fetch(`/api/esg/retrofit/${encodeURIComponent(listingId)}/scenario`, { credentials: "same-origin" }),
      ]);
      const pj = (await pr.json()) as { plans?: Plan[]; error?: string };
      const fj = (await fin.json()) as { financingOptions?: FinancingOpt[]; error?: string };
      const sj = (await sc.json()) as { scenarios?: SavedScenario[]; error?: string };
      if (!pr.ok) throw new Error(pj.error ?? "Failed to load plans");
      setPlans(pj.plans ?? []);
      if (fin.ok) setFinancing(fj.financingOptions ?? []);
      else setFinancing([]);
      if (sc.ok) setSavedScenarios(sj.scenarios ?? []);
      else setSavedScenarios([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setPlans([]);
      setFinancing([]);
    } finally {
      setLoading(false);
    }
  }, [listingId, strategy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function regenerate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/esg/retrofit/${encodeURIComponent(listingId)}/generate`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Generate failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function runScenario() {
    if (!activePlan) return;
    const ids = activePlan.retrofitActions
      .filter((r) => selected.has(r.id))
      .map((r) => r.actionId)
      .filter((x): x is string => Boolean(x));
    if (ids.length === 0) {
      setScenarioResult("Select at least one action linked to the Action Center (needs action id).");
      return;
    }
    setBusy(true);
    setScenarioResult(null);
    try {
      const res = await fetch(`/api/esg/retrofit/${encodeURIComponent(listingId)}/scenario`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName,
          selectedActionIds: ids,
          planStrategy: strategy,
        }),
      });
      const j = (await res.json()) as {
        bands?: {
          totalCostBand?: string | null;
          totalImpactBand?: string | null;
          timelineBand?: string | null;
          financingFit?: string | null;
          directionalRoiBand?: string | null;
        };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Scenario failed");
      const b = j.bands;
      setScenarioResult(
        `Stored scenario — cost ${b?.totalCostBand ?? "—"}, impact ${b?.totalImpactBand ?? "—"}, timeline ${b?.timelineBand ?? "—"}, directional payback ${b?.directionalRoiBand ?? "—"}, financing fit ${b?.financingFit ?? "—"} (qualitative bands only).`
      );
      await load();
    } catch (e) {
      setScenarioResult(e instanceof Error ? e.message : "Scenario failed");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function applyPreset(key: "low-cost" | "carbon" | "investor" | "netzero") {
    if (!activePlan) return;
    const rows = activePlan.retrofitActions;
    let sel = new Set<string>();
    if (key === "low-cost") {
      setScenarioName("Low-cost improvement plan");
      sel = new Set(
        rows.filter((r) => r.phase <= 2 && r.costBand !== "HIGH").map((r) => r.id)
      );
    } else if (key === "carbon") {
      setScenarioName("Carbon reduction strategy");
      sel = new Set(
        rows
          .filter(
            (r) =>
              r.category === "CARBON" ||
              r.category === "ENERGY" ||
              /carbon|heat pump|envelope|solar|renew/i.test(r.title)
          )
          .map((r) => r.id)
      );
    } else if (key === "investor") {
      setScenarioName("Investor readiness fast-track");
      sel = new Set(rows.filter((r) => r.phase <= 2).map((r) => r.id));
    } else {
      setScenarioName("Net-zero trajectory");
      sel = new Set(rows.filter((r) => r.phase >= 4).map((r) => r.id));
    }
    setSelected(sel);
    setScenarioResult(
      sel.size === 0 ?
        "No rows matched this preset for the current strategy — adjust selection manually."
      : `Preset applied (${sel.size} rows). Review checkboxes and run “Recalculate scenario”.`
    );
  }

  const phases = useMemo(() => {
    if (!activePlan) return [];
    const map = new Map<number, RetrofitAction[]>();
    for (const a of activePlan.retrofitActions) {
      const list = map.get(a.phase) ?? [];
      list.push(a);
      map.set(a.phase, list);
    }
    return [1, 2, 3, 4, 5].map((p) => ({
      phase: p,
      label: PHASE_LABELS[p] ?? `Phase ${p}`,
      actions: map.get(p) ?? [],
    }));
  }, [activePlan]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ESG · Retrofit planner</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Retrofit roadmap</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Band-based sequencing and financing mapping — advisory only. Generate plans from open Action Center items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => regenerate()}
            className="rounded-xl bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? "Working…" : "Regenerate plans"}
          </button>
          <Link
            href="/dashboard/esg/action-center"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Action Center
          </Link>
          <Link
            href="/dashboard/esg/retrofit"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Portfolio view
          </Link>
        </div>
      </div>

      {err ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{err}</p> : null}

      <div className="flex flex-wrap gap-2">
        {["BASELINE", "OPTIMIZED", "AGGRESSIVE", "NET_ZERO_PATH"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStrategy(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              strategy === s ? "bg-white text-black" : "bg-white/10 text-slate-200 hover:bg-white/15"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ?
        <p className="text-sm text-slate-500">Loading…</p>
      : !activePlan ?
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          No retrofit plan for this strategy yet. Ensure open ESG actions exist, then regenerate.
        </div>
      : <>
          <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-lg font-semibold text-white">{activePlan.planName}</h2>
            <p className="mt-2 text-sm text-slate-400">{activePlan.summaryText}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-slate-500">Cost band</dt>
                <dd className="font-medium text-slate-100">{activePlan.totalEstimatedCostBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Impact band</dt>
                <dd className="font-medium text-slate-100">{activePlan.totalEstimatedImpactBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Timeline band</dt>
                <dd className="font-medium text-slate-100">{activePlan.totalTimelineBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Score direction</dt>
                <dd className="font-medium text-slate-100">{activePlan.expectedScoreBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Carbon direction</dt>
                <dd className="font-medium text-slate-100">{activePlan.expectedCarbonReductionBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Confidence</dt>
                <dd className="font-medium text-slate-100">{activePlan.expectedConfidenceImprovement ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Phase roadmap</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              {phases.map((col) => (
                <div key={col.phase} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[11px] font-bold uppercase text-emerald-400/90">Phase {col.phase}</p>
                  <p className="text-xs text-slate-400">{col.label}</p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    {col.actions.length === 0 ?
                      <li className="text-slate-600">—</li>
                    : col.actions.map((a) => (
                        <li key={a.id} className="rounded-md bg-white/5 px-2 py-1">
                          {a.title}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h3>
            <div className="mt-4 space-y-3">
              {activePlan.retrofitActions.map((a) => {
                const deps = a.dependenciesJson as { deferred?: boolean; gate?: string } | null;
                return (
                  <div key={a.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-sky-400">Phase {a.phase}</span>
                        <h4 className="font-semibold text-white">{a.title}</h4>
                        {a.notes ? <p className="mt-2 text-xs text-slate-400">{a.notes}</p> : null}
                        {deps?.gate ?
                          <p className="mt-2 text-[11px] text-amber-200/90">
                            Dependency: {deps.gate}
                            {deps.deferred ? " (sequencing gate)" : ""}
                          </p>
                        : null}
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        <p>Cost: {a.costBand ?? "—"}</p>
                        <p>Impact: {a.impactBand ?? "—"}</p>
                        <p>Timeline: {a.timelineBand ?? "—"}</p>
                        <p>Payback: {a.paybackBand ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h3 className="text-lg font-semibold text-white">Scenario builder</h3>
            <p className="mt-2 text-sm text-slate-400">
              Select Action Center-linked rows to recompute aggregate bands (stored as a scenario record).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={() => applyPreset("low-cost")}
              >
                Low-cost preset
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={() => applyPreset("carbon")}
              >
                Carbon preset
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={() => applyPreset("investor")}
              >
                Investor fast-track
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={() => applyPreset("netzero")}
              >
                Net-zero trajectory
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="Scenario name"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => runScenario()}
                className="rounded-lg bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
              >
                Recalculate scenario
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {activePlan.retrofitActions.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                    disabled={!a.actionId}
                    className="mt-1"
                  />
                  <span className={a.actionId ? "text-slate-100" : "text-slate-600"}>
                    {a.title}
                    {!a.actionId ? " — no Action Center link" : ""}
                  </span>
                </label>
              ))}
            </div>
            {scenarioResult ? <p className="mt-4 text-sm text-emerald-200">{scenarioResult}</p> : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h3 className="text-lg font-semibold text-white">Saved scenarios (compare)</h3>
            <p className="mt-2 text-sm text-slate-400">
              Recent scenario runs for this listing — compare qualitative bands side by side (not dollar ROI).
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-white/5 uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Impact</th>
                    <th className="px-3 py-2">Timeline</th>
                    <th className="px-3 py-2">Financing fit</th>
                    <th className="px-3 py-2">Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {savedScenarios.length === 0 ?
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={6}>
                        No saved scenarios yet.
                      </td>
                    </tr>
                  : savedScenarios.map((s) => (
                      <tr key={s.id} className="border-t border-white/10 text-slate-200">
                        <td className="px-3 py-2 font-medium text-white">{s.scenarioName}</td>
                        <td className="px-3 py-2">{s.totalCostBand ?? "—"}</td>
                        <td className="px-3 py-2">{s.totalImpactBand ?? "—"}</td>
                        <td className="px-3 py-2">{s.timelineBand ?? "—"}</td>
                        <td className="px-3 py-2">{s.financingFit ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h3 className="text-lg font-semibold text-white">Financing mapping</h3>
            <p className="mt-2 text-sm text-slate-400">
              Conservative matches from disclosure + retrofit scope — not lender commitments.
            </p>
            <ul className="mt-4 space-y-3">
              {financing.length === 0 ?
                <li className="text-sm text-slate-500">Run regenerate or switch strategy to refresh financing rows.</li>
              : financing.map((f, i) => (
                  <li key={`${f.type}-${i}`} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="font-medium text-white">
                      {f.type.replace(/_/g, " ")} · {f.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{f.reasoning ?? ""}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Coverage band: {f.coverageBand ?? "—"} · Benefit: {f.benefit ?? "—"}
                    </p>
                  </li>
                ))
              }
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h3 className="text-lg font-semibold text-emerald-100">Investor positioning</h3>
            <p className="mt-2 text-sm text-slate-300">
              {activePlan.summaryText ??
                "This plan communicates phased capital and disclosure sequencing for diligence — bands stay qualitative until engineering packages exist."}
            </p>
          </section>
        </>
      }
    </div>
  );
}
