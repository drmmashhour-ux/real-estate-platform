import type { MarketplaceCategory } from "@/lib/marketplace-categories";

function qs(category: string, subcategory: string): string {
  return `category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`;
}

/** Target browse URL for a category+sub (sale → /buy, rent → /rest, short stay → /bnhub/stays). */
export function browseHrefForMarketplaceSub(
  category: MarketplaceCategory,
  subcategory: string,
): { href: string } {
  if (subcategory === "rent") {
    return { href: `/rent?${qs(category, subcategory)}` };
  }
  if (category === "real_estate" && subcategory === "hotel") {
    return { href: `/bnhub/stays?${qs(category, subcategory)}` };
  }
  return { href: `/buy?${qs(category, subcategory)}` };
}
