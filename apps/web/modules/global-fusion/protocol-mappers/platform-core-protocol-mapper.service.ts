/**
 * Platform Core — health + governance attention (advisory).
 */
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolPlatformCorePayload } from "../global-fusion.types";

export function buildPlatformCoreProtocolPayload(protocol: GlobalFusionOperatingProtocol): GlobalFusionProtocolPlatformCorePayload {
  const gov = protocol.directives.filter((d) => d.directiveType === "governance_sync");
  return {
    version: 1,
    healthPriorities: protocol.risks
      .filter((s) => s.targetSystems.includes("platform_core"))
      .map((s) => s.reasons[0] ?? "risk")
      .slice(0, 8),
    governanceAttention: gov.map((g) => g.summary),
    technicalRiskSignals: protocol.signals.filter(
      (s) => s.type === "risk" && s.targetSystems.includes("platform_core"),
    ),
    notes: ["platform_core_autonomy_preserved"],
  };
}
