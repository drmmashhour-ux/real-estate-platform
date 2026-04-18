/**
 * Operator V2 — readiness + blockers (advisory; not execution orders).
 */
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolOperatorPayload } from "../global-fusion.types";

export function buildOperatorProtocolPayload(protocol: GlobalFusionOperatingProtocol): GlobalFusionProtocolOperatorPayload {
  const readiness = protocol.blockers
    .filter((s) => s.targetSystems.includes("operator"))
    .map((s) => s.reasons[0] ?? "blocker");
  const deps = protocol.conflicts
    .filter((c) => c.systemsInvolved.includes("operator"))
    .map((c) => c.description);
  return {
    version: 1,
    readinessHints: readiness.slice(0, 8),
    dependencyBlockers: deps.slice(0, 8),
    resourceConstraints: protocol.directives.filter((d) => d.targetSystems.includes("operator")).map((d) => d.summary),
    signals: protocol.signals.filter((s) => s.targetSystems.includes("operator")),
    notes: ["operator_autonomy_preserved"],
  };
}
