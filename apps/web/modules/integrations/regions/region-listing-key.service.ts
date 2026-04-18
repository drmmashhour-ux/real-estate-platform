/**
 * Deterministic region listing key encoding — no throws; parse failures yield null key.
 */
import type { RegionListingKey, RegionListingRef, RegionListingSource } from "./region-listing-key.types";

/** Default region tag for main LECIPM web CRM listings (Québec routing). */
export const DEFAULT_WEB_REGION_CODE = "ca_qc";

const SOURCE_SET = new Set<string>(["web", "syria", "external"]);

function normSeg(s: string): string {
  return typeof s === "string" ? s.trim() : "";
}

/** Build a key from explicit parts (normalizes whitespace). */
export function buildRegionListingKey(params: {
  regionCode: string;
  source: RegionListingSource;
  listingId: string;
}): RegionListingKey | null {
  const regionCode = normSeg(params.regionCode);
  const listingId = normSeg(params.listingId);
  if (!regionCode || !listingId) return null;
  const source = params.source;
  if (!SOURCE_SET.has(source)) return null;
  return { regionCode, source, listingId };
}

/**
 * Wire format: `{regionCode}:{source}:{listingId}`
 * Examples: `sy:syria:clxxxxxxxx`, `ca_qc:web:clxxxxxxxx`
 * Listing id must not contain `:` (cuids satisfy this).
 */
export function stringifyRegionListingKey(key: RegionListingKey): string {
  return `${key.regionCode}:${key.source}:${key.listingId}`;
}

export function parseRegionListingKey(value: string): { key: RegionListingKey | null; fallbackNote: string | null } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { key: null, fallbackNote: "region_listing_key_empty" };

  const match = /^([^:]+):([^:]+):(.+)$/.exec(raw);
  if (!match) {
    return { key: null, fallbackNote: "region_listing_key_parse_failed" };
  }
  const regionCode = normSeg(match[1]);
  const sourceRaw = normSeg(match[2]);
  const listingId = normSeg(match[3]);
  if (!regionCode || !listingId || !sourceRaw) {
    return { key: null, fallbackNote: "region_listing_key_parse_incomplete" };
  }
  if (!SOURCE_SET.has(sourceRaw)) {
    return { key: null, fallbackNote: "region_listing_key_unknown_source" };
  }
  return {
    key: {
      regionCode,
      source: sourceRaw as RegionListingSource,
      listingId,
    },
    fallbackNote: null,
  };
}

export function isSameRegionListingKey(a: RegionListingKey | null | undefined, b: RegionListingKey | null | undefined): boolean {
  if (!a || !b) return false;
  return a.regionCode === b.regionCode && a.source === b.source && a.listingId === b.listingId;
}

export function buildRegionListingRef(key: RegionListingKey | null): RegionListingRef | null {
  if (!key) return null;
  return {
    key,
    displayId: stringifyRegionListingKey(key),
  };
}
