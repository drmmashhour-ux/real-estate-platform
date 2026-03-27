/**
 * Normalize attribution `source` into organic channel buckets for reporting.
 */

export const ORGANIC_LABELS = ["Facebook", "Instagram", "WhatsApp", "Direct"] as const;
export type OrganicLabel = (typeof ORGANIC_LABELS)[number] | "Other";

export function normalizeOrganicSource(raw: string | null | undefined): OrganicLabel {
  const s = (raw ?? "direct").toLowerCase().trim().replace(/\s+/g, "_");
  if (!s || s === "direct" || s === "none" || s === "organic") return "Direct";
  if (s === "facebook" || s === "fb" || s === "meta") return "Facebook";
  if (s === "instagram" || s === "ig" || s === "insta") return "Instagram";
  if (s === "whatsapp" || s === "wa" || s === "whats_app") return "WhatsApp";
  return "Other";
}

/** True when source is one of the four core organic channels (including default direct). */
export function isCoreOrganicSource(raw: string | null | undefined): boolean {
  const b = normalizeOrganicSource(raw);
  return b !== "Other";
}
