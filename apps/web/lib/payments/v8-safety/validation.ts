/**
 * Input validation helpers — reject malformed ids before side effects (additive guards).
 */

const CS_PREFIX = "cs_";

export function assertCheckoutSessionIdShape(sessionId: string): void {
  if (typeof sessionId !== "string" || sessionId.length < 10) {
    throw new Error("v8_safety_validation:invalid_session_id_shape");
  }
  if (!sessionId.startsWith(CS_PREFIX)) {
    throw new Error("v8_safety_validation:session_id_must_start_with_cs_");
  }
}

export function safePositiveMinorAmountCents(cents: number | null | undefined): boolean {
  if (cents == null || typeof cents !== "number" || !Number.isFinite(cents)) return false;
  return cents >= 0 && cents < 1e12;
}
