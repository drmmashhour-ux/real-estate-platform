"use client";

import { useCallback, useEffect, useState } from "react";
import type { UnifiedPlatformSimulationReport } from "@/modules/e2e-simulation/e2e-simulation.types";
import { BrowserE2eResultsPanel } from "./BrowserE2eResultsPanel";
import { CriticalBlockersPanel } from "./CriticalBlockersPanel";
import { LaunchDecisionCard } from "./LaunchDecisionCard";
import { ScenarioResultCard } from "./ScenarioResultCard";
import { ScenarioStepsTable } from "./ScenarioStepsTable";
import { TestRunSummary } from "./TestRunSummary";

export function FullPlatformSimulationDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [report, setReport] = useState<UnifiedPlatformSimulationReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/testing/e2e-report", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        missing?: boolean;
        hint?: string;
        report?: UnifiedPlatformSimulationReport;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setReport(null);
        return;
      }
      if (json.missing) {
        setMissing(true);
        setHint(json.hint ?? null);
        setReport(null);
        return;
      }
      setMissing(false);
      setReport(json.report ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-zinc-400">Loading latest E2E simulation report…</p>;
  }
  if (error) {
    return <p className="text-red-400">{error}</p>;
  }
  if (missing || !report) {
    return (
      <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200">
        <p>No report found. Generate locally:</p>
        <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-sm text-zinc-300">
          cd apps/web && pnpm run simulate:platform
        </pre>
        {hint ? <p className="text-sm text-zinc-500">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LaunchDecisionCard decision={report.decision} />
      <TestRunSummary report={report} />
      <BrowserE2eResultsPanel report={report} />
      <div>
        <h2 className="text-lg font-semibold text-white">Warnings</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
          {report.warnings.slice(0, 40).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Critical blockers</h2>
        <div className="mt-2">
          <CriticalBlockersPanel items={report.criticalBlockers} />
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Scenarios</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {report.scenarios.map((s) => (
            <ScenarioResultCard key={s.scenarioId} scenario={s} />
          ))}
        </div>
      </div>
      {report.scenarios.map((s) => (
        <div key={s.scenarioId} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <h3 className="font-medium text-white">{s.scenarioName}</h3>
          <ScenarioStepsTable scenario={s} />
        </div>
      ))}
    </div>
  );
}
