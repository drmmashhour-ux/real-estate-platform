"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalibrationMetrics, ValidationMetricsDelta } from "@/modules/model-validation/domain/validation.types";
import type { OverfittingRiskLevel } from "@/modules/model-validation/infrastructure/overfittingCheckService";
import { CalibrationMetricsCards } from "./components/CalibrationMetricsCards";
import { DisagreementReviewPanel } from "./components/DisagreementReviewPanel";
import { FreshSetSamplingSummary } from "./components/FreshSetSamplingSummary";
import { OverfittingRiskPanel } from "./components/OverfittingRiskPanel";
import { ValidationDeltaTable } from "./components/ValidationDeltaTable";
import { ValidationItemsTable, type ValidationItemRow } from "./components/ValidationItemsTable";
import { ValidationRunSummary } from "./components/ValidationRunSummary";

type RunListRow = {
  id: string;
  name: string | null;
  description: string | null;
  status: string;
  validationRunKind: string;
  appliedTuningProfileId: string | null;
  appliedTuningProfileName: string | null;
  comparisonTargetRunId: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
};

type RunDetail = {
  run: {
    id: string;
    name: string | null;
    description: string | null;
    status: string;
    validationRunKind?: string;
    appliedTuningProfileId: string | null;
    comparisonTargetRunId: string | null;
    createdBy: string | null;
    createdAt: string;
    completedAt: string | null;
  };
  metrics: CalibrationMetrics;
  items: ValidationItemRow[];
};

