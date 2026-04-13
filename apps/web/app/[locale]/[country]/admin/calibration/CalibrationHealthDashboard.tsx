"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalibrationHealthSummary, SegmentPerformanceRow } from "@/modules/continuous-calibration/domain/calibration.types";
import { CalibrationBatchTable, type BatchRow } from "./components/CalibrationBatchTable";
import { DriftAlertsPanel, type DriftAlertRow } from "./components/DriftAlertsPanel";
import { SegmentPerformanceBreakdown } from "./components/SegmentPerformanceBreakdown";
import { TuningReviewRecommendationCard } from "./components/TuningReviewRecommendationCard";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(100 * n).toFixed(1)}%`;
}

export function CalibrationHealthDashboard() {
  const [health, setHealth] = useState<CalibrationHealthSummary | null>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [alerts, setAlerts] = useState<DriftAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailSegments, setDetailSegments] = useState<SegmentPerformanceRow[] | null>(null);
  const [detailReview, setDetailReview] = useState<{ recommended: boolean; reasons: string[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rh, rb, ra] = await Promise.all([
        fetch("/api/internal/calibration/health"),
        fetch("/api/internal/calibration/batches"),
        fetch("/api/internal/calibration/drift-alerts?take=40"),
      ]);
      if (!rh.ok || !rb.ok || !ra.ok) throw new Error("Calibration API error");
      const [h, b, a] = await Promise.all([rh.json(), rb.json(), ra.json()]);
      setHealth(h as CalibrationHealthSummary);
      setBatches((b.batches ?? []) as BatchRow[]);
      setAlerts(
        (a.alerts ?? []).map((x: DriftAlertRow) => ({
          id: x.id,
          severity: x.severity,
          alertType: x.alertType,
          message: x.message,
          segmentKey: x.segmentKey,
          createdAt: x.createdAt,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetailSegments(null);
    setDetailReview(null);
    try {
      const runRes = await fetch(`/api/internal/calibration/batches/${id}`);
      const data = (await runRes.json()) as {
        segments?: SegmentPerformanceRow[];
        batch: {
          tuningReviewRecommended: boolean | null;
          tuningReviewReasonsJson: string[] | null;
        };
      };
      const reasons = Array.isArray(data.batch.tuningReviewReasonsJson) ? data.batch.tuningReviewReasonsJson : [];
      setDetailReview({
        recommended: data.batch.tuningReviewRecommended ?? false,
        reasons: reasons.length ? reasons : ["No stored reasons."],
      });
      setDetailSegments(data.segments ?? []);
    } catch {
      setDetailReview({ recommended: false, reasons: ["Could not load batch detail."] });
      setDetailSegments([]);
    }
  }, []);

  const runBatch = useCallback(
    async (id: string) => {
      setRunLoading(id);
      setError(null);
      try {
        const res = await fetch(`/api/internal/calibration/batches/${id}/run`, { method: "POST" });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Run failed");
        await load();
        await openDetail(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Run failed");
      } finally {
        setRunLoading(null);
      }
    },
    [load, openDetail],
  );

  const trends = health?.trends;
  const latest = health?.latestBatch?.metrics;

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Internal only — compares labeled pools to the active production tuning profile. No auto-apply.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">Active production profile</p>
          {health?.activeProductionProfile ? (
            <div className="mt-2 text-sm text-zinc-300">
              <p className="font-mono text-amber-200/90">{health.activeProductionProfile.id}</p>
              <p>{health.activeProductionProfile.name ?? "—"}</p>
              <p className="text-xs text-zinc-500">created {new Date(health.activeProductionProfile.createdAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No active tuning profile flagged in DB.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Latest batch snapshot</p>
          {latest ? (
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
              <dt className="text-zinc-500">Trust agr.</dt>
              <dd>{pct(latest.trustAgreementRate)}</dd>
              <dt className="text-zinc-500">Deal agr.</dt>
              <dd>{pct(latest.dealAgreementRate)}</dd>
              <dt className="text-zinc-500">FP high trust</dt>
              <dd>{pct(latest.falsePositiveHighTrustRate)}</dd>
              <dt className="text-zinc-500">FP strong opp.</dt>
              <dd>{pct(latest.falsePositiveStrongOpportunityRate)}</dd>
              <dt className="text-zinc-500">Low-conf / disagree</dt>
              <dd>{pct(latest.lowConfidenceDisagreementConcentration)}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No completed batch metrics yet.</p>
          )}
        </div>
      </div>

      {trends ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Last 5 batches (chronological)</p>
          <div className="mt-3 grid gap-2 font-mono text-[11px] text-zinc-400 sm:grid-cols-5">
            <div>
              <p className="text-zinc-600">Trust</p>
              <p>{trends.trustAgreement.map((v) => pct(v)).join(" → ")}</p>
            </div>
            <div>
              <p className="text-zinc-600">Deal</p>
              <p>{trends.dealAgreement.map((v) => pct(v)).join(" → ")}</p>
            </div>
            <div>
              <p className="text-zinc-600">FP HT</p>
              <p>{trends.fpHighTrust.map((v) => pct(v)).join(" → ")}</p>
            </div>
            <div>
              <p className="text-zinc-600">FP SO</p>
              <p>{trends.fpStrongOpportunity.map((v) => pct(v)).join(" → ")}</p>
            </div>
            <div>
              <p className="text-zinc-600">Low-conf</p>
              <p>{trends.lowConfDisagreementConcentration.map((v) => pct(v)).join(" → ")}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-zinc-300">Drift alerts</h2>
        <div className="mt-2">
          <DriftAlertsPanel alerts={alerts} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-300">Batches</h2>
        <div className="mt-2">
          <CalibrationBatchTable
            batches={batches}
            onOpen={(id) => void openDetail(id)}
            onRun={(id) => void runBatch(id)}
            runLoadingId={runLoading}
          />
        </div>
      </div>

      {detailId && detailReview ? (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs text-zinc-500">
            Batch <span className="font-mono text-zinc-400">{detailId}</span>
          </p>
          <TuningReviewRecommendationCard recommended={detailReview.recommended} reasons={detailReview.reasons} />
          {detailSegments ? <SegmentPerformanceBreakdown segments={detailSegments} /> : <p className="text-xs text-zinc-500">Loading segments…</p>}
        </div>
      ) : null}
    </div>
  );
}
