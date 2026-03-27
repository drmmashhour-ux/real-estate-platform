import "server-only";

export type ExtractedPdfResult = {
  text: string;
  pageCount: number;
};

async function loadPdfParse() {
  const mod = await import("pdf-parse");
  return (mod as { default: (dataBuffer: Buffer) => Promise<{ text: string; numpages: number }> }).default;
}

/**
 * Extract plain text from a PDF buffer (server-side only).
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<ExtractedPdfResult> {
  const pdfParse = await loadPdfParse();
  const data = await pdfParse(buffer);
  const text = String(data.text ?? "").replace(/\s+/g, " ").trim();
  const pageCount = Math.max(1, Number(data.numpages) || 1);
  return { text, pageCount };
}

export async function extractTextFromPdfOrSource(args: {
  fileUrl: string;
  rawText?: string;
}): Promise<ExtractedPdfResult> {
  if (args.rawText?.trim()) {
    return { text: args.rawText.trim(), pageCount: 1 };
  }

  const res = await fetch(args.fileUrl).catch(() => null);
  if (!res || !res.ok) return { text: "", pageCount: 0 };

  const contentType = res.headers.get("content-type") ?? "";
  const buf = Buffer.from(await res.arrayBuffer());

  if (contentType.includes("pdf") || args.fileUrl.toLowerCase().includes(".pdf")) {
    try {
      return await extractTextFromPdfBuffer(buf);
    } catch {
      return { text: "", pageCount: 0 };
    }
  }

  if (contentType.includes("text") || args.fileUrl.endsWith(".txt")) {
    const text = (await res.text()).trim();
    return { text, pageCount: 1 };
  }

  return { text: "", pageCount: 0 };
}

/** Map a substring offset in full text to an approximate 1-based PDF page. */
export function approximatePageForOffset(offset: number, fullTextLength: number, pageCount: number): number | null {
  if (!pageCount || !fullTextLength) return pageCount ? 1 : null;
  const ratio = Math.min(1, Math.max(0, offset / fullTextLength));
  return Math.min(pageCount, Math.max(1, Math.floor(ratio * pageCount) + 1));
}

export function approximatePageForChunk(chunk: string, chunkIndex: number, chunks: string[], fullText: string, pageCount: number): number | null {
  if (!pageCount) return null;
  const needle = chunk.slice(0, Math.min(64, chunk.length));
  let offset = needle.length ? fullText.indexOf(needle) : -1;
  if (offset < 0) {
    const pos = (chunkIndex / Math.max(1, chunks.length)) * fullText.length;
    offset = Math.floor(pos);
  }
  return approximatePageForOffset(offset, fullText.length, pageCount);
}
