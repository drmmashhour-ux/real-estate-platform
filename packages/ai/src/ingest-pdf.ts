/**
 * PDF text extraction + chunking for drafting corpora (OACIQ forms, brokerage books).
 * Low-level I/O lives in `ingest-documents.ts`; this module matches the LECIPM chunk defaults.
 */
import { extractPdfText } from "@/lib/ai/ingest-documents";

export { extractPdfText };

/** Overlapping windows (default 1200 / 150) to limit boundary loss on long forms. */
export function splitIntoChunks(text: string, size = 1200, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

/** @deprecated Use `splitIntoChunks` (now overlap-aware). */
export function splitIntoChunksWithOverlap(text: string, size = 1200, overlap = 150): string[] {
  return splitIntoChunks(text, size, overlap);
}
