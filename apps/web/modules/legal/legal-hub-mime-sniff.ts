import {
  LEGAL_HUB_ALLOWED_MIME,
  LEGAL_HUB_DOC_MAX_BYTES,
} from "./legal-hub-phase2.constants";

/** Sniff PDF / JPEG / PNG from magic bytes — do not trust `File.type`. */
export function sniffLegalHubMime(buffer: Uint8Array): string | null {
  if (buffer.length < 8) return null;
  const b = buffer;

  // PDF — header starts with %PDF (version digit may follow on same line or after whitespace)
  if (buffer.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return "application/pdf";
  }

  // JPEG
  if (buffer.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "image/png";
  }

  return null;
}

export function extensionForLegalMime(mime: string): string | null {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return null;
  }
}

export function validateLegalHubBuffer(params: {
  buffer: Buffer;
  declaredMime?: string | null;
}): { ok: true; mime: string } | { ok: false; message: string } {
  if (params.buffer.length === 0) {
    return { ok: false, message: "Empty file" };
  }
  if (params.buffer.length > LEGAL_HUB_DOC_MAX_BYTES) {
    return { ok: false, message: `File too large (max ${LEGAL_HUB_DOC_MAX_BYTES / (1024 * 1024)} MB)` };
  }

  const sniffed = sniffLegalHubMime(params.buffer);
  if (!sniffed || !LEGAL_HUB_ALLOWED_MIME.has(sniffed)) {
    return { ok: false, message: "Only PDF, JPG, or PNG files are allowed" };
  }

  const declared = (params.declaredMime ?? "").trim().toLowerCase();
  const normalized =
    declared === "image/jpg" ? "image/jpeg" : declared === "application/x-pdf" ? "application/pdf" : declared;
  if (normalized && LEGAL_HUB_ALLOWED_MIME.has(normalized) && normalized !== sniffed) {
    return { ok: false, message: "File content does not match declared type" };
  }

  return { ok: true, mime: sniffed };
}

export function sanitizeLegalHubDisplayName(raw: string, maxLen = 200): string {
  const base = raw.replace(/[/\\]/g, "_").replace(/\s+/g, " ").trim().slice(0, maxLen);
  if (!base) return "upload";
  return base;
}
