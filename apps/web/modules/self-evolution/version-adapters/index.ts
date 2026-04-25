import type { EvolutionProposalCategory } from "@prisma/client";
import { applyHandoffRuleProposedVersion } from "./handoff-rule.adapter";
import { applyPlaybookProposedVersion } from "./playbook-version.adapter";
import { applyRankingWeightProposedVersion } from "./ranking-weight.adapter";
import { applyRoutingWeightProposedVersion } from "./routing-weight.adapter";
import { applyThresholdProposedVersion } from "./threshold.adapter";
import { isCategorySupportedInAdapterLayer, recordAdapterLog, type AdapterResult } from "./adapter-helpers";

/**
 * Route proposal to a narrow adapter; fail safe for unknown.
 */
export function applyProposedVersion(
  category: EvolutionProposalCategory,
  proposedVersionKey: string,
  proposalJson: Record<string, unknown>
): AdapterResult {
  if (!isCategorySupportedInAdapterLayer(category)) {
    return { ok: false, error: "unknown_category", trace: String(category) };
  }
  try {
    if (category === "ROUTING_WEIGHT") return applyRoutingWeightProposedVersion(proposedVersionKey);
    if (category === "RANKING_WEIGHT") return applyRankingWeightProposedVersion(proposedVersionKey);
    if (category === "THRESHOLD") return applyThresholdProposedVersion(proposedVersionKey);
    if (category === "HANDOFF_RULE") return applyHandoffRuleProposedVersion(proposedVersionKey, proposalJson);
    if (category === "PLAYBOOK" || category === "OTHER") return applyPlaybookProposedVersion(category, proposedVersionKey, proposalJson);
    if (category === "FOLLOWUP_TIMING" || category === "FEATURE_SUBSET") return recordAdapterLog(category, proposedVersionKey);
    return { ok: true, appliedVersionKey: proposedVersionKey, trace: "generic ledger record" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "adapter", trace: "error" };
  }
}

export type { AdapterResult };
