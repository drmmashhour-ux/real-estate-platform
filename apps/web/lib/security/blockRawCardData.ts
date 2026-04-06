import { NextResponse } from "next/server";

function normalizePanCandidate(s: string): string {
  return s.replace(/\s+/g, "");
}

function isPanLikeString(s: string): boolean {
  const d = normalizePanCandidate(s);
  return /^\d{12,19}$/.test(d);
}

function isLikelyRawCardObject(obj: Record<string, unknown>): boolean {
  const num = obj.number;
  const em = obj.exp_month;
  const ey = obj.exp_year;
  const cvc = obj.cvc;
  const exp = obj.exp;

  if (typeof num === "string" && isPanLikeString(num)) {
    if (em !== undefined || ey !== undefined || exp !== undefined || cvc !== undefined) return true;
  }
  if (typeof cvc === "string" && /^\d{3,4}$/.test(cvc)) {
    if (num !== undefined || em !== undefined || ey !== undefined) return true;
  }
  return false;
}

/**
 * Detects client-submitted raw card / payment_method_data payloads.
 * Avoids flagging Stripe webhook bodies (last4-only card objects, etc.).
 */
export function hasRawCardLikePayload(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasRawCardLikePayload(item));

  const o = value as Record<string, unknown>;

  if ("payment_method_data" in o) return true;

  const expCombined =
    typeof o.exp === "string" && /^\d{1,2}\s*\/\s*\d{2,4}$/.test(o.exp.trim());
  if (expCombined && (typeof o.number === "string" || typeof o.cvc === "string")) return true;

  if (o.card !== undefined && o.card !== null && typeof o.card === "object") {
    const card = o.card as Record<string, unknown>;
    if (isLikelyRawCardObject(card)) return true;
    if (hasRawCardLikePayload(card)) return true;
  }

  if (isLikelyRawCardObject(o)) return true;

  for (const val of Object.values(o)) {
    if (hasRawCardLikePayload(val)) return true;
  }
  return false;
}

export function logBlockedRawCardAttempt(): void {
  console.warn("[SECURITY] Blocked raw card data attempt");
}

export function jsonResponseRawCardBlocked(): NextResponse {
  logBlockedRawCardAttempt();
  return NextResponse.json({ error: "Raw card data is not allowed" }, { status: 400 });
}
