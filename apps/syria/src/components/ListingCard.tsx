"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LISTING_IMAGE_QUALITY } from "@/lib/design-tokens";
import { formatSyriaCurrency } from "@/lib/format";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import {
  getLocalizedPropertyCity,
  getLocalizedPropertyDistrict,
  getLocalizedPropertyTitle,
} from "@/lib/property-localization";
import { cn } from "@/lib/cn";
import { SELF_MKT_VIEWS_HOT_BADGE_MIN } from "@/lib/self-marketing";
import { isNewListing } from "@/lib/syria-phone";
import { Badge } from "@/components/ui/Badge";
import type { SyriaProperty } from "@/generated/prisma";
import type { SerializedBrowseListing } from "@/services/search/search.service";
import { labelSyriaState } from "@/lib/syria/states";
import { labelSyriaAmenity } from "@/lib/syria/amenities";
import { MARKETPLACE_CATEGORY_EMOJI } from "@/lib/marketplace-categories";

type CardListing = Pick<
  SyriaProperty,
  | "id"
  | "titleAr"
  | "titleEn"
  | "descriptionAr"
  | "descriptionEn"
  | "state"
  | "governorate"
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
  | "listingVerified"
  | "verified"
  | "createdAt"
  | "views"
  | "category"
  | "subcategory"
  | "isDirect"
>;

export type ListingCardModel = CardListing | SerializedBrowseListing;

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const u = images.find((x): x is string => typeof x === "string" && x.length > 0);
  return u ?? null;
}

function imageCount(images: unknown): number {
  if (!Array.isArray(images)) return 0;
  return images.filter((x): x is string => typeof x === "string" && x.length > 0).length;
}

