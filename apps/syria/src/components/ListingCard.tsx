"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatSyriaCurrency } from "@/lib/format";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import {
  getLocalizedPropertyCity,
  getLocalizedPropertyDistrict,
  getLocalizedPropertyTitle,
} from "@/lib/property-localization";
import { cn } from "@/lib/cn";
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
  | "plan"
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
  const img = firstImage(listing.images);
  const guests = listing.guestsMax ?? null;
  const previewTags = amenityPreview(listing.amenities, 3);
  const isBnhub = listing.type === "BNHUB";
  const planTier = ("plan" in listing && listing.plan ? listing.plan : "free") as "free" | "featured" | "premium";

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-[var(--darlink-shadow-sm)] hover:border-[color:var(--darlink-accent)]/25",
        planTier === "premium" && "ring-1 ring-[color:var(--darlink-sand)]/40",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--darlink-surface-muted)]">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[color:var(--darlink-surface-muted)]">
            <span className="text-xs font-medium text-[color:var(--darlink-text-muted)]">{cityDisplay}</span>
          </div>
        )}
        <div className="absolute start-3 top-3 z-[1] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
          {planTier === "premium" ? (
            <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-[color:var(--darlink-sand)]/35">
              {t("premiumBadge")}
            </span>
          ) : null}
          {planTier === "featured" ? (
            <Badge tone="accent" className="shadow-[var(--darlink-shadow-sm)]">
              {t("featuredBadge")}
            </Badge>
          ) : null}
          <Badge tone="sand" className="shadow-[var(--darlink-shadow-sm)]">
            {t("verifiedBadge")}
          </Badge>
          {isBnhub ? (
            <span className="rounded-full bg-[color:var(--darlink-navy)]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[var(--darlink-shadow-sm)]">
              BNHub
            </span>
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 p-4 text-start",
          planTier === "premium" && "sm:gap-2.5 sm:p-5",
        )}
      >
        <h3
          className={cn("line-clamp-2 text-base font-semibold leading-snug text-[color:var(--darlink-text)]", planTier === "premium" && "sm:text-lg")}
        >
          {title}
        </h3>
        <p className="text-sm leading-snug text-[color:var(--darlink-text-muted)]">
          {cityDisplay}
          {areaLine ? ` · ${areaLine}` : ""}
        </p>
        {!isBnhub && listing.bedrooms != null ? (
          <p className="text-xs text-[color:var(--darlink-text-muted)]">
            {listing.bedrooms}+ {t("cardBedroomsShort")}
            {listing.bathrooms != null ? ` · ${listing.bathrooms}+ ${t("cardBathsShort")}` : ""}
          </p>
        ) : null}
        {isBnhub && guests != null ? (
          <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("cardGuestsMax", { n: guests })}</p>
        ) : null}
        {isBnhub && previewTags.length > 0 ? (
          <p className="line-clamp-1 text-[11px] text-[color:var(--darlink-text-muted)]">{previewTags.join(" · ")}</p>
        ) : null}
        <div className="mt-auto border-t border-[color:var(--darlink-border)]/60 pt-3">
          <p className="text-xl font-bold tabular-nums leading-tight text-[color:var(--darlink-text)] sm:text-2xl">
            {formatSyriaCurrency(listing.price, listing.currency, locale)}
          </p>
          {isBnhub ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
              {t("cardPerNight")}
            </p>
          ) : null}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--darlink-text-muted)]">{listing.type}</p>
      </div>
    </Link>
  );
}
