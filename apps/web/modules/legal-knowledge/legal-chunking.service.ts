import type { LegalIngestSection } from "./legal-knowledge.types";

export const LEGAL_CHUNK_MAX_CHARS = 2800;

/**
 * Splits raw text into ingestible sections (paragraph blocks + optional markdown headings).
 * Keeps page hints when provided (OCR-free; assumes text is already extracted).
 */
export function parsePlaintextToSections(rawText: string, defaultPage?: number): LegalIngestSection[] {
  const blocks = rawText.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: LegalIngestSection[] = [];
  let buf = "";
  let title = "Introduction";

  for (const block of blocks) {
    const heading = block.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      if (buf) {
        out.push({ sectionTitle: title, pageNumber: defaultPage ?? null, content: buf.trim() });
        buf = "";
      }
      title = heading[1]!.trim();
      continue;
    }
    if ((buf + block).length > LEGAL_CHUNK_MAX_CHARS) {
      if (buf) out.push({ sectionTitle: title, pageNumber: defaultPage ?? null, content: buf.trim() });
      buf = block;
    } else {
      buf = buf ? `${buf}\n\n${block}` : block;
    }
  }
  if (buf) out.push({ sectionTitle: title, pageNumber: defaultPage ?? null, content: buf.trim() });
  return out.length
    ? out
    : [{ sectionTitle: "Body", pageNumber: defaultPage ?? null, content: rawText.slice(0, LEGAL_CHUNK_MAX_CHARS) }];
}
