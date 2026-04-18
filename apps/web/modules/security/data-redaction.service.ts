const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "stripesecret",
  "secret",
  "token",
  "authorization",
  "cookie",
  "ssn",
]);

/** Redact obvious secrets for safe logging / client responses. */
export function redactForLog<T>(input: T, depth = 0): T {
  if (depth > 8) return "[max-depth]" as T;
  if (input == null || typeof input !== "object") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((x) => redactForLog(x, depth + 1)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes("password")) {
      out[k] = "[redacted]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactForLog(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
