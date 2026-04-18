"use client";

import { useCallback, useEffect, useState } from "react";

type UserSimulationReport = {
  generatedAt: string;
  engineVersion: string;
  personasTested: string[];
  overallReadinessScore: number;
  conversionBlockers: string[];
  recommendations: string[];
  notes: string[];
  journeys: {
    persona: string;
    journey: string;
    conversionStatus: string;
    frictionPoints: { category: string; severity: string; description: string }[];
    dropOffPoints: { label: string; reason: string }[];
    confusionEvents: { description: string }[];
  }[];
  allFrictionPoints: { category: string; severity: string; description: string }[];
  allDropOffs: { label: string; reason: string }[];
};

export function AdminSimulationDashboard() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [report, setReport] = useState<UserSimulationReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulation/results", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        missing?: boolean;
        report?: UserSimulationReport;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.missing) {
        setMissing(true);
        setReport(null);
        return;
      }
      setMissing(false);
      setReport(json.report ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/simulation/run", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; report?: UserSimulationReport; error?: string };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setReport(json.report ?? null);
      setMissing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Real user simulation</h1>
          <p className="mt-1 text-sm text-zinc-400">
            LECIPM Real User Simulation v1 — friction, drop-offs, and UX recommendations (heuristic narratives + rules).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void runSimulation()}
            className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-50"
            disabled={running}
          >
            {running ? "Running…" : "Run simulation"}
          </button>
        </div>
      </div>

      {loading && !running && <p className="text-zinc-400">Loading…</p>}
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/80 bg-red-950/40 p-4 text-red-200">{error}</div>
      )}
      {missing && !report && !loading && (
        <div className="rounded-lg border border-amber-800/80 bg-amber-950/30 p-4 text-amber-100">
          No report yet. Click <strong>Run simulation</strong> (admin only).
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-sm text-zinc-400">{report.generatedAt}</p>
            <p className="mt-1 text-lg font-medium">
              Readiness score:{" "}
              <span
                className={
                  report.overallReadinessScore >= 70 ? "text-emerald-400" : report.overallReadinessScore >= 40 ? "text-amber-300" : "text-red-400"
                }
              >
                {report.overallReadinessScore}
              </span>{" "}
              / 100
            </p>
            <p className="mt-2 text-xs text-zinc-500">{report.engineVersion}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-medium">Personas</h2>
            <ul className="list-inside list-disc text-sm text-zinc-300">
              {report.personasTested.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          {report.conversionBlockers.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-medium text-amber-200">Conversion blockers (inferred)</h2>
              <ul className="list-inside list-disc text-sm text-zinc-300">
                {report.conversionBlockers.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-lg font-medium">Recommendations</h2>
            <ul className="list-inside list-decimal text-sm text-zinc-300">
              {report.recommendations.map((r) => (
                <li key={r} className="mb-1">
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-medium">Journeys</h2>
            <div className="space-y-3">
              {report.journeys.map((j) => (
                <details key={`${j.persona}-${j.journey}`} className="rounded-lg border border-zinc-800 bg-black/40">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    {j.persona} — {j.journey}{" "}
                    <span className="text-zinc-500">({j.conversionStatus})</span>
                  </summary>
                  <div className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                    <p className="font-semibold text-zinc-300">Friction</p>
                    <ul className="mb-2 list-inside list-disc">
                      {j.frictionPoints.length === 0 ? (
                        <li>None flagged by rules (does not prove zero UX issues).</li>
                      ) : (
                        j.frictionPoints.map((f) => (
                          <li key={f.description}>
                            [{f.severity}] {f.category}: {f.description}
                          </li>
                        ))
                      )}
                    </ul>
                    <p className="font-semibold text-zinc-300">Drop-offs</p>
                    <ul className="list-inside list-disc">
                      {j.dropOffPoints.length === 0 ? (
                        <li>—</li>
                      ) : (
                        j.dropOffPoints.map((d) => (
                          <li key={d.label + d.reason}>
                            {d.label} ({d.reason})
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-medium">Aggregate friction</h2>
            <ul className="list-inside list-disc text-sm text-zinc-400">
              {report.allFrictionPoints.map((f) => (
                <li key={f.description}>
                  [{f.severity}] {f.category}: {f.description}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-medium">Notes</h2>
            {report.notes.map((n) => (
              <p key={n} className="text-sm text-zinc-500">
                {n}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
