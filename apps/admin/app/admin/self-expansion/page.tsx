"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";

type RecRow = {
  id: string;
  territoryId: string;
  title: string;
  category: string;
  summary: string;
  expansionScore: number;
  confidenceScore: number;
  urgency: string;
  recommendationActionBand: string;
  phaseSuggested: string;
  entryHub: string;
  targetSegment: string | null;
  phasedPlanSummary: string | null;
  executionSafety: string;
  decisionStatus: string;
  explanationJson: unknown;
};

type Measurement = {
  proposedCount: number;
  approvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  completedCount: number;
  pausedCount: number;
  territoriesWithLaunches: number;
};

export default function SelfExpansionAdminPage() {
  const [rows, setRows] = useState<RecRow[]>([]);
  const [measurements, setMeasurements] = useState<Measurement | null>(null);
  const [learning, setLearning] = useState<unknown>(null);
  const [ctxNote, setCtxNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/self-expansion/recommendations");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "load_failed");
        return;
      }
      setRows((j.recommendations as RecRow[]) ?? []);
      setMeasurements(j.measurements as Measurement);
      setLearning(j.learningPatterns);
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

  async function act(id: string, path: string, body?: object) {
    setBusyId(id);
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

  const ranked = [...rows].sort((a, b) => b.expansionScore - a.expansionScore);
  const pending = ranked.filter((r) => r.decisionStatus === "PROPOSED");
  const launched = ranked.filter((r) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(r.decisionStatus));

  const lp = learning as {
    bestEntryStrategies?: Array<{ hub: string; lift: number }>;
    commonBlockers?: Array<{ blocker: string; penalty: number }>;
    archetypes?: Array<{ archetype: string; lift: number }>;
  } | null;

  return (
    <div className="min-h-screen bg-black pb-16 pt-8 text-[#f4efe4]">
      <div className="mx-auto max-w-[1400px] space-y-8 px-4">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${autonomyMuted}`}>Strategic expansion</p>
            <h1 className={`font-serif text-3xl ${autonomyGoldText}`}>Self-Expansion Engine</h1>
            <p className={`mt-2 max-w-3xl text-sm ${autonomyMuted}`}>
              Recommendation and orchestration layer — v1 never auto-launches territories. High-impact moves stay
              approval-gated; regulatory posture is configurable input, not inferred compliance.
            </p>
            {ctxNote ? <p className="mt-2 text-xs text-amber-200/90">Coverage: {ctxNote}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-xs font-semibold text-[#E8D889] hover:bg-[#D4AF37]/10"
          >
            {loading ? "Refreshing…" : "Refresh engine"}
          </button>
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {measurements ?
          <div className={`${autonomyGlassCard} grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6`}>
            <Metric label="Proposed" value={String(measurements.proposedCount)} />
            <Metric label="Approved" value={String(measurements.approvedCount)} />
            <Metric label="Rejected" value={String(measurements.rejectedCount)} />
            <Metric label="In progress" value={String(measurements.inProgressCount)} />
            <Metric label="Completed" value={String(measurements.completedCount)} />
            <Metric label="Paused" value={String(measurements.pausedCount)} />
          </div>
        : null}

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`mb-4 text-lg font-semibold ${autonomyGoldText}`}>1 · Expansion opportunity board</h2>
          <ul className="space-y-3">
            {ranked.slice(0, 12).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#D4AF37]/15 bg-black/40 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/admin/self-expansion/${r.territoryId}`}
                    className="font-medium text-[#f6f0e4] hover:text-[#E8D889]"
                  >
                    {r.title}
                  </Link>
                  <p className={`text-xs ${autonomyMuted}`}>
                    Score {Math.round(r.expansionScore)} · {r.recommendationActionBand} · phase {r.phaseSuggested}
                  </p>
                </div>
                <div className="text-right text-xs text-[#c9b667]">
                  {(r.confidenceScore * 100).toFixed(0)}% conf · {r.entryHub}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className={`${autonomyGlassCard} p-6`}>
            <h2 className={`mb-4 text-lg font-semibold ${autonomyGoldText}`}>2 · Entry strategy (pending)</h2>
            <ul className="space-y-4">
              {pending.slice(0, 8).map((r) => (
                <li key={r.id} className="rounded-xl border border-[#D4AF37]/10 bg-black/35 p-4 text-sm">
                  <p className="font-medium text-[#f4efe4]">{r.title}</p>
                  <p className={`mt-1 ${autonomyMuted}`}>Lead hub: {r.entryHub} · {r.targetSegment ?? "—"}</p>
                  <p className={`mt-2 text-xs ${autonomyMuted}`}>{r.phasedPlanSummary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, `/api/self-expansion/recommendations/${r.id}/approve`)}
                      className="rounded-lg border border-emerald-700/60 px-3 py-1 text-xs text-emerald-100"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, `/api/self-expansion/recommendations/${r.id}/reject`)}
                      className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-100"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, `/api/self-expansion/recommendations/${r.id}/progress`)}
                      className="rounded-lg border border-[#D4AF37]/35 px-3 py-1 text-xs text-[#E8D889]"
                    >
                      In progress
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, `/api/self-expansion/recommendations/${r.id}/pause`)}
                      className="rounded-lg border border-amber-800/50 px-3 py-1 text-xs text-amber-100"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        void act(r.id, `/api/self-expansion/recommendations/${r.id}/complete`, {
                          outcomeNotes: "Marked complete from self-expansion admin",
                          outcomeImpactBand: "moderate_positive_observed",
                        })
                      }
                      className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200"
                    >
                      Complete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${autonomyGlassCard} p-6`}>
            <h2 className={`mb-4 text-lg font-semibold ${autonomyGoldText}`}>3 · Phase tracker (launched)</h2>
            <ul className="space-y-2 text-sm">
              {launched.length === 0 ?
                <li className={autonomyMuted}>No active expansion rows yet.</li>
              : launched.slice(0, 10).map((r) => (
                  <li key={r.id} className="rounded-lg border border-[#D4AF37]/10 px-3 py-2">
                    <span className="text-[#f4efe4]">{r.title}</span>
                    <span className="ml-2 text-xs text-[#b8a66a]">{r.decisionStatus}</span>
                  </li>
                ))
              }
            </ul>
          </section>
        </div>

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`mb-4 text-lg font-semibold ${autonomyGoldText}`}>4 · Outcome tracker</h2>
          <p className={`text-sm ${autonomyMuted}`}>
            Territories with any approved / in-progress / completed recommendation:{" "}
            {measurements?.territoriesWithLaunches ?? 0}. Link detailed funnel metrics in external BI — v1 stores
            decision audit + optional outcome JSON on complete.
          </p>
        </section>

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`mb-4 text-lg font-semibold ${autonomyGoldText}`}>5 · Learning patterns</h2>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div>
              <p className={`text-xs uppercase tracking-wide ${autonomyMuted}`}>Entry hubs</p>
              <ul className="mt-2 space-y-1">
                {(lp?.bestEntryStrategies ?? []).map((x) => (
                  <li key={x.hub}>
                    {x.hub} · ×{x.lift.toFixed(3)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${autonomyMuted}`}>Blocker weights</p>
              <ul className="mt-2 space-y-1">
                {(lp?.commonBlockers ?? []).slice(0, 6).map((x) => (
                  <li key={x.blocker} className="truncate" title={x.blocker}>
                    {x.blocker.slice(0, 48)}
                    {x.blocker.length > 48 ? "…" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${autonomyMuted}`}>Archetypes</p>
              <ul className="mt-2 space-y-1">
                {(lp?.archetypes ?? []).map((x) => (
                  <li key={x.archetype}>
                    {x.archetype} · ×{x.lift.toFixed(3)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#D4AF37]/12 bg-black/45 px-3 py-2">
      <p className={`text-[10px] uppercase tracking-wider ${autonomyMuted}`}>{props.label}</p>
      <p className="mt-1 font-semibold text-[#f4efe4]">{props.value}</p>
    </div>
  );
}
