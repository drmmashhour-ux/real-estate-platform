import { readFile } from "fs/promises";
import path from "node:path";

export type ExtractedDocumentText = {
  text: string;
  pageCount: number | null;
  method: "PDF_TEXT" | "PLAIN_TEXT" | "OCR_STUB";
  warnings: string[];
};

async function loadPdfParse(): Promise<(b: Buffer) => Promise<{ text: string; numpages: number }>> {
  const mod = await import("pdf-parse");
  return mod.default as (b: Buffer) => Promise<{ text: string; numpages: number }>;
}

/** Extract UTF-8 text from buffer based on mime; PDF uses pdf-parse (no OCR). */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string | null | undefined,
  fileName: string
): Promise<ExtractedDocumentText> {
  const mime = (mimeType ?? "").toLowerCase();
  const lowerName = fileName.toLowerCase();
  const warnings: string[] = [];

  if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
    try {
      const pdfParse = await loadPdfParse();
      const data = await pdfParse(buffer);
      const text = (data.text ?? "").trim();
      if (text.length < 40) {
        warnings.push("PDF_TEXT_SPARSE — OCR not enabled; classification may rely on filename heuristics.");
      }
      return {
        text,
        pageCount: data.numpages ?? null,
        method: "PDF_TEXT",
        warnings,
      };
    } catch {
      return {
        text: "",
        pageCount: null,
        method: "OCR_STUB",
        warnings: ["PDF_UNREADABLE — possible encrypted or corrupted PDF."],
      };
    }
  }

  if (mime.startsWith("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".csv")) {
    try {
      const text = buffer.toString("utf8");
      return { text, pageCount: null, method: "PLAIN_TEXT", warnings };
    } catch {
      warnings.push("TEXT_DECODE_FAILED");
      return { text: "", pageCount: null, method: "PLAIN_TEXT", warnings };
    }
  }

  warnings.push("UNSUPPORTED_FOR_TEXT_EXTRACTION — treat as review-required.");
  return { text: "", pageCount: null, method: "OCR_STUB", warnings };
}

export async function readDocumentBufferFromPublicPath(filePath: string): Promise<Buffer> {
  const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
  const abs = path.join(process.cwd(), "public", normalized.replace(/^\//, ""));
  return readFile(abs);
}
