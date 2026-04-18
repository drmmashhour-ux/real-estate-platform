/** Stable cross-region listing identity — pure types (no runtime logic). */

export type RegionListingSource = "web" | "syria" | "external";

/**
 * Canonical tuple for a listing in a regional marketplace.
 * `regionCode` is a short jurisdiction / routing tag (e.g. `sy`, `ca_qc`).
 */
export type RegionListingKey = {
  regionCode: string;
  source: RegionListingSource;
  listingId: string;
};

/** Wire format for admin APIs — stable key + human-safe display id (often equals stringified key). */
export type RegionListingRef = {
  key: RegionListingKey;
  displayId: string;
};
