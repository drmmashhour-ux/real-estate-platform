"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssistantFeedResponse } from "@/modules/operator/assistant-aggregator.service";
import { buildGuardrailExplanation } from "@/modules/operator/assistant-explanation.service";
import { getOperatorQueue } from "@/modules/operator/operator-action-queue.service";
import { badgeLabel, getRecommendationSafetyBadges } from "@/modules/operator/recommendation-badges";
import {
  approveRecommendation,
  dismissRecommendation,
  executeApprovedBudgetSyncAction,
  simulateApprovedBudgetSyncAction,
} from "@/lib/operator/admin-actions";
import { whyPrioritizedLine } from "@/modules/operator/operator-priority.service";
import type { LatestSyncSummary } from "@/modules/operator/operator-external-sync.repository";
import { isExternallySyncableBudgetAction } from "@/modules/operator/operator-execution.types";
import type { ProviderConfigHealth } from "@/modules/operator/provider-sync/provider-config.service";

function confidenceClass(label: string) {
  if (label === "HIGH") return "border-emerald-600/60 bg-emerald-950/40 text-emerald-100";
  if (label === "MEDIUM") return "border-amber-600/50 bg-amber-950/35 text-amber-100";
  return "border-zinc-600/60 bg-zinc-900/50 text-zinc-300";
}

function evidenceClass(q: string | null | undefined) {
  if (q === "HIGH") return "border-sky-600/50 bg-sky-950/30 text-sky-100";
  if (q === "MEDIUM") return "border-zinc-600/50 bg-zinc-900/40 text-zinc-200";
  return "border-zinc-700/50 bg-zinc-950/40 text-zinc-400";
}

