"use client";

import type { ReactNode } from "react";
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
import { isNewListing } from "@/lib/syria-phone";
import type { SyriaProperty } from "@/generated/prisma";
import type { SerializedBrowseListing } from "@/services/search/search.service";
import { labelSyriaState } from "@/lib/syria/states";
import { pickListingCardAmenityBadges } from "@/lib/syria/amenities";
import {
  getListingPhotoTrustTier,
  isSellerVerifiedForListingTrust,
  shouldShowTrustedListingBadge,
} from "@/lib/listing-trust-badges";

type CardListing = Pick<
  SyriaProperty,
  | "id"
  | "adCode"
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
  | "fraudFlag"
  | "createdAt"
  | "views"
  | "category"
  | "subcategory"
  | "isDirect"
  | "pricePerNight"
>;

export type ListingCardModel = CardListing | SerializedBrowseListing;

/** ORDER SYBNB-67 — browse hero = first valid URL (index 0); future: smart pick. */
function primaryListingImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const first = images[0];
  if (typeof first === "string" && first.trim().length > 0) return first.trim();
  const u = images.find((x): x is string => typeof x === "string" && x.trim().length > 0);
  return u?.trim() ?? null;
}

function imageCount(images: unknown): number {
  if (!Array.isArray(images)) return 0;
  return images.filter((x): x is string => typeof x === "string" && x.length > 0).length;
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
  const catKey = "category" in listing && typeof (listing as { category?: string }).category === "string" ? (listing as { category: string }).category : null;
  const isStay = catKey === "stay";
  const title = getLocalizedPropertyTitle(listing, locale);
  const cityDisplay = getLocalizedPropertyCity(resolved, locale);
  const districtLine = getLocalizedPropertyDistrict(resolved, locale);
  const areaLine = districtLine ?? (listing.area?.trim() ? listing.area : null);
  const stateRaw = "state" in listing && listing.state?.trim() ? listing.state : null;
  const govRaw = "governorate" in listing && listing.governorate?.trim() ? listing.governorate : null;
  const stateLabel = stateRaw ? labelSyriaState(stateRaw, locale) : govRaw;
  const locationPrimary = stateLabel ? `${stateLabel} · ${cityDisplay}` : cityDisplay;
  const cityAreaLine = [cityDisplay, areaLine]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .join(" · ");

  const img = primaryListingImage(listing.images);
  const nPhotos = imageCount(listing.images);
  const fraudFlag = "fraudFlag" in listing && listing.fraudFlag === true;
  const sellerVerified = isSellerVerifiedForListingTrust({
    verified: listing.verified,
    listingVerified: listing.listingVerified,
    sy8SellerVerified: "sy8SellerVerified" in listing ? listing.sy8SellerVerified : undefined,
  });
  const showTrustedListingBadgeUi = shouldShowTrustedListingBadge({
    sellerVerified,
    imageCount: nPhotos,
    fraudFlag,
  });
  const showVerifiedSellerOnly = sellerVerified && !showTrustedListingBadgeUi && !fraudFlag;
  const photoTrustTier = getListingPhotoTrustTier(nPhotos);
  const cardAmenityBadges = pickListingCardAmenityBadges(listing.amenities, locale, 2);
  const isBnhub = listing.type === "BNHUB";
  const nightly =
    "pricePerNight" in listing && typeof (listing as { pricePerNight?: number | null }).pricePerNight === "number"
      ? (listing as { pricePerNight: number }).pricePerNight
      : null;
  const planTier = ("plan" in listing && listing.plan ? listing.plan : "free") as
    | "free"
    | "featured"
    | "premium"
    | "hotel_featured";
  const created =
    "createdAt" in listing && listing.createdAt ?
      typeof listing.createdAt === "string" ?
        new Date(listing.createdAt)
      : (listing as SyriaProperty).createdAt
    : null;
  const showNew = created ? isNewListing(created) : false;

  /** SYBNB-CTR: max 3 badges — trust → photo tier → new */
  const ctrBadgeRow: ReactNode[] = [];
  if (showTrustedListingBadgeUi) {
    ctrBadgeRow.push(
      <span
        key="trust"
        className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-teal-400/60"
      >
        {t("badgeTrustedListing")}
      </span>,
    );
  } else if (showVerifiedSellerOnly) {
    ctrBadgeRow.push(
      <div key="verified" className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        {t("verifiedBadge")}
      </div>,
    );
  }
  if (photoTrustTier === "full") {
    ctrBadgeRow.push(
      <span
        key="photo-full"
        className="rounded-full bg-violet-100/95 px-2 py-0.5 text-[10px] font-bold text-violet-950 ring-1 ring-violet-300/65"
      >
        {t("badgePhotoGalleryFull")}
      </span>,
    );
  } else if (photoTrustTier === "clear") {
    ctrBadgeRow.push(
      <span
        key="photo-clear"
        className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200/80"
      >
        {t("badgePhotoQuality")}
      </span>,
    );
  }
  if (showNew) {
    ctrBadgeRow.push(
      <div key="new" className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
        {t("badgeNew")}
      </div>,
    );
  }
  const ctrBadgesVisible = ctrBadgeRow.slice(0, 3);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-none hover:border-[color:var(--darlink-accent)]/30",
        (planTier === "premium" || planTier === "hotel_featured") &&
          "ring-1 ring-[color:var(--darlink-sand)]/40",
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
        <div className="absolute start-3 top-3 z-[1] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">{ctrBadgesVisible}</div>
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 p-4 text-start",
          planTier === "premium" && "sm:gap-2.5 sm:p-5",
        )}
      >
        {"adCode" in listing && listing.adCode ? (
          <p className="mb-1 text-[11px] font-semibold tabular-nums text-[color:var(--darlink-text-muted)] [dir:ltr]">
            {listing.adCode}
          </p>
        ) : null}
        <h3
          className={cn(
            "line-clamp-2 text-base font-semibold leading-snug text-[color:var(--darlink-text)]",
            (planTier === "premium" || planTier === "hotel_featured") && "sm:text-lg",
          )}
        >
          {title}
        </h3>
        <div>
          <p className="text-xl font-bold tabular-nums leading-tight text-[color:var(--darlink-text)] sm:text-2xl">
            {formatSyriaCurrency(isStay && nightly != null ? nightly : listing.price, listing.currency, locale)}
          </p>
          {isBnhub || isStay ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
              {t("cardPerNight")}
            </p>
          ) : null}
        </div>
        <p className="text-sm leading-snug text-[color:var(--darlink-text-muted)]">{cityAreaLine}</p>
        {cardAmenityBadges.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 [dir=rtl]:justify-end">
            {cardAmenityBadges.map((b) => (
              <span
                key={b.key}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-[color:var(--darlink-surface-muted)] px-2 py-0.5 text-[10px] font-semibold leading-tight text-[color:var(--darlink-text)] ring-1 ring-[color:var(--darlink-border)]/80"
                title={b.label}
              >
                <span aria-hidden className="shrink-0">
                  {b.emoji}
                </span>
                <span className="truncate">{b.label}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
