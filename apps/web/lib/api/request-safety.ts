/**
 * Reject obvious raw card payloads — Stripe Elements / Checkout must tokenize client-side.
 */

export function assertNoRawCardDataInBody(body: unknown): { ok: true } | { ok: false; reason: string } {
  if (body == null || typeof body !== "object") return { ok: true };
  const o = body as Record<string, unknown>;
  const card = o.card;
  if (card && typeof card === "object") {
    const c = card as Record<string, unknown>;
    if (typeof c.number === "string" && c.number.replace(/\s/g, "").length >= 12) {
      return { ok: false, reason: "Raw card numbers are not accepted by this API. Use Stripe Checkout or Elements." };
    }
    if (typeof c.cvc === "string" && c.cvc.trim().length > 0) {
      return { ok: false, reason: "Raw card security codes are not accepted by this API." };
    }
  }
  if (typeof o.cardNumber === "string" && o.cardNumber.replace(/\s/g, "").length >= 12) {
    return { ok: false, reason: "Raw card numbers are not accepted by this API." };
  }
  return { ok: true };
}
