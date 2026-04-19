"use client";

import * as React from "react";
import Link from "next/link";
import type {
  GrowthAutonomyApiRolloutStatus,
  GrowthAutonomySnapshot,
  GrowthAutonomyRolloutStage,
} from "@/modules/growth/growth-autonomy.types";
import {
  GROWTH_AUTONOMY_DEBUG_QUERY,
  shouldShowGrowthAutonomyDebugUi,
} from "@/modules/growth/growth-autonomy-debug";
import type { GrowthAutonomyMonitoringState } from "@/modules/growth/growth-autonomy-monitoring.service";
import { GrowthAutonomyRolloutStatusPanel } from "./GrowthAutonomyRolloutStatusPanel";
import { GrowthAutonomyValidationChecklist } from "./GrowthAutonomyValidationChecklist";
import { GrowthAutonomyTestScenariosPanel } from "./GrowthAutonomyTestScenariosPanel";
import type { GrowthAutonomyAutoLowRiskRolloutStage } from "@/modules/growth/growth-autonomy-auto.types";
import { GrowthAutonomyAutoLowRiskPanel } from "./GrowthAutonomyAutoLowRiskPanel";
import { GrowthAutonomyExpansionPanel } from "./GrowthAutonomyExpansionPanel";
import { GrowthAutonomyLearningPanel } from "./GrowthAutonomyLearningPanel";
import { GrowthAutonomyTrialApprovalPanel } from "./GrowthAutonomyTrialApprovalPanel";
import { GrowthAutonomyTrialResultsPanel } from "./GrowthAutonomyTrialResultsPanel";

/** Badge text — freeze stays explicit (never collapsed into generic “blocked”). */
function dispositionBadgeLabel(s: GrowthAutonomySnapshot["suggestions"][0]): string {
  if (s.enforcementTargetMode === "freeze") return "frozen (policy)";
  return s.disposition.replace(/_/g, " ");
}

function outcomeExplanationLabel(s: GrowthAutonomySnapshot["suggestions"][0]): string {
  if (s.disposition === "blocked") {
    return s.enforcementTargetMode === "freeze" ? "Why frozen:" : "Why blocked:";
  }
  if (s.disposition === "approval_required") return "Why review is required:";
  return "Why allowed / advisory:";
}

function dispositionStyles(d: GrowthAutonomySnapshot["suggestions"][0]["disposition"]): string {
  switch (d) {
    case "blocked":
      return "border-rose-800/55 bg-rose-950/30 text-rose-100";
    case "approval_required":
      return "border-amber-700/50 bg-amber-950/35 text-amber-100";
    case "prefilled_action":
    case "prefilled_only":
      return "border-emerald-800/45 bg-emerald-950/25 text-emerald-100";
    case "suggest_only":
      return "border-sky-800/45 bg-sky-950/25 text-sky-100";
    default:
      return "border-zinc-700 bg-zinc-900/70 text-zinc-400";
  }
}

