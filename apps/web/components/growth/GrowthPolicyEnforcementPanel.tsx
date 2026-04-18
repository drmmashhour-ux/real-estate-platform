"use client";

import * as React from "react";
import type {
  GrowthPolicyEnforcementDebugPayload,
  GrowthPolicyEnforcementGetResponse,
} from "@/modules/growth/growth-policy-enforcement-api.types";
import { isGrowthPolicyEnforcementEnabledResponse } from "@/modules/growth/growth-policy-enforcement-api.types";
import type { GrowthPolicyEnforcementMonitoringState } from "@/modules/growth/growth-policy-enforcement-monitoring.service";
import { policyEnforcementSnapshotLooksPartial } from "@/modules/growth/growth-policy-enforcement-rollout.helpers";
import {
  GROWTH_POLICY_DEBUG_QUERY,
  shouldShowGrowthPolicyEnforcementDebugUi,
} from "@/modules/growth/growth-policy-enforcement-debug";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { buildGrowthPolicyEnforcementNotes } from "@/modules/growth/growth-policy-enforcement-explainer.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";

const TARGETS = [
  "autopilot_advisory_conversion",
  "autopilot_safe_execution",
  "learning_adjustments",
  "content_assist_generation",
  "messaging_assist_generation",
  "fusion_autopilot_bridge",
  "fusion_content_bridge",
  "fusion_influence_bridge",
  "simulation_recommendation_promotion",
  "strategy_recommendation_promotion",
  "panel_render_hint",
] as const;

