/**
 * Decision set — maps ranked opportunities to a Fusion-style prioritized list with lightweight conflict hints.
 * Does not mutate Fusion storage or subsystem truth.
 */
import type { CompanyFusionDecision, CompanyFusionDecisionSet, RankedOpportunity } from "./autonomous-company.types";

export function opportunitiesToFusionStyleDecisions(ranked: RankedOpportunity[]): CompanyFusionDecisionSet {
  const decisions: CompanyFusionDecision[] = [];
  let conflictPairsApprox = 0;

  for (let i = 0; i < ranked.length; i++) {
    const o = ranked[i]!;
    const systems = [o.domain, "platform_core"].filter((x, j, a) => a.indexOf(x) === j);
    const conflictsWith: string[] = [];
    if (o.domain === "ads" && ranked.some((x) => x.domain === "cro" && x.score > 0.65)) {
      conflictsWith.push("cro_bottleneck_may_limit_scale");
      conflictPairsApprox += 1;
    }
    decisions.push({
      id: `dec_${o.id}`,
      opportunityId: o.id,
      title: o.title,
      priorityScore: o.score,
      systems,
      conflictsWith,
    });
  }

  return {
    decisions,
    conflictPairsApprox,
    notes: ["Advisory ordering only — compare with Fusion snapshot for authoritative cross-domain conflicts."],
  };
}
