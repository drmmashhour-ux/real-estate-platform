/**
 * Simple amenity keys for listings (String[] in DB) — no extra tables.
 * ORDER SYBNB-47 — Syria priority order below drives normalization + listing-page display.
 */
export const SYRIA_AMENITIES = [
  { key: "electricity_24h", label_en: "24h Electricity", label_ar: "كهرباء 24 ساعة" },
  { key: "wifi", label_en: "WiFi", label_ar: "واي فاي" },
  { key: "water", label_en: "Water supply", label_ar: "ماء" },
  { key: "air_conditioning", label_en: "Air Conditioning", label_ar: "مكيف" },
  { key: "heating", label_en: "Heating", label_ar: "تدفئة" },
  { key: "generator", label_en: "Generator", label_ar: "مولد كهرباء" },
  { key: "elevator", label_en: "Elevator", label_ar: "مصعد" },
  { key: "parking", label_en: "Parking", label_ar: "موقف سيارات" },
  { key: "security", label_en: "Security / guard", label_ar: "حراسة / أمان" },
  { key: "furnished", label_en: "Furnished", label_ar: "مفروش" },
  { key: "hot_water_24h", label_en: "24h Hot Water", label_ar: "مياه ساخنة 24 ساعة" },
  { key: "near_market", label_en: "Near Market", label_ar: "قريب من سوق" },
  { key: "city_center", label_en: "City Center", label_ar: "وسط المدينة" },
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

/** Keep only valid catalog keys, stable order (SYRIA_AMENITIES array order). */
export function normalizeSyriaAmenityKeys(keys: string[] | undefined | null): string[] {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const order = SYRIA_AMENITIES.map((a) => a.key);
  const set = new Set(keys.filter((k) => typeof k === "string" && KEY_SET.has(k)));
  return order.filter((k) => set.has(k));
}

/** Valid catalog keys only, preserving first-seen order (e.g. quick-post submit order). */
export function normalizeSyriaAmenityKeysPreserveOrder(keys: string[] | undefined | null): string[] {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const seen = new Set<string>();
  const out: SyriaAmenityKey[] = [];
  for (const k of keys) {
    if (typeof k !== "string" || !KEY_SET.has(k)) continue;
    const key = k as SyriaAmenityKey;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/** Listing detail section: readable priority (كهرباء → مكيف → واي فاي → …). */
const LISTING_DETAIL_AMENITY_ORDER: SyriaAmenityKey[] = [
  "electricity_24h",
  "air_conditioning",
  "wifi",
  "water",
  "hot_water_24h",
  "heating",
  "generator",
  "elevator",
  "parking",
  "security",
  "furnished",
  "near_market",
  "city_center",
];

export function sortSyriaAmenityKeysForListingDisplay(keys: string[]): string[] {
  const norm = normalizeSyriaAmenityKeys(keys);
  const rank = new Map(LISTING_DETAIL_AMENITY_ORDER.map((k, i) => [k, i]));
  return [...norm].sort((a, b) => (rank.get(a as SyriaAmenityKey) ?? 999) - (rank.get(b as SyriaAmenityKey) ?? 999));
}

/** Parse `features=wifi,air_conditioning` (comma-separated). */
export function parseFeaturesQuery(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return normalizeSyriaAmenityKeys(parts);
}

/** Minimum results before widening amenity filter from ALL-tags to ANY-tag (browse UX). */
export function getAmenityFallbackMinResults(): number {
  const raw =
    process.env.SYRIA_AMENITY_FALLBACK_MIN_RESULTS ?? process.env.NEXT_PUBLIC_SYRIA_AMENITY_FALLBACK_MIN_RESULTS ?? "8";
  const n = Number(raw);
  if (!Number.isFinite(n)) return 8;
  return Math.min(48, Math.max(1, Math.floor(n)));
}

/** Broad match: listing must satisfy **at least one** requested amenity tag (substring rules match `listingMatchesAmenityTags`). */
export function listingMatchesAmenityTagsSome(amenitiesJson: unknown, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const arr = Array.isArray(amenitiesJson)
    ? amenitiesJson
        .filter((x): x is string => typeof x === "string")
        .map((a) => a.toLowerCase())
    : [];
  return tags.some((tag) => arr.some((a) => a.includes(tag) || tag.includes(a)));
}

/** SYBNB-46 — Card chips (electricity → AC → wifi → …). */
const CARD_BADGE_PRIORITY: SyriaAmenityKey[] = [
  "electricity_24h",
  "air_conditioning",
  "wifi",
  "water",
  "hot_water_24h",
  "heating",
  "generator",
  "elevator",
  "parking",
  "security",
  "furnished",
  "near_market",
  "city_center",
];

const CARD_AMENITY_EMOJI: Partial<Record<SyriaAmenityKey, string>> = {
  electricity_24h: "⚡",
  wifi: "📶",
  water: "💧",
  hot_water_24h: "♨️",
  air_conditioning: "❄️",
  heating: "🌡️",
  generator: "🔌",
  elevator: "🛗",
  parking: "🅿️",
  security: "🔒",
  furnished: "🛋️",
  near_market: "🏬",
  city_center: "📍",
};

export type ListingCardAmenityBadge = { key: SyriaAmenityKey; emoji: string; label: string };

/** ORDER SYBNB-80 — browse API wires catalog keys only; card expands labels client-side with nearly zero work. */
export function pickListingCardAmenityBadgeKeys(amenities: unknown, max = 3): SyriaAmenityKey[] {
  const keys = normalizeSyriaAmenityKeys(
    Array.isArray(amenities) ? amenities.filter((x): x is string => typeof x === "string") : [],
  );
  const out: SyriaAmenityKey[] = [];
  for (const k of CARD_BADGE_PRIORITY) {
    if (!keys.includes(k)) continue;
    out.push(k);
    if (out.length >= max) break;
  }
  return out;
}

/** Pick up to `max` catalog amenities for card chips (stable priority). */
export function pickListingCardAmenityBadges(
  amenities: unknown,
  locale: string,
  max = 3,
): ListingCardAmenityBadge[] {
  const ids = pickListingCardAmenityBadgeKeys(amenities, max);
  return ids.map((k) => ({
    key: k,
    emoji: CARD_AMENITY_EMOJI[k] ?? "✓",
    label: labelSyriaAmenity(k, locale).primary,
  }));
}

/** Render-ready badges when browse payload shipped only `browseAmenityBadgeKeys` (SYBNB-80). */
export function listingCardBadgesFromAmenityKeys(keys: SyriaAmenityKey[], locale: string): ListingCardAmenityBadge[] {
  return keys.map((k) => ({
    key: k,
    emoji: CARD_AMENITY_EMOJI[k] ?? "✓",
    label: labelSyriaAmenity(k, locale).primary,
  }));
}

/** Toggle one catalog tag in a comma-separated browse `amenities` query (preserves other tags). */
export function toggleCommaSeparatedAmenityKey(raw: string | undefined, key: SyriaAmenityKey): string | undefined {
  const parts = raw?.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) ?? [];
  const lower = key.toLowerCase();
  const set = new Set(parts.map((p) => p.toLowerCase()));
  if (set.has(lower)) set.delete(lower);
  else set.add(lower);
  const out = [...set];
  return out.length ? out.join(",") : undefined;
}
