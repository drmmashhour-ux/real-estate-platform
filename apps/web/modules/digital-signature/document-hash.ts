import { createHash } from "node:crypto";

/** Canonical UTF-8 payload hashed before any signature (integrity). */
export function canonicalDocumentSha256(input: {
  templateVersionId: string;
  templateVersionNumber: number;
  renderedHtml: string;
}): string {
  const canonical = JSON.stringify({
    v: input.templateVersionId,
    vn: input.templateVersionNumber,
    html: input.renderedHtml,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function recordEnvelopeSha256(parts: {
  documentHash: string;
  signedByUserId: string;
  signedAtIso: string;
  consentTextVersion: string;
  consentAcknowledged: boolean;
  ipAddress: string;
  userAgent: string;
}): string {
  const line = [
    parts.documentHash,
    parts.signedByUserId,
    parts.signedAtIso,
    parts.consentTextVersion,
    parts.consentAcknowledged ? "1" : "0",
    parts.ipAddress,
    parts.userAgent,
  ].join("|");
  return createHash("sha256").update(line, "utf8").digest("hex");
}
