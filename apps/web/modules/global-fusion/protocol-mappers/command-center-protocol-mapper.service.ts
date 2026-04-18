/**
 * Company Command Centers — presentation-oriented grouping (advisory).
 */
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolCommandCenterPayload } from "../global-fusion.types";

export function buildCommandCenterProtocolPayload(protocol: GlobalFusionOperatingProtocol): GlobalFusionProtocolCommandCenterPayload {
  return {
    version: 1,
    headline: protocol.active ? "Fusion operating protocol (advisory)" : "Fusion protocol inactive",
    groupedPriorities: protocol.priorities.slice(0, 12),
    groupedRisks: protocol.risks.slice(0, 12),
    presentationNotes: protocol.meta.notes.slice(0, 8),
  };
}
