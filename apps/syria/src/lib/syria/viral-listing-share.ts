import type { SyriaProperty } from "@/generated/prisma";
import { buildListingShareMessage } from "@/lib/ai/shareMessage";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { getListingPath } from "@/lib/syria/listing-share";
import { buildWhatsAppSendUrl } from "@/lib/syria-whatsapp";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import { getLocalizedPropertyCity } from "@/lib/property-localization";
import { isNewListing } from "@/lib/syria-phone";
import { appendHadiahShareSource, HADIAH_SHARE_QUERY_PARAM } from "@/lib/syria/hadiah-share-attribution";

/**
 * Public listing URL for shares: `{origin}/{locale}/listing/{id}` — not `/buy` or homepage.
 * When `origin` is empty (misconfiguration), returns path-only; prefer setting `NEXT_PUBLIC_SYRIA_APP_URL`.
 */
export function buildAbsoluteViralListingUrl(
  origin: string | undefined | null,
  locale: string,
  listingId: string,
): string {
  const path = getListingPath(locale, listingId);
  const base = (origin ?? "").replace(/\/$/, "");
  if (!base) {
    return `${path}?${HADIAH_SHARE_QUERY_PARAM}=whatsapp`;
  }
  return appendHadiahShareSource(`${base}${path}`, "whatsapp");
}

export function buildViralShareForSyriaProperty(
  listing: SyriaProperty,
  locale: string,
  numberLoc: string,
  origin: string | undefined | null,
): { canonicalUrl: string; whatsappHref: string; message: string } {
  const url = buildAbsoluteViralListingUrl(origin, locale, listing.id);
  const localized = backfillLocalizedPropertyShape(listing);
  const place = (getLocalizedPropertyCity(localized, locale) || listing.city || "").trim();
  const message = buildListingShareMessage({
    title: pickListingTitle(listing, locale),
    priceLine: money(listing.price, listing.currency, numberLoc),
    priceAmount: Number(listing.price),
    url,
    locale,
    city: place || undefined,
    highlightNew: isNewListing(listing.createdAt),
  });
  return { canonicalUrl: url, message, whatsappHref: buildWhatsAppSendUrl(message) };
}
