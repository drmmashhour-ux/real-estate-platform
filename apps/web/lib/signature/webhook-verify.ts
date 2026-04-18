import { createHmac, timingSafeEqual } from "crypto";

/** DocuSign Connect HMAC (configure secret in Connect). */
export function verifyDocuSignHmac(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.DOCUSIGN_CONNECT_HMAC_SECRET;
  if (!secret || !signatureHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** PandaDoc webhook shared secret (header name varies by workspace). */
export function verifyPandaDocSharedSecret(headerValue: string | null): boolean {
  const expected = process.env.PANDADOC_WEBHOOK_SECRET;
  if (!expected || !headerValue) return false;
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(headerValue);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
