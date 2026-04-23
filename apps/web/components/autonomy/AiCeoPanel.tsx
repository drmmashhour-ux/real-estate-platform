"use client";

import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

type Measurement = {
  recommendationCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  completedCount: number;
  successRateProxy: number | null;
  avgConfidenceCompleted: number | null;
  falsePositiveReports: number;
  ignoredStalePending: number;
};

type RecRow = {
  id: string;
  title: string;
  category: string;
  summary: string;
  expectedImpactBand: string;
  confidenceScore: number;
  urgency: string;
  requiredEffort: string;
  prioritizationBucket: string | null;
  executionSafety: string;
  decisionStatus: string;
  explanationJson: unknown;
  lastRefreshedAt: string;
  outcomeImpactBand: string | null;
};

export function AiCeoPanel() {
  const [measurements, setMeasurements] = useState<Measurement | null>(null);
  const [recommendations, setRecommendations] = useState<RecRow[]>([]);
  const [ctxNote, setCtxNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-ceo/recommendations");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "ceo_load_failed");
        return;
      }
      setMeasurements(j.measurements as Measurement);
      setRecommendations((j.recommendations as RecRow[]) ?? []);
      const cs = j.contextSummary as { thinDataWarnings?: string[] } | undefined;
      setCtxNote(cs?.thinDataWarnings?.length ? cs.thinDataWarnings.join(" · ") : null);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(recId: string, path: string, body?: object) {
    setBusyId(recId);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function completeRow(recId: string) {
    await act(recId, `/api/ai-ceo/recommendations/${recId}/complete`, {
      outcomeNotes: "Marked complete from AI CEO panel",
      outcomeImpactBand: "moderate_observed",
    });
  }

  const pending = recommendations.filter((r) => r.decisionStatus === "pending");
  const top5 = [...pending].sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 5);
  const queue = pending.filter((r) =>
    ["TOP_PRIORITY", "QUICK_WIN"].includes(r.prioritizationBucket ?? "")
  );
  const accepted = recommendations.filter((r) => r.decisionStatus === "approved").slice(0, 6);
  const rejected = recommendations.filter((r) => r.decisionStatus === "rejected").slice(0, 6);
  const completed = recommendations.filter((r) => r.decisionStatus === "completed").slice(0, 8);

  return (
    <section className={`${autonomyGlassCard} p-6`}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.28em] ${autonomyMuted}`}>Strategic layer</p>
          <h2 className={`font-serif text-2xl ${autonomyGoldText}`}>AI CEO Mode</h2>
          <p className={`mt-2 max-w-3xl text-sm ${autonomyMuted}`}>
            Recommendations synthesize platform telemetry — no automatic execution for pricing, capital, legal, or
            marketplace apply paths. Confidence reflects data coverage, not promised ROI.
          </p>
          {ctxNote ?
            <p className={`mt-2 text-xs text-amber-200/90`}>Coverage: {ctxNote}</p>
          : null}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-xs font-semibold text-[#E8D889] hover:bg-[#D4AF37]/10"
        >
          {loading ? "Refreshing…" : "Refresh signals"}
        </button>
      </header>

      {error ?
        <p className="mb-4 text-sm text-red-400">{error}</p>
      : null}

      {measurements ?
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pending" value={String(measurements.pendingCount)} />
          <Metric label="Approved" value={String(measurements.approvedCount)} />
          <Metric label="Rejected" value={String(measurements.rejectedCount)} />
          <Metric label="Completed" value={String(measurements.completedCount)} />
          <Metric
            label="Success proxy"
            value={
              measurements.successRateProxy == null ? "—" : `${(measurements.successRateProxy * 100).toFixed(0)}%`
            }
          />
          <Metric
            label="Avg confidence (done)"
            value={
              measurements.avgConfidenceCompleted == null ?
                "—"
              : `${(measurements.avgConfidenceCompleted * 100).toFixed(0)}%`
            }
          />
          <Metric label="False-positive notes" value={String(measurements.falsePositiveReports)} />
          <Metric label="Stale pending (14d+)" value={String(measurements.ignoredStalePending)} />
        </div>
      : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
            1 · Top 5 strategic picks
          </h3>
          <ul className="space-y-3">
            {top5.length === 0 ?
              <li className={`text-sm ${autonomyMuted}`}>No pending recommendations.</li>
            : top5.map((r) => (
                <RecommendationCard
                  key={r.id}
                  row={r}
                  busy={busyId === r.id}
                  onApprove={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/approve`)}
                  onReject={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/reject`)}
                  onProgress={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/progress`)}
                  onComplete={() => void completeRow(r.id)}
                />
              ))
            }
          </ul>
        </div>

        <div>
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
            2 · Priority queue (TOP / QUICK)
          </h3>
          <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {queue.length === 0 ?
              <li className={`text-sm ${autonomyMuted}`}>Queue clear.</li>
            : queue.map((r) => (
                <RecommendationCard
                  key={`q-${r.id}`}
                  row={r}
                  busy={busyId === r.id}
                  onApprove={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/approve`)}
                  onReject={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/reject`)}
                  onProgress={() => void act(r.id, `/api/ai-ceo/recommendations/${r.id}/progress`)}
                  onComplete={() => void completeRow(r.id)}
                />
              ))
            }
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
            3 · Accepted vs rejected decisions
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={`mb-2 text-[10px] uppercase tracking-wider ${autonomyMuted}`}>Accepted</p>
              <ul className="space-y-2 text-sm">
                {accepted.length === 0 ?
                  <li className={autonomyMuted}>None yet.</li>
                : accepted.map((r) => (
                    <li
                      key={`a-${r.id}`}
                      className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[#d8f5e8]"
                    >
                      <span className="font-medium">{r.title}</span>
                      <span className="ml-2 text-xs text-emerald-200/70">
                        {(r.confidenceScore * 100).toFixed(0)}% conf
                      </span>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div>
              <p className={`mb-2 text-[10px] uppercase tracking-wider ${autonomyMuted}`}>Rejected</p>
              <ul className="space-y-2 text-sm">
                {rejected.length === 0 ?
                  <li className={autonomyMuted}>None yet.</li>
                : rejected.map((r) => (
                    <li
                      key={`rej-${r.id}`}
                      className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-[#fde8e8]"
                    >
                      <span className="font-medium">{r.title}</span>
                      <span className="ml-2 text-xs text-red-200/70">
                        {(r.confidenceScore * 100).toFixed(0)}% conf
                      </span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
            4 · Impact tracker (recent completions)
          </h3>
          <ul className="space-y-2 text-sm text-[#e8dfd0]">
            {completed.length === 0 ?
              <li className={autonomyMuted}>No completions logged.</li>
            : completed.map((r) => (
                <li key={r.id} className="rounded-lg border border-[#D4AF37]/15 bg-black/40 px-3 py-2">
                  <span className="font-medium text-[#f4efe4]">{r.title}</span>
                  {r.outcomeImpactBand ?
                    <span className="ml-2 text-xs text-[#c9b667]">→ {r.outcomeImpactBand}</span>
                  : null}
                </li>
              ))
            }
          </ul>
        </div>
        <div>
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
            5 · Confidence indicators
          </h3>
          <ul className="space-y-3">
            {pending.slice(0, 8).map((r) => (
              <li key={`c-${r.id}`}>
                <div className="flex justify-between text-xs text-[#b8b3a8]">
                  <span className="truncate pr-2">{r.title}</span>
                  <span>{(r.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#5c4a1f] to-[#D4AF37]"
                    style={{ width: `${Math.min(100, r.confidenceScore * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/12 bg-black/45 px-3 py-2">
      <p className={`text-[10px] uppercase tracking-wider ${autonomyMuted}`}>{props.label}</p>
      <p className="mt-1 font-semibold text-[#f4efe4]">{props.value}</p>
    </div>
  );
}

function RecommendationCard(props: {
  row: RecRow;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onProgress: () => void;
  onComplete: () => void;
}) {
  const { row: r } = props;
  const expl = r.explanationJson as { whyItMatters?: string; dataBasisNote?: string } | null;

  return (
    <li className="rounded-xl border border-[#D4AF37]/20 bg-black/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#c9b667]">{r.category}</p>
          <p className="font-medium text-[#f4efe4]">{r.title}</p>
        </div>
        <span className="rounded-full border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] uppercase text-[#E8D889]">
          {r.executionSafety.replace(/_/g, " ")}
        </span>
      </div>
      <p className={`mt-2 text-sm ${autonomyMuted}`}>{r.summary}</p>
      {expl?.whyItMatters ?
        <p className="mt-2 text-xs text-[#a39e93]">{expl.whyItMatters}</p>
      : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="text-[#b8b3a8]">Impact band: {r.expectedImpactBand}</span>
        <span className="text-[#b8b3a8]">Urgency: {r.urgency}</span>
        <span className="text-[#b8b3a8]">Effort: {r.requiredEffort}</span>
      </div>
      {r.decisionStatus === "pending" ?
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onApprove}
            className="rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onReject}
            className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/40 disabled:opacity-40"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onProgress}
            className="rounded-lg border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#E8D889] hover:bg-[#D4AF37]/10 disabled:opacity-40"
          >
            In progress
          </button>
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onComplete}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900 disabled:opacity-40"
          >
            Complete
          </button>
        </div>
      : null}
    </li>
  );
}
