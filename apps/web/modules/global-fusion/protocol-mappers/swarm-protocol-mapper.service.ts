/**
 * Swarm-facing protocol slice — objectives + coordination signals (advisory).
 */
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolSwarmPayload } from "../global-fusion.types";

export function buildSwarmProtocolPayload(protocol: GlobalFusionOperatingProtocol): GlobalFusionProtocolSwarmPayload {
  return {
    version: 1,
    objectives: protocol.priorities.slice(0, 6).map((p) => p.title),
    coordinationSignals: protocol.signals.filter((s) => s.targetSystems.includes("swarm")),
    conflictWarnings: protocol.conflicts.map((c) => c.description).slice(0, 8),
    notes: ["advisory_only", "swarm_autonomy_preserved"],
  };
}
