"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bath,
  Bed,
  Camera,
  ChevronDown,
  Heart,
  LayoutGrid,
  List,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import { ExploreLandingGoogleMap } from "@/components/explore/ExploreLandingGoogleMap";
import { ExploreMapGeminiPanel } from "@/components/explore/ExploreMapGeminiPanel";
import { ExploreQaListingHint } from "@/components/explore/ExploreQaListingHint";
import { SearchFiltersProvider } from "@/components/search/SearchEngine";
import { LISTINGS_MAP_SEARCH_ID, PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";
import { PLATFORM_IMMOBILIER_HUB_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { ExploreQuebecHeroSearch, useExploreListingsMapHref } from "@/app/[locale]/[country]/explore/explore-quebec-hero-search";

const GOLD = "#d4af37";

/** Hero backdrop — historic Québec cityscape feel (English-market landing). */
const HERO_BG =
  "https://images.unsplash.com/photo-1594040226829-7f81ad1c9967?q=80&w=2400&auto=format&fit=crop";

type MockListing = {
  id: string;
  price: number;
  title: string;
  line1: string;
  line2: string;
  beds: number;
  baths: number;
  photos: number;
  image: string;
  badge?: string;
};

const MOCK_LISTINGS: MockListing[] = [
  {
    id: "1",
    price: 485_000,
    title: "Condo — for sale",
    line1: "1200 Rue Sherbrooke Ouest",
    line2: "Montréal (Ville-Marie)",
    beds: 2,
    baths: 1,
    photos: 32,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    badge: "Virtual tour",
  },
  {
    id: "2",
    price: 349_900,
    title: "Townhouse — for sale",
    line1: "89 Rue des Érables",
    line2: "Terrebonne (La Plaine)",
    beds: 3,
    baths: 2,
    photos: 18,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    price: 629_000,
    title: "Single-family — for sale",
    line1: "45 Chemin du Lac",
    line2: "Magog",
    beds: 4,
    baths: 3,
    photos: 45,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800&auto=format&fit=crop",
    badge: "Open house",
  },
  {
    id: "4",
    price: 412_500,
    title: "Condo — for sale",
    line1: "2100 Boul. René-Lévesque",
    line2: "Québec (La Cité)",
    beds: 2,
    baths: 2,
    photos: 24,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    price: 279_000,
    title: "Condo — for sale",
    line1: "300 Rue King Ouest",
    line2: "Sherbrooke",
    beds: 1,
    baths: 1,
    photos: 14,
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    price: 519_000,
    title: "Duplex — for sale",
    line1: "88 Avenue du Parc",
    line2: "Gatineau (Hull)",
    beds: 5,
    baths: 2,
    photos: 21,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "7",
    price: 389_000,
    title: "Condo — for sale",
    line1: "10 Rue des Châteaux",
    line2: "Laval (Chomedey)",
    beds: 2,
    baths: 1,
    photos: 19,
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "8",
    price: 725_000,
    title: "Single-family — for sale",
    line1: "2 Chemin de la Montagne",
    line2: "Mont-Tremblant",
    beds: 4,
    baths: 3,
    photos: 52,
    image: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?q=80&w=800&auto=format&fit=crop",
    badge: "Virtual tour",
  },
];

function formatCad(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ExploreQuebecClient() {
  return (
    <SearchFiltersProvider mode="buy">
      <ExploreQuebecPageInner />
    </SearchFiltersProvider>
  );
}

function ExploreQuebecPageInner() {
  const mapListingsHref = useExploreListingsMapHref();

  const subtitle = useMemo(
    () =>
      `Sample results below — open live search on ${PLATFORM_NAME} for real inventory across Québec.`,
    []
  );

  return (
    <div className="bg-[#0B0B0B] text-[#ececec]">
      {/* Full-bleed hero — Centris-style English headline + integrated search (brand gold, not purple) */}
      <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_BG} alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-20">
          <div className="mb-8 border-b border-white/10 pb-8">
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/[0.12] bg-black/50 px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:px-6 sm:py-7">
              <div className="grid gap-6 sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-white/10 md:gap-6">
                <Link
                  href="/join-broker"
                  className="group flex flex-col items-center text-center sm:items-stretch sm:px-4 sm:text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/95">
                    Premium broker
                  </span>
                  <span className="mt-2 text-sm font-medium text-white transition group-hover:text-premium-gold">
                    Broker workspace &amp; visibility
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-white/55">Join the licensed network →</span>
                </Link>
                <Link
                  href="/listings/luxury"
                  className="group flex flex-col items-center text-center sm:items-stretch sm:px-4 sm:text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/95">
                    Premium property
                  </span>
                  <span className="mt-2 text-sm font-medium text-white transition group-hover:text-premium-gold">
                    Curated luxury listings
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-white/55">Browse standout homes →</span>
                </Link>
                <div className="flex flex-col items-center text-center sm:items-stretch sm:px-4 sm:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/95">
                    Premium sale, buy &amp; visit
                  </span>
                  <p className="mt-2 text-sm font-medium text-white">Sell, purchase, or book a visit</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-white/75 sm:justify-start">
                    <Link href="/sell" className="rounded-full border border-white/15 px-3 py-1 transition hover:border-premium-gold/45 hover:text-premium-gold">
                      Sell
                    </Link>
                    <Link
                      href={PUBLIC_MAP_SEARCH_URL.listingsBuy}
                      className="rounded-full border border-white/15 px-3 py-1 transition hover:border-premium-gold/45 hover:text-premium-gold"
                    >
                      Buy
                    </Link>
                    <Link
                      href={`/#${LISTINGS_MAP_SEARCH_ID}`}
                      className="rounded-full border border-white/15 px-3 py-1 transition hover:border-premium-gold/45 hover:text-premium-gold"
                    >
                      Visit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/80">
            {PLATFORM_IMMOBILIER_HUB_NAME} · For buyers · Québec
          </p>
          <h1 className="mt-4 max-w-3xl text-left text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find your place in Québec —{" "}
            <span className="text-premium-gold">map, tools, and trusted guidance</span> in one workspace.
          </h1>
          <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/85 sm:text-base">
            Search by city, neighborhood, or address — then refine with map view, financing tools, and broker support on{" "}
            {PLATFORM_NAME}.
          </p>

          <ExploreQuebecHeroSearch mapHref={mapListingsHref} />
        </div>
      </section>

      {/* Map search — links into live Listings explorer with mapLayout=map */}
      <section
        id={LISTINGS_MAP_SEARCH_ID}
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-premium-gold/25 bg-[#0B0B0B] py-12 sm:py-16"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-premium-gold">Map search</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Search Québec on the map</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
            Open the interactive map: pan and zoom — listings use{" "}
            <span className="font-semibold text-premium-gold">Québec flag pins</span> so you can spot properties at a
            glance, then refine filters in the same black &amp; gold experience as the rest of {PLATFORM_NAME}.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
            <ExploreLandingGoogleMap mapListingsHref={mapListingsHref} />
            <div className="space-y-5 text-sm text-white/80">
              <ExploreMapGeminiPanel />
              <ul className="list-inside list-disc space-y-2 text-white/85">
                <li>Interactive Google Map above — search places, then open LECIPM listings with Québec-flag pins</li>
                <li>Map-first layout with gallery toggle on the listings page</li>
                <li>Jump here anytime from the hub — anchor id <code className="text-premium-gold/90">listings-map-search</code></li>
                <li>Prefer list view? Use &quot;Gallery&quot; in the explorer after you search</li>
              </ul>
              <ExploreQaListingHint />
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href={mapListingsHref}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-premium-gold px-6 text-sm font-bold text-black transition hover:brightness-110"
                >
                  Start map search
                </Link>
                <Link
                  href={PUBLIC_MAP_SEARCH_URL.listingsBuy}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-premium-gold/50"
                >
                  Default map (all Québec)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo strip — black / gold (matches platform shell) */}
      <section className="border-y border-premium-gold/20 bg-[#111111]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:px-6 lg:py-10">
          <div className="max-w-lg text-center sm:text-left">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              How to sell your home in 12 steps
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              A clear, plain-English checklist for Québec sellers — pricing, disclosures, offers, and closing.
            </p>
          </div>
          <Link
            href="/selling"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl border border-premium-gold/50 bg-black px-8 text-sm font-bold text-premium-gold transition hover:bg-premium-gold/10"
          >
            Read the guide
          </Link>
        </div>
      </section>

      {/* Image-forward row — “Properties for sale” */}
      <section className="mx-auto max-w-[1440px] border-t border-white/5 bg-[#111111] px-4 py-10 sm:px-6 lg:py-14">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Properties for sale</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          A quick visual sample — every photo links to live search so you can explore real inventory.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {MOCK_LISTINGS.slice(0, 4).map((l) => (
            <Link
              key={l.id}
              href="/listings"
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#e0dcd4] shadow-sm ring-1 ring-black/[0.06] transition hover:ring-2 hover:ring-premium-gold/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.image}
                alt={`Property in ${l.line2}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1440px] gap-6 border-t border-white/5 bg-[#0B0B0B] px-4 py-8 sm:px-6 lg:py-10">
        {/* Sidebar — resources & tools */}
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-32 space-y-6 lg:top-36">
            <Link
              href={mapListingsHref}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-premium-gold/35 bg-[#1a1610] px-4 py-3.5 text-sm font-bold text-premium-gold shadow-sm transition hover:border-premium-gold/60 hover:bg-[#221c12]"
            >
              <MapIcon className="h-4 w-4" aria-hidden />
              Map search
            </Link>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-premium-gold/80">Buy</p>
              <Link
                href="/listings"
                className="mt-3 flex items-center justify-between text-sm font-semibold text-white hover:text-premium-gold hover:underline"
              >
                View properties for sale
                <span className="text-premium-gold" aria-hidden>
                  →
                </span>
              </Link>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-premium-gold/80">Resources</p>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>
                  <Link href="/tools/welcome-tax" className="hover:text-premium-gold hover:underline">
                    Fees to expect
                  </Link>
                </li>
                <li>
                  <Link href="/buying/with-platform-broker" className="hover:text-premium-gold hover:underline">
                    Buy with a broker
                  </Link>
                </li>
                <li>
                  <Link href="/mortgage" className="hover:text-premium-gold hover:underline">
                    Pre-approval &amp; financing
                  </Link>
                </li>
                <li>
                  <Link href="/analyze" className="hover:text-premium-gold hover:underline">
                    Analyze a deal (ROI)
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-premium-gold/80">Tools</p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <Link
                    href="/analyze#mortgage-calculator"
                    className="flex items-start gap-2 font-medium text-white/90 hover:text-premium-gold"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
                    Mortgage payment estimate
                  </Link>
                </li>
                <li>
                  <Link href="/tools/roi-calculator" className="flex items-start gap-2 font-medium text-white/90 hover:text-premium-gold">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-premium-gold/20 text-[10px] font-bold text-premium-gold">
                      %
                    </span>
                    ROI calculator
                  </Link>
                </li>
                <li>
                  <Link href="/analyze" className="flex items-start gap-2 font-medium text-white/90 hover:text-premium-gold">
                    <MapIcon className="mt-0.5 h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
                    Benchmarks by city (QC)
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-[#1a1610] to-[#0f0e0c] p-4 text-[#ece8df] shadow-lg">
              <p className="text-sm font-semibold text-white">Mortgage broker or expert?</p>
              <p className="mt-2 text-xs leading-relaxed text-[#b8b3a8]">
                Access tiers, leads, and verification tools built for Québec.
              </p>
              <Link
                href="/mortgage/for-brokers"
                className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl text-sm font-bold text-[#0b0b0b]"
                style={{ background: GOLD }}
              >
                Broker platform
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <span className="inline-flex items-center gap-2 border-b-2 border-premium-gold pb-1 text-white">
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Gallery
              </span>
              <Link
                href={mapListingsHref}
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-1 text-white/60 transition hover:text-premium-gold"
              >
                <MapIcon className="h-4 w-4" aria-hidden />
                Map
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-1 text-white/60 transition hover:text-premium-gold"
              >
                <List className="h-4 w-4" aria-hidden />
                Summary
              </Link>
            </div>
            <p className="text-center text-sm text-white/60 sm:flex-1">{subtitle}</p>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-medium text-white/45">Sort by</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#141414] px-3 py-1.5 text-xs font-semibold text-white/90"
              >
                Newest
                <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
              </button>
            </div>
          </div>

          <p className="py-3 text-center text-xs text-white/45">
            Page <strong className="text-white">1</strong> · Sample layout —{" "}
            <Link href="/listings" className="font-semibold text-premium-gold hover:underline">
              open live search
            </Link>
          </p>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {MOCK_LISTINGS.map((l) => (
              <article
                key={l.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-sm transition hover:border-premium-gold/30 hover:shadow-md"
              >
                <Link href="/listings" className="relative block aspect-[4/3] overflow-hidden bg-[#1f1f1f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.image}
                    alt={`${l.title} — ${l.line2}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  {l.badge ? (
                    <span className="absolute left-3 top-3 rounded-md bg-[#0b0b0b]/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      {l.badge}
                    </span>
                  ) : null}
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                    <Camera className="h-3 w-3" aria-hidden />
                    {l.photos}
                  </span>
                </Link>
                <div className="relative p-4">
                  <button
                    type="button"
                    className="absolute right-3 top-3 rounded-full border border-white/10 p-2 text-white/45 transition hover:border-premium-gold/40 hover:text-premium-gold"
                    aria-label="Save listing"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
                    {formatCad(l.price)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{l.title}</p>
                  <p className="mt-0.5 text-xs text-white/60">{l.line1}</p>
                  <p className="text-xs text-white/60">{l.line2}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-white/80">
                    <span className="inline-flex items-center gap-1">
                      <Bed className="h-4 w-4 text-premium-gold" aria-hidden />
                      {l.beds}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-4 w-4 text-premium-gold" aria-hidden />
                      {l.baths}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-[#141414] p-6 text-center shadow-sm lg:hidden">
            <p className="text-sm font-semibold text-white">Resources &amp; broker tools</p>
            <p className="mt-2 text-xs text-white/60">
              On desktop, the left column shows buying resources and mortgage tools in one place.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/mortgage" className="text-sm font-semibold text-premium-gold hover:underline">
                Financing &amp; pre-approval
              </Link>
              <Link href="/mortgage/for-brokers" className="text-sm font-semibold text-premium-gold hover:underline">
                Mortgage broker platform
              </Link>
              <Link href={mapListingsHref} className="text-sm font-semibold text-premium-gold hover:underline">
                Search on map
              </Link>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}
