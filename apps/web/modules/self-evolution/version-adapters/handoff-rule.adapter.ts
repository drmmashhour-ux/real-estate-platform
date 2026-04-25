import { recordAdapterLog, type AdapterResult } from "./adapter-helpers";

export function applyHandoffRuleProposedVersion(proposedVersionKey: string, _proposal: Record<string, unknown>): AdapterResult {
  return recordAdapterLog("HANDOFF_RULE", proposedVersionKey);
}
