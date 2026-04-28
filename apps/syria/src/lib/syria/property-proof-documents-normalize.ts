import { MAX_PROPERTY_PROOF_DOCUMENTS } from "@/lib/syria/photo-upload";
import { isTrustedDarlinkCloudinaryProofUrl } from "@/lib/syria/cloudinary-proof-url";
import { isValidPropertyDocumentTypeKey } from "@/lib/syria/property-document-types";

/**
 * ORDER SYBNB-100 — Strict normalization for listing proofs JSON (`unknown` from APIs / JSON.parse).
 * Returns `null` when payload is malformed; `[]` when absent / empty.
 */
export function normalizeProofDocumentsPayload(raw: unknown): { type: string; url: string }[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_PROPERTY_PROOF_DOCUMENTS) return null;

  const seen = new Set<string>();
  const out: { type: string; url: string }[] = [];

  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const typ = typeof o.type === "string" ? o.type.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!isValidPropertyDocumentTypeKey(typ)) return null;
    if (!url || !isTrustedDarlinkCloudinaryProofUrl(url)) return null;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ type: typ, url });
  }

  return out;
}
