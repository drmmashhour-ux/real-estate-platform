import { recordAdapterLog, type AdapterResult } from "./adapter-helpers";

export function applyThresholdProposedVersion(proposedVersionKey: string): AdapterResult {
  return recordAdapterLog("THRESHOLD", proposedVersionKey);
}
