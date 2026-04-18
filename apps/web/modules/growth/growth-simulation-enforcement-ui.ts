/**
 * Shared copy helpers for Growth Simulation panel + enforcement snapshot rollout tests.
 */

export function simulationEnforcementSnapshotDebugLabel(args: {
  enforcementLayerEnabled: boolean;
  enforcementSnapshotReady: boolean;
  enforcementSnapshot: unknown | null | undefined;
}): "layer_off" | "loading_parent" | "received" | "absent" {
  if (!args.enforcementLayerEnabled) return "layer_off";
  if (!args.enforcementSnapshotReady) return "loading_parent";
  if (args.enforcementSnapshot) return "received";
  return "absent";
}
