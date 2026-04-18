import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

export type AcquisitionPriority = "P1" | "P2" | "P3";

export type ScoredAcquisitionTarget = MontrealOpportunityRow & {
  priority: AcquisitionPriority;
  rationale: string;
};

/** Rank opportunities for supply-side focus — uses only platform-derived scores. */
export function scoreAcquisitionTargets(rows: MontrealOpportunityRow[]): ScoredAcquisitionTarget[] {
  const sorted = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore);
  return sorted.map((row, i) => {
    const priority: AcquisitionPriority = i < 5 ? "P1" : i < 12 ? "P2" : "P3";
    const rationale = `Opportunity score ${row.opportunityScore} (demand ${row.demandScore} vs supply ${row.supplyScore}) in ${row.neighborhood}.`;
    return { ...row, priority, rationale };
  });
}
