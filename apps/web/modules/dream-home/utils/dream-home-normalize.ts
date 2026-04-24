import type { DreamHomeIntake } from "../types/dream-home.types";

/** Keys we never pass to the model or use for matching (safety / anti-profiling). */
const STRIP_INTAKE_KEYS = new Set([
  "nationality",
  "nationalities",
  "countryOfBirth",
  "countryOfOrigin",
  "ethnicity",
  "religionInferred",
  "race",
]);

const MAX_LEN = 4000;

function truncate(s: string): string {
  if (s.length <= MAX_LEN) return s;
  return `${s.slice(0, MAX_LEN)}…`;
}

/**
 * Strips unsafe keys, caps string length, and ensures numeric fields are finite.
 * Does not add inferred preferences — only cleans transport.
 */
export function normalizeIntake(input: unknown): DreamHomeIntake {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const raw = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (STRIP_INTAKE_KEYS.has(k)) continue;
    if (k === "culturalLifestyleTags" && Array.isArray(v)) {
      out[k] = v.filter((x): x is string => typeof x === "string").map((s) => truncate(s));
      continue;
    }
    if (typeof v === "string") {
      out[k] = truncate(v);
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (v === null || v === undefined) {
      continue;
    }
  }
  return out as DreamHomeIntake;
}
