"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ListingFadeInImg } from "@/components/syria/ListingFadeInImg";
import { ListingImageSkeleton } from "@/components/syria/ListingImageSkeleton";
import { useDataSaverOptional } from "@/context/DataSaverProvider";
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
import type { BrowseCtrBadgeKind } from "@/lib/sybnb/browse-card-signals";
import { labelSyriaState } from "@/lib/syria/states";
import { pickListingCardAmenityBadges, listingCardBadgesFromAmenityKeys, normalizeSyriaAmenityKeys } from "@/lib/syria/amenities";
import {
  getListingPhotoTrustTier,
  isSellerVerifiedForListingTrust,
  shouldShowTrustedListingBadge,
} from "@/lib/listing-trust-badges";
import { isOwnershipVerificationTierListing } from "@/lib/listing-posting-kind";

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
  | "listingPhotoCount"
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
  | "proofDocumentsSubmitted"
  | "ownershipVerified"
  | "postingKind"
  | "isTest"
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

/** SYBNB-77 — browse wires may ship one image URL but include `listingPhotoCount` for badges. */
function effectivePhotoCount(listing: ListingCardModel): number {
  const rpc =
    "listingPhotoCount" in listing &&
    listing.listingPhotoCount != null &&
    typeof listing.listingPhotoCount === "number" ?
      listing.listingPhotoCount
    : null;
  if (rpc != null && rpc >= 0) return rpc;
  return imageCount(listing.images);
}

