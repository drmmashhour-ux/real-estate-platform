/**
 * Self-marketing / share copy (deterministic, Syria-only).
 * Used for WhatsApp, copy-to-clipboard, and quick-post success — no external AI.
 *
 * `url` must be the **public listing page** (see `getListingPath`): absolute `https://…/{locale}/listing/{id}`.
 * Do not use `/buy`, home, or browse URLs here — traffic should land on the listing.
 *
 * ORDER SYBNB-116 — Listing share (Arabic):
 *   🔥 إعلان جديد بسعر ممتاز!
 *   [مرحباً، مهتم بالإعلان رقم …] (when `adCode` set)
 *   شوف التفاصيل هون 👇
 *   {url}
 *   لا تضيع الفرصة
 *
 * Platform invite (cold outreach / groups): `buildHadiahPlatformInviteMessage`.
 *
 * `title`, `priceLine`, `city`, `priceAmount`, `highlightNew` are retained for API compatibility;
 * listing body lines above are fixed for viral consistency (`highlightNew` does not add an extra banner line).
 */
export function buildListingShareMessage(input: {
  title: string;
  priceLine: string;
  url: string;
  locale: string;
  /** Unused in SYBNB-116 template — kept for call-site compatibility. */
  city?: string;
  /** SY-28: e.g. RE-1023 — inserts “interested in listing #” before the details line. */
  adCode?: string;
  /** Unused in SYBNB-116 template — kept for call-site compatibility. */
  priceAmount?: number;
  /** Unused in SYBNB-116 template — headline already implies “new”; kept for API compatibility. */
  highlightNew?: boolean;
}): string {
  const isAr = input.locale.startsWith("ar");
  const link = input.url.trim();
  const code = input.adCode?.trim() ?? "";

  if (isAr) {
    const parts: string[] = ["🔥 إعلان جديد بسعر ممتاز!"];
    if (code) parts.push(`مرحباً، مهتم بالإعلان رقم ${code}`);
    parts.push("شوف التفاصيل هون 👇");
    parts.push(link);
    parts.push("لا تضيع الفرصة");
    return parts.join("\n");
  }

  const parts: string[] = ["🔥 New listing at a great price!"];
  if (code) parts.push(`Hi, I'm interested in listing ${code}`);
  parts.push("See the details here 👇");
  parts.push(link);
  parts.push("Don't miss out");
  return parts.join("\n");
}

/**
 * ORDER SYBNB-116 — Direct WhatsApp script (platform invite, not a single listing).
 * Use absolute app URL with locale path, e.g. `https://…/ar` or `https://…/ar/browse`.
 */
export function buildHadiahPlatformInviteMessage(locale: string, url: string): string {
  const link = url.trim();
  const isAr = locale.startsWith("ar");
  if (isAr) {
    return [
      "مرحبا 👋",
      "في منصة جديدة للإيجارات بسوريا 🇸🇾",
      "بتقدر تنشر إعلانك أو تلاقي سكن بسهولة",
      "",
      "جربها هون 👇",
      link,
    ].join("\n");
  }
  return [
    "Hi 👋",
    "There's a new rentals platform for Syria 🇸🇾",
    "Post your listing or find a place — easily",
    "",
    "Try it here 👇",
    link,
  ].join("\n");
}
