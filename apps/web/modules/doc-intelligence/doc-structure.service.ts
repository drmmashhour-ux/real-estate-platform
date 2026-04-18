import type { DealDocument } from "@prisma/client";

export function summarizeStructure(doc: DealDocument): { templateKey: string | null; hasRender: boolean } {
  return {
    templateKey: doc.templateKey ?? null,
    hasRender: doc.renderedOutput != null,
  };
}
