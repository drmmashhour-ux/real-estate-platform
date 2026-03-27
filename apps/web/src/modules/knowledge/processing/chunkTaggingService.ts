import type { KnowledgeChunkAudience, KnowledgeChunkImportance, KnowledgeChunkSemanticType } from "@prisma/client";

/**
 * Deterministic keyword/heuristic tagging — no LLM. Same input always yields same tags.
 */
export function tagChunkForLegalKnowledge(
  content: string,
  documentType: "law" | "drafting" | "internal",
): {
  chunkType: KnowledgeChunkSemanticType;
  audience: KnowledgeChunkAudience;
  importance: KnowledgeChunkImportance;
} {
  const low = content.toLowerCase();

  let chunkType: KnowledgeChunkSemanticType = "declaration";
  if (/\b(must|shall|obligat|required to|duty|devoir|interdit|prohibited|mandatory)\b/.test(low)) {
    chunkType = "obligation";
  } else if (/\b(clause|section|article|paragraph|subparagraph|subsection)\b/.test(low)) {
    chunkType = "clause";
  } else if (/\b(process|procedure|step|steps|first\b|then\b|submit|file|timeline|délai)\b/.test(low)) {
    chunkType = "process";
  } else if (documentType === "drafting" && /\b(template|form|field)\b/.test(low)) {
    chunkType = "process";
  }

  let audience: KnowledgeChunkAudience = "transaction";
  if (/\b(seller|vendor|vendeur|disclose|declaration|divulgation)\b/.test(low)) audience = "seller";
  else if (/\b(buyer|purchaser|acquéreur|acheteur)\b/.test(low)) audience = "buyer";
  else if (/\b(broker|agent|mandat|oaciq|courtier)\b/.test(low)) audience = "broker";

  const importance: KnowledgeChunkImportance =
    /\b(must|shall|mandatory|required|interdit|prohibited|shall not|ne doit pas)\b/.test(low) ? "mandatory" : "optional";

  return { chunkType, audience, importance };
}
