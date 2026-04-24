import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";

const BLOCK = new Set([
  "nationality",
  "countryOfOrigin",
  "ethnicity",
  "ethnicityInferred",
  "religionInferred",
  "religion",
  "race",
  "gender",
  "ageExact",
  "age_inferred",
]);

/**
 * Strips disallowed keys and flattens safe preference blobs (explicit + product interaction only).
 */
export function normalizePreferenceRecord(input: unknown): Record<string, unknown> {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (BLOCK.has(k.toLowerCase()) || k.toLowerCase().includes("nationalit")) {
      continue;
    }
    if (typeof v === "string") {
      out[k] = v.length > 8_000 ? v.slice(0, 8_000) : v;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (v == null) {
      continue;
    } else if (Array.isArray(v)) {
      out[k] = (v as unknown[]).filter((x) => typeof x === "string" || typeof x === "number").slice(0, 80);
    } else if (typeof v === "object" && v !== null) {
      out[k] = normalizePreferenceRecord(v);
    } else {
      /* skip unknown types */
    }
  }
  return out;
}

export function safeSignalValue(value: unknown): unknown {
  try {
    if (value == null) {
      return null;
    }
    if (typeof value === "string") {
      return value.length > 4_000 ? value.slice(0, 4_000) : value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (Array.isArray(value)) {
      return (value as unknown[]).map((v) => safeSignalValue(v)).filter((v) => v != null);
    }
    if (typeof value === "object") {
      return normalizePreferenceRecord(value);
    }
  } catch (e) {
    playbookLog.warn("user-intelligence: normalize", { message: e instanceof Error ? e.message : String(e) });
  }
  return null;
}
