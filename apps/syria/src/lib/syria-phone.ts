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

export function buildTelHref(phone: string): string | null {
  const path = toWhatsAppPath(phone);
  if (!path) return null;
  return `tel:+${path}`;
}

/** ~7 days = "new" listing in UI */
export function isNewListing(createdAt: Date, days = 7): boolean {
  return Date.now() - createdAt.getTime() < days * 24 * 60 * 60 * 1000;
}
