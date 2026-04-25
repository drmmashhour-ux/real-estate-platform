import { recordAdapterLog, type AdapterResult } from "./adapter-helpers";

export function applyRankingWeightProposedVersion(proposedVersionKey: string): AdapterResult {
  return recordAdapterLog("RANKING_WEIGHT", proposedVersionKey);
}