/** ORDER SYBNB-80 — browse payloads ship pre-ranked CTR badge kinds from the API. */
function browseCtrBadgeElement(kind: BrowseCtrBadgeKind, idx: number, t: (key: string) => string): ReactNode {
  switch (kind) {
    case "trusted_listing":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-teal-400/60"
        >
          {t("badgeTrustedListing")}
        </span>
      );
    case "verified_seller":
      return (
        <div key={`browse-ctr-${idx}`} className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          {t("verifiedBadge")}
        </div>
      );
    case "ownership_confirmed":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-emerald-600/60"
        >
          {t("badgeOwnershipConfirmed")}
        </span>
      );
    case "ownership_not_verified":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-400/70"
        >
          {t("badgeOwnershipNotVerified")}
        </span>
      );
    case "proof_documents":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-slate-500/50"
        >
          {t("badgeProofDocuments")}
        </span>
      );
    case "photo_full":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-violet-100/95 px-2 py-0.5 text-[10px] font-bold text-violet-950 ring-1 ring-violet-300/65"
        >
          {t("badgePhotoGalleryFull")}
        </span>
      );
    case "photo_clear":
      return (
        <span
          key={`browse-ctr-${idx}`}
          className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200/80"
        >
          {t("badgePhotoQuality")}
        </span>
      );
    case "new":
      return (
        <div key={`browse-ctr-${idx}`} className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
          {t("badgeNew")}
        </div>
      );
    default:
      return null;
  }
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
  const { listingImageQuality } = useDataSaverOptional();
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
  const nPhotos = effectivePhotoCount(listing);
  const browseWire = listing as SerializedBrowseListing;
  const browseCtrKinds =
    Array.isArray(browseWire.browseCtrBadgeKinds) && browseWire.browseCtrBadgeKinds.length > 0 ?
      browseWire.browseCtrBadgeKinds
    : null;

  const cardAmenityBadges =
    Array.isArray(browseWire.browseAmenityBadgeKeys) && browseWire.browseAmenityBadgeKeys.length > 0 ?
      listingCardBadgesFromAmenityKeys(browseWire.browseAmenityBadgeKeys, locale)
    : pickListingCardAmenityBadges(listing.amenities, locale, 2);
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

  /** SYBNB-CTR / SYBNB-101 — trust → ownership → proof → photo → new (capped server-side). */
  let ctrBadgesVisible: ReactNode[];
  if (browseCtrKinds) {
    ctrBadgesVisible = browseCtrKinds.map((kind, idx) => browseCtrBadgeElement(kind, idx, t));
  } else {
    const fraudFlag = "fraudFlag" in listing && listing.fraudFlag === true;
    const sellerVerified = isSellerVerifiedForListingTrust({
      verified: listing.verified,
      listingVerified: listing.listingVerified,
      sy8SellerVerified: "sy8SellerVerified" in listing ? listing.sy8SellerVerified : undefined,
    });
    const wireAmenityCount =
      "amenityCount" in listing && typeof (listing as SerializedBrowseListing).amenityCount === "number"
        ? (listing as SerializedBrowseListing).amenityCount
        : normalizeSyriaAmenityKeys(
            Array.isArray(listing.amenities)
              ? listing.amenities.filter((x): x is string => typeof x === "string")
              : [],
          ).length;
    const showTrustedListingBadgeUi = shouldShowTrustedListingBadge({
      sellerVerified,
      imageCount: nPhotos,
      amenityCount: wireAmenityCount,
      fraudFlag,
    });
    const showVerifiedSellerOnly = sellerVerified && !showTrustedListingBadgeUi && !fraudFlag;
    const photoTrustTier = getListingPhotoTrustTier(nPhotos);
    const created =
      "createdAt" in listing && listing.createdAt ?
        typeof listing.createdAt === "string" ?
          new Date(listing.createdAt)
        : (listing as SyriaProperty).createdAt
      : null;
    const showNew = created ? isNewListing(created) : false;

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
    const catStr =
      "category" in listing && typeof (listing as { category?: string }).category === "string" ?
        (listing as { category: string }).category
      : "";
    const pkStr =
      "postingKind" in listing ?
        ((listing as { postingKind?: string | null }).postingKind ?? "")
      : "";
    const tierOv = isOwnershipVerificationTierListing(catStr, pkStr) && !fraudFlag;
    if (tierOv) {
      const ov = "ownershipVerified" in listing && (listing as { ownershipVerified?: boolean }).ownershipVerified === true;
      ctrBadgeRow.push(
        ov ?
          <span
            key="own-confirmed"
            className="rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-emerald-600/60"
          >
            {t("badgeOwnershipConfirmed")}
          </span>
        : <span
            key="own-not"
            className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-400/70"
          >
            {t("badgeOwnershipNotVerified")}
          </span>,
      );
    }
    const proofUploaded =
      "proofDocumentsSubmitted" in listing && listing.proofDocumentsSubmitted === true && !fraudFlag;
    if (proofUploaded) {
      ctrBadgeRow.push(
        <span
          key="proof-docs"
          className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-slate-500/50"
        >
          {t("badgeProofDocuments")}
        </span>,
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
    ctrBadgesVisible = ctrBadgeRow.slice(0, 4);
  }

  const showTestListing =
    "isTest" in listing && (listing as { isTest?: boolean }).isTest === true;
  if (showTestListing) {
    ctrBadgesVisible = [
      <span
        key="sybn108-test"
        className="rounded-full bg-fuchsia-900/90 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-fuchsia-400/60"
      >
        {t("badgeTestData")}
      </span>,
      ...ctrBadgesVisible,
    ];
  }

  const [coverLoaded, setCoverLoaded] = useState(false);
  useEffect(() => {
    setCoverLoaded(false);
  }, [img]);

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
                <ListingFadeInImg
                  src={img}
                  alt=""
                  className=""
                  loading={priority ? "eager" : "lazy"}
                  fetchPriority={priority ? "high" : "low"}
                />
              );
            }
            return (
              <>
                <ListingImageSkeleton active={!coverLoaded} />
                <Image
                  src={img}
                  alt=""
                  fill
                  loading={priority ? "eager" : "lazy"}
                  className={cn(
                    "relative z-[2] object-cover transition-opacity duration-300",
                    coverLoaded ? "opacity-100" : "opacity-0",
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 360px"
                  quality={listingImageQuality}
                  priority={!!priority}
                  unoptimized={img.startsWith("http://") || img.startsWith("https://")}
                  onLoadingComplete={() => setCoverLoaded(true)}
                />
              </>
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
