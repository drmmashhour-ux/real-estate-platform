import type { Deal } from "@prisma/client";
import type { ClauseSuggestionType } from "./clause-engine.types";

export function mapDealToClauseScenarios(deal: Deal): ClauseSuggestionType[] {
  const tags: ClauseSuggestionType[] = ["workflow_reminder"];
  if (deal.dealExecutionType?.includes("coownership")) tags.push("annex_recommendation");
  if (deal.priceCents > 0) tags.push("deposit_timing");
  return tags;
}

export function scenarioToTitle(t: ClauseSuggestionType): string {
  const titles: Record<ClauseSuggestionType, string> = {
    annex_recommendation: "Annex / schedule alignment",
    workflow_reminder: "Workflow sequencing",
    deposit_timing: "Deposit / payment timing",
    financing_flow: "Financing condition flow",
    seller_disclosure: "Seller disclosure dependencies",
    brokerage_remuneration: "Brokerage remuneration / disclosure",
    unrepresented_buyer_notice: "Notice — unrepresented party context",
  };
  return titles[t];
}
