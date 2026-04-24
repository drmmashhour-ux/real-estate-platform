import type { SharedContextRepresentation } from "./shared-context.types";

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function sortKeys<T extends Record<string, unknown>>(o: T): T {
  const out = {} as T;
  for (const k of Object.keys(o).sort((a, b) => a.localeCompare(b, "en"))) {
    out[k as keyof T] = o[k] as T[keyof T];
  }
  return out;
}

function normalizeValue(v: unknown, depth: number): string | number | boolean | null | (string | number | boolean)[] {
  if (v === null) {
    return null;
  }
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return v;
  }
  if (Array.isArray(v) && depth < 6) {
    return v
      .map((x) => {
        if (x === null || x === undefined) {
          return null;
        }
        if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
          return x;
        }
        if (isPlainObject(x) && depth < 5) {
          return JSON.stringify(sortKeys(serializeToFlatObject(x, depth + 1)));
        }
        return null;
      })
      .filter((x): x is string | number | boolean => x !== null) as (string | number | boolean)[];
  }
  if (isPlainObject(v) && depth < 5) {
    return JSON.stringify(sortKeys(serializeToFlatObject(v, depth + 1)));
  }
  return String(v);
}

function serializeToFlatObject(obj: Record<string, unknown>, depth: number): Record<string, string | number | boolean | null> {
  const flat: Record<string, string | number | boolean | null> = {};
  for (const k of Object.keys(obj).sort((a, b) => a.localeCompare(b, "en"))) {
    if (k === "undefined" || k.startsWith("_")) {
      continue;
    }
    const n = obj[k as keyof typeof obj] as unknown;
    if (n === undefined) {
      continue;
    }
    if (n === null) {
      flat[k] = null;
    } else if (typeof n === "string" || typeof n === "number" || typeof n === "boolean") {
      flat[k] = n;
    } else {
      const nv = normalizeValue(n, depth);
      if (Array.isArray(nv)) {
        const sorted = [...nv].sort();
        flat[k] = JSON.stringify(sorted);
      } else if (typeof nv === "string" || typeof nv === "number" || typeof nv === "boolean" || nv === null) {
        flat[k] = nv;
      }
    }
  }
  return sortKeys(flat) as unknown as typeof flat;
}

/**
 * Produces a deterministic, sorted feature map. Drops undefined, stabilizes array order, shallow JSON for nested.
 */
export function normalizeSharedContext(input: unknown): Record<string, string | number | boolean | null> {
  try {
    if (!isPlainObject(input) && !Array.isArray(input)) {
      if (input === null) {
        return {};
      }
      if (input === undefined) {
        return {};
      }
      if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
        return { v: input };
      }
      return {};
    }
    if (Array.isArray(input)) {
      return { a: JSON.stringify([...input].map(String).sort()) };
    }
    return sortKeys(serializeToFlatObject(input, 0));
  } catch {
    return {};
  }
}

/**
 * Merges segment/market/signals from a request into a SharedContextRepresentation.
 */
export function toSharedContextRepresentation(
  params: {
    originDomain: string;
    features?: unknown;
    explicit?: unknown;
    market?: unknown;
    segment?: unknown;
  },
): SharedContextRepresentation {
  const features = { ...normalizeSharedContext(params.features), ...normalizeSharedContext(params.segment) };
  const m = normalizeSharedContext(params.market);
  for (const [k, v] of Object.entries(m)) {
    if (features[k] == null) {
      features[k] = v;
    }
  }
  return {
    version: 1,
    originDomain: String(params.originDomain).toUpperCase(),
    features: features as Record<string, string | number | boolean | null>,
    explicitPreferences: normalizeSharedContext(params.explicit),
    marketHints: (params.market as SharedContextRepresentation["marketHints"]) ?? undefined,
  };
}
