"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ListingFadeInImg } from "@/components/syria/ListingFadeInImg";
import { ListingImageSkeleton } from "@/components/syria/ListingImageSkeleton";
import { useDataSaverOptional } from "@/context/DataSaverProvider";
import { formatSyriaCurrency } from "@/lib/format";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import { getLocalizedPropertyCity, getLocalizedPropertyTitle } from "@/lib/property-localization";
import { cn } from "@/lib/cn";
import { labelSyriaState } from "@/lib/syria/states";
import type { SyriaProperty } from "@/generated/prisma";

type FeedItem = Pick<
  SyriaProperty,
  | "id"
  | "adCode"
  | "titleAr"
  | "titleEn"
  | "state"
  | "governorate"
  | "city"
  | "cityAr"
  | "cityEn"
  | "area"
  | "districtAr"
  | "districtEn"
  | "price"
  | "currency"
  | "images"
  | "isDirect"
  | "type"
>;

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const u = images.find((x): x is string => typeof x === "string" && x.length > 0);
  return u ?? null;
}

export function FeedListingCard({
  listing,
  locale,
  priority = false,
}: {
  listing: FeedItem;
  locale: string;
  priority?: boolean;
}) {
  const t = useTranslations("Listing");
  const { listingImageQuality } = useDataSaverOptional();
  const resolved = backfillLocalizedPropertyShape(listing);
  const title = getLocalizedPropertyTitle(listing, locale);
  const cityLine = getLocalizedPropertyCity(resolved, locale);
  const stateRaw = listing.state?.trim() ? listing.state : null;
  const govRaw = listing.governorate?.trim() ? listing.governorate : null;
  const stateLabel = stateRaw ? labelSyriaState(stateRaw, locale) : govRaw;
  const subLocation = stateLabel && stateLabel !== cityLine ? stateLabel : null;
  const img = firstImage(listing.images);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  useEffect(() => {
    setThumbLoaded(false);
  }, [img]);

  const isDirect = listing.isDirect !== false;
  const isStay = listing.type === "BNHUB";

  return (
    <Link
      prefetch={false}
      href={`/listing/${listing.id}`}
      className="flex w-full min-w-0 touch-manipulation gap-3 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-3 text-start transition hover:border-[color:var(--darlink-accent)]/35 active:bg-[color:var(--darlink-surface-muted)]/50"
    >
      <div
        className={cn(
          "relative size-20 shrink-0 overflow-hidden rounded-[var(--darlink-radius-lg)] bg-[color:var(--darlink-surface-muted)]",
          !img && "flex items-center justify-center",
        )}
      >
        {img ? (
          (() => {
            const isDataOrBlob = img.startsWith("data:") || img.startsWith("blob:");
            if (isDataOrBlob) {
              return (
                <span className="relative block size-20 overflow-hidden">
                  <ListingFadeInImg
                    src={img}
                    alt=""
                    className="size-20 object-cover"
                    loading={priority ? "eager" : "lazy"}
                  />
                </span>
              );
            }
            return (
              <span className="relative block size-20 overflow-hidden">
                <ListingImageSkeleton active={!thumbLoaded} />
                <Image
                  src={img}
                  alt=""
                  width={520}
                  height={520}
                  sizes="80px"
                  loading={priority ? "eager" : "lazy"}
                  className={cn(
                    "relative z-[2] size-20 object-cover transition-opacity duration-300",
                    thumbLoaded ? "opacity-100" : "opacity-0",
                  )}
                  quality={listingImageQuality}
                  priority={!!priority}
                  unoptimized={img.startsWith("http://") || img.startsWith("https://")}
                  onLoadingComplete={() => setThumbLoaded(true)}
                />
              </span>
            );
          })()
        ) : (
          <span className="px-1 text-center text-[10px] font-medium text-[color:var(--darlink-text-muted)]">
            {cityLine.slice(0, 3)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {listing.adCode ? (
          <p className="mb-0.5 text-[10px] font-semibold tabular-nums text-[color:var(--darlink-text-muted)] [dir:ltr]">
            {listing.adCode}
          </p>
        ) : null}
        <p className="text-xl font-bold tabular-nums leading-none text-[color:var(--darlink-text)] sm:text-2xl">
          {formatSyriaCurrency(listing.price, listing.currency, locale)}
        </p>
        {isStay ? (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
            {t("cardPerNight")}
          </p>
        ) : null}
        <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--darlink-text)]">{title}</h2>
        <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--darlink-text-muted)]">
          {subLocation ? `${subLocation} · ` : null}
          {cityLine}
        </p>
        {isDirect ? (
          <p className="mt-1 text-[11px] font-bold text-emerald-800">{t("badgeDirect")}</p>
        ) : null}
      </div>
    </Link>
  );
}
