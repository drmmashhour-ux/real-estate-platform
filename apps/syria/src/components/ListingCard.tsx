"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/format";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import {
  getLocalizedPropertyCity,
  getLocalizedPropertyDistrict,
  getLocalizedPropertyTitle,
} from "@/lib/property-localization";
import { Badge } from "@/components/ui/Badge";
import type { SyriaProperty } from "@/generated/prisma";
import type { SerializedBrowseListing } from "@/services/search/search.service";

type CardListing = Pick<
  SyriaProperty,
  | "id"
  | "titleAr"
  | "titleEn"
  | "descriptionAr"
  | "descriptionEn"
  | "city"
  | "cityAr"
  | "cityEn"
  | "price"
  | "currency"
  | "type"
  | "isFeatured"
  | "images"
  | "area"
  | "districtAr"
  | "districtEn"
  | "bedrooms"
  | "bathrooms"
  | "guestsMax"
  | "amenities"
>;

export type ListingCardModel = CardListing | SerializedBrowseListing;

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const u = images.find((x): x is string => typeof x === "string" && x.length > 0);
  return u ?? null;
}

function amenityPreview(amenities: unknown, max: number): string[] {
  if (!Array.isArray(amenities)) return [];
  return amenities.filter((x): x is string => typeof x === "string").slice(0, max);
}

export function ListingCard({
  listing,
  locale,
  priority,
}: {
  listing: ListingCardModel;
  locale: string;
  priority?: boolean;
}) {
  const t = useTranslations("Listing");
  const resolved = backfillLocalizedPropertyShape(listing);
  const title = getLocalizedPropertyTitle(listing, locale);
  const cityDisplay = getLocalizedPropertyCity(resolved, locale);
  const districtLine = getLocalizedPropertyDistrict(resolved, locale);
  const areaLine = districtLine ?? (listing.area?.trim() ? listing.area : null);
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const img = firstImage(listing.images);
  const guests = listing.guestsMax ?? null;
  const previewTags = amenityPreview(listing.amenities, 3);
  const isBnhub = listing.type === "BNHUB";

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-[var(--darlink-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[color:var(--darlink-accent)]/35 hover:shadow-[var(--darlink-shadow-md)] active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--darlink-surface-muted)]">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--darlink-surface-muted)] to-[color:var(--darlink-sand)]/25">
            <span className="text-xs font-medium text-[color:var(--darlink-text-muted)]">{cityDisplay}</span>
          </div>
        )}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {listing.isFeatured ? (
            <Badge tone="accent" className="shadow-[var(--darlink-shadow-sm)]">
              {t("featuredBadge")}
            </Badge>
          ) : null}
          {isBnhub ? (
            <span className="rounded-full bg-[color:var(--darlink-navy)]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[var(--darlink-shadow-sm)]">
              BNHub
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0 flex-1 text-start">
          <h3 className="line-clamp-2 font-semibold leading-snug text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-accent)]">
            {title}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">
            {cityDisplay}
            {areaLine ? ` · ${areaLine}` : ""}
          </p>
          {!isBnhub && listing.bedrooms != null ? (
            <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">
              {listing.bedrooms}+ {t("cardBedroomsShort")}
              {listing.bathrooms != null ? ` · ${listing.bathrooms}+ ${t("cardBathsShort")}` : ""}
            </p>
          ) : null}
          {isBnhub && guests != null ? (
            <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">
              {t("cardGuestsMax", { n: guests })}
            </p>
          ) : null}
          {isBnhub && previewTags.length > 0 ? (
            <p className="mt-2 line-clamp-1 text-[11px] text-[color:var(--darlink-text-muted)]">{previewTags.join(" · ")}</p>
          ) : null}
        </div>
        <div className="mt-3">
          <p className="text-base font-bold tabular-nums text-[color:var(--darlink-text)]">
            {money(listing.price, listing.currency, numberLoc)}
          </p>
          {isBnhub ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("cardPerNight")}</p>
          ) : null}
        </div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--darlink-text-muted)]">{listing.type}</p>
      </div>
    </Link>
  );
}
