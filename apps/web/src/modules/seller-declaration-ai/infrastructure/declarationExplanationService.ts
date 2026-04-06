import { retrieveExplanationContent, retrieveGuidanceBySection } from "@/src/modules/seller-declaration-ai/knowledge/declarationKnowledgeRetrievalService";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

async function retrieveBookHints(sectionKey: string) {
  const q = `seller declaration disclosure ${sectionKey}`;
  let hits = await getLegalContext(q, { audience: "seller", documentType: "law", limit: 2 }).catch(() => []);
  if (!hits.length) hits = await getLegalContext(q, { audience: "seller", documentType: "drafting", limit: 2 }).catch(() => []);
  if (!hits.length) hits = await getLegalContext(q, { audience: "seller", limit: 2 }).catch(() => []);
  return hits;
}

export async function explainDeclarationSection(sectionKey: string) {
  const explanation = retrieveExplanationContent(sectionKey)[0]?.text;
  const guidance = retrieveGuidanceBySection(sectionKey)[0]?.text;
  const bookHits = await retrieveBookHints(sectionKey);
  const externalHint = bookHits[0]?.content;
  const sources = bookHits.map((h) => ({
    title: h.source.title,
    pageNumber: h.pageNumber,
    importance: h.importance,
    chunkType: h.chunkType,
    excerpt: h.content.slice(0, 320),
  }));

  return {
    sectionKey,
    text: explanation ?? guidance ?? externalHint ?? "Disclose factual, material information relevant to this section.",
    expectedAnswer: "Use neutral factual statements only. Avoid promotional wording, blanket guarantees, and unsupported legal assurances. Include dates, areas, and status where known.",
    example: "Example: Water infiltration observed in basement storage room in spring 2023. Area was dried and repaired by contractor in June 2023. Seller is not aware of recurrence since that repair.",
    sources,
  };
}
