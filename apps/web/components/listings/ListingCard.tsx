"use client";

import Link from "next/link";
import { BrowseListingFavoriteButton } from "@/components/listings/BrowseListingFavoriteButton";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import { getListingCardDeterministicInsights } from "@/lib/listings/listing-card-deterministic-insights";
import { recordListingCtaClick } from "@/modules/conversion/conversion-monitoring.service";
import { track } from "@/lib/tracking";

const GOLD = "#C9A96A";

export type ListingCardRow = {
  kind?: "fsbo" | "crm";
  id: string;
  title: string;
  priceCents: number;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  images: string[];
  propertyType: string | null;
  address?: string | null;
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
    tone: "amber" | "emerald" | "slate";
  } | null;
  verifiedListing?: boolean;
  featuredUntil?: string | null;
};

function publicHref(row: ListingCardRow): string {
  if (row.kind === "fsbo") {
    return buildFsboPublicListingPath({
      id: row.id,
      city: row.city,
      propertyType: row.propertyType,
    });
  }
  return `/listings/${row.id}`;
}

function featuredActive(featuredUntil: string | null | undefined): boolean {
  if (featuredUntil == null || featuredUntil === "") return false;
  const t = new Date(featuredUntil).getTime();
  return Number.isFinite(t) && t > Date.now();
}

type Props = {
  row: ListingCardRow;
  cardIndex: number;
  selected: boolean;
  medianForCards: number | null;
  conversionUpgradeV1: boolean;
  onHoverChange: (id: string | null) => void;
};

export default function ListingCard({
  row,
  cardIndex,
  selected,
  medianForCards,
  conversionUpgradeV1,
  onHoverChange,
}: Props) {
  const img = row.coverImage || row.images[0] || null;
  const price = `$${(row.priceCents / 100).toLocaleString("en-CA")}`;
  const addr = [row.address, row.city].filter(Boolean).join(", ") || row.city;
  const href = publicHref(row);
  const insights = getListingCardDeterministicInsights({
    priceCents: row.priceCents,
    city: row.city,
    bedrooms: row.bedrooms,
    medianPriceDollars: medianForCards,
  });
  const microCta =
    insights.some((line) => line.includes("Below median")) ? "Get this deal" : "Contact now";
  const primaryOpportunityCta = conversionUpgradeV1 ? "Get this opportunity" : microCta;

  const fireListingClick = () => {
    track("listing_click", {
      meta: { listingId: row.id, surface: "lecipm_grid", city: row.city },
    });
    if (conversionUpgradeV1) {
      recordListingCtaClick({ listingId: row.id, surface: "lecipm_grid" });
    }
  };

  return (
    <article
      id={`lecipm-card-${row.id}`}
      onMouseEnter={() => onHoverChange(row.id)}
      onMouseLeave={() => onHoverChange(null)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-left shadow-[0_12px_40px_-14px_rgba(0,0,0,0.75)] transition duration-300 hover:-translate-y-1 hover:border-[#C9A96A]/55 hover:shadow-[0_20px_50px_-12px_rgba(201,169,106,0.14)] ${
        selected ? "border-[#C9A96A]/55 ring-1 ring-[#C9A96A]/25" : ""
      }`}
    >
      <BrowseListingFavoriteButton
        listingId={row.id}
        kind={row.kind === "crm" ? "crm" : "fsbo"}
        className="absolute right-3 top-3 z-10"
      />
      <Link
        href={href}
        onClick={fireListingClick}
        className="relative block aspect-[4/3] overflow-hidden bg-black outline-none ring-white/15 focus-visible:ring-2"
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            loading={cardIndex < 3 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={cardIndex === 0 ? "high" : undefined}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
            No photo
          </div>
        )}
        {img ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            aria-hidden
          />
        ) : null}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[2] flex max-w-[calc(100%-5rem)] flex-wrap items-center gap-1.5">
          {row.verifiedListing ? (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur-sm">
              Verified
            </span>
          ) : null}
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E5C07B] ring-1 ring-[#C9A96A]/35 backdrop-blur-sm">
            AI score
          </span>
          {featuredActive(row.featuredUntil) ? (
            <span className="rounded-full border border-[#C9A96A]/40 bg-[#C9A96A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E5C07B] backdrop-blur-sm">
              Featured
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-2xl font-bold tracking-tight text-white">{price}</p>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90">{addr}</p>
        <div className="mt-3 flex gap-5 text-xs text-neutral-500">
          <span>{row.bedrooms != null ? `${row.bedrooms} beds` : "— beds"}</span>
          <span>{row.bathrooms != null ? `${row.bathrooms} baths` : "— baths"}</span>
        </div>
        {insights.length ? (
          <ul className="mt-3 space-y-1 text-[11px] leading-snug text-neutral-400">
            {insights.map((line) => (
              <li key={line} className="flex gap-1.5">
                <span className="text-[#C9A96A]" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={href}
            onClick={fireListingClick}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 text-center text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            View details
          </Link>
          <Link
            href={`${href}#property-contact-cta`}
            onClick={() => {
              track("cta_click", {
                meta: { label: "contact_now", listingId: row.id, surface: "lecipm_grid" },
              });
              if (conversionUpgradeV1) {
                recordListingCtaClick({ listingId: row.id, surface: "lecipm_grid", label: "opportunity" });
              }
            }}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-4 text-center text-sm font-bold text-black transition hover:bg-[#E5C07B]"
            style={{ backgroundColor: GOLD }}
          >
            {primaryOpportunityCta}
          </Link>
        </div>
      </div>
    </article>
  );
}
