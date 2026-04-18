import type { Deal } from "@prisma/client";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import { buildDraftingQueryFromDeal } from "@/modules/deal-intelligence/drafting-context.builder";
import { toStructuredChunks } from "./legal-knowledge.service";

/**
 * Retrieves brokerage-law-aligned chunks for clause / drafting assistance (semantic search).
 */
export async function retrieveClausesForDeal(deal: Deal, limit = 8) {
  const query = buildDraftingQueryFromDeal(deal);
  const rows = await getLegalContext(query, { documentType: "drafting", limit });
  return toStructuredChunks(rows);
}

/**
 * Broader retrieval when transaction touches statutory obligations (law docs).
 */
export async function retrieveLawSnippetsForDeal(deal: Deal, limit = 6) {
  const query = `${buildDraftingQueryFromDeal(deal)} brokerage obligation disclosure mandate`;
  const rows = await getLegalContext(query, { documentType: "law", limit });
  return toStructuredChunks(rows);
}
