/**
 * Deep-stable normalization for context payloads (deterministic, no DB).
 * Removes `undefined`, keeps `null` explicit, sorts object keys.
 */

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function normalizeValue(v: unknown): unknown {
  if (v === undefined) {
    return undefined;
  }
  if (v === null) {
    return null;
  }
  if (Array.isArray(v)) {
    return v.map((x) => normalizeValue(x) ?? null);
  }
  if (isPlainObject(v)) {
    return normalizeObject(v);
  }
  if (typeof v === "number" && !Number.isFinite(v)) {
    return null;
  }
  return v;
}

function normalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const n = normalizeValue(obj[k]);
    if (n !== undefined) {
      out[k] = n;
    }
  }
  return out;
}

/** Strips undefined at root and normalizes — safe for JSON persistence / hashing. */
export function normalizeContextSnapshot<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return normalizeObject({ ...input }) as Record<string, unknown>;
}

/**
 * Deterministic deep normalization: sorted keys, undefined stripped (Wave 2 fingerprinting).
 * Mirrors a stable JSON shape before hashing; keeps `null` where present.
 */
export function normalizeContext(input: unknown): unknown {
  if (input === null || input === undefined) {
    return null;
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeContext(item));
  }
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const value = obj[key];
      if (value !== undefined) {
        result[key] = normalizeContext(value);
      }
    }
    return result;
  }
  return input;
}
