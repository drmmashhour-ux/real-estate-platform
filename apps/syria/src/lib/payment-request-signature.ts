import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * S3 — HMAC of canonical payload. Secret: PAYMENT_SECRET (server only).
 * Payload: `${requestId}|${listingId}|${amountSypInt}`
 */
export function f1PaymentPayload(requestId: string, listingId: string, amount: number): string {
  return `${requestId}|${listingId}|${amount}`;
}

export function f1GetPaymentSecret(): string | null {
  const s = (process.env.PAYMENT_SECRET ?? "").trim();
  return s.length > 0 ? s : null;
}

export function f1SignPaymentRequest(requestId: string, listingId: string, amount: number, secret: string): string {
  return createHmac("sha256", secret).update(f1PaymentPayload(requestId, listingId, amount), "utf8").digest("hex");
}

export function f1VerifyPaymentRequestSig(
  sigHex: string,
  requestId: string,
  listingId: string,
  amount: number,
  secret: string,
): boolean {
  const expected = f1SignPaymentRequest(requestId, listingId, amount, secret);
  const a = Buffer.from(sigHex.trim().toLowerCase(), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