export function ModelValidationAdminClient() {
  const [runs, setRuns] = useState<RunListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [tuningProfileId, setTuningProfileId] = useState("");
  const [round2Loading, setRound2Loading] = useState(false);
  const [comparisonPayload, setComparisonPayload] = useState<{
    stored: {
      id: string;
      metricsDelta: ValidationMetricsDelta;
      summary: { biggestImprovements: { metric: string; delta: number | null }[] } | null;
      baseRun: { id: string; name: string | null };
      comparisonRun: { id: string; name: string | null };
    }[];
  } | null>(null);
  const [overfitting, setOverfitting] = useState<{
    overfittingRisk: OverfittingRiskLevel;
    reasons: string[];
  } | null>(null);
  const [lastFreshSampling, setLastFreshSampling] = useState<{
    counts: import("@/modules/model-validation/infrastructure/validationSamplingService").FreshSetDistribution;
    shortfalls: string[];
    listingCount: number;
  } | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/model-validation/runs");
      const json = (await res.json()) as { runs?: RunListRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRuns(json.runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComparison = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/internal/model-validation/runs/${id}/comparison`);
      const json = (await res.json()) as {
        stored?: {
          id: string;
          metricsDelta: ValidationMetricsDelta;
          summary: { biggestImprovements: { metric: string; delta: number | null }[] } | null;
          baseRun: { id: string; name: string | null };
          comparisonRun: { id: string; name: string | null };
        }[];
      };
      if (res.ok && json.stored) {
        setComparisonPayload({ stored: json.stored });
      } else {
        setComparisonPayload(null);
      }
    } catch {
      setComparisonPayload(null);
    }
  }, []);

  const loadOverfitting = useCallback(async (id: string, kind: string) => {
    if (kind !== "tuned_same_set" && kind !== "tuned_fresh_set") {
      setOverfitting(null);
      return;
    }
    try {
      const res = await fetch(`/api/internal/model-validation/runs/${id}/overfitting-check`);
      const json = (await res.json()) as {
        overfittingRisk?: OverfittingRiskLevel;
        reasons?: string[];
        error?: string;
      };
      if (res.ok && json.overfittingRisk && json.reasons) {
        setOverfitting({ overfittingRisk: json.overfittingRisk, reasons: json.reasons });
      } else {
        setOverfitting(null);
      }
    } catch {
      setOverfitting(null);
    }
  }, []);

  const loadDetail = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetailLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/internal/model-validation/runs/${id}`);
        const json = (await res.json()) as RunDetail & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setDetail({
          run: json.run,
          metrics: json.metrics,
          items: json.items as ValidationItemRow[],
        });
        void loadComparison(id);
        void loadOverfitting(id, json.run.validationRunKind ?? "baseline");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [loadComparison, loadOverfitting],
  );

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const finalize = useCallback(async () => {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/model-validation/runs/${selectedId}/finalize`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Finalize failed");
      await loadDetail(selectedId);
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }, [selectedId, loadDetail, loadRuns]);

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400/90">Internal API</p>
          <p className="mt-1 text-sm text-zinc-500">
            <code className="text-amber-200/80">/api/internal/model-validation/*</code> — admin session required.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRuns()}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Refresh list
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading runs…</p> : null}

      {!loading && runs.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
          No runs. POST <code className="text-amber-200/90">/api/internal/model-validation/runs</code> or run{" "}
          <code className="text-amber-200/90">npm run seed:calibration</code>.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/50">
                <td className="px-3 py-2 font-mono text-xs text-zinc-400">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-zinc-200">{r.name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{r.validationRunKind ?? "baseline"}</td>
                <td className="px-3 py-2 text-xs uppercase text-zinc-400">{r.status}</td>
                <td className="px-3 py-2 tabular-nums text-zinc-300">{r.itemCount}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => void loadDetail(r.id)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {detail?.run.status !== "completed" ? (
              <button
                type="button"
                disabled={detailLoading || actionLoading}
                onClick={() => void finalize()}
                className="rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
              >
                {actionLoading ? "Finalizing…" : "Finalize run (recompute agreements)"}
              </button>
            ) : (
              <span className="text-xs text-zinc-500">Run completed {detail?.run.completedAt ? new Date(detail.run.completedAt).toLocaleString() : ""}</span>
            )}
            {detailLoading ? <span className="text-xs text-zinc-500">Loading detail…</span> : null}
          </div>

          {detail ? (
            <>
              <ValidationRunSummary
                name={detail.run.name}
                description={detail.run.description}
                status={detail.run.status}
                createdAt={detail.run.createdAt}
                completedAt={detail.run.completedAt}
                itemCount={detail.metrics.itemCount}
              />
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
                <p className="font-semibold uppercase tracking-wide text-amber-400/90">Round 2 — tuned validation</p>
                <p className="mt-2 leading-relaxed">
                  Uses the selected run as baseline for same-set rerun, or as <code className="text-amber-200/80">baselineRunId</code> for a
                  fresh sample. Does not change production thresholds.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-zinc-500">Tuning profile id</span>
                    <input
                      value={tuningProfileId}
                      onChange={(e) => setTuningProfileId(e.target.value)}
                      placeholder="cuid…"
                      className="w-72 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-zinc-200"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={round2Loading || !tuningProfileId.trim()}
                    onClick={async () => {
                      if (!selectedId || !tuningProfileId.trim()) return;
                      setRound2Loading(true);
                      setError(null);
                      try {
                        const res = await fetch(`/api/internal/model-validation/runs/${selectedId}/rerun-tuned`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ tuningProfileId: tuningProfileId.trim() }),
                        });
                        const json = (await res.json()) as { error?: string; runId?: string };
                        if (!res.ok) throw new Error(json.error ?? "Failed");
                        await loadRuns();
                        if (json.runId) await loadDetail(json.runId);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setRound2Loading(false);
                      }
                    }}
                    className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-900/40 disabled:opacity-40"
                  >
                    {round2Loading ? "Working…" : "Rerun same listings (tuned)"}
                  </button>
                  <button
                    type="button"
                    disabled={round2Loading || !tuningProfileId.trim() || !selectedId}
                    onClick={async () => {
                      if (!selectedId || !tuningProfileId.trim()) return;
                      setRound2Loading(true);
                      setError(null);
                      try {
                        const res = await fetch(`/api/internal/model-validation/runs/fresh-set`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            tuningProfileId: tuningProfileId.trim(),
                            baselineRunId: selectedId,
                          }),
                        });
                        const json = (await res.json()) as {
                          error?: string;
                          runId?: string;
                          sampling?: {
                            listingIds: string[];
                            counts: import("@/modules/model-validation/infrastructure/validationSamplingService").FreshSetDistribution;
                            shortfalls: string[];
                          };
                        };
                        if (!res.ok) throw new Error(json.error ?? "Failed");
                        if (json.sampling) {
                          setLastFreshSampling({
                            counts: json.sampling.counts,
                            shortfalls: json.sampling.shortfalls,
                            listingCount: json.sampling.listingIds.length,
                          });
                        }
                        await loadRuns();
                        if (json.runId) await loadDetail(json.runId);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setRound2Loading(false);
                      }
                    }}
                    className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    {round2Loading ? "Working…" : "Create fresh 50 (tuned)"}
                  </button>
                </div>
              </div>

              {lastFreshSampling ? (
                <FreshSetSamplingSummary
                  counts={lastFreshSampling.counts}
                  shortfalls={lastFreshSampling.shortfalls}
                  listingCount={lastFreshSampling.listingCount}
                />
              ) : null}

              {overfitting ? <OverfittingRiskPanel risk={overfitting.overfittingRisk} reasons={overfitting.reasons} /> : null}

              {comparisonPayload?.stored?.length ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Stored comparisons</p>
                  {comparisonPayload.stored.slice(0, 3).map((c) => (
                    <div key={c.id} className="space-y-2">
                      <p className="text-xs text-zinc-500">
                        vs base <span className="font-mono text-zinc-400">{c.baseRun.name ?? c.baseRun.id}</span> → peer{" "}
                        <span className="font-mono text-zinc-400">{c.comparisonRun.name ?? c.comparisonRun.id}</span>
                      </p>
                      <ValidationDeltaTable delta={c.metricsDelta} />
                    </div>
                  ))}
                </div>
              ) : null}

              <CalibrationMetricsCards metrics={detail.metrics} />
              <div className="grid gap-6 lg:grid-cols-2">
                <DisagreementReviewPanel items={detail.items} />
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 text-xs text-zinc-500">
                  <p className="font-semibold uppercase tracking-wide text-zinc-400">Human labels</p>
                  <p className="mt-2 leading-relaxed">
                    POST <code className="text-amber-200/80">…/runs/[id]/items</code> to add a listing; PATCH{" "}
                    <code className="text-amber-200/80">…/items/[itemId]</code> to set human labels and reviewer fields. Trust: critical |
                    caution | strong | verified. Deal: negative | caution | review | strong. Risk: low | medium | high.
                  </p>
                </div>
              </div>
              <ValidationItemsTable items={detail.items} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
