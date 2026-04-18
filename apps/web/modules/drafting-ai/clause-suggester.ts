import type { Deal } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealExecutionFlags } from "@/config/feature-flags";
import { retrieveClausesForDeal, retrieveLawSnippetsForDeal } from "@/modules/legal-knowledge/legal-clause-retriever";
import type { LegalSourceAttribution } from "@/modules/legal-knowledge/legal-knowledge.types";
import { BROKER_REVIEW_LABEL } from "@/modules/legal-knowledge/legal-knowledge.types";

export type ClauseSuggestionOutput = {
  id: string;
  title: string;
  suggestion: string;
  whyGenerated: string;
  source: LegalSourceAttribution;
  confidence: number;
  severity: "info" | "warning";
  requiresBrokerReview: typeof BROKER_REVIEW_LABEL;
  affectedDocumentHint?: string;
};

function attributionFromChunk(chunk: {
  sourceName: string;
  pageNumber: number | null;
  sectionTitle: string;
  content: string;
  score?: number;
}): LegalSourceAttribution {
  return {
    source: chunk.sourceName,
    page: chunk.pageNumber,
    section: chunk.sectionTitle,
    explanation: `Retrieved drafting/law context (similarity ${chunk.score != null ? chunk.score.toFixed(3) : "n/a"}) — verify in source.`,
  };
}

/**
 * Produces reviewable clause prompts grounded in knowledge chunks + clause library (never auto-inserted).
 */
export async function suggestClausesForDeal(deal: Deal & { dealParties?: { id: string }[] }): Promise<ClauseSuggestionOutput[]> {
  const out: ClauseSuggestionOutput[] = [];

  const [chunks, lawChunks, library] = await Promise.all([
    retrieveClausesForDeal(deal, 5),
    retrieveLawSnippetsForDeal(deal, 3),
    dealExecutionFlags.draftingKnowledgeV1
      ? prisma.clauseTemplate.findMany({
          where: { active: true, jurisdiction: deal.jurisdiction ?? "QC" },
          take: 4,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  for (const c of [...chunks, ...lawChunks]) {
    out.push({
      id: `knowledge-${c.id}`,
      title: `Context: ${c.sectionTitle}`,
      suggestion: c.content.slice(0, 900) + (c.content.length > 900 ? "…" : ""),
      whyGenerated: "Matched your deal context against indexed brokerage materials — use as drafting guidance only.",
      source: attributionFromChunk(c),
      confidence: Math.min(0.95, 0.45 + (c.score ?? 0) * 0.5),
      severity: "info",
      requiresBrokerReview: BROKER_REVIEW_LABEL,
      affectedDocumentHint: "Annex / schedule (broker-drafted language)",
    });
  }

  for (const row of library) {
    out.push({
      id: `library-${row.id}`,
      title: `Clause library: ${row.title}`,
      suggestion: row.clauseText.slice(0, 900) + (row.clauseText.length > 900 ? "…" : ""),
      whyGenerated: "Template from curated clause library — adapt to parties and official forms.",
      source: {
        source: "Clause library",
        page: null,
        section: row.title,
        explanation: row.sourceReference,
      },
      confidence: 0.55,
      severity: "info",
      requiresBrokerReview: BROKER_REVIEW_LABEL,
      affectedDocumentHint: row.category,
    });
  }

  return out;
}
