import type { ConflictReviewFlag } from "./esg-document-types";

export const ESG_DOC_MAX_BYTES = 25 * 1024 * 1024;

export const ESG_ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function guessMimeFromName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return null;
}

export function validateUpload(input: {
  fileName: string;
  mimeType: string | null | undefined;
  sizeBytes: number;
}): { ok: true; mime: string } | { ok: false; message: string } {
  if (input.sizeBytes <= 0 || input.sizeBytes > ESG_DOC_MAX_BYTES) {
    return { ok: false, message: "File size must be between 1 byte and 25 MB." };
  }
  const mime = (input.mimeType ?? guessMimeFromName(input.fileName) ?? "").toLowerCase();
  if (!mime || !ESG_ALLOWED_MIME.has(mime)) {
    return { ok: false, message: "Unsupported file type for ESG ingestion." };
  }
  return { ok: true, mime };
}

/** Token overlap 0–1 for address / listing alignment checks */
export function tokenSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const ta = new Set(norm(a));
  const tb = new Set(norm(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

export function shouldFlagAddressMismatch(
  listingAnchor: string,
  documentAddress: string | null | undefined,
  minSim = 0.12
): ConflictReviewFlag | null {
  if (!documentAddress?.trim()) return null;
  const sim = tokenSimilarity(listingAnchor, documentAddress);
  if (sim >= minSim) return null;
  return {
    severity: "MEDIUM",
    fieldName: "serviceAddress",
    issue: "Document address tokens do not align with listing anchor text.",
    oldValue: listingAnchor.slice(0, 200),
    newValue: documentAddress.slice(0, 200),
    recommendedAction: "Confirm service address manually or upload a bill for this asset.",
  };
}
