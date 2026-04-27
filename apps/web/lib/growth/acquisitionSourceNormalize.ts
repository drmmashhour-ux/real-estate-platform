/**
 * Canonical acquisition labels for reporting (Order 50.1).
 * Encourage consistent `?src=` / `acquisitionChannel` values in product.
 */
export const CANONICAL_ACQUISITION_SOURCES = [
  "tiktok",
  "meta",
  "google",
  "referral",
  "direct",
  "organic",
  "other",
] as const;

export type CanonicalAcquisitionSource = (typeof CANONICAL_ACQUISITION_SOURCES)[number];

/**
 * Lowercase, trim, and map legacy / Marketing mix to canonical buckets.
 * (First-touch channel on `User` is still the source of truth for rows without a dedicated `Acquisition` table.)
 */
export function normalizeAcquisitionSource(raw: string | null | undefined): CanonicalAcquisitionSource {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "other";
  if (s === "tiktok" || s === "tt") return "tiktok";
  if (
    s === "meta" ||
    s === "facebook" ||
    s === "fb" ||
    s === "instagram" ||
    s === "ig" ||
    s.startsWith("meta_")
  ) {
    return "meta";
  }
  if (s === "google" || s === "gclid" || s === "ads") return "google";
  if (s === "referral" || s === "ref" || s.startsWith("ref-")) return "referral";
  if (s === "direct" || s === "(none)") return "direct";
  if (s === "organic" || s === "seo" || s === "bing") return "organic";
  if (s === "other" || s === "unknown" || s === "outreach") return "other";
  return "other";
}
