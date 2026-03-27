"use client";

import { useCallback, useState } from "react";
import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";
import type { ClusterAnalysis, SimulationDiffRow } from "@/modules/model-tuning/domain/tuning.types";
import { proposeThresholdAdjustments } from "@/modules/model-tuning/application/proposeThresholdAdjustments";
import { DisagreementClusterTable } from "./components/DisagreementClusterTable";
import { ThresholdComparisonCards } from "./components/ThresholdComparisonCards";
import { TuningProfilePanel } from "./components/TuningProfilePanel";
import { TuningSimulationResults } from "./components/TuningSimulationResults";

export function ModelTuningAdminClient() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [validationRunId, setValidationRunId] = useState("");
  const [simulateRun, setSimulateRun] = useState<{
    beforeMetrics: CalibrationMetrics;
    afterMetrics: CalibrationMetrics;
    diffs: SimulationDiffRow[];
    clustersBefore: ClusterAnalysis[];
  } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const createProfile = useCallback(
    async (payload: { name: string; description: string; validationRunId: string; configJson: string }) => {
      setBusy(true);
      setError(null);
      try {
        let config: object;
        try {
          config = JSON.parse(payload.configJson || "{}") as object;
        } catch {
          throw new Error("Invalid JSON in config");
        }
        const res = await fetch("/api/internal/model-tuning/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name || null,
            description: payload.description || null,
            basedOnValidationRunId: payload.validationRunId || null,
            config,
          }),
        });
        const json = (await res.json()) as { id?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setProfileId(json.id ?? null);
        if (payload.validationRunId) setValidationRunId(payload.validationRunId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const runSimulate = useCallback(async () => {
    if (!profileId || !validationRunId.trim()) {
      setError("Set profile id and validation run id");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/model-tuning/profiles/${profileId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationRunId: validationRunId.trim() }),
      });
      const json = (await res.json()) as {
        beforeMetrics?: CalibrationMetrics;
        afterMetrics?: CalibrationMetrics;
        diffs?: SimulationDiffRow[];
        clustersBefore?: ClusterAnalysis[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Simulate failed");
      if (!json.beforeMetrics || !json.afterMetrics || !json.diffs || !json.clustersBefore) throw new Error("Bad response");
      setSimulateRun({
        beforeMetrics: json.beforeMetrics,
        afterMetrics: json.afterMetrics,
        diffs: json.diffs,
        clustersBefore: json.clustersBefore,
      });
      setSuggestions(proposeThresholdAdjustments(json.clustersBefore));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [profileId, validationRunId]);

  const applyProfile = useCallback(async () => {
    if (!profileId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/model-tuning/profiles/${profileId}/apply`, { method: "POST", body: "{}" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Apply failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [profileId]);

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <TuningProfilePanel onCreate={createProfile} busy={busy} />

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="text-[10px] font-semibold uppercase text-zinc-500">Simulation</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={profileId ?? ""}
            onChange={(e) => setProfileId(e.target.value || null)}
            placeholder="Tuning profile id"
            className="min-w-[200px] flex-1 rounded border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200"
          />
          <input
            value={validationRunId}
            onChange={(e) => setValidationRunId(e.target.value)}
            placeholder="Validation run id"
            className="min-w-[200px] flex-1 rounded border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void runSimulate()}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
          >
            Run simulation
          </button>
          <button
            type="button"
            disabled={busy || !profileId}
            onClick={() => void applyProfile()}
            className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
          >
            Mark profile applied (audit)
          </button>
        </div>
      </div>

      {simulateRun ? (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Disagreement clusters (baseline items)</p>
            <div className="mt-2">
              <DisagreementClusterTable clusters={simulateRun.clustersBefore} />
            </div>
          </div>

          {suggestions.length ? (
            <div className="rounded-lg border border-zinc-800 bg-black/30 p-4">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Suggested heuristics (review only)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                {suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Before / after metrics</p>
            <div className="mt-2">
              <ThresholdComparisonCards before={simulateRun.beforeMetrics} after={simulateRun.afterMetrics} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Per-item diffs</p>
            <div className="mt-2">
              <TuningSimulationResults diffs={simulateRun.diffs} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
