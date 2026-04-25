/** Minimal listing snapshot for safe comparison (no invented metrics). */

export type ListingCompareSnapshot = {
  id: string;
  title?: string;
  priceLabel?: string;
  city?: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  category?: string;
};

/**
 * Produce a neutral comparison — no subjective “better”, only observable fields.
 */
export function compareListings(a: ListingCompareSnapshot, b: ListingCompareSnapshot): string {
  const lines: string[] = ["Side-by-side (from available data only):"];

  const priceNum = (s?: string) => {
    if (!s) return null;
    const m = s.replace(/,/g, "").match(/(\d+)/);
    return m ? Number.parseInt(m[1], 10) : null;
  };

  const pa = priceNum(a.priceLabel);
  const pb = priceNum(b.priceLabel);
  if (pa != null && pb != null && pa !== pb) {
    lines.push(pa < pb ? `• Lower listed price: ${a.title ?? a.id}` : `• Lower listed price: ${b.title ?? b.id}`);
  }

  if (a.beds != null && b.beds != null && a.beds !== b.beds) {
    lines.push(
      a.beds > b.beds
        ? `• More bedrooms: ${a.title ?? "Listing A"} (${a.beds} vs ${b.beds})`
        : `• More bedrooms: ${b.title ?? "Listing B"} (${b.beds} vs ${a.beds})`
    );
  }

  if (a.sqft != null && b.sqft != null && a.sqft !== b.sqft) {
    lines.push(
      a.sqft > b.sqft
        ? `• Larger (sq ft): ${a.title ?? "Listing A"}`
        : `• Larger (sq ft): ${b.title ?? "Listing B"}`
    );
  }

  lines.push("Which fits best depends on your budget and needs — open both listings for full details.");

  if (lines.length <= 2) {
    return "I need two listings with price or size data to compare. Open two listing pages or save two properties, then ask again.";
  }

  return lines.join("\n");
}
