"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  loadPlatformCoreDashboardPayload,
  loadPlatformCoreDashboardPayloadWithBrainV8Overlay,
} from "@/modules/platform-core/platform-history.service";
import {
  approvePlatformDecision,
  cancelPlatformTask,
  dismissPlatformDecision,
  executePlatformDecision,
  getBrainSnapshotAction,
  getBrainSnapshotWithV8OverlayAction,
  rollbackPlatformDecision,
  retryPlatformTask,
  runBrainAdaptiveLearningAction,
  runBrainOutcomeIngestionAction,
} from "@/lib/platform-core/admin-actions";
import type { ProviderConfigHealth } from "@/modules/operator/provider-sync/provider-config.service";

type Payload =
  | Awaited<ReturnType<typeof loadPlatformCoreDashboardPayload>>
  | Awaited<ReturnType<typeof loadPlatformCoreDashboardPayloadWithBrainV8Overlay>>;

export function PlatformCoreSectionClient({
  data,
  canApprove,
  canExecute,
  canMutate,
  operatorProviderHealth,
  brainRefreshMode = "legacy",
}: {
  data: Payload;
  canApprove: boolean;
  canExecute: boolean;
  /** Admin + platform core on — task retry/cancel */
  canMutate: boolean;
  operatorProviderHealth: ProviderConfigHealth | null;
  /** `legacy` = raw snapshot action; `v8_overlay` = opt-in Phase C/D presentation refresh */
  brainRefreshMode?: "legacy" | "v8_overlay";
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<"all" | "ads">("all");

  async function act(
    label: string,
    fn: () => Promise<{ ok: boolean } | { ok: true }>,
  ) {
    setMsg(null);
    try {
      await fn();
      setMsg(`${label} recorded.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    }
  }

  const { decisions, tasks, audit, summary, health, brain, brainV8PrimaryMonitoring, orchestration } = data;

  const adsDecisions = useMemo(() => decisions.filter((d) => d.source === "ADS"), [decisions]);
  const displayDecisions = decisionFilter === "ads" ? adsDecisions : decisions;

  return (
    <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/15 p-5 sm:p-6" data-platform-core-section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Platform Core</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Internal operating backbone</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Single store for decisions, tasks, and audit — no external ad APIs or payments from this panel.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-xs sm:grid-cols-3">
          <Stat label="Pending" value={summary.decisions.pending} />
          <Stat label="Approved" value={summary.decisions.approved} />
          <Stat label="Blocked" value={summary.decisions.blocked} />
          <Stat label="Queue" value={summary.tasks.queued} />
          <Stat label="Running" value={summary.tasks.running} />
          <Stat label="Failed tasks" value={summary.tasks.failed} />
        </div>
      </div>

      {health.warnings.length > 0 ? (
        <ul className="mt-4 list-inside list-disc rounded-lg border border-amber-900/45 bg-amber-950/25 px-3 py-2 text-xs text-amber-100">
          {health.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {operatorProviderHealth ? (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-300">Operator V2 ad providers (env presence only): </span>
          Meta {operatorProviderHealth.metaConfigured ? "ready" : "not configured"} · Google{" "}
          {operatorProviderHealth.googleConfigured ? "ready" : "not configured"}
          {operatorProviderHealth.warnings.length > 0 ? (
            <span className="ml-1 text-amber-200/90">— {operatorProviderHealth.warnings.join(" ")}</span>
          ) : null}
        </div>
      ) : null}

      {msg ? <p className="mt-3 text-sm text-emerald-300/90">{msg}</p> : null}

      {brain ? (
        <div className="mt-6 rounded-xl border border-violet-900/40 bg-violet-950/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/90">One Brain V2</p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-100">Adaptive learning (explainable)</h3>
              <p className="mt-1 max-w-2xl text-xs text-zinc-500">
                Source weights refine trust conservatively. Outcomes need real before/after metrics on decisions.
              </p>
            </div>
            {canMutate ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-violet-800/60 px-2 py-1 text-[11px] text-violet-200"
                  onClick={() =>
                    act("Ingest outcomes", async () => {
                      await runBrainOutcomeIngestionAction();
                      return { ok: true as const };
                    })
                  }
                >
                  Ingest outcomes
                </button>
                <button
                  type="button"
                  className="rounded border border-violet-800/60 px-2 py-1 text-[11px] text-violet-200"
                  onClick={() =>
                    act("Learning run", async () => {
                      await runBrainAdaptiveLearningAction();
                      return { ok: true as const };
                    })
                  }
                >
                  Run learning
                </button>
                <button
                  type="button"
                  className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400"
                  onClick={() =>
                    act("Refresh snapshot", async () => {
                      if (brainRefreshMode === "v8_overlay") {
                        await getBrainSnapshotWithV8OverlayAction();
                      } else {
                        await getBrainSnapshotAction();
                      }
                      return { ok: true as const };
                    })
                  }
                >
                  Refresh snapshot
                </button>
              </div>
            ) : null}
          </div>

          {brain.lastLearningRun ? (
            <p className="mt-3 text-[11px] text-zinc-500">
              Last learning run: {new Date(brain.lastLearningRun.createdAt).toLocaleString()} ·{" "}
              {brain.lastLearningRun.decisionCount} outcomes · {brain.lastLearningRun.sourceCount} sources adjusted
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-zinc-500">No learning runs recorded yet.</p>
          )}

          {brain.notes.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-[11px] text-zinc-500">
              {brain.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}

          <p className="mt-2 text-[10px] text-zinc-600">
            <span className="font-semibold text-zinc-500">Brain V8 primary (process-local)</span> · last{" "}
            {brainV8PrimaryMonitoring.lastPrimaryPathLabel ?? "—"} · success {brainV8PrimaryMonitoring.v8PrimarySuccessCount}{" "}
            · fallback {brainV8PrimaryMonitoring.v8PrimaryFallbackCount}
            {brainV8PrimaryMonitoring.postCutover ?
              <span className="block mt-0.5 text-zinc-500">
                Post-cutover KPIs (heuristic): fallback rate {brainV8PrimaryMonitoring.postCutover.fallbackRatePct}% ·
                stability ~{brainV8PrimaryMonitoring.postCutover.stabilityScoreHeuristic}/100 · vol{" "}
                {brainV8PrimaryMonitoring.postCutover.outcomeScoreVolatilityHint}
                {brainV8PrimaryMonitoring.postCutover.phaseBComparison ?
                  <>
                    {" "}
                    · Phase B overlap {(brainV8PrimaryMonitoring.postCutover.phaseBComparison.overlapRate * 100).toFixed(0)}%
                    / div {(brainV8PrimaryMonitoring.postCutover.phaseBComparison.divergenceRate * 100).toFixed(0)}%
                  </>
                : null}
              </span>
            : null}
            {brainV8PrimaryMonitoring.postCutover?.observationalWarnings &&
            brainV8PrimaryMonitoring.postCutover.observationalWarnings.length > 0 ?
              <span className="block mt-0.5 text-amber-200/80">
                {brainV8PrimaryMonitoring.postCutover.observationalWarnings.slice(0, 3).join(" ")}
              </span>
            : null}
            {brainV8PrimaryMonitoring.recentPrimaryFallbackReasons.length > 0 ? (
              <span className="block mt-0.5 text-zinc-600">
                Recent fallback: {brainV8PrimaryMonitoring.recentPrimaryFallbackReasons.slice(-4).join(", ")}
              </span>
            ) : null}
          </p>

          {"brainV8Influence" in brain && brain.brainV8Influence ? (
            <div className="mt-3 rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-[10px] text-zinc-500">
              <span className="font-semibold text-zinc-400">Brain V8 influence (display only)</span>
              <span className="ml-2">
                enabled {String(brain.brainV8Influence.enabled)} · applied {String(brain.brainV8Influence.applied)} ·
                boosted {brain.brainV8Influence.stats.boosted} · caution {brain.brainV8Influence.stats.caution} · monitor{" "}
                {brain.brainV8Influence.stats.monitor} · skipped {brain.brainV8Influence.stats.skipped} · influenced{" "}
                {brain.brainV8Influence.stats.influenced}
              </span>
              {brain.brainV8Influence.warnings.length > 0 ? (
                <span className="ml-2 text-amber-200/80">warnings: {brain.brainV8Influence.warnings.join(", ")}</span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brain.weights.map((w) => (
              <div key={w.source} className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2 text-[11px] text-zinc-400">
                <div className="font-semibold text-zinc-200">{w.source}</div>
                <div className="mt-1">
                  Weight <span className="font-mono text-violet-200">{w.weight.toFixed(2)}</span> · confidence{" "}
                  <span className="font-mono">{w.confidence.toFixed(2)}</span>
                </div>
                <div className="mt-0.5 text-zinc-500">
                  n={w.sampleCount} · +{w.positiveCount} / −{w.negativeCount} / ~{w.neutralCount}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-semibold text-zinc-300">Recent outcomes</h4>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-[11px] text-zinc-500">
              {brain.recentOutcomes.length === 0 ? (
                <li className="text-zinc-600">No outcomes stored — ingest when decisions carry before/after metrics.</li>
              ) : (
                brain.recentOutcomes.map((o) => (
                  <li key={o.id} className="border-b border-zinc-800/40 py-1">
                    <span className="text-zinc-400">{o.source}</span> ·{" "}
                    <span className="text-zinc-300">{o.outcomeType}</span> · score{" "}
                    <span className="font-mono">{o.outcomeScore.toFixed(3)}</span>
                    <div className="text-zinc-600">{o.reason}</div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <details className="mt-4 text-[11px] text-zinc-600">
            <summary className="cursor-pointer text-zinc-500">Timeline (recommendation → outcome → adaptation)</summary>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {brain.timeline.length === 0 ? (
                <li>No timeline rows yet.</li>
              ) : (
                brain.timeline.map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    <span className="text-zinc-500">{new Date(t.at).toLocaleString()}</span> · {t.title}
                    {t.detail ? <div className="text-zinc-600">{t.detail}</div> : null}
                  </li>
                ))
              )}
            </ul>
          </details>

          {brain.v3 ? (
            <div className="mt-6 rounded-xl border border-emerald-900/35 bg-emerald-950/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/90">
                One Brain V3 — cross-domain learning
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Durable signals + negative quality gate — no auto-execution; influences are capped in ranking/CTA/retargeting/profit paths when flags are on.
              </p>
              {brain.v3.runtime.lastUpdatedAt ? (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Runtime snapshot: {new Date(brain.v3.runtime.lastUpdatedAt).toLocaleString()} ·{" "}
                  {brain.v3.runtime.signals.length} signal(s) · {brain.v3.runtime.impacts.length} propagation edge(s)
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-zinc-600">No in-memory runtime snapshot yet — run a learning pass.</p>
              )}
              {brain.v3.runtime.guardNotes.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-amber-200/90">Signal quality (filtered negatives)</p>
                  <ul className="mt-1 list-inside list-disc text-[11px] text-amber-100/85">
                    {brain.v3.runtime.guardNotes.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400">Persisted signals</p>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-[10px] text-zinc-500">
                    {brain.v3.persistedSignals.length === 0 ?
                      <li>None yet.</li>
                    : brain.v3.persistedSignals.map((s) => (
                        <li key={s.id}>
                          {s.source} · {s.direction} · mag {s.magnitude.toFixed(2)} · stab {s.stability.toFixed(2)} · conf{" "}
                          {s.confidence.toFixed(2)}
                        </li>
                      ))
                    }
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400">Propagation (runtime)</p>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-[10px] text-zinc-500">
                    {brain.v3.runtime.impacts.length === 0 ?
                      <li>No edges until learning run produces cross-domain impacts.</li>
                    : brain.v3.runtime.impacts.slice(0, 20).map((im, i) => (
                        <li key={`${im.source}-${im.affectedDomain}-${i}`}>
                          {im.source} → {im.affectedDomain}: {im.impactWeight.toFixed(3)} — {im.reason}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-zinc-400">Negative signal guards (DB)</p>
                <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto text-[10px] text-zinc-500">
                  {brain.v3.negativeGuards.length === 0 ?
                    <li>No guard rows.</li>
                  : brain.v3.negativeGuards.map((g) => (
                      <li key={g.id}>
                        {g.source} · {g.entityId ?? "—"} · count {g.signalCount} · {g.reason ?? "—"}
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">Decision queue</h3>
            <div className="flex gap-1 text-[10px]">
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${decisionFilter === "all" ? "bg-cyan-950/50 text-cyan-200" : "text-zinc-500"}`}
                onClick={() => setDecisionFilter("all")}
              >
                All sources
              </button>
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${decisionFilter === "ads" ? "bg-cyan-950/50 text-cyan-200" : "text-zinc-500"}`}
                onClick={() => setDecisionFilter("ads")}
              >
                Ads ({adsDecisions.length})
              </button>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-xs">
            {displayDecisions.length === 0 ? (
              <li className="text-zinc-500">No decisions yet — enable ingest sources or run the growth feed.</li>
            ) : (
              displayDecisions.map((d) => (
                <li key={d.id} className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-zinc-300">
                  <div className="font-medium text-zinc-100">{d.title}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {d.source} · {d.entityType} · {d.entityId ?? "—"} · status {d.status}
                  </div>
                  {orchestration?.priorityByDecisionId[d.id] ? (
                    <div className="mt-1 text-[10px] text-cyan-200/85">
                      <span className="font-semibold text-zinc-400">Priority </span>
                      <span className="font-mono">
                        {(orchestration.priorityByDecisionId[d.id]!.priorityScore * 100).toFixed(0)}
                      </span>
                      <span className="text-zinc-500">
                        {" "}
                        · urg {(orchestration.priorityByDecisionId[d.id]!.urgency * 100).toFixed(0)}% · impact{" "}
                        {(orchestration.priorityByDecisionId[d.id]!.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : null}
                  {(orchestration &&
                    ((orchestration.dependencyOutgoing[d.id] ?? 0) > 0 ||
                      (orchestration.dependencyIncoming[d.id] ?? 0) > 0 ||
                      orchestration.detectedEdges.some((e) => e.decisionId === d.id))) ?
                    <div className="mt-1 text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-400">Dependencies </span>↑{" "}
                      {orchestration.dependencyOutgoing[d.id] ?? 0} · ↓ {orchestration.dependencyIncoming[d.id] ?? 0}
                      {orchestration.detectedEdges.some((e) => e.decisionId === d.id) ?
                        <span className="text-amber-200/85"> · heuristic edge detected</span>
                      : null}
                    </div>
                  : null}
                  {(orchestration?.conflictFindings?.some(
                    (c) => c.decisionIds[0] === d.id || c.decisionIds[1] === d.id,
                  ) ||
                    (d.metadata && typeof d.metadata === "object" && d.metadata.coreConflict === true)) ?
                    <div className="mt-1 text-[10px] text-rose-200/90">
                      Conflict — overlapping entity actions or contradictory signals flagged.
                    </div>
                  : null}
                  {orchestration?.nextRunByDecisionId[d.id] ?
                    <div className="mt-1 text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-400">Next re-eval </span>
                      {new Date(orchestration.nextRunByDecisionId[d.id]!).toLocaleString()}
                    </div>
                  : null}
                  {orchestration?.simulationsByDecisionId[d.id] ?
                    <div className="mt-1 rounded border border-zinc-800/70 bg-black/25 px-2 py-1 text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-400">Simulation (heuristic) </span>
                      ΔCTR {orchestration.simulationsByDecisionId[d.id]!.expectedCtrDelta.toFixed(4)} · Δconv{" "}
                      {orchestration.simulationsByDecisionId[d.id]!.expectedConversionDelta.toFixed(4)} · Δprofit{" "}
                      {orchestration.simulationsByDecisionId[d.id]!.expectedProfitDelta.toFixed(4)} · conf{" "}
                      {(orchestration.simulationsByDecisionId[d.id]!.confidence * 100).toFixed(0)}%
                      <ul className="mt-0.5 list-inside list-disc text-zinc-600">
                        {orchestration.simulationsByDecisionId[d.id]!.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                      {(orchestration.simulationsByDecisionId[d.id]!.notes ?? []).length > 0 ? (
                        <ul className="mt-0.5 list-inside list-disc text-zinc-600">
                          {orchestration.simulationsByDecisionId[d.id]!.notes!.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  : null}
                  {d.metadata && typeof d.metadata === "object" && Array.isArray(d.metadata.lifecycleHistory) ?
                    <details className="mt-1 text-[10px] text-zinc-600">
                      <summary className="cursor-pointer text-zinc-500">Lifecycle timeline</summary>
                      <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
                        {(
                          d.metadata.lifecycleHistory as { status: string; changedAt: string; reason?: string }[]
                        )
                          .filter((h) => typeof h?.status === "string" && typeof h?.changedAt === "string")
                          .map((h, i) => (
                            <li key={`${h.changedAt}-${i}`}>
                              {new Date(h.changedAt).toLocaleString()} · {h.status}
                              {h.reason ?
                                <span className="text-zinc-600"> · {h.reason}</span>
                              : null}
                            </li>
                          ))}
                      </ul>
                    </details>
                  : null}
                  <div className="mt-1 text-zinc-400">
                    Confidence {(d.confidenceScore * 100).toFixed(0)}%
                    {d.evidenceScore != null ? (
                      <span className="ml-2">· Evidence {(d.evidenceScore * 100).toFixed(0)}%</span>
                    ) : null}
                  </div>
                  {d.metadata && typeof d.metadata === "object" && "trustScore" in d.metadata ? (
                    <div className="mt-1 text-[10px] text-violet-200/90">
                      One Brain · trust {(Number(d.metadata.trustScore) * 100).toFixed(0)}%
                      {typeof d.metadata.sourceWeightApplied === "number" ?
                        <span> · weight ×{d.metadata.sourceWeightApplied.toFixed(2)}</span>
                      : null}{" "}
                      · ranking impact{" "}
                      {typeof d.metadata.rankingImpact === "number" ? d.metadata.rankingImpact.toFixed(2) : "—"} · exec{" "}
                      {String(d.metadata.executionAllowed) === "true" ? "allowed" : "blocked"}
                    </div>
                  ) : null}
                  {d.metadata && typeof d.metadata === "object" && "oneBrainAdaptationReason" in d.metadata ? (
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {String(d.metadata.oneBrainAdaptationReason).slice(0, 220)}
                    </p>
                  ) : null}
                  {d.source === "ADS" && d.metadata && typeof d.metadata === "object" ? (
                    <div className="mt-1 space-y-0.5 text-[10px] text-zinc-500">
                      {"geo" in d.metadata && d.metadata.geo != null ? (
                        <div>
                          <span className="font-semibold text-zinc-400">Geo: </span>
                          {typeof d.metadata.geo === "object" ? JSON.stringify(d.metadata.geo).slice(0, 160) : String(d.metadata.geo)}
                        </div>
                      ) : null}
                      {"learningSignals" in d.metadata && d.metadata.learningSignals != null ? (
                        <div>
                          <span className="font-semibold text-zinc-400">Learning: </span>
                          {JSON.stringify(d.metadata.learningSignals).slice(0, 120)}
                        </div>
                      ) : null}
                      {"loopId" in d.metadata && d.metadata.loopId != null ? (
                        <div>
                          <span className="font-semibold text-zinc-400">Loop: </span>
                          {String(d.metadata.loopId).slice(0, 24)}…
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {canApprove && d.status === "PENDING" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-emerald-800/60 px-2 py-1 text-[11px] text-emerald-200"
                        onClick={() => act("Approve", () => approvePlatformDecision(d.id))}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300"
                        onClick={() => act("Dismiss", () => dismissPlatformDecision(d.id))}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : null}
                  {canExecute && d.status === "APPROVED" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-cyan-800/60 px-2 py-1 text-[11px] text-cyan-200"
                        onClick={() => act("Execute (internal)", () => executePlatformDecision(d.id))}
                      >
                        Execute (internal)
                      </button>
                    </div>
                  ) : null}
                  {canExecute && d.status === "EXECUTED" ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="rounded border border-rose-900/50 px-2 py-1 text-[11px] text-rose-200"
                        onClick={() => act("Rollback", () => rollbackPlatformDecision(d.id, "operator rollback"))}
                      >
                        Rollback marker
                      </button>
                    </div>
                  ) : null}
                  <details className="mt-2 text-[10px] text-zinc-600">
                    <summary className="cursor-pointer">Details</summary>
                    <pre className="mt-1 max-h-28 overflow-auto rounded bg-black/30 p-2">{d.summary}</pre>
                  </details>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Task queue</h3>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {tasks.length === 0 ? (
              <li className="text-zinc-500">No tasks.</li>
            ) : (
              tasks.map((t) => (
                <li key={t.id} className="rounded border border-zinc-800/70 px-3 py-2">
                  <span className="text-zinc-200">{t.taskType}</span> · {t.status} · attempts {t.attemptCount}
                  {t.lastError ? <span className="ml-2 text-rose-300/90">{t.lastError}</span> : null}
                  {canMutate ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="text-[11px] text-zinc-400 underline"
                        onClick={() => act("Retry task", () => retryPlatformTask(t.id))}
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-zinc-400 underline"
                        onClick={() => act("Cancel task", () => cancelPlatformTask(t.id))}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Audit timeline</h3>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-[11px] text-zinc-500">
            {audit.map((a) => (
              <li key={a.id} className="border-b border-zinc-800/50 py-1">
                <span className="text-zinc-400">{new Date(a.createdAt).toLocaleString()}</span> · {a.eventType}:{" "}
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="font-mono text-sm text-zinc-100">{value}</div>
    </div>
  );
}
