"use client";

import { useCallback, useEffect, useState } from "react";
import { autonomousGrowthFlags } from "@/config/feature-flags";
import {
  getAutonomousRunDetailsAction,
  listRecentAutonomousRunsAction,
  reevaluateAutonomousRunAction,
  runFullAutonomousGrowthCycleAction,
  simulateFullAutonomousGrowthCycleAction,
} from "@/lib/autonomous-growth/admin-actions";

type RunRow = Awaited<ReturnType<typeof listRecentAutonomousRunsAction>>[number];

const STAGE_ORDER = [
  "OBSERVED",
  "DECIDED",
  "PRIORITIZED",
  "POLICY_BLOCKED",
  "SIMULATED",
  "APPROVAL_REQUIRED",
  "EXECUTED",
  "LEARNED",
] as const;

function formatStageLabel(s: string): string {
  if (s === "APPROVAL_REQUIRED") return "Approval routed";
  if (s === "POLICY_BLOCKED") return "Policy / blocked";
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

export function AutonomousGrowthSystemSection({ isAdmin }: { isAdmin: boolean }) {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAutonomousRunDetailsAction>> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAdmin || !autonomousGrowthFlags.autonomousGrowthSystemV1) return;
    setLoading(true);
    try {
      const list = await listRecentAutonomousRunsAction(12);
      setRuns(list);
      if (!selectedId && list[0]) setSelectedId(list[0].id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId || !isAdmin) return;
    let cancelled = false;
    void (async () => {
      try {
        const d = await getAutonomousRunDetailsAction(selectedId);
        if (!cancelled) setDetail(d);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, isAdmin]);

  const latest = runs[0];
  const notes = Array.isArray(latest?.notes) ? (latest!.notes as string[]) : [];

  async function onRunFull() {
    setMsg(null);
    setLoading(true);
    try {
      const r = await runFullAutonomousGrowthCycleAction();
      setMsg(`Run ${r.summary.runId} — ${r.summary.status}`);
      await refresh();
      setSelectedId(r.summary.runId);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSimulate() {
    setMsg(null);
    setLoading(true);
    try {
      const r = await simulateFullAutonomousGrowthCycleAction();
      setMsg(`Simulation run ${r.summary.runId} — ${r.summary.status}`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onReevaluate() {
    if (!selectedId) return;
    setMsg(null);
    setLoading(true);
    try {
      const r = await reevaluateAutonomousRunAction(selectedId);
      setMsg(r.notes.join(" · "));
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Reevaluation failed");
    } finally {
      setLoading(false);
    }
  }

  if (!autonomousGrowthFlags.autonomousGrowthSystemV1) {
    return null;
  }

  const domains = Array.isArray(latest?.domains) ? (latest!.domains as string[]) : [];

  return (
    <section className="rounded-2xl border border-emerald-900/40 bg-emerald-950/15 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">V7 Autonomous growth</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Controlled autonomous system</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Observation and policy buckets unify Operator, Platform Core, and One Brain outputs. Medium- and high-impact
            actions are approval-bound; budget and external sync never execute from this panel.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>Flags: system={String(autonomousGrowthFlags.autonomousGrowthSystemV1)}</div>
          <div>
            exec={String(autonomousGrowthFlags.autonomousGrowthExecutionV1)} · sim=
            {String(autonomousGrowthFlags.autonomousGrowthSimulationV1)} · reeval=
            {String(autonomousGrowthFlags.autonomousGrowthReevaluationV1)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <h3 className="text-sm font-semibold text-white">Last run</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <dt>Status</dt>
            <dd className="text-zinc-200">{latest?.status ?? "—"}</dd>
            <dt>Decisions (ordered)</dt>
            <dd className="text-zinc-200">{latest?.decisionCount ?? 0}</dd>
            <dt>Executable (bucket)</dt>
            <dd className="text-zinc-200">{latest?.executableCount ?? 0}</dd>
            <dt>Blocked</dt>
            <dd className="text-zinc-200">{latest?.blockedCount ?? 0}</dd>
            <dt>Approval required</dt>
            <dd className="text-zinc-200">{latest?.approvalRequiredCount ?? 0}</dd>
          </dl>
          {notes.length > 0 ? (
            <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
              {notes.slice(0, 6).map((n) => (
                <li key={n.slice(0, 80)}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">No notes on latest run yet.</p>
          )}
          {domains.length > 0 ? (
            <p className="mt-3 text-xs text-zinc-500">
              Observed domains: {domains.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <h3 className="text-sm font-semibold text-white">Simulation (heuristic)</h3>
          <p className="mt-2 text-xs text-zinc-500">
            Estimates are coarse and non-binding. Enable FEATURE_AUTONOMOUS_GROWTH_SIMULATION_V1 for Operator + Platform
            Core previews during a full cycle.
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void onRunFull()}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Run full cycle
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onSimulate()}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Simulate only
          </button>
          <button
            type="button"
            disabled={loading || !selectedId || !autonomousGrowthFlags.autonomousGrowthReevaluationV1}
            onClick={() => void onReevaluate()}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Reevaluate selected run
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-500">Admin actions are hidden — admin session required.</p>
      )}

      {msg ? <p className="mt-3 text-xs text-emerald-300">{msg}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent runs</h3>
          <ul className="mt-2 space-y-1 text-xs">
            {runs.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full rounded px-2 py-1 text-left hover:bg-zinc-800 ${selectedId === r.id ? "bg-zinc-800" : ""}`}
                >
                  <span className="text-zinc-200">{r.status}</span>{" "}
                  <span className="text-zinc-500">{r.createdAt.toISOString().slice(0, 19)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Timeline (selected)</h3>
          {detail?.events?.length ? (
            <ol className="mt-2 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-400">
              {detail.events
                .filter((e) => STAGE_ORDER.includes(e.stage as (typeof STAGE_ORDER)[number]) || e.stage === "FAILED")
                .map((e) => (
                  <li key={e.id} className="border-l border-zinc-700 pl-2">
                    <span className="text-emerald-400/90">{formatStageLabel(e.stage)}</span>
                    <p className="text-zinc-500">{e.message.slice(0, 220)}</p>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Select a run to inspect events.</p>
          )}
        </div>
      </div>
    </section>
  );
}
