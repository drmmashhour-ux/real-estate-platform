import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

type KnowledgeSection = {
  id: string;
  title: string;
  content: string;
  keywords: string[];
};

type LocalKnowledgeChunk = {
  id: string;
  sectionId: string;
  title: string;
  chunkText: string;
  keywords: string[];
};

const sections: KnowledgeSection[] = [
  {
    id: "book_required_fields",
    title: "Required Field Discipline",
    keywords: ["required", "field", "missing", "mandatory"],
    content:
      "All mandatory fields must be completed before legal drafting can proceed. Dates should be provided in YYYY-MM-DD format.",
  },
  {
    id: "book_clause_clarity",
    title: "Clause Clarity",
    keywords: ["clause", "clarity", "plain", "wording"],
    content:
      "Clauses should be explicit, non-ambiguous, and tied to a contract reference where possible.",
  },
  {
    id: "book_compliance_disclaimer",
    title: "Compliance Disclaimer",
    keywords: ["compliance", "review", "counsel", "legal"],
    content:
      "Generated drafts are preparatory and must be reviewed by qualified legal counsel before execution.",
  },
];

function chunkContent(section: KnowledgeSection): LocalKnowledgeChunk[] {
  const segments = section.content.split(/(?<=\.)\s+/).filter(Boolean);
  return segments.map((chunkText, idx) => ({
    id: `${section.id}_chunk_${idx + 1}`,
    sectionId: section.id,
    title: section.title,
    chunkText,
    keywords: section.keywords,
  }));
}

const indexedChunks: LocalKnowledgeChunk[] = sections.flatMap(chunkContent);

export function getKnowledgeIndex() {
  return indexedChunks;
}

/** Offline / deterministic fallback when no uploaded books match. */
export function retrieveRelevantKnowledge(query: string, limit = 3): LocalKnowledgeChunk[] {
  const q = query.toLowerCase();
  const scored = indexedChunks.map((chunk) => {
    const keyHits = chunk.keywords.filter((k) => q.includes(k)).length;
    const textHit = chunk.chunkText.toLowerCase().includes(q) ? 1 : 0;
    return { chunk, score: keyHits * 2 + textHit };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, limit)
    .map((x) => x.chunk);
}

/**
 * Prefer uploaded law/drafting books (retrieval); fall back to local seed chunks.
 */
export async function retrieveRelevantKnowledgeWithUploads(query: string, limit = 4) {
  const rows = await getLegalContext(query, { documentType: "drafting", limit }).catch(() => []);
  if (rows.length) {
    return rows.map((r) => ({
      id: r.chunkId,
      title: r.source.title,
      chunkText: r.content,
      keywords: [] as string[],
      sourceUrl: r.source.fileUrl,
      pageNumber: r.pageNumber,
      importance: r.importance,
    }));
  }
  return retrieveRelevantKnowledge(query, limit).map((c) => ({
    id: c.id,
    title: c.title,
    chunkText: c.chunkText,
    keywords: c.keywords,
    sourceUrl: null as string | null,
    pageNumber: null as number | null,
    importance: "optional" as const,
  }));
}
