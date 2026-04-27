/**
 * Self-marketing / share copy (deterministic, Syria-only).
 * Used for WhatsApp, copy-to-clipboard, and quick-post success — no external AI.
 *
 * `url` must be the **public listing page** (see `getListingPath`): absolute `https://…/{locale}/listing/{id}`.
 * Do not use `/buy`, home, or browse URLs here — traffic should land on the listing.
 *
 * Arabic template (viral, short):
 *   شاهد هذا الإعلان على Hadiah Link 🎁
 *   {title}
 *   {n} ل.س   (or legacy line from priceLine)
 *   {city} (when set)
 *   (blank line)
 *   {url}
 */
export function buildListingShareMessage(input: {
  title: string;
  priceLine: string;
  url: string;
  locale: string;
  /** Shown on its own line before the link when set. */
  city?: string;
  /** SY-28: e.g. RE-1023 — adds a “interested in listing #” line for phone/WhatsApp handoff. */
  adCode?: string;
  /** When set, Arabic message uses this amount with `ar-SY` digits + " ل.س" (ignores SYP in priceLine for that line). */
  priceAmount?: number;
}): string {
  const isAr = input.locale.startsWith("ar");
  const title = input.title.trim() || (isAr ? "إعلان" : "Listing");
  const price = input.priceLine.trim();
  const link = input.url.trim();
  const place = input.city?.trim() ?? "";
  const n = input.priceAmount;
  const code = input.adCode?.trim() ?? "";

  if (isAr) {
    const priceRow =
      typeof n === "number" && Number.isFinite(n)
        ? `${n.toLocaleString("ar-SY", { maximumFractionDigits: 0 })} ل.س`
        : `${price.replace(/^SYP\s+/i, "").trim()} ل.س`;
    const parts: string[] = ["شاهد هذا الإعلان على Hadiah Link 🎁"];
    if (code) {
      parts.push(`مرحباً، مهتم بالإعلان رقم ${code}`);
    }
    parts.push(title, priceRow);
    if (place) parts.push(place);
    parts.push("", link);
    return parts.join("\n");
  }

  const parts: string[] = ["See this listing on Hadiah Link 🎁"];
  if (code) {
    parts.push(`Hi, I'm interested in listing ${code}`);
  }
  parts.push(title, `Price: ${price}`);
  if (place) parts.push(`Location: ${place}`);
  parts.push("", link);
  return parts.join("\n");
}