function sendAutonomyTelemetry(event: "prefill_navigate" | "prefill_copy") {
  void fetch("/api/growth/autonomy/telemetry", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

export function GrowthAutonomyPanel({
  locale,
  country,
  autonomyEnabled,
  panelEnabled,
  killSwitch,
  rolloutStage,
  enforcementEnabled,
  enforcementLayerFlagOn,
  viewerIsAdmin,
  viewerGrowthAutonomyPilotAccess,
  learningFeatureEnabled = false,
  learningPanelVisible = false,
  autoLowRiskFeatureEnabled = false,
  autoLowRiskPanelVisible = false,
  autoLowRiskRolloutStage = "off" as GrowthAutonomyAutoLowRiskRolloutStage,
  expansionFeatureEnabled = false,
  expansionPanelVisible = false,
  trialFeatureEnabled = false,
  trialPanelVisible = false,
}: {
  locale: string;
  country: string;
  autonomyEnabled: boolean;
  panelEnabled: boolean;
  killSwitch: boolean;
  rolloutStage: GrowthAutonomyRolloutStage;
  enforcementEnabled: boolean;
  /** Policy enforcement feature flag — same cohort as Growth Machine policy layer. */
  enforcementLayerFlagOn: boolean;
  viewerIsAdmin: boolean;
  /** Server: admin, allowlisted internal operator, or non-production equivalent. */
  viewerGrowthAutonomyPilotAccess: boolean;
  learningFeatureEnabled?: boolean;
  learningPanelVisible?: boolean;
  autoLowRiskFeatureEnabled?: boolean;
  autoLowRiskPanelVisible?: boolean;
  autoLowRiskRolloutStage?: GrowthAutonomyAutoLowRiskRolloutStage;
  expansionFeatureEnabled?: boolean;
  expansionPanelVisible?: boolean;
  trialFeatureEnabled?: boolean;
  trialPanelVisible?: boolean;
}) {
  const [snapshot, setSnapshot] = React.useState<GrowthAutonomySnapshot | null>(null);
  const [internalGate, setInternalGate] = React.useState<string | null>(null);
  const [disabledMsg, setDisabledMsg] = React.useState<string | null>(null);
  const [monitoring, setMonitoring] = React.useState<GrowthAutonomyMonitoringState | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [showDebug, setShowDebug] = React.useState(false);
  const [apiRolloutStatus, setApiRolloutStatus] = React.useState<GrowthAutonomyApiRolloutStatus | null>(null);

  const growthBase = `/${locale}/${country}/dashboard/growth`;
  const showOperatorValidation = viewerGrowthAutonomyPilotAccess || viewerIsAdmin || showDebug;
  const showValidationNotesOnly = viewerGrowthAutonomyPilotAccess || viewerIsAdmin;

  React.useEffect(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get(
      GROWTH_AUTONOMY_DEBUG_QUERY,
    );
    setShowDebug(shouldShowGrowthAutonomyDebugUi(q));
  }, []);

  React.useEffect(() => {
    if (!autonomyEnabled || killSwitch) {
      setSnapshot(null);
      setInternalGate(null);
      setDisabledMsg(null);
      setMonitoring(null);
      setApiRolloutStatus(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void fetch(
      `/api/growth/autonomy?locale=${encodeURIComponent(locale)}&country=${encodeURIComponent(country)}${showDebug ? `&${GROWTH_AUTONOMY_DEBUG_QUERY}=1` : ""}`,
      {
        credentials: "same-origin",
      },
    )
      .then(async (r) => {
        const j = (await r.json()) as {
          autonomyLayerEnabled?: boolean;
          killSwitchActive?: boolean;
          operatorMessage?: string;
          internalGateBlocked?: boolean;
          snapshot?: GrowthAutonomySnapshot | null;
          operationalMonitoring?: GrowthAutonomyMonitoringState;
          rolloutStatus?: GrowthAutonomyApiRolloutStatus;
        };
        if (!cancelled && j.rolloutStatus) setApiRolloutStatus(j.rolloutStatus);
        if (!r.ok) throw new Error((j as { operatorMessage?: string }).operatorMessage ?? "Autonomy unavailable");
        if (j.internalGateBlocked) {
          if (!cancelled) {
            setInternalGate(j.operatorMessage ?? "Access restricted.");
            setSnapshot(null);
            setMonitoring(j.operationalMonitoring ?? null);
          }
          return;
        }
        if (j.snapshot) {
          if (!cancelled) {
            setDisabledMsg(null);
            setInternalGate(null);
            setSnapshot(j.snapshot);
            setMonitoring(j.operationalMonitoring ?? null);
          }
          return;
        }
        if (j.killSwitchActive || j.autonomyLayerEnabled === false) {
          if (!cancelled) {
            setDisabledMsg(j.operatorMessage ?? "Autonomy disabled.");
            setSnapshot(null);
            setMonitoring(null);
          }
          return;
        }
        if (!cancelled) {
          setDisabledMsg(null);
          setInternalGate(null);
          setMonitoring(j.operationalMonitoring ?? null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autonomyEnabled, killSwitch, locale, country, showDebug]);

  async function copyText(text: string, meta?: { suggestionId: string; categoryId: string; targetKey: string }) {
    try {
      await navigator.clipboard.writeText(text);
      sendAutonomyTelemetry("prefill_copy");
      if (learningFeatureEnabled && !killSwitch && meta) {
        void postGrowthAutonomyLearningEvent({
          suggestionId: meta.suggestionId,
          categoryId: meta.categoryId,
          targetKey: meta.targetKey,
          kind: "interaction",
        });
      }
    } catch {
      /* noop */
    }
  }

  const rolloutProps = {
    rolloutStage,
    autonomyEnabled,
    panelEnabled,
    killSwitch,
    enforcementLayerFlagOn,
    viewerGrowthAutonomyPilotAccess,
    apiRolloutStatus,
    snapshotSummary:
      snapshot ?
        {
          createdAt: snapshot.createdAt,
          enforcementInputPartial: snapshot.enforcementInputPartial,
          operatorNotesCount: snapshot.operatorNotes.length,
          warningAttentionCount: snapshot.counts.blocked + snapshot.counts.approvalRequired,
        }
      : null,
    enforcementSnapshotPresent: snapshot?.enforcementSnapshotPresent,
  };

  const validationBlock =
    showOperatorValidation ?
      <>
        <GrowthAutonomyValidationChecklist showValidationNotes={showValidationNotesOnly} />
        <GrowthAutonomyTestScenariosPanel />
      </>
    : null;

  if (killSwitch) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <section className="rounded-xl border border-red-900/45 bg-red-950/15 px-4 py-3" aria-label="Growth autonomy kill switch">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300">Growth autonomy — suppressed</p>
          <p className="mt-2 text-xs leading-relaxed text-red-100/90">
            Kill switch is active (<code className="rounded bg-black/40 px-1">FEATURE_GROWTH_AUTONOMY_KILL_SWITCH</code>). No
            autonomy suggestions are evaluated and the autonomy API does not return snapshots for this UI. Nothing in this
            section performs writes or automatic execution — the rest of the dashboard is unchanged.
          </p>
          {validationBlock}
        </section>
      </div>
    );
  }

  if (!autonomyEnabled) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <section className="rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-4 py-3" aria-label="Growth autonomy disabled">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Growth autonomy</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            Internal: autonomy layer is off. Set{" "}
            <code className="rounded bg-zinc-900 px-1 font-mono text-[10px]">FEATURE_GROWTH_AUTONOMY_V1=true</code> for OFF /
            ASSIST / SAFE_AUTOPILOT orchestration (advisory-only).
          </p>
          {validationBlock}
        </section>
      </div>
    );
  }

  if (!panelEnabled) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <section className="rounded-xl border border-indigo-900/40 bg-indigo-950/15 px-4 py-3" aria-label="Growth autonomy panel flag">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">Growth autonomy</p>
          <p className="mt-2 text-xs text-indigo-100/85">
            Panel UI is hidden — enable{" "}
            <code className="rounded bg-black/30 px-1 font-mono text-[10px]">FEATURE_GROWTH_AUTONOMY_PANEL_V1</code> to show
            the full snapshot table. Orchestration may still run server-side when autonomy v1 is on.
          </p>
          {validationBlock}
        </section>
      </div>
    );
  }

  if (internalGate) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <section className="rounded-xl border border-amber-900/45 bg-amber-950/15 px-4 py-3" aria-label="Growth autonomy internal gate">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">Growth autonomy — internal rollout</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-100/90">{internalGate}</p>
          {!viewerGrowthAutonomyPilotAccess ? (
            <p className="mt-2 text-[11px] text-zinc-500">
              Your account is not in the internal pilot cohort for production ({rolloutStage} stage). Use an admin account,
              add your user id to <code className="rounded bg-black/30 px-1 text-[10px]">GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS</code>
              , set <code className="rounded bg-black/30 px-1 text-[10px]">NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI=1</code>, or use{" "}
              <code className="rounded bg-black/30 px-1 text-[10px]">?growthAutonomyDebug=1</code>.
            </p>
          ) : null}
          {showDebug && monitoring ? (
            <pre className="mt-3 max-h-32 overflow-auto rounded border border-zinc-800 p-2 font-mono text-[10px] text-zinc-500">
              {JSON.stringify(monitoring, null, 0)}
            </pre>
          ) : null}
          {validationBlock}
        </section>
      </div>
    );
  }

  if (loading && !snapshot) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <p className="text-sm text-zinc-500">Loading autonomy snapshot…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <p className="text-sm text-red-400">{err}</p>
      </div>
    );
  }

  if (disabledMsg && !snapshot) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <section className="rounded-xl border border-zinc-700 px-4 py-3">
          <p className="text-xs text-zinc-400">{disabledMsg}</p>
        </section>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-3">
        <GrowthAutonomyRolloutStatusPanel {...rolloutProps} snapshotSummary={null} enforcementSnapshotPresent={undefined} />
        <p className="text-sm text-zinc-500">No autonomy snapshot returned — check flags and API access.</p>
      </div>
    );
  }

  const visibleSuggestions = snapshot.suggestions.filter((s) => s.disposition !== "hidden");

  return (
    <div className="space-y-3">
      <GrowthAutonomyRolloutStatusPanel {...rolloutProps} />
      {validationBlock}
      <section
        className="rounded-xl border border-indigo-900/35 bg-indigo-950/15 p-4"
        aria-label="Growth autonomy snapshot"
      >
        {!snapshot.autonomyLayerEnabled ? (
          <p className="mb-3 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2 text-[11px] text-amber-100/90">
            Autonomy layer is in a <span className="font-semibold">disabled</span> rollout state — see operator notes below.
            No autonomous execution is implied.
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-indigo-100">Growth autonomy</h3>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded-full border border-indigo-800/50 px-2 py-0.5 font-medium text-indigo-100">
              Mode: {snapshot.autonomyMode}
            </span>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300">Rollout: {snapshot.rolloutStage}</span>
            {!enforcementEnabled || !snapshot.enforcementSnapshotPresent ? (
              <span className="rounded-full border border-amber-800/50 px-2 py-0.5 text-amber-100">Enforcement: reduced</span>
            ) : snapshot.enforcementInputPartial ? (
              <span className="rounded-full border border-amber-800/50 px-2 py-0.5 text-amber-100">Enforcement: partial</span>
            ) : (
              <span className="rounded-full border border-emerald-800/45 px-2 py-0.5 text-emerald-100">Enforcement: on</span>
            )}
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          <span className="font-semibold text-zinc-400">Suggestion vs execution:</span> most rows stay advisory or
          navigation/copy. When{" "}
          <code className="rounded bg-black/30 px-1 font-mono text-[10px]">FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1</code>{" "}
          is on, a tiny allowlisted set may auto-create internal-only records (tasks / drafts / reminders) — never
          payments, bookings core, ads, CRO, pricing, external sends, or listing publication.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Advisory-first — reversible rollout via flags. This system does <span className="text-zinc-400">not</span> control
          payments, booking core, ads core, CRO core, unsafe outbound messaging, or risky live mutations.
        </p>

        {!enforcementEnabled || !snapshot.enforcementSnapshotPresent ? (
          <p className="mt-2 rounded-lg border border-amber-900/35 bg-black/25 p-2 text-[11px] text-amber-100/90">
            Policy enforcement is off or unavailable — autonomy runs with reduced guardrails. Prefer enabling{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-[10px]">FEATURE_GROWTH_POLICY_ENFORCEMENT_V1</code>{" "}
            before widening rollout.
          </p>
        ) : null}

        {snapshot.enforcementInputPartial ? (
          <p className="mt-2 text-[11px] text-amber-200/85">
            Partial enforcement inputs — treat modes and counts as directional, not definitive.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-sky-800/45 bg-sky-950/20 px-2 py-0.5 text-sky-100">
            Surfaced: {snapshot.counts.surfaced}
          </span>
          <span className="rounded-full border border-rose-800/45 bg-rose-950/25 px-2 py-0.5 text-rose-100">
            Blocked: {snapshot.counts.blocked}
          </span>
          <span className="rounded-full border border-amber-800/45 bg-amber-950/25 px-2 py-0.5 text-amber-100">
            Review: {snapshot.counts.approvalRequired}
          </span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">
            Hidden (mode): {snapshot.counts.hidden}
          </span>
          <span className="rounded-full border border-emerald-800/35 px-2 py-0.5 text-emerald-100">
            Prefills: {snapshot.counts.prefilled}
          </span>
        </div>

        <p className="mt-3 rounded-lg border border-zinc-800 bg-black/30 p-2 text-[10px] leading-relaxed text-zinc-400">
          <span className="font-semibold text-zinc-300">Policy paths:</span> Rows labeled{" "}
          <span className="text-rose-200/90">blocked</span> or <span className="text-rose-200/90">frozen (policy)</span> mean
          that target is not cleared — read the explanation before acting.{" "}
          <span className="text-amber-200/90">Approval required</span> means a recorded human decision before promotion.
          Suggest-only and prefilled rows still <span className="text-zinc-300">never auto-execute</span> from this panel
          (navigate or copy only).
        </p>

        {learningPanelVisible && snapshot.learning ? (
          <div className="mt-3">
            <GrowthAutonomyLearningPanel
              learning={snapshot.learning}
              viewerIsAdmin={viewerIsAdmin}
              killSwitch={killSwitch}
              debugMode={showDebug}
            />
          </div>
        ) : null}

        {autoLowRiskFeatureEnabled && autoLowRiskPanelVisible ? (
          <GrowthAutonomyAutoLowRiskPanel
            locale={locale}
            country={country}
            rolloutStage={autoLowRiskRolloutStage}
            viewerIsAdmin={viewerIsAdmin}
          />
        ) : null}

        {expansionFeatureEnabled && expansionPanelVisible ? (
          <GrowthAutonomyExpansionPanel viewerIsAdmin={viewerIsAdmin} />
        ) : null}

        {trialFeatureEnabled && trialPanelVisible && snapshot.trial ?
          <GrowthAutonomyTrialApprovalPanel
            trial={snapshot.trial}
            rolloutStage={snapshot.rolloutStage}
            viewerMayMutate={viewerIsAdmin || viewerGrowthAutonomyPilotAccess}
          />
        : null}

        {trialFeatureEnabled && trialPanelVisible ? <GrowthAutonomyTrialResultsPanel /> : null}

        {showDebug && snapshot.trial ?
          <pre className="mt-3 max-h-48 overflow-auto rounded border border-zinc-800 p-2 font-mono text-[10px] text-zinc-500">
            autonomy_trial_debug={JSON.stringify(snapshot.trial, null, 0)}
          </pre>
        : null}

        {snapshot.operatorNotes.length > 0 ? (
          <ul className="mt-3 list-inside list-disc space-y-1 text-[11px] text-zinc-400">
            {snapshot.operatorNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 text-[10px] text-zinc-500">
          <span className="font-semibold text-zinc-400">Snapshot health:</span> built at{" "}
          <time dateTime={snapshot.createdAt}>{new Date(snapshot.createdAt).toLocaleString()}</time>
          {" · "}
          partial inputs: {snapshot.enforcementInputPartial ? "yes" : "no"}
          {" · "}
          operator notes: {snapshot.operatorNotes.length}
          {" · "}
          attention rows: {snapshot.counts.blocked + snapshot.counts.approvalRequired}
        </p>

        <div className="mt-4 space-y-3">
          {visibleSuggestions.length === 0 ? (
            <p className="text-sm text-zinc-500">No visible suggestions (mode OFF or all hidden).</p>
          ) : (
            visibleSuggestions.map((s) => (
              <div key={s.id} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{s.label}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${dispositionStyles(s.disposition)}`}
                  >
                    {dispositionBadgeLabel(s)}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  {s.actionType} · target:{s.targetKey} · enf:{s.enforcementTargetMode} · conf:{s.confidence.toFixed(2)}
                  {s.execution ?
                    <>
                      {" "}
                      · exec:{s.execution.resolvedExecutionClass}
                    </>
                  : null}
                </p>
                {s.execution?.downgradeExplanation ?
                  <p className="mt-1 text-[10px] text-zinc-500">{s.execution.downgradeExplanation}</p>
                : null}
                <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
                  <p>
                    <span className="font-semibold text-zinc-300">Why suggested:</span> {s.explanation.whySuggested}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-300">{outcomeExplanationLabel(s)}</span>{" "}
                    {s.explanation.whyBlockedOrAllowed}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-300">Next step:</span> {s.explanation.whatNext}
                  </p>
                  <p className="text-zinc-500">Policy signal: {s.policyNote}</p>
                  {s.learningNote ? (
                    <p className="text-[10px] text-violet-300/90">
                      <span className="font-semibold text-violet-400">Learning:</span> {s.learningNote}
                    </p>
                  ) : null}
                  {learningFeatureEnabled && !killSwitch && s.disposition !== "hidden" ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-2">
                      <span className="text-[10px] text-zinc-500">Was this helpful?</span>
                      <button
                        type="button"
                        className="rounded border border-emerald-800/50 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-950/40"
                        onClick={() =>
                          void postGrowthAutonomyLearningEvent({
                            suggestionId: s.id,
                            categoryId: s.id,
                            targetKey: s.targetKey,
                            kind: "feedback_helpful",
                          })
                        }
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-900"
                        onClick={() =>
                          void postGrowthAutonomyLearningEvent({
                            suggestionId: s.id,
                            categoryId: s.id,
                            targetKey: s.targetKey,
                            kind: "feedback_not_helpful",
                          })
                        }
                      >
                        No
                      </button>
                      <button
                        type="button"
                        className="rounded border border-amber-900/45 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-950/25"
                        onClick={() =>
                          void postGrowthAutonomyLearningEvent({
                            suggestionId: s.id,
                            categoryId: s.id,
                            targetKey: s.targetKey,
                            kind: "confusion",
                          })
                        }
                      >
                        Confusing
                      </button>
                    </div>
                  ) : null}
                </div>
                {s.disposition === "approval_required" ? (
                  <p className="mt-2 border-t border-amber-900/30 pt-2 text-[11px] leading-relaxed text-amber-100/90">
                    {s.actionType === "request_manual_review" ? (
                      <>
                        <span className="font-semibold text-amber-200">Why approval is required:</span> learning / automation
                        adjustments need explicit operator review under policy.
                        <br />
                        <span className="font-semibold text-amber-200">Where to route:</span>{" "}
                        <Link href={`${growthBase}?growthAutonomyFocus=review`} className="text-amber-200 underline">
                          Open Growth Machine — review focus
                        </Link>{" "}
                        (same destination as the prefilled manual-review link when prefilled).
                        <br />
                        <span className="font-semibold text-amber-200">What to do next:</span> document the outcome with
                        governance or a platform admin before changing weights — navigation alone does not mutate state.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-amber-200">Why approval is required:</span> enforcement or
                        governance marks this path as not cleared until a human records a decision.
                        <br />
                        <span className="font-semibold text-amber-200">Where to route:</span>{" "}
                        <Link href={`${growthBase}?growthAutonomyFocus=governance`} className="text-amber-200 underline">
                          Open governance focus on Growth Machine
                        </Link>{" "}
                        and work the policy console there, or escalate to a platform admin if you cannot approve.
                        <br />
                        <span className="font-semibold text-amber-200">What to do next:</span> capture the approval (or
                        rejection) in governance before any promotion, spend, or automation change — no background execution
                        from this panel.
                      </>
                    )}
                  </p>
                ) : null}
                {s.prefill ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] text-zinc-500">
                      Prefill opens a route or copies text — <span className="text-zinc-400">does not execute</span>{" "}
                      mutations; apply any change yourself in the UI.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.prefill.kind === "navigate_path" && s.prefill.href ? (
                        <Link
                          href={s.prefill.href}
                          className="inline-flex rounded-md border border-indigo-700/50 bg-indigo-950/40 px-2 py-1 text-[11px] text-indigo-100 hover:bg-indigo-900/50"
                          onClick={() => {
                            sendAutonomyTelemetry("prefill_navigate");
                            if (learningFeatureEnabled && !killSwitch) {
                              void postGrowthAutonomyLearningEvent({
                                suggestionId: s.id,
                                categoryId: s.id,
                                targetKey: s.targetKey,
                                kind: "prefill_used",
                              });
                            }
                          }}
                        >
                          {s.prefill.label}
                        </Link>
                      ) : null}
                      {s.prefill.kind === "copy_text" && s.prefill.copyText ? (
                        <button
                          type="button"
                          className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            void copyText(s.prefill!.copyText!, {
                              suggestionId: s.id,
                              categoryId: s.id,
                              targetKey: s.targetKey,
                            })
                          }
                        >
                          {s.prefill.label}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <details className="mt-4 text-[11px] text-zinc-500">
          <summary className="cursor-pointer text-zinc-400">Out of scope (this phase)</summary>
          <ul className="mt-2 list-inside list-disc space-y-0.5">
            {snapshot.scopeExclusions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>

        {showDebug ? (
          <div className="mt-3 rounded border border-zinc-800 p-2 font-mono text-[10px] text-zinc-500">
            <span className="text-zinc-400">Debug</span> autonomyEnabled={String(autonomyEnabled)} panel=
            {String(panelEnabled)} enforcementFlag={String(enforcementEnabled)} admin={String(viewerIsAdmin)} rollout=
            {rolloutStage} pilot={String(viewerGrowthAutonomyPilotAccess)}
            {monitoring ? (
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(monitoring, null, 2)}</pre>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
