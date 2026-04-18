import type { Deal } from "@prisma/client";
import type { LegalContextChunk } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import { retrieveHybrid, type KeywordHit } from "@/modules/legal-knowledge/legal-retrieval.service";
import type { ClauseEngineSuggestion } from "./clause-engine.types";
import { mapDealToClauseScenarios, scenarioToTitle } from "./clause-scenario-mapper";

function summarizeChunk(chunk: LegalContextChunk | KeywordHit): { content: string; sourceName: string; page: number | null } {
  if ("source" in chunk && chunk.source && "title" in chunk.source) {
    const s = chunk as LegalContextChunk;
    return { content: s.content, sourceName: s.source.title, page: s.pageNumber };
  }
  const k = chunk as KeywordHit;
  return { content: k.content, sourceName: k.documentTitle, page: k.pageNumber };
}

export async function retrieveClauseSuggestionsForDeal(deal: Deal): Promise<ClauseEngineSuggestion[]> {
  const query = `Quebec residential brokerage ${deal.dealExecutionType ?? "sale"} promise deposit financing syndicate`;
  const hybrid = await retrieveHybrid(query, { documentType: "drafting", limit: 6 });
  const scenarios = mapDealToClauseScenarios(deal);

  return hybrid.map((h, i) => {
    const { content, sourceName, page } = summarizeChunk(h.chunk);
    const st = scenarios[i % scenarios.length]!;
    return {
      suggestionType: st,
      title: scenarioToTitle(st),
      summary: content.slice(0, 420) + (content.length > 420 ? "…" : ""),
      sourceReferences: [{ sourceName, pageNumber: page, sectionLabel: "Retrieved excerpt" }],
      confidence: Math.min(0.88, 0.32 + h.score * 0.45),
      brokerReviewRequired: true as const,
    };
  });
}
