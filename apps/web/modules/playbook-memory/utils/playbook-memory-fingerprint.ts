import { createHash } from "node:crypto";
import { normalizeContext } from "./playbook-memory-normalize";
import type { PlaybookComparableContext } from "../types/playbook-memory.types";

/** Deterministic stable JSON string (sorted keys recursively). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(",")}}`;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildSegmentKey(context: PlaybookComparableContext): string {
  const s = context.segment ?? {};
  const parts = [
    context.entityType,
    s.leadType ?? "",
    s.budgetBand ?? "",
    s.urgency ?? "",
    s.propertyType ?? "",
    s.language ?? "",
    s.hostTier ?? "",
    s.bedrooms != null ? String(s.bedrooms) : "",
  ];
  return parts.join("|").replace(/\|+/g, "|").replace(/^_|_$/g, "") || "default";
}

export function buildMarketKey(context: PlaybookComparableContext): string {
  const m = context.market ?? {};
  const parts = [
    m.country ?? "",
    m.province ?? "",
    m.city ?? "",
    m.neighborhood ?? "",
    m.season ?? "",
    m.demandBand ?? "",
  ];
  const raw = parts.filter(Boolean).join("|");
  return raw || "global";
}

export function extractComparableFeatures(context: PlaybookComparableContext): Record<string, unknown> {
  return {
    domain: context.domain,
    entityType: context.entityType,
    entityId: context.entityId ?? null,
    market: context.market ?? {},
    segment: context.segment ?? {},
    signals: sortSignals(context.signals),
  };
}

function sortSignals(
  signals?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  if (!signals) return {};
  const keys = Object.keys(signals).sort();
  const out: Record<string, string | number | boolean | null> = {};
  for (const k of keys) {
    const v = signals[k];
    out[k] = v === undefined ? null : v;
  }
  return out;
}

/** Stable SHA-256 fingerprint over normalized comparable features (no randomness). */
export function buildSimilarityFingerprint(context: PlaybookComparableContext): string {
  const normalized = extractComparableFeatures(context);
  return sha256Hex(stableStringify(normalized));
}

/** SHA-256 of `JSON.stringify(normalizeContext(context))` — Wave 2 minimal write path. */
export function buildFingerprint(context: unknown): string {
  const normalized = normalizeContext(context);
  return sha256Hex(JSON.stringify(normalized));
}

/**
 * Join `segment` entries as `k:v` pairs sorted lexicographically, or `null` if empty.
 * Used for Wave 2 lead capture and other entry-style keys (retrieval may still use `buildSegmentKey` above).
 */
export function buildLeadsEntrySegmentKey(context: unknown): string | null {
  if (context === null || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }
  const seg = (context as { segment?: Record<string, unknown> }).segment;
  if (!seg || typeof seg !== "object" || Array.isArray(seg)) {
    return null;
  }
  return Object.entries(seg)
    .map(([k, v]) => `${k}:${String(v)}`)
    .sort()
    .join("|");
}

/**
 * Join `market` entries as `k:v` pairs sorted lexicographically, or `null` if empty.
 */
export function buildLeadsEntryMarketKey(context: unknown): string | null {
  if (context === null || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }
  const m = (context as { market?: Record<string, unknown> }).market;
  if (!m || typeof m !== "object" || Array.isArray(m)) {
    return null;
  }
  return Object.entries(m)
    .map(([k, v]) => `${k}:${String(v)}`)
    .sort()
    .join("|");
}
