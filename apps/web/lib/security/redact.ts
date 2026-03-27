/**
 * Redact common secret patterns from strings before logging or returning diagnostics.
 * Not a substitute for never logging secrets — use for defense in depth.
 */
const PATTERNS: RegExp[] = [
  /Bearer\s+[\w-_.]+/gi,
  /sk_(live|test)_[\w]+/gi,
  /whsec_[\w]+/gi,
  /password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /api[_-]?key["']?\s*[:=]\s*["']?[^"'\s,}]+/gi,
];

export function redactSensitiveText(input: string): string {
  let out = input;
  for (const re of PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

export function redactForLog(meta: unknown): unknown {
  if (meta == null) return meta;
  if (typeof meta === "string") return redactSensitiveText(meta);
  if (typeof meta === "number" || typeof meta === "boolean") return meta;
  if (meta instanceof Error) {
    return { name: meta.name, message: redactSensitiveText(meta.message) };
  }
  try {
    const s = JSON.stringify(meta);
    return JSON.parse(redactSensitiveText(s)) as unknown;
  } catch {
    return "[unserializable]";
  }
}