function WhatToDoBlock({
  blockedCount,
  frozenCount,
  approvalCount,
}: {
  blockedCount: number;
  frozenCount: number;
  approvalCount: number;
}) {
  if (blockedCount === 0 && frozenCount === 0 && approvalCount === 0) {
    return (
      <div className="mt-3 rounded-lg border border-zinc-800/90 bg-black/25 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What to do</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          No block/freeze/approval gates are active from this snapshot. Continue normal review; watch for partial
          inputs if flagged above.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-zinc-800/90 bg-black/25 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What to do</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] leading-relaxed text-zinc-400">
        {blockedCount > 0 ? (
          <li>
            <span className="text-zinc-200">Blocked</span> — review governance policy / target policy inputs; do not
            expect downstream advisory paths to auto-escalate.
          </li>
        ) : null}
        {frozenCount > 0 ? (
          <li>
            <span className="text-zinc-200">Frozen</span> — inspect learning / autopilot conditions and governance
            posture; freeze is advisory until upstream state changes.
          </li>
        ) : null}
        {approvalCount > 0 ? (
          <li>
            <span className="text-zinc-200">Approval required</span> — route promotion or execution steps to operator or
            admin review before treating outcomes as cleared.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function GrowthPolicyEnforcementPanel() {
  const [snapshot, setSnapshot] = React.useState<GrowthPolicyEnforcementSnapshot | null>(null);
  const [layerDisabled, setLayerDisabled] = React.useState<{ message: string; panelFlag: boolean } | null>(null);
  const [monitoring, setMonitoring] = React.useState<
    GrowthPolicyEnforcementGetResponse extends { operationalMonitoring?: infer M } ? M | null : never
  >(null);
  const [debugPayload, setDebugPayload] = React.useState<
    GrowthPolicyEnforcementGetResponse extends { debug?: infer D } ? D | null : never
  >(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams(window.location.search).get(GROWTH_POLICY_DEBUG_QUERY);
    const debugUi = shouldShowGrowthPolicyEnforcementDebugUi(q);
    setShowDebugPanel(debugUi);
    const url = `/api/growth/policy-enforcement${debugUi ? `?${GROWTH_POLICY_DEBUG_QUERY}=1` : ""}`;

    void fetch(url, { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as GrowthPolicyEnforcementGetResponse;
        if (!r.ok) throw new Error("Policy enforcement unavailable");
        if (!isGrowthPolicyEnforcementEnabledResponse(j)) {
          if (!cancelled) {
            setSnapshot(null);
            setLayerDisabled({ message: j.operatorMessage, panelFlag: j.enforcementPanelFlagEnabled });
            setPanelFlagFromApi(j.enforcementPanelFlagEnabled);
            setMonitoring(null);
            setDebugPayload(null);
          }
          return;
        }
        if (!cancelled) {
          setSnapshot(j.snapshot);
          setLayerDisabled(null);
          setPanelFlagFromApi(j.enforcementPanelFlagEnabled);
          setMonitoring(j.operationalMonitoring ?? null);
          setDebugPayload(j.debug ?? null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setSnapshot(null);
          setLayerDisabled(null);
          setPanelFlagFromApi(null);
          setMonitoring(null);
          setDebugPayload(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading policy enforcement…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (layerDisabled) {
    return (
      <section
        className="rounded-xl border border-amber-900/45 bg-amber-950/20 p-4"
        aria-label="Growth policy enforcement disabled"
      >
        <h3 className="text-sm font-semibold text-amber-100">Policy enforcement (layer off)</h3>
        <p className="mt-2 text-xs leading-relaxed text-amber-100/90">{layerDisabled.message}</p>
        <p className="mt-2 text-[10px] text-zinc-500">
          Panel flag: {layerDisabled.panelFlag ? "on" : "off"} — UI may still hide this block if the panel flag is off at
          the page level.
        </p>
      </section>
    );
  }
  if (!snapshot) {
    return (
      <p className="text-sm text-amber-200/90">
        Internal: enforcement response had no snapshot. Check API and server logs — this should not occur when the layer
        flag is enabled.
      </p>
    );
  }

  const partial = snapshot.inputCompleteness === "partial" || snapshot.missingDataWarnings.length > 0;
  const notes = buildGrowthPolicyEnforcementNotes(snapshot).slice(0, 5);
  const showDebugPanel =
    typeof window !== "undefined" &&
    shouldShowGrowthPolicyEnforcementDebugUi(new URLSearchParams(window.location.search).get(GROWTH_POLICY_DEBUG_QUERY));

  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4"
      aria-label="Growth policy enforcement"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-amber-100">Policy enforcement</h3>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2 py-0.5 font-medium text-emerald-100">
            Layer on
          </span>
          {panelFlagFromApi !== null ? (
            <span
              className={`rounded-full border px-2 py-0.5 font-medium ${
                panelFlagFromApi
                  ? "border-sky-800/55 bg-sky-950/25 text-sky-100"
                  : "border-zinc-600 bg-zinc-900/75 text-zinc-400"
              }`}
            >
              Panel flag: {panelFlagFromApi ? "on" : "off"}
            </span>
          ) : null}
          <span className="rounded-full border border-amber-800/45 bg-amber-950/25 px-2 py-0.5 font-medium text-amber-100">
            Advisory-only scope
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-medium ${
              partial
                ? "border-amber-700/55 bg-amber-950/40 text-amber-100"
                : "border-zinc-700 bg-zinc-900/70 text-zinc-200"
            }`}
          >
            Inputs: {partial ? "partial / incomplete" : "complete"}
          </span>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        <span className="text-zinc-400">Out of scope for this layer:</span> payments, bookings core, ads execution
        core, CRO core — this surface is bounded advisory/orchestration only.
      </p>

      {partial ? (
        <div className="mt-3 rounded-lg border border-amber-800/40 bg-black/30 p-2.5">
          <p className="text-[11px] font-semibold text-amber-100/95">Partial data</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
            Snapshot built with gaps — treat modes as directional, not definitive. Review warnings below before acting.
          </p>
          {snapshot.missingDataWarnings.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-0.5 font-mono text-[10px] text-amber-200/80">
              {snapshot.missingDataWarnings.slice(0, 6).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-rose-800/50 bg-rose-950/30 px-2 py-0.5 text-rose-100">
          Blocked: {snapshot.blockedTargets.length}
        </span>
        <span className="rounded-full border border-sky-800/45 bg-sky-950/25 px-2 py-0.5 text-sky-100">
          Frozen: {snapshot.frozenTargets.length}
        </span>
        <span className="rounded-full border border-amber-700/45 bg-amber-950/30 px-2 py-0.5 text-amber-100">
          Approval required: {snapshot.approvalRequiredTargets.length}
        </span>
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-zinc-800/80 bg-black/20">
        <table className="w-full text-left text-[11px] text-zinc-300">
          <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
            <tr>
              <th className="px-2 py-1.5 font-medium">Target</th>
              <th className="px-2 py-1.5 font-medium">Mode</th>
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const d = getEnforcementForTarget(t, snapshot);
              return (
                <tr key={t} className="border-t border-zinc-800/60">
                  <td className="px-2 py-1 align-top font-mono text-[10px] text-zinc-400">{t}</td>
                  <td className="px-2 py-1 align-top">
                    <span className="text-zinc-200">{d.mode}</span>
                    <p className="mt-0.5 text-zinc-500">{d.rationale}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <WhatToDoBlock
        blockedCount={snapshot.blockedTargets.length}
        frozenCount={snapshot.frozenTargets.length}
        approvalCount={snapshot.approvalRequiredTargets.length}
      />

      {notes.length > 0 ? (
        <div className="mt-3 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-zinc-400">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.notes.length > 0 ? (
        <div className="mt-2 text-[10px] text-zinc-600">
          {snapshot.notes.slice(0, 3).map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      ) : null}

      {monitoring ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Operational monitoring</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            In-process counters since deploy / reset — use for rollout checks alongside server logs; not a billing or SLA
            metric.
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-400">
            <dt>Builds</dt>
            <dd>{monitoring.enforcementBuilds}</dd>
            <dt>Blocked Σ</dt>
            <dd>{monitoring.blockedTargetsCount}</dd>
            <dt>Frozen Σ</dt>
            <dd>{monitoring.frozenTargetsCount}</dd>
            <dt>Approval Σ</dt>
            <dd>{monitoring.approvalRequiredTargetsCount}</dd>
            <dt>Advisory-only Σ</dt>
            <dd>{monitoring.advisoryOnlyTargetsCount}</dd>
            <dt>Gated UI Σ</dt>
            <dd>{monitoring.gatedUiActionsCount}</dd>
            <dt>Missing-data Σ</dt>
            <dd>{monitoring.missingDataWarnings}</dd>
          </dl>
        </div>
      ) : null}

      {showDebugPanel ? (
        <div className="mt-2 rounded border border-zinc-800/90 bg-black/40 p-2 font-mono text-[10px] text-zinc-500">
          <span className="text-zinc-400">Debug</span>{" "}
          {debugPayload ? (
            <>
              snapshot={debugPayload.snapshotAvailable ? "yes" : "no"} notes={debugPayload.notesCount} warnings=
              {debugPayload.warningsCount}
            </>
          ) : (
            <>add ?growthPolicyDebug=1 to this page for snapshot notes/warnings counts (or set env in production)</>
          )}
        </div>
      ) : null}
    </section>
  );
}
