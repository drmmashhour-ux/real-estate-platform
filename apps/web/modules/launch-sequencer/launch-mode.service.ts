import type { LaunchDependency, LaunchFeatureSubset, LaunchMode, LaunchReadinessScore } from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

function blockingCount(deps: LaunchDependency[]): number {
  return deps.filter((d) => d.blocking).length;
}

export type LaunchModeSelection = {
  launchMode: LaunchMode;
  rationale: string[];
};

/**
 * Select launch mode from readiness, dependencies, and planned feature subset. Never throws.
 */
export function selectLaunchMode(
  readiness: LaunchReadinessScore,
  dependencies: LaunchDependency[],
  featureSubset: LaunchFeatureSubset,
): LaunchModeSelection {
  try {
    const rationale: string[] = [];
    const blockers = blockingCount(dependencies);
    const autoBlocked = featureSubset.blockedFeatures.includes("autonomy");

    let mode: LaunchMode = "READ_ONLY_INTELLIGENCE";

    if (readiness.label === "not_ready" || readiness.score < 38) {
      mode = "READ_ONLY_INTELLIGENCE";
      rationale.push("Readiness below pilot threshold — scenario defaults to read-only intelligence.");
    } else if (readiness.label === "pilot_ready" || blockers >= 2 || readiness.score < 58) {
      mode = "BROKER_ASSISTED_PILOT";
      rationale.push("Partial readiness or multiple blockers — human-heavy pilot is the conservative scenario.");
    } else if (readiness.label === "limited_launch_ready" || blockers === 1 || autoBlocked) {
      mode = "LIMITED_PRODUCTION";
      rationale.push("Core gates mostly clear — limited production with restricted autonomy/messaging surfaces.");
    } else if (readiness.label === "launch_ready" && blockers === 0) {
      mode = "FULL_PRODUCTION";
      rationale.push("Heuristic launch_ready with no blocking dependencies in this scan — still requires human compliance sign-off.");
    } else {
      mode = "LIMITED_PRODUCTION";
      rationale.push("Mixed signals — defaulting to limited production rather than full.");
    }

    rationale.push("Launch mode is a planning label only; it does not enable features or bypass policy gates.");

    launchSequencerLog.info("launch_mode_selected", { mode, readiness: readiness.label, blockers });
    return { launchMode: mode, rationale };
  } catch {
    launchSequencerLog.warn("launch_mode_selected_failed", {});
    return {
      launchMode: "READ_ONLY_INTELLIGENCE",
      rationale: ["Fallback mode after selector error — treat as read-only planning."],
    };
  }
}
