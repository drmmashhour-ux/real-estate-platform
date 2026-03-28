import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CityExploreMap } from "@/components/city/CityExploreMap";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import { CityInvestmentInsights } from "@/components/city/CityInvestmentInsights";
import { CityWhyInvestSection } from "@/components/city/CityWhyInvest";
import { StaysRecommendationGrid } from "@/components/recommendations/StaysRecommendationGrid";
import {
  CITY_SLUGS,
  fsboCityWhereFromParam,
  getCityPageConfig,
  parseCitySlugParam,
  type CitySlug,
} from "@/lib/geo/city-search";
import { getCityInsights, getWhyInvestContent } from "@/lib/city-insights";
import { searchListingsPaginated } from "@/lib/bnhub/listings";
import { getStaysRecommendedInCity } from "@/lib/recommendations";
import { prisma } from "@/lib/db";
import { FsboCompareButton } from "@/components/compare/FsboCompareButton";
import { PLATFORM_CARREFOUR_NAME, platformCarrefourGoldGradientClass } from "@/lib/brand/platform";
import { buildCityInternalLinks } from "@/src/modules/demand-engine/internalLinking";

export const revalidate = 120;

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

type PageProps = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: raw } = await params;
  const slug = parseCitySlugParam(raw);
  if (!slug) return { title: "City" };
  const c = getCityPageConfig(slug);
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    openGraph: { title: c.metaTitle, description: c.metaDescription },
  };
}

function firstBnhubPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  for (const p of photos) {
    if (typeof p === "string") return p;
  }
  return null;
}

function fsboHeroImage(images: string[], cover: string | null): string | null {
  if (cover) return cover;
  return images.find((u) => typeof u === "string" && u.length > 0) ?? null;
}

