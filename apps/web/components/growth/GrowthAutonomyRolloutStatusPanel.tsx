"use client";

import * as React from "react";
import type {
  GrowthAutonomyApiRolloutStatus,
  GrowthAutonomyRolloutStage,
} from "@/modules/growth/growth-autonomy.types";

export type GrowthAutonomyRolloutSnapshotSummary = {
  createdAt: string;
  enforcementInputPartial: boolean;
  operatorNotesCount: number;
  /** Blocked + approval-required rows — items needing attention. */
  warningAttentionCount: number;
};

export function GrowthAutonomyRolloutStatusPanel({
  rolloutStage,
  autonomyEnabled,
  panelEnabled,
  killSwitch,
  enforcementLayerFlagOn,
  viewerGrowthAutonomyPilotAccess,
  apiRolloutStatus,
  snapshotSummary,
  enforcementSnapshotPresent,
}: {
  rolloutStage: GrowthAutonomyRolloutStage;
  autonomyEnabled: boolean;
  panelEnabled: boolean;
  killSwitch: boolean;
  enforcementLayerFlagOn: boolean;
  viewerGrowthAutonomyPilotAccess: boolean;
  apiRolloutStatus?: GrowthAutonomyApiRolloutStatus | null;
  snapshotSummary?: GrowthAutonomyRolloutSnapshotSummary | null;
  /** From loaded snapshot — whether policy snapshot was present. */
  enforcementSnapshotPresent?: boolean;
}) {
  const rs = apiRolloutStatus;
  const modeLabel = rolloutStage === "off" ? "off (no staged visibility)" : rolloutStage;

  const enforcementUi =
    enforcementSnapshotPresent !== undefined
      ? enforcementLayerFlagOn && enforcementSnapshotPresent
        ? "available"
        : enforcementLayerFlagOn
          ? "flag on — snapshot missing/partial"
          : "unavailable (flag off)"
      : enforcementLayerFlagOn
        ? "flag on"
        : "unavailable (flag off)";

  const pilotLine = viewerGrowthAutonomyPilotAccess
    ? "You are in the internal pilot cohort (admin, allowlisted operator, internal UI flag, non-production, or debug)."
    : "You are not in the internal pilot cohort — in production with rollout=internal you will not receive snapshots unless access is granted.";

  return (
    <section
      className="rounded-lg border border-zinc-800/90 bg-black/30 px-3 py-2.5"
      aria-label="Growth autonomy rollout status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Autonomy rollout status</p>
      <p className="mt-1 text-[10px] leading-snug text-zinc-600">
        Pilot scope is <span className="text-zinc-500">read-only guidance</span>: clarity on rollout and policy outcomes —
        not new execution powers. Prefills are navigation/copy only; kill switch stops all autonomy snapshots here.
      </p>
      <dl className="mt-2 grid gap-1.5 text-[11px] text-zinc-300 sm:grid-cols-2">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-zinc-500">Rollout mode</dt>
          <dd className="font-medium text-zinc-200">{modeLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-zinc-500">Autonomy flag</dt>
          <dd>{autonomyEnabled ? <span className="text-emerald-300">on</span> : <span className="text-zinc-500">off</span>}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-zinc-500">Panel flag</dt>
          <dd>{panelEnabled ? <span className="text-emerald-300">on</span> : <span className="text-zinc-500">hidden</span>}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-zinc-500">Kill switch</dt>
          <dd>
            {killSwitch ? <span className="text-red-300">active — autonomy suppressed</span> : <span className="text-emerald-300">off</span>}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 sm:col-span-2">
          <dt className="text-zinc-500">Enforcement</dt>
          <dd className="text-zinc-200">{enforcementUi}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 sm:col-span-2">
          <dt className="text-zinc-500">Internal gate</dt>
          <dd>
            {rs?.internalGateBlocked ? (
              <span className="text-amber-200">blocked for this session — snapshot not delivered</span>
            ) : rolloutStage === "internal" ? (
              <span className="text-emerald-200/90">internal stage — pilot access OK</span>
            ) : (
              <span className="text-zinc-400">not applying internal-only gate</span>
            )}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 sm:col-span-2">
          <dt className="text-zinc-500">API snapshot</dt>
          <dd>
            {rs?.snapshotDelivered ? (
              <span className="text-emerald-200">delivered</span>
            ) : killSwitch || !autonomyEnabled ? (
              <span className="text-zinc-500">not requested / suppressed</span>
            ) : (
              <span className="text-amber-200/90">not delivered for this session</span>
            )}
          </dd>
        </div>
      </dl>
      {rs?.partialExposureNote ? (
        <p className="mt-2 border-t border-zinc-800 pt-2 text-[10px] text-amber-200/85">{rs.partialExposureNote}</p>
      ) : null}
      <p className="mt-2 text-[10px] leading-snug text-zinc-500">{pilotLine}</p>
      {snapshotSummary ? (
        <div className="mt-2 border-t border-zinc-800 pt-2 text-[10px] text-zinc-400">
          <span className="font-semibold text-zinc-500">Last snapshot</span>{" "}
          <time dateTime={snapshotSummary.createdAt}>{new Date(snapshotSummary.createdAt).toLocaleString()}</time>
          {" · "}
          partial inputs: {snapshotSummary.enforcementInputPartial ? "yes" : "no"}
          {" · "}
          operator notes: {snapshotSummary.operatorNotesCount}
          {" · "}
          attention rows (blocked + review): {snapshotSummary.warningAttentionCount}
        </div>
      ) : null}
    </section>
  );
}
