/**
 * Central limits for TrustGraph-related evidence uploads (align with FSBO hub where possible).
 */
export const TRUSTGRAPH_UPLOAD_IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const TRUSTGRAPH_UPLOAD_DOCUMENT_MIMES = ["application/pdf"] as const;

export const TRUSTGRAPH_UPLOAD_VALIDATION = {
  maxFileBytes: 12 * 1024 * 1024,
  /** All allowed types (photos + PDF) for mixed TrustGraph evidence buckets. */
  allowedMimeTypes: [...TRUSTGRAPH_UPLOAD_IMAGE_MIMES, ...TRUSTGRAPH_UPLOAD_DOCUMENT_MIMES] as const,
} as const;

export type TrustgraphAllowedMime = (typeof TRUSTGRAPH_UPLOAD_VALIDATION.allowedMimeTypes)[number];

export function isAllowedTrustGraphMime(mime: string): mime is TrustgraphAllowedMime {
  const normalized = mime.toLowerCase().trim();
  if (normalized === "image/jpg") return true;
  return (TRUSTGRAPH_UPLOAD_VALIDATION.allowedMimeTypes as readonly string[]).includes(normalized as TrustgraphAllowedMime);
}

export function isAllowedTrustGraphImageMime(mime: string): boolean {
  const n = mime.toLowerCase().trim();
  if (n === "image/jpg") return true;
  return (TRUSTGRAPH_UPLOAD_IMAGE_MIMES as readonly string[]).includes(n);
}

export function isAllowedTrustGraphDocumentMime(mime: string): boolean {
  return (TRUSTGRAPH_UPLOAD_DOCUMENT_MIMES as readonly string[]).includes(mime.toLowerCase().trim());
}