function ListingCardImage({
  src,
  sizes,
  className,
}: {
  src: string;
  sizes: string;
  className?: string;
}) {
  if (src.startsWith("/")) {
    return <Image src={src} alt="" fill className={className} sizes={sizes} loading="lazy" />;
  }
  // Remote / uploaded URLs — avoid Next remotePatterns requirement
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`} loading="lazy" decoding="async" />;
}

export default async function CityPage({ params }: PageProps) {
  const { city: raw } = await params;
  const slug = parseCitySlugParam(raw);
  if (!slug) notFound();

  const config = getCityPageConfig(slug);
  const q = config.searchQuery;

  const [bnhubResult, fsboRows, insights, recommendedInCity, whyInvest] = await Promise.all([
    searchListingsPaginated({ city: q, page: 1, limit: 12, sort: "newest" }),
    prisma.fsboListing.findMany({
      where: {
        AND: [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }, fsboCityWhereFromParam(q)],
      },
      orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        priceCents: true,
        city: true,
        bedrooms: true,
        images: true,
        coverImage: true,
      },
    }),
    getCityInsights(slug),
    getStaysRecommendedInCity(slug, 6),
    Promise.resolve(getWhyInvestContent(slug)),
  ]);

  const mapListings: MapListing[] = bnhubResult.listings
    .filter((l) => hasValidCoordinates(l))
    .map((l) => ({
      id: l.id,
      latitude: l.latitude!,
      longitude: l.longitude!,
      price: l.nightPriceCents / 100,
      title: l.title ?? "Stay",
      image: firstBnhubPhoto(l.photos),
      href: `/bnhub/${l.listingCode || l.id}`,
    }));

  const bnhubBrowse = `/search/bnhub?location=${encodeURIComponent(q)}`;
  const fsboBrowse = `/sell?city=${encodeURIComponent(q)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative flex min-h-[420px] items-end sm:min-h-[480px]">
        <Image
          src={config.heroImage}
          alt={config.heroImageAlt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p
            className={`max-w-xl text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] sm:text-xs sm:tracking-[0.18em] ${platformCarrefourGoldGradientClass}`}
          >
            {PLATFORM_CARREFOUR_NAME}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{config.heroTitle}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/95">{config.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={bnhubBrowse}
              className="inline-flex rounded-full bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
            >
              Browse BNHub in {labelForSlug(slug)}
            </Link>
            <Link
              href={fsboBrowse}
              className="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              FSBO listings — {labelForSlug(slug)}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <CityInvestmentInsights data={insights} bnhubHref={bnhubBrowse} fsboHref={fsboBrowse} />

        <div className="mt-12">
          <StaysRecommendationGrid
            title="Recommended in this city"
            subtitle="Popular and well-reviewed stays in the area."
            items={recommendedInCity}
            variant="light"
            viewAllHref={bnhubBrowse}
            viewAllLabel="Browse all stays →"
            sectionId="recommended-in-city"
          />
        </div>

        <CityWhyInvestSection content={whyInvest} bnhubHref={bnhubBrowse} fsboHref={fsboBrowse} />

        <section aria-labelledby="bnhub-city-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 id="bnhub-city-heading" className="text-2xl font-semibold text-slate-900">
                BNHub stays
              </h2>
              <p className="mt-1 text-sm text-slate-600">Short-term rentals in and near {labelForSlug(slug)}.</p>
            </div>
            <Link href={bnhubBrowse} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              View all BNHub results →
            </Link>
          </div>
          {bnhubResult.listings.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No published stays match this area yet.</p>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bnhubResult.listings.map((l) => {
                const photo = firstBnhubPhoto(l.photos);
                const href = `/bnhub/${l.listingCode || l.id}`;
                return (
                  <li key={l.id}>
                    <Link href={href} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-rose-200 hover:shadow-md">
                      <div className="relative aspect-[4/3] bg-slate-200">
                        {photo ? (
                          <ListingCardImage
                            src={photo}
                            className="transition duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width:1024px) 100vw, 33vw"
                          />
                        ) : null}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-slate-900 group-hover:text-rose-600">{l.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{l.city}</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          ${(l.nightPriceCents / 100).toFixed(0)} <span className="text-slate-500">/ night</span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-16" aria-labelledby="fsbo-city-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 id="fsbo-city-heading" className="text-2xl font-semibold text-slate-900">
                FSBO properties
              </h2>
              <p className="mt-1 text-sm text-slate-600">Private-sale listings in this area.</p>
            </div>
            <Link href={fsboBrowse} className="text-sm font-semibold text-premium-gold hover:underline">
              View all FSBO — filter by city →
            </Link>
          </div>
          {fsboRows.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No FSBO listings in this area yet.</p>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fsboRows.map((l) => {
                const img = fsboHeroImage(l.images, l.coverImage);
                return (
                  <li key={l.id}>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-premium-gold/50 hover:shadow-md">
                      <Link href={`/sell/${l.id}`} className="group block">
                        <div className="relative aspect-[4/3] bg-slate-200">
                          {img ? (
                            <ListingCardImage
                              src={img}
                              className="transition duration-300 group-hover:scale-[1.02]"
                              sizes="(max-width:1024px) 100vw, 33vw"
                            />
                          ) : null}
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-slate-900 group-hover:text-[#B8941F]">{l.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{l.city}</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            ${(l.priceCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            {l.bedrooms != null ? (
                              <span className="text-slate-500"> · {l.bedrooms} bed{l.bedrooms !== 1 ? "s" : ""}</span>
                            ) : null}
                          </p>
                        </div>
                      </Link>
                      <div className="border-t border-slate-100 px-4 pb-4">
                        <FsboCompareButton
                          listingId={l.id}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-premium-gold/50"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {mapListings.length > 0 ? <CityExploreMap listings={mapListings} cityLabel={labelForSlug(slug)} /> : null}

        <nav
          className="mt-10 flex flex-wrap gap-x-3 gap-y-2 border-t border-slate-200 pt-8 text-sm text-slate-600"
          aria-label="City and neighborhood links"
        >
          <span className="font-medium text-slate-800">On LECIPM:</span>
          {buildCityInternalLinks(slug).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:border-premium-gold/50 hover:text-[#B8941F]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <nav className="mt-12 border-t border-slate-200 pt-8 text-sm text-slate-600" aria-label="Other cities">
          <span className="font-medium text-slate-800">More cities: </span>
          {CITY_SLUGS.filter((s) => s !== slug).map((s, i) => (
            <span key={s}>
              {i > 0 ? " · " : ""}
              <Link href={`/city/${s}`} className="font-medium text-rose-600 hover:text-rose-700">
                {labelForSlug(s)}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

function labelForSlug(s: CitySlug): string {
  switch (s) {
    case "montreal":
      return "Montreal";
    case "laval":
      return "Laval";
    case "quebec":
      return "Quebec";
  }
}
