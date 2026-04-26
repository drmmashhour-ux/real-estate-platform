/**
 * Simple amenity keys for listings (String[] in DB) — no extra tables.
 */
export const SYRIA_AMENITIES = [
  { key: "electricity_24h", label_en: "24h Electricity", label_ar: "كهرباء 24 ساعة" },
  { key: "air_conditioning", label_en: "Air Conditioning", label_ar: "مكيف" },
  { key: "hot_water_24h", label_en: "24h Hot Water", label_ar: "مياه ساخنة 24 ساعة" },
  { key: "near_market", label_en: "Near Market", label_ar: "قريب من سوق" },
  { key: "city_center", label_en: "City Center", label_ar: "وسط المدينة" },
  { key: "furnished", label_en: "Furnished", label_ar: "مفروش" },
  { key: "wifi", label_en: "WiFi", label_ar: "واي فاي" },
] as const;

const KEY_SET = new Set<string>(SYRIA_AMENITIES.map((a) => a.key));

export type SyriaAmenityKey = (typeof SYRIA_AMENITIES)[number]["key"];

export function isSyriaAmenityKey(s: string): s is SyriaAmenityKey {
  return KEY_SET.has(s);
}

export function labelSyriaAmenity(key: string, locale: string): { primary: string; secondary?: string } {
  const row = SYRIA_AMENITIES.find((a) => a.key === key);
  if (!row) return { primary: key };
  if (locale.startsWith("ar")) {
    return { primary: row.label_ar, secondary: row.label_en };
  }
  return { primary: row.label_en, secondary: row.label_ar };
}

/** Listing page: Arabic-first; English UI gets a small EN line under each item. */
export function labelSyriaAmenityForListing(key: string, locale: string): { primary: string; secondary?: string } {
  const row = SYRIA_AMENITIES.find((a) => a.key === key);
  if (!row) return { primary: key };
  if (locale.startsWith("en")) {
    return { primary: row.label_ar, secondary: row.label_en };
  }
  return { primary: row.label_ar };
}

/** Keep only valid catalog keys, stable order. */
export function normalizeSyriaAmenityKeys(keys: string[] | undefined | null): string[] {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const order = SYRIA_AMENITIES.map((a) => a.key);
  const set = new Set(keys.filter((k) => typeof k === "string" && KEY_SET.has(k)));
  return order.filter((k) => set.has(k));
}

/** Parse `features=wifi,air_conditioning` (comma-separated). */
export function parseFeaturesQuery(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return normalizeSyriaAmenityKeys(parts);
}
