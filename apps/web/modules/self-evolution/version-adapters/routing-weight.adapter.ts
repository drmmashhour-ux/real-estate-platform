import { recordAdapterLog, type AdapterResult } from "./adapter-helpers";

export function applyRoutingWeightProposedVersion(proposedVersionKey: string): AdapterResult {
  return recordAdapterLog("ROUTING_WEIGHT", proposedVersionKey);
}