export function AiAssistantLayerSection({
  feed,
  canApprove,
  operatorV2,
}: {
  feed: AssistantFeedResponse;
  canApprove: boolean;
  operatorV2?: {
    providerHealth: ProviderConfigHealth;
    latestSyncByRecommendationId: Record<string, LatestSyncSummary>;
  };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [v2Result, setV2Result] = useState<Record<string, string | null>>({});
  const queue = getOperatorQueue(feed);
  const scoredById = new Map((feed.operatorV2ScoredPreview ?? []).map((s) => [s.id, s]));
  const v2Plan = feed.operatorV2ExecutionPlan;
  const v2Sim = feed.operatorV2Simulation;

  async function onApprove(id: string) {
    setMsg(null);
    const r = await approveRecommendation(id);
    setMsg(r.ok ? "Recorded approval (manual action still required in external tools)." : r.error ?? "Failed");
    if (r.ok) router.refresh();
  }

  async function onDismiss(id: string) {
    setMsg(null);
    const r = await dismissRecommendation(id);
    setMsg(r.ok ? "Dismissal logged." : r.error ?? "Failed");
    if (r.ok) router.refresh();
  }

  return (
    <section
      className="rounded-2xl border border-violet-900/40 bg-violet-950/15 p-5 sm:p-6"
      data-ai-assistant-layer
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/90">AI recommendations</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Operator assistant layer</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Explainable AI recommendations only — manual review required before budgets, pricing, listings, or compliance
            changes. Nothing here auto-executes on ad platforms or payments.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-xs sm:text-sm">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
            <div className="text-zinc-500">Total signals</div>
            <div className="font-mono text-zinc-100">{feed.summaryCounts.total}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
            <div className="text-zinc-500">Blocked</div>
            <div className="font-mono text-rose-200">{feed.summaryCounts.blocked}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
            <div className="text-zinc-500">Conflicts</div>
            <div className="font-mono text-amber-200">{feed.summaryCounts.conflicts}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
            <div className="text-zinc-500">Monitor</div>
            <div className="font-mono text-zinc-200">{feed.summaryCounts.monitoring}</div>
          </div>
        </div>
      </div>

      {feed.subsystemWarnings.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-800/50 bg-amber-950/25 px-3 py-2 text-xs text-amber-100">
          <span className="font-semibold">Partial data: </span>
          {feed.subsystemWarnings.join(" · ")}
        </div>
      ) : null}
      {feed.persistWarnings.length > 0 ? (
        <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
          {feed.persistWarnings.join(" · ")}
        </div>
      ) : null}
      {msg ? <p className="mt-3 text-sm text-emerald-300/90">{msg}</p> : null}

      {v2Plan || v2Sim ? (
        <div className="mt-4 space-y-3 rounded-xl border border-violet-800/40 bg-zinc-950/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/90">
            Operator V2 — execution brain
          </div>
          {v2Plan ? (
            <div className="text-sm text-zinc-300">
              <p>
                Ranked batch: <span className="font-mono text-zinc-100">{v2Plan.ordered.length}</span> action(s) in
                plan · Approved (guardrails):{" "}
                <span className="font-mono text-zinc-100">{v2Plan.approvedCount}</span> · Blocked:{" "}
                <span className="font-mono text-rose-200/90">{v2Plan.blockedCount}</span>
              </p>
              {v2Plan.conflicts.length > 0 ? (
                <details className="mt-2 text-xs text-zinc-400">
                  <summary className="cursor-pointer text-amber-200/90">
                    Conflicts resolved ({v2Plan.conflicts.length}) — dropped lower priority
                  </summary>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {v2Plan.conflicts.map((c) => (
                      <li key={c.conflictGroup}>
                        <span className="font-mono text-zinc-200">{c.conflictGroup}</span>: kept{" "}
                        {c.keptRecommendationId} — {c.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {v2Plan.notes.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
                  {v2Plan.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {v2Sim ? (
            <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-300">Simulation preview ({v2Sim.label})</div>
              <p className="mt-1 text-zinc-500">
                CTR Δ ≈ {v2Sim.ctrDeltaApprox} · Conv Δ ≈ {v2Sim.conversionDeltaApprox} · Profit Δ ≈{" "}
                {v2Sim.profitDeltaApprox} — heuristic only, not a guarantee.
              </p>
              {v2Sim.risks.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-amber-200/85">
                  {v2Sim.risks.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              ) : null}
              {v2Sim.notes.map((n) => (
                <p key={n} className="mt-1 text-zinc-600">
                  {n}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {operatorV2 ? (
        <div className="mt-4 rounded-lg border border-cyan-900/40 bg-cyan-950/20 px-3 py-2 text-[11px] text-zinc-400">
          <div className="font-semibold text-cyan-200/90">Operator V2 — external ad budget sync</div>
          <p className="mt-1 text-zinc-500">
            External sync requires approval · Dry-run available · No auto-spend · Live writes need feature flags + validated
            credentials
          </p>
          <p className="mt-1">
            Meta:{" "}
            <span className={operatorV2.providerHealth.metaConfigured ? "text-emerald-300/90" : "text-amber-200/90"}>
              {operatorV2.providerHealth.metaConfigured ? "env detected" : "not configured"}
            </span>
            {" · "}
            Google:{" "}
            <span className={operatorV2.providerHealth.googleConfigured ? "text-emerald-300/90" : "text-amber-200/90"}>
              {operatorV2.providerHealth.googleConfigured ? "env detected" : "not configured"}
            </span>
          </p>
          {operatorV2.providerHealth.warnings.length > 0 ? (
            <p className="mt-1 text-amber-200/80">{operatorV2.providerHealth.warnings.join(" ")}</p>
          ) : null}
          {typeof feed.operatorV2BudgetSyncEligibleCount === "number" ? (
            <p className="mt-1 text-zinc-500">
              SCALE/PAUSE signals eligible for prep:{" "}
              <span className="font-mono text-zinc-200">{feed.operatorV2BudgetSyncEligibleCount}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Top recommendations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {feed.topRecommendations.map((r) => {
            const badges = getRecommendationSafetyBadges(r, null);
            const scored = scoredById.get(r.id);
            return (
              <article key={r.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${confidenceClass(r.confidenceLabel)}`}>
                    {r.confidenceLabel} confidence
                  </span>
                  {r.evidenceQuality ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${evidenceClass(r.evidenceQuality)}`}
                    >
                      Evidence: {r.evidenceQuality}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                    {r.source}
                  </span>
                  {scored ? (
                    <>
                      <span className="rounded-full border border-fuchsia-900/50 bg-fuchsia-950/30 px-2 py-0.5 text-[10px] text-fuchsia-100/90">
                        Priority {scored.priorityScore.toFixed(1)}
                      </span>
                      <span className="rounded-full border border-sky-900/40 bg-sky-950/25 px-2 py-0.5 text-[10px] text-sky-100/90">
                        Trust {(scored.trustScore * 100).toFixed(0)}%
                      </span>
                      {scored.conflictGroup ? (
                        <span
                          className="rounded-full border border-amber-800/50 bg-amber-950/30 px-2 py-0.5 text-[10px] text-amber-100/90"
                          title="Conflict group — other items in this group were dropped if lower priority"
                        >
                          Conflict: {scored.conflictGroup}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
                {scored ? (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    <span className="font-semibold text-zinc-300">Why prioritized: </span>
                    {whyPrioritizedLine(scored)}
                  </p>
                ) : null}
                <h4 className="mt-2 text-base font-medium text-zinc-100">{r.title}</h4>
                <p className="mt-1 text-sm text-zinc-400">{r.summary}</p>
                <p className="mt-2 text-xs text-zinc-500">{r.reason}</p>
                {r.expectedImpact ? (
                  <p className="mt-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">Expected impact: </span>
                    {r.expectedImpact}
                  </p>
                ) : null}
                {r.operatorAction ? (
                  <p className="mt-2 text-xs text-violet-200/90">
                    <span className="font-semibold">Suggested operator action: </span>
                    {r.operatorAction}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {badges.map((b) => (
                    <span key={b} className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                      {badgeLabel(b)}
                    </span>
                  ))}
                </div>
                {(r.warnings?.length || r.blockers?.length) ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-amber-200/90">
                    {r.blockers?.map((x) => (
                      <li key={`b-${x}`}>{x}</li>
                    ))}
                    {r.warnings?.map((x) => (
                      <li key={`w-${x}`}>{x}</li>
                    ))}
                  </ul>
                ) : null}
                {operatorV2 && isExternallySyncableBudgetAction(r.actionType) ? (
                  <div className="mt-3 rounded-lg border border-cyan-900/35 bg-black/25 p-3 text-[11px] text-zinc-400">
                    <div className="flex flex-wrap items-center gap-2 text-zinc-300">
                      <span className="rounded border border-cyan-800/50 px-1.5 py-0.5 text-[10px] uppercase text-cyan-200/90">
                        V2 budget sync
                      </span>
                      <span className="text-zinc-500">Provider mapping required — run simulate to validate payload</span>
                    </div>
                    {operatorV2.latestSyncByRecommendationId[r.id] ? (
                      <p className="mt-2 text-zinc-500">
                        Last log:{" "}
                        <span className="text-zinc-300">{operatorV2.latestSyncByRecommendationId[r.id].provider}</span> ·{" "}
                        {operatorV2.latestSyncByRecommendationId[r.id].dryRun ? "dry-run" : "live attempt"} ·{" "}
                        {operatorV2.latestSyncByRecommendationId[r.id].success ? "reported success" : "no success"} ·{" "}
                        {new Date(operatorV2.latestSyncByRecommendationId[r.id].createdAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-2 text-zinc-500">No external sync logs for this recommendation yet.</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-cyan-800/60 bg-cyan-950/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-900/40"
                        onClick={async () => {
                          setV2Result((s) => ({ ...s, [r.id]: "…" }));
                          const out = await simulateApprovedBudgetSyncAction(r.id);
                          if (!out.ok) {
                            setV2Result((s) => ({ ...s, [r.id]: out.error ?? "Failed" }));
                            return;
                          }
                          const o = out.result;
                          const g = o.guardrails;
                          const guardLine =
                            g.allowed ?
                              `Guardrails: OK. Warnings: ${g.warnings.join("; ") || "none"}.`
                            : `Blocked: ${g.blockingReasons.join("; ")}`;
                          const sim = o.simulation;
                          const simLine = sim
                            ? `Simulation: ${sim.success ? "dry-run ok" : "dry-run issue"} — ${sim.message}`
                            : "";
                          setV2Result((s) => ({
                            ...s,
                            [r.id]: `${o.phase.toUpperCase()} · ${guardLine} ${simLine}`.trim(),
                          }));
                          router.refresh();
                        }}
                      >
                        Simulate (dry-run)
                      </button>
                      {canApprove ? (
                        <button
                          type="button"
                          className="rounded border border-emerald-900/50 bg-emerald-950/25 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-900/35"
                          onClick={async () => {
                            setV2Result((s) => ({ ...s, [r.id]: "…" }));
                            const out = await executeApprovedBudgetSyncAction(r.id);
                            if (!out.ok) {
                              setV2Result((s) => ({ ...s, [r.id]: out.error ?? "Failed" }));
                              return;
                            }
                            const o = out.result;
                            const ex = o.execution;
                            const line =
                              o.phase === "executed" && ex?.success ?
                                "Outbound call finished with adapter-reported success — verify in the ad platform."
                              : o.phase === "executed" || o.phase === "failed" ?
                                `${o.message}${ex ? ` (${ex.dryRun ? "unexpected dry-run" : "live attempt"})` : ""}`
                              : `${o.phase}: ${o.message}`;
                            setV2Result((s) => ({ ...s, [r.id]: line }));
                            router.refresh();
                          }}
                        >
                          Execute sync (admin, requires approval)
                        </button>
                      ) : null}
                    </div>
                    {v2Result[r.id] ? (
                      <p className="mt-2 whitespace-pre-wrap text-[11px] text-zinc-300">{v2Result[r.id]}</p>
                    ) : null}
                  </div>
                ) : null}
                {canApprove ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/50"
                      onClick={() => onApprove(r.id)}
                    >
                      Approve (log only)
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                      onClick={() => onDismiss(r.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-zinc-500">Admin approvals are disabled or your role cannot log approvals.</p>
                )}
                <details className="mt-3 text-xs text-zinc-500">
                  <summary className="cursor-pointer text-zinc-400">Technical details</summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/30 p-2 text-[10px] leading-relaxed">
                    {JSON.stringify({ id: r.id, actionType: r.actionType, metrics: r.metrics }, null, 2)}
                  </pre>
                </details>
              </article>
            );
          })}
        </div>
        {feed.topRecommendations.length === 0 ? (
          <p className="text-sm text-zinc-500">No prioritized recommendations right now — check monitoring or enable more growth subsystems.</p>
        ) : null}
      </div>

      {feed.blockedRecommendations.length > 0 ? (
        <div className="mt-10 space-y-3">
          <h3 className="text-sm font-semibold text-rose-200/90">Blocked by guardrails</h3>
          <p className="text-xs text-zinc-500">
            These AI recommendations are visible for transparency but must not be treated as ready to execute.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {feed.blockedRecommendations.map(({ recommendation: r, guardrail }) => {
              const badges = getRecommendationSafetyBadges(r, guardrail);
              return (
                <article key={r.id} className="rounded-xl border border-rose-900/50 bg-rose-950/15 p-4">
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <span
                        key={b}
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          b === "blocked_by_guardrails" ? "bg-rose-900/50 text-rose-100" : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {badgeLabel(b)}
                      </span>
                    ))}
                  </div>
                  <h4 className="mt-2 text-sm font-medium text-zinc-100">{r.title}</h4>
                  <p className="mt-1 text-xs text-rose-100/90">{buildGuardrailExplanation(r, guardrail)}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {feed.conflicts.length > 0 ? (
        <div className="mt-10 space-y-3">
          <h3 className="text-sm font-semibold text-amber-200/90">Conflicts to reconcile</h3>
          <ul className="space-y-3">
            {feed.conflicts.map((c, i) => (
              <li key={`${c.targetId}-${i}`} className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm">
                <div className="text-xs font-semibold uppercase text-amber-300/90">{c.severity} severity</div>
                <p className="mt-1 text-zinc-200">
                  Target: <span className="font-mono text-zinc-100">{c.targetId ?? "—"}</span>
                </p>
                <p className="text-xs text-zinc-400">Actions: {c.actionTypes.join(" vs ")}</p>
                <p className="text-xs text-zinc-400">Sources: {c.sources.join(", ")}</p>
                <p className="mt-2 text-xs text-zinc-300">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Monitoring & queue preview</h3>
        <p className="text-xs text-zinc-500">Lower urgency items and merged operator ordering (informational).</p>
        <ul className="space-y-2 text-sm text-zinc-400">
          {feed.monitoringOnly.map((r) => (
            <li key={r.id} className="rounded border border-zinc-800/80 bg-zinc-950/30 px-3 py-2">
              <span className="text-zinc-200">{r.title}</span>
              <span className="ml-2 text-xs text-zinc-500">({r.source})</span>
            </li>
          ))}
        </ul>
        {queue.length > 0 ? (
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer text-zinc-400">Operator queue order ({queue.length})</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              {queue.slice(0, 12).map((r) => (
                <li key={r.id}>{r.title}</li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </section>
  );
}
