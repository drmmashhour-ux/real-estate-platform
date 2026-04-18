import { parsePlaintextToSections } from "@/modules/legal-knowledge/legal-chunking.service";
import type { LegalIngestSection } from "@/modules/legal-knowledge/legal-knowledge.types";

/**
 * Adapter boundary for future PDF/HTML/OCR pipelines — v1 passes through plain text from uploads.
 */
export function adaptRawTextToSections(raw: string, opts?: { defaultPage?: number }): LegalIngestSection[] {
  return parsePlaintextToSections(raw, opts?.defaultPage);
}
