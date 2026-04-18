"use client";

/**
 * Consolidated rollout debug — parent holds shared enforcement snapshot used by Simulation + panels.
 */

import * as React from "react";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import {
  GROWTH_POLICY_DEBUG_QUERY,
  shouldShowGrowthPolicyEnforcementDebugUi,
} from "@/modules/growth/growth-policy-enforcement-debug";
import { simulationEnforcementSnapshotDebugLabel } from "@/modules/growth/growth-simulation-enforcement-ui";

export function GrowthPolicyEnforcementRolloutDebugStrip({
  enforcementLayerFlagOn,
  panelFlagOn,
  enforcementSnapshot,
  enforcementSnapshotReady,
  simulationSectionMounted,
}: {
  enforcementLayerFlagOn: boolean;
  panelFlagOn: boolean;
  enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null;
  enforcementSnapshotReady: boolean;
  simulationSectionMounted: boolean;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get(GROWTH_POLICY_DEBUG_QUERY);
    setVisible(shouldShowGrowthPolicyEnforcementDebugUi(q));
  }, []);

  if (!visible) return null;

  const snapshotStatus = !enforcementLayerFlagOn
    ? "layer_off"
    : !enforcementSnapshotReady
      ? "loading_shared_snapshot"
      : enforcementSnapshot
        ? "available"
        : "unavailable_empty";

  const simulationBridge = simulationSectionMounted
    ? simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: enforcementLayerFlagOn,
        enforcementSnapshotReady,
        enforcementSnapshot,
      })
    : "n_a_panel_not_shown";

  return (
    <aside
      className="rounded-lg border border-violet-900/35 bg-violet-950/20 px-3 py-2 font-mono text-[10px] leading-relaxed text-zinc-400"
      aria-label="Policy enforcement rollout debug"
    >
      <p className="font-semibold text-violet-200/90">Policy enforcement — rollout debug</p>
      <p className="mt-1">
        FLAGS layer={String(enforcementLayerFlagOn)} panel_flag={String(panelFlagOn)}
      </p>
      <p className="mt-1">
        Shared snapshot: {snapshotStatus} · notes_count={enforcementSnapshot?.notes.length ?? "—"} · warnings_count=
        {enforcementSnapshot?.missingDataWarnings.length ?? "—"}
      </p>
      <p className="mt-1">
        Simulation receives enforcementSnapshot:{" "}
        <span className="text-zinc-300">{simulationBridge}</span>
        {" "}(layer_off | loading_parent | received | absent)
      </p>
    </aside>
  );
}
