export { extractPdfText, splitIntoChunks } from "@/lib/ai/ingest-documents";

/** Overlapping windows — optional for long PDFs where boundary loss matters. */
export function splitIntoChunksWithOverlap(text: string, size = 1200, overlap = 150): string[] {
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
