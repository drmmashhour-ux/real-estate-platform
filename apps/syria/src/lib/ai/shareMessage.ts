/**
 * Self-marketing / share copy (deterministic, Syria-only).
 * Used for WhatsApp, copy-to-clipboard, and quick-post success — no external AI.
 *
 * `url` must be the **public listing page** (see `getListingPath`): absolute `https://…/{locale}/listing/{id}`.
 * Do not use `/buy`, home, or browse URLs here — traffic should land on the listing.
 *
 * Arabic template (default):
 *   شاهد هذا الإعلان على Hadiah Link 🎁
 *   {title}
 *   {price}
 *   (📍 {city} when set)
 *   {url}
 */
export function buildListingShareMessage(input: {
  title: string;
  priceLine: string;
  url: string;
  locale: string;
  /** Shown on its own line before the link when set. */
  city?: string;
}): string {
  const isAr = input.locale.startsWith("ar");
  const title = input.title.trim() || (isAr ? "إعلان" : "Listing");
  const price = input.priceLine.trim();
  const link = input.url.trim();
  const place = input.city?.trim() ?? "";

  if (isAr) {
    const parts: string[] = ["شاهد هذا الإعلان على Hadiah Link 🎁", title, price];
    if (place) parts.push(`📍 ${place}`);
    parts.push(link);
    return parts.join("\n");
  }

  const parts: string[] = ["See this listing on Hadiah Link 🎁", title, `Price: ${price}`];
  if (place) parts.push(`Location: ${place}`);
  parts.push(link);
  return parts.join("\n");
}
