"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type LuxuryBrowseListing = {
  id: string;
  title: string;
  price: string;
  priceUsd: number;
  location: string;
  beds: number;
  baths: number;
  image: string;
};

const DEFAULT_LISTINGS: LuxuryBrowseListing[] = [
  {
    id: "1",
    title: "Modern Villa in Westmount",
    price: "$3,750,000",
    priceUsd: 3_750_000,
    location: "Westmount, Montréal",
    beds: 4,
    baths: 3,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "2",
    title: "Luxury Downtown Penthouse",
    price: "$2,490,000",
    priceUsd: 2_490_000,
    location: "Downtown Montréal",
    beds: 3,
    baths: 2,
    image:
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "3",
    title: "Waterfront Estate",
    price: "$1,150,000",
    priceUsd: 1_150_000,
    location: "Laval-sur-le-Lac",
    beds: 5,
    baths: 4,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
  },
];

const PRICE_SLIDER_MAX = 5_000_000;

type SortKey = "default" | "price-asc" | "price-desc";

type FilterPanelProps = {
  maxPriceUsd: number;
  onMaxPriceUsd: (v: number) => void;
  minBeds: number;
  onMinBeds: (v: number) => void;
  propertyType: "all" | "house" | "condo";
  onPropertyType: (v: "all" | "house" | "condo") => void;
};

function FilterPanel({
  maxPriceUsd,
  onMaxPriceUsd,
  minBeds,
  onMinBeds,
  propertyType,
  onPropertyType,
}: FilterPanelProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-[#222] bg-[#0B0B0B] p-5">
      <h3 className="text-sm uppercase tracking-widest text-[#D4AF37]">Filters</h3>

      <div>
        <label className="text-xs text-gray-400">Max price</label>
        <input
          type="range"
          min={0}
          max={PRICE_SLIDER_MAX}
          step={50_000}
          value={maxPriceUsd}
          onChange={(e) => onMaxPriceUsd(Number(e.target.value))}
          className="mt-2 w-full accent-[#D4AF37]"
          aria-valuemin={0}
          aria-valuemax={PRICE_SLIDER_MAX}
          aria-valuenow={maxPriceUsd}
        />
        <p className="mt-1 text-xs text-gray-500">
          Up to{" "}
          {new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 0,
          }).format(maxPriceUsd)}
        </p>
      </div>

      <div>
        <label className="text-xs text-gray-400" htmlFor="luxury-min-beds">
          Bedrooms
        </label>
        <select
          id="luxury-min-beds"
          value={minBeds}
          onChange={(e) => onMinBeds(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-[#222] bg-black p-2 text-sm"
        >
          <option value={0}>Any</option>
          <option value={1}>1+</option>
          <option value={2}>2+</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-400" htmlFor="luxury-type">
          Type
        </label>
        <select
          id="luxury-type"
          value={propertyType}
          onChange={(e) => onPropertyType(e.target.value as FilterPanelProps["propertyType"])}
          className="mt-2 w-full rounded-lg border border-[#222] bg-black p-2 text-sm"
        >
          <option value="all">All</option>
          <option value="house">House</option>
          <option value="condo">Condo</option>
        </select>
      </div>
    </div>
  );
}

function detailHrefForItem(base: string, item: LuxuryBrowseListing): string {
  if (item.id === "1") return `${base}/listings/showcase/westmount-villa`;
  return `${base}/listings/luxury`;
}

function matchesPropertyType(item: LuxuryBrowseListing, t: FilterPanelProps["propertyType"]): boolean {
  if (t === "all") return true;
  const title = `${item.title}`.toLowerCase();
  if (t === "condo") return title.includes("condo") || title.includes("penthouse");
  if (t === "house") {
    return (
      title.includes("villa") ||
      title.includes("estate") ||
      title.includes("waterfront") ||
      title.includes("house")
    );
  }
  return true;
}

function ListingCard({
  item,
  detailHref,
}: {
  item: LuxuryBrowseListing;
  detailHref: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-[#222] bg-[#0B0B0B] transition hover:border-[#D4AF37]/40">
      <div
        className="h-60 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${item.image})` }}
      />

      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>

        <p className="text-sm text-gray-400">{item.location}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-[#D4AF37]">{item.price}</span>

          <span className="text-xs text-gray-500">
            {item.beds} beds • {item.baths} baths
          </span>
        </div>

        <Link
          href={detailHref}
          className="mt-3 block w-full rounded-lg border border-[#D4AF37]/40 py-2 text-center text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          View property
        </Link>
      </div>
    </div>
  );
}

export type LecipmLuxuryListingsBrowseProps = {
  locale: string;
  country: string;
  /** Override demo inventory (e.g. when wired to an API). */
  listings?: LuxuryBrowseListing[];
};

export function LecipmLuxuryListingsBrowse({
  locale,
  country,
  listings: listingsProp,
}: LecipmLuxuryListingsBrowseProps) {
  const base = `/${locale}/${country}`;
  const source = listingsProp ?? DEFAULT_LISTINGS;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [maxPriceUsd, setMaxPriceUsd] = useState(PRICE_SLIDER_MAX);
  const [minBeds, setMinBeds] = useState(0);
  const [propertyType, setPropertyType] = useState<FilterPanelProps["propertyType"]>("all");

  const filtered = useMemo(() => {
    let rows = source.filter((item) => {
      const q = search.trim().toLowerCase();
      const text = `${item.title} ${item.location}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (item.priceUsd > maxPriceUsd) return false;
      if (item.beds < minBeds) return false;
      if (!matchesPropertyType(item, propertyType)) return false;
      return true;
    });

    if (sort === "price-asc") rows = [...rows].sort((a, b) => a.priceUsd - b.priceUsd);
    if (sort === "price-desc") rows = [...rows].sort((a, b) => b.priceUsd - a.priceUsd);

    return rows;
  }, [source, search, maxPriceUsd, minBeds, propertyType, sort]);

  return (
    <div className="min-h-screen space-y-6 bg-black p-6 text-white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Explore Properties</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search city, address..."
          type="search"
          className="w-full rounded-full border border-[#222] bg-[#0B0B0B] px-5 py-2 text-sm focus:border-[#D4AF37] focus:outline-none md:w-96"
          autoComplete="off"
        />
      </div>

      <p className="text-sm text-gray-400">
        Curated preview layout — full inventory search & map:{" "}
        <Link href={`${base}/listings?view=explorer`} className="font-medium text-[#D4AF37] underline-offset-4 hover:underline">
          open explorer
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <FilterPanel
            maxPriceUsd={maxPriceUsd}
            onMaxPriceUsd={setMaxPriceUsd}
            minBeds={minBeds}
            onMinBeds={setMinBeds}
            propertyType={propertyType}
            onPropertyType={setPropertyType}
          />
        </div>

        <div className="md:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              {filtered.length} result{filtered.length === 1 ? "" : "s"} found
            </p>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-[#222] bg-[#0B0B0B] px-3 py-2 text-sm"
              aria-label="Sort listings"
            >
              <option value="default">Sort by</option>
              <option value="price-asc">Price (low → high)</option>
              <option value="price-desc">Price (high → low)</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                detailHref={detailHrefForItem(base, item)}
              />
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-500">No listings match these filters.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
