/** Canonical public path for a listing (share, copy link, WhatsApp). Not `/buy` or homepage. */
export function getListingPath(locale: string, listingId: string): string {
  return `/${locale}/listing/${listingId}`;
}

export function buildWhatsAppMeShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
