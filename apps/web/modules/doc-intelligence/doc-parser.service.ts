import type { DealDocument } from "@prisma/client";
import type { ParsedDocumentStub } from "./doc.types";

/** Uses structured JSON already stored on the document — no OCR in v1. */
export function parseStructuredDocument(doc: DealDocument): ParsedDocumentStub {
  const raw = doc.structuredData;
  const fields = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    dealDocumentId: doc.id,
    fields,
    confidence: 0.75,
  };
}
