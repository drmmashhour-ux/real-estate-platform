import type { KnowledgeChunkSemanticType, KnowledgeDocumentType } from "@prisma/client";
import type { LegalMaterialType } from "./legal-knowledge.types";

export function mapSemanticToMaterialType(
  chunkType: KnowledgeChunkSemanticType,
  documentType: KnowledgeDocumentType,
): LegalMaterialType {
  if (documentType === "law") return "law";
  if (chunkType === "obligation") return "obligation";
  if (chunkType === "process") return "workflow";
  if (documentType === "drafting") return "drafting_guideline";
  return "drafting_guideline";
}

export function mapDocumentTypeToMaterialType(documentType: KnowledgeDocumentType): LegalMaterialType {
  if (documentType === "law") return "law";
  if (documentType === "drafting") return "drafting_guideline";
  return "drafting_guideline";
}
