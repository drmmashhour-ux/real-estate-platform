import type { SyriaPropertyType } from "@/generated/prisma";
import { syriaFlags } from "@/lib/platform-flags";

/**
 * Hadiah Link marketplace verticals — keys stored on `SyriaProperty.category` / `.subcategory`.
 * No images; copy + emoji in UI only.
 */
export const MARKETPLACE_CATEGORIES = [
  "real_estate",
  "stay",
  "cars",
  "electronics",
  "furniture",
  "services",
  "other",
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const MARKETPLACE_SUBCATEGORIES: Record<MarketplaceCategory, readonly string[]> = {
  real_estate: ["sale", "rent", "furnished", "hotel", "commercial"],
  stay: ["furnished", "hotel"],
  cars: ["sale", "rent", "motorcycle"],
  electronics: ["mobile", "laptop", "appliances"],
  furniture: ["sale", "used", "office"],
  services: ["cleaning", "repair", "transport"],
  other: ["other"],
};

export const MARKETPLACE_CATEGORY_EMOJI: Record<MarketplaceCategory, string> = {
  real_estate: "🏠",
  stay: "🏨",
  cars: "🚗",
  electronics: "📱",
  furniture: "🛋️",
  services: "🛠️",
  other: "📦",
};

export function isMarketplaceCategory(v: string): v is MarketplaceCategory {
  return (MARKETPLACE_CATEGORIES as readonly string[]).includes(v);
}

export function isSubcategoryForCategory(category: MarketplaceCategory, sub: string): boolean {
  return (MARKETPLACE_SUBCATEGORIES[category] as readonly string[]).includes(sub);
}

export function defaultSubcategory(category: MarketplaceCategory): string {
  const subs = MARKETPLACE_SUBCATEGORIES[category];
  return subs[0] ?? "other";
}

/** Normalize + validate pair; returns null if invalid. */
export function parseMarketplacePair(
  categoryRaw: string | undefined,
  subRaw: string | undefined,
): { category: MarketplaceCategory; subcategory: string } | null {
  const c = (categoryRaw ?? "").trim();
  if (!isMarketplaceCategory(c)) return null;
  const s = (subRaw ?? "").trim();
  if (s && isSubcategoryForCategory(c, s)) {
    return { category: c, subcategory: s };
  }
  if (s && !isSubcategoryForCategory(c, s)) return null;
  return { category: c, subcategory: defaultSubcategory(c) };
}

/** Maps marketplace pair to legacy `SyriaProperty.type` for DB + contact/booking rules. */
export function listingTypeForMarketplace(
  category: MarketplaceCategory,
  subcategory: string,
): SyriaPropertyType {
  if (category === "stay" && subcategory === "hotel") return "HOTEL";
  if (category === "stay") return "RENT";
  if (subcategory === "rent") return "RENT";
  if (category === "real_estate" && subcategory === "hotel" && syriaFlags.BNHUB_ENABLED) {
    return "BNHUB";
  }
  return "SALE";
}
