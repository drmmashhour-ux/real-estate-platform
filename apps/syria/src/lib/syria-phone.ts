/**
 * Normalizes Syrian-style numbers for tel: and wa.me (digits only, 963…).
 */
const DIGITS = /\D/g;

export function onlyDigits(phone: string): string {
  return phone.replace(DIGITS, "");
}

/**
 * E.164-style digits without + for wa.me/PHONENUMBER
 */
export function toWhatsAppPath(phone: string): string | null {
  const d = onlyDigits(phone);
  if (d.length < 8) return null;
  if (d.startsWith("0") && d.length >= 9) {
    return `963${d.slice(1)}`;
  }
  if (d.startsWith("963")) return d;
  if (d.length === 9) return `963${d}`;
  return d;
}

export function buildWhatsAppContactHref(phone: string): string | null {
  const path = toWhatsAppPath(phone);
  if (!path) return null;
  return `https://wa.me/${path}`;
}

/**
 * Prefill for monetization upgrade (باقة مميز / فاخر) — `wa.me` with Arabic-first message.
 */
export function buildMonetizationUpgradeWhatsappUrl(
  displayPhone: string,
  listingId: string,
  plan: "featured" | "premium",
  locale: string,
): string | null {
  const path = toWhatsAppPath(displayPhone);
  if (!path) return null;
  const isAr = locale.startsWith("ar");
  const text = isAr
    ? `قمت بالدفع للإعلان ${listingId} — باقة ${plan === "premium" ? "فاخر" : "مميز"}`
    : `I paid for listing ${listingId} — ${plan === "featured" ? "Featured" : "Premium"}`;
  return `https://wa.me/${path}?text=${encodeURIComponent(text)}`;
}

export function buildTelHref(phone: string): string | null {
  const path = toWhatsAppPath(phone);
  if (!path) return null;
  return `tel:+${path}`;
}

/** Default window for "New" in browse; SY-11 uses `TRUST_NEW_LISTING_DAYS` (3). */
export const TRUST_NEW_LISTING_DAYS = 3;

export function isNewListing(createdAt: Date, days: number = TRUST_NEW_LISTING_DAYS): boolean {
  return Date.now() - createdAt.getTime() < days * 24 * 60 * 60 * 1000;
}
