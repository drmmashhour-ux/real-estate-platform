/**
 * Shared upload limits and filename hygiene for API routes and storage helpers.
 */

/** BNHUB listing images — server-side ops upload. */
export const LISTING_IMAGE_MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export const LISTING_IMAGE_MIME_ALLOWLIST = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DANGEROUS_EXT = /\.(html?|svg|js|mjs|cjs|php|phtml|exe|sh|bat|cmd)(\s|$)/i;

/**
 * Reduce path traversal and script-like names; keep a short safe basename.
 */
export function sanitizeUploadBasename(original: string | undefined | null, fallbackExt: string): string {
  const base = (original ?? "").split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-()+ ]/g, "_").slice(0, 120);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return `upload${fallbackExt.startsWith(".") ? fallbackExt : `.${fallbackExt}`}`;
  }
  if (DANGEROUS_EXT.test(cleaned)) {
    return `sanitized${fallbackExt.startsWith(".") ? fallbackExt : `.${fallbackExt}`}`;
  }
  return cleaned;
}

export function isAllowedListingImageMime(mime: string): boolean {
  const m = mime.trim().toLowerCase();
  return LISTING_IMAGE_MIME_ALLOWLIST.has(m);
}

/** See `lib/security/malware-scan.ts` (ClamAV + webhook) — used by BNHUB listing uploads. */
