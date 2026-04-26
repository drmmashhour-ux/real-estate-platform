/** Client: canonical listing path for current locale. */
export function getListingPath(locale: string, listingId: string): string {
  return `/${locale}/listing/${listingId}`;
}

export function buildWhatsAppMeShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
