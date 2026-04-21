import type { GreenEngineInput, GreenImprovement } from "@/modules/green/green.types";
import { greenAiLog } from "../green-ai-logger";
import type { GrantTag } from "./grants.data";
import { QUEBEC_GRANTS_SEED, type QuebecGrantRecord } from "./grants.data";
import {
  grantMatchesRecord,
  grantsForAction,
  inferTagsFromImprovementAction,
  inferTagsFromProperty,
  unionTags,
} from "./grants.matcher";

export const GRANTS_ELIGIBILITY_DISCLAIMER =
  "I cannot confirm real-time eligibility. Verify with official programs.";

export type EligibleGrantDisplay = {
  name: string;
  amount: string;
  reason: string;
  howToApply: string;
  id: string;
};

function toDisplay(grant: QuebecGrantRecord, reason: string): EligibleGrantDisplay {
  return {
    id: grant.id,
    name: grant.name,
    amount: grant.amount,
    reason,
    howToApply: grant.howToApply,
  };
}

function reasonForOverlap(tags: GrantTag[]): string {
  const label = tags.join(", ").replace(/_/g, " ");
  return tags.length > 0
    ? `Aligned with planned work or property signals (${label}).`
    : "May align with your renovation profile — confirm eligibility.";
}

function matchedTagsForGrant(grant: QuebecGrantRecord, candidate: ReadonlySet<GrantTag>): GrantTag[] {
  return grant.eligibility.filter((t) => candidate.has(t));
}

function combinedTagsForRecommendation(action: string, property: GreenEngineInput): Set<GrantTag> {
  return new Set([...inferTagsFromImprovementAction(action), ...inferTagsFromProperty(property)]);
}

/**
 * Québec-inspired illustrative grants — deterministic matching from upgrade text + property intake.
 */
export function findEligibleGrants(args: {
  property: GreenEngineInput;
  plannedUpgrades: GreenImprovement[];
  catalog?: QuebecGrantRecord[];
}): {
  eligibleGrants: EligibleGrantDisplay[];
  byRecommendation: Array<{ action: string; grants: EligibleGrantDisplay[] }>;
  disclaimer: string;
} {
  const catalog = args.catalog ?? QUEBEC_GRANTS_SEED;
  const combinedAll = new Set(unionTags(args.plannedUpgrades, args.property));

  const seen = new Set<string>();
  const eligibleGrants: EligibleGrantDisplay[] = [];

  for (const grant of catalog) {
    if (!grantMatchesRecord(grant, combinedAll)) continue;
    if (seen.has(grant.id)) continue;
    seen.add(grant.id);
    const overlap = matchedTagsForGrant(grant, combinedAll);
    eligibleGrants.push(toDisplay(grant, reasonForOverlap(overlap)));
  }

  const byRecommendation = args.plannedUpgrades.map((u) => {
    const matched = grantsForAction(u.action, args.property, catalog);
    const rowCombined = combinedTagsForRecommendation(u.action, args.property);
    const grants = matched.map((g) => {
      const overlap = matchedTagsForGrant(g, rowCombined);
      return toDisplay(g, reasonForOverlap(overlap));
    });
    const uniq = new Map<string, EligibleGrantDisplay>();
    for (const g of grants) uniq.set(g.id, g);
    return { action: u.action, grants: [...uniq.values()] };
  });

  greenAiLog.info("grants_engine_done", {
    eligibleCount: eligibleGrants.length,
    upgrades: args.plannedUpgrades.length,
  });

  return {
    eligibleGrants,
    byRecommendation,
    disclaimer: GRANTS_ELIGIBILITY_DISCLAIMER,
  };
}
