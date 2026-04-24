/**
 * Strip obvious PII from stored training payloads (best-effort; not a certified anonymizer).
 */

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
const LONG_DIGIT = /\b\d{10,}\b/g;

export function anonymizeJsonValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(EMAIL, "[REDACTED_EMAIL]").replace(PHONE, "[REDACTED_PHONE]").replace(LONG_DIGIT, "[REDACTED_ID]");
  }
  if (Array.isArray(value)) {
    return value.map(anonymizeJsonValue);
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const keyLower = k.toLowerCase();
      if (
        keyLower.includes("email") ||
        keyLower.includes("phone") ||
        keyLower.includes("telephone") ||
        keyLower.includes("ssn") ||
        keyLower.includes("nas")
      ) {
        out[k] = "[REDACTED_FIELD]";
      } else {
        out[k] = anonymizeJsonValue(v);
      }
    }
    return out;
  }
  return value;
}
