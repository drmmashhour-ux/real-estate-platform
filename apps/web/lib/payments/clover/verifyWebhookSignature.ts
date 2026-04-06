import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates `Clover-Signature: t=...,v1=...` per Hosted Checkout webhook docs.
 * @see https://docs.clover.com/dev/docs/ecomm-hosted-checkout-webhook
 */
export function verifyCloverHostedCheckoutSignature(
  rawBody: string,
  cloverSignatureHeader: string | null,
  signingSecret: string
): boolean {
  if (!cloverSignatureHeader?.trim() || !signingSecret) return false;

  let t = "";
  let v1 = "";
  for (const part of cloverSignatureHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "t") t = val;
    if (key === "v1") v1 = val;
  }
  if (!t || !v1) return false;

  const payload = `${t}.${rawBody}`;
  const expectedHex = createHmac("sha256", signingSecret).update(payload, "utf8").digest("hex");

  try {
    const a = Buffer.from(expectedHex, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
