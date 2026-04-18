import type { Deal } from "@prisma/client";
import { rankSuggestions } from "./clause-ranking.service";
import { retrieveClauseSuggestionsForDeal } from "./clause-retrieval.service";

export async function runClauseEngine(deal: Deal) {
  const suggestions = await retrieveClauseSuggestionsForDeal(deal);
  return {
    suggestions: rankSuggestions(suggestions),
    disclaimer:
      "Source-grounded drafting assistance from indexed materials — not legal advice. Specimen structure only until execution forms are broker-authorized.",
  };
}