function amenityPreview(amenities: unknown, max: number, loc: string): string[] {
  if (!Array.isArray(amenities)) return [];
  return amenities
    .filter((x): x is string => typeof x === "string")
    .slice(0, max)
    .map((k) => labelSyriaAmenity(k, loc).primary);
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
  const tCat = useTranslations("Categories");
  const resolved = backfillLocalizedPropertyShape(listing);
  const catKey = "category" in listing && typeof (listing as { category?: string }).category === "string" ? (listing as { category: string }).category : null;
  const subKey =
    "subcategory" in listing && typeof (listing as { subcategory?: string }).subcategory === "string"
      ? (listing as { subcategory: string }).subcategory
      : null;
  const catEmoji =
    catKey && (MARKETPLACE_CATEGORY_EMOJI as Record<string, string>)[catKey] ? (MARKETPLACE_CATEGORY_EMOJI as Record<string, string>)[catKey] : null;
  const title = getLocalizedPropertyTitle(listing, locale);
  const cityDisplay = getLocalizedPropertyCity(resolved, locale);
  const districtLine = getLocalizedPropertyDistrict(resolved, locale);
  const areaLine = districtLine ?? (listing.area?.trim() ? listing.area : null);
  const stateRaw = "state" in listing && listing.state?.trim() ? listing.state : null;
  const govRaw = "governorate" in listing && listing.governorate?.trim() ? listing.governorate : null;
  const stateLabel = stateRaw ? labelSyriaState(stateRaw, locale) : govRaw;
  const locationPrimary = stateLabel ? `${stateLabel} · ${cityDisplay}` : cityDisplay;
  const img = firstImage(listing.images);
  const nPhotos = imageCount(listing.images);
  const showPhotoQuality = nPhotos >= 3;
  const guests = listing.guestsMax ?? null;
  const previewTags = amenityPreview(listing.amenities, 3, locale);
  const isBnhub = listing.type === "BNHUB";
  const planTier = ("plan" in listing && listing.plan ? listing.plan : "free") as "free" | "featured" | "premium";
  const created =
    "createdAt" in listing && listing.createdAt ?
      typeof listing.createdAt === "string" ?
        new Date(listing.createdAt)
      : (listing as SyriaProperty).createdAt
    : null;
  const showNew = created ? isNewListing(created) : false;
  const viewCount = "views" in listing && typeof (listing as { views?: unknown }).views === "number" ? (listing as { views: number }).views : 0;
  const showHot = viewCount >= SELF_MKT_VIEWS_HOT_BADGE_MIN;
  const isDirectVal =
    "isDirect" in listing && typeof (listing as { isDirect?: boolean }).isDirect === "boolean" ?
      (listing as { isDirect: boolean }).isDirect
    : true;
  const showDirect = isDirectVal !== false;
  const showDirectPlusBoost = showDirect && (planTier === "featured" || planTier === "premium");
  const flagVerified = "verified" in listing && typeof listing.verified === "boolean" ? listing.verified : false;
  const nAmenities = Array.isArray(listing.amenities)
    ? listing.amenities.filter((x): x is string => typeof x === "string" && x.length > 0).length
    : 0;
  const showTrustedHighlight = nPhotos >= 3 && nAmenities >= 2;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-none hover:border-[color:var(--darlink-accent)]/30",
        planTier === "premium" && "ring-1 ring-[color:var(--darlink-sand)]/40",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--darlink-surface-muted)]">
        {img ? (
          (() => {
            const isDataOrBlob = img.startsWith("data:") || img.startsWith("blob:");
            if (isDataOrBlob) {
              return (
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={priority ? "high" : "low"}
                />
              );
            }
            return (
              <Image
                src={img}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 360px"
                quality={LISTING_IMAGE_QUALITY}
                priority={!!priority}
                unoptimized={img.startsWith("http://") || img.startsWith("https://")}
              />
            );
          })()
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[color:var(--darlink-surface-muted)]">
            <span className="text-xs font-medium text-[color:var(--darlink-text-muted)]">{locationPrimary}</span>
          </div>
        )}
        <div className="absolute start-3 top-3 z-[1] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
          {showDirectPlusBoost ? (
            <span className="max-w-[min(100%,12rem)] rounded-full bg-gradient-to-r from-amber-100 via-emerald-100 to-amber-100 px-2 py-0.5 text-[10px] font-bold leading-tight text-amber-950 ring-1 ring-amber-300/50">
              {t("badgeDirectPlusBoost")}
            </span>
          ) : (
            <>
              {planTier === "premium" ? (
                <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-[color:var(--darlink-sand)]/35">
                  {t("premiumBadge")}
                </span>
              ) : null}
              {planTier === "featured" ? (
                <Badge tone="accent">
                  {t("featuredBadge")}
                </Badge>
              ) : null}
              {showDirect ? (
                <span className="rounded-full bg-gradient-to-r from-emerald-100/95 to-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-300/60">
                  {t("badgeDirect")}
                </span>
              ) : null}
            </>
          )}
          {showNew ? (
            <div className="bg-blue-500 px-2 py-1 text-xs font-medium text-white rounded">{t("badgeNew")}</div>
          ) : null}
          {showHot ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-900 ring-1 ring-orange-200/80">
              {t("badgeHot")}
            </span>
          ) : null}
          {flagVerified ? (
            <div className="bg-green-600 px-2 py-1 text-xs font-medium text-white rounded">{t("verifiedBadge")}</div>
          ) : null}
          {showPhotoQuality ? (
            <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200/80">
              {t("badgePhotoQuality")}
            </span>
          ) : null}
          {isBnhub ? (
            <span className="rounded-full bg-[color:var(--darlink-navy)]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
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
        {catKey && subKey ? (
          <p className="line-clamp-1 text-[11px] text-[color:var(--darlink-text-muted)]" dir="auto">
            {catEmoji ? <span aria-hidden>{catEmoji} </span> : null}
            {(tCat as (k: string) => string)(catKey)} · {(tCat as (k: string) => string)(`sub_${subKey}`)}
          </p>
        ) : null}
        {showTrustedHighlight ? <div className="text-sm text-green-600">{t("badgeTrustedListing")}</div> : null}
        <p className="text-sm leading-snug text-[color:var(--darlink-text-muted)]">
          {locationPrimary}
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
