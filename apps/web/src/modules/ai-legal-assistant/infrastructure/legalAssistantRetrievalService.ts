import { retrieveGuidanceBySection, retrieveExplanationContent } from "@/src/modules/seller-declaration-ai/knowledge/declarationKnowledgeRetrievalService";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

export async function retrieveLegalAssistantKnowledge(sectionKeys: string[], queryHint?: string) {
  const out: string[] = [];
  for (const s of sectionKeys) {
    for (const g of retrieveGuidanceBySection(s)) out.push(`${g.sectionKey}: ${g.text}`);
    for (const e of retrieveExplanationContent(s)) out.push(`${e.sectionKey}: ${e.text}`);
  }
  if (queryHint?.trim()) {
    const hits = await getLegalContext(queryHint, { limit: 5 }).catch(() => []);
    for (const hit of hits) {
      out.push(`[${hit.source.title} · p.${hit.pageNumber ?? "—"} · ${hit.importance}] ${hit.content}`);
    }
  }
  return Array.from(new Set(out)).slice(0, 20);
}
