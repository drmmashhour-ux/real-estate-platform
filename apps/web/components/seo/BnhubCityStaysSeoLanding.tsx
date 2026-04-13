import Image from "next/image";
import Link from "next/link";
import { VerificationStatus } from "@prisma/client";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { VerifiedListingBadge } from "@/components/listings/VerifiedListingBadge";
import { ListingCodeBadge } from "@/components/bnhub/ListingCodeBadge";
import { prisma } from "@/lib/db";
import {
  buildPublishedListingSearchWhere,
  searchOrderBy,
} from "@/lib/bnhub/build-search-where";
import {
  growthCityDisplayName,
  growthCityRegion,
  growthCitySearchQuery,
  type GrowthCitySlug,
} from "@/lib/growth/geo-slugs";
import { bnhubStaysMapSearchUrl } from "@/lib/search/public-map-search-urls";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { breadcrumbListJsonLd, webPageJsonLd } from "@/src/modules/seo/structuredData";

const GOLD = "var(--color-premium-gold)";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

type Props = {
  citySlug: GrowthCitySlug;
  /** Path for breadcrumbs + JSON-LD, e.g. `/bnhub/montreal` */
  canonicalPath: string;
};

export async function BnhubCityStaysSeoLanding({ citySlug, canonicalPath }: Props) {
  const cityLabel = growthCityDisplayName(citySlug);
  const q = growthCitySearchQuery(citySlug);
  const region = growthCityRegion(citySlug) === "US" ? "USA" : "Canada";
  const base = getSiteBaseUrl().replace(/\/$/, "");

  const where = buildPublishedListingSearchWhere({ city: q });
  const listings = await prisma.shortTermListing.findMany({
    where,
    orderBy: searchOrderBy("newest"),
    take: 24,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
      verificationStatus: true,
    },
  });

  const mapHref = bnhubStaysMapSearchUrl({ city: q });
  const breadcrumbs = breadcrumbListJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "BNHUB", path: "/bnhub" },
      { name: `${cityLabel} stays`, path: canonicalPath },
    ],
    base
  );
  const pageLd = webPageJsonLd({
    name: `Short-term stays in ${cityLabel} | BNHUB`,
    description: `Book verified nightly rentals in ${cityLabel}, ${region}. Browse BNHUB listings with clear pricing on LECIPM.`,
    url: `${base}${canonicalPath}`,
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <JsonLdScript data={breadcrumbs} />
      <JsonLdScript data={pageLd} />

      <section className="border-b border-white/10 bg-gradient-to-b from-black to-[#0B0B0B]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHUB · {region}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {cityLabel} short-term stays &amp; nightly rentals
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Discover verified BNHUB vacation rentals in {cityLabel}. Compare nightly rates, open the map to filter by
            dates and guests, or contact our team for help planning your stay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={mapHref}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              style={{ background: GOLD }}
            >
              Book on map search
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
            >
              Contact
            </Link>
            <Link
              href="/bnhub/stays"
              className="rounded-xl border border-premium-gold/40 px-6 py-3 text-sm text-premium-gold hover:bg-premium-gold/10"
            >
              All stays
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="bnhub-city-stays-heading">
        <h2 id="bnhub-city-stays-heading" className="text-2xl font-bold text-white sm:text-3xl">
          Stays in {cityLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
          Published BNHUB listings matching this area. Tap a card for photos, amenities, and booking.
        </p>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-white/80">No published stays in this city yet.</p>
            <Link
              href={mapHref}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-premium-gold/45 bg-premium-gold/10 px-6 text-sm font-bold text-premium-gold transition hover:border-premium-gold hover:bg-premium-gold/18"
            >
              Search nearby on the map
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const href = `/bnhub/stays/${l.listingCode || l.id}`;
              const img = photoFirst(l.photos);
              const price = (l.nightPriceCents / 100).toFixed(0);
              return (
                <li key={l.id}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141414] transition hover:border-premium-gold/35"
                  >
                    <div className="relative aspect-[20/13] bg-[#1a1a1a]">
                      {l.verificationStatus === VerificationStatus.VERIFIED ? (
                        <VerifiedListingBadge variant="dark" />
                      ) : null}
                      {img ? (
                        img.startsWith("/") ? (
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                            sizes="(max-width:768px) 100vw, 33vw"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/35">Photo</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="line-clamp-2 flex-1 font-semibold leading-snug text-white group-hover:text-premium-gold">
                          {l.title}
                        </p>
                        <ListingCodeBadge code={l.listingCode} className="shrink-0" />
                      </div>
                      <p className="mt-1 text-sm text-white/55">{l.city}</p>
                      <p className="mt-3 text-sm font-bold text-white">
                        <span className="font-semibold text-white/60">from </span>${price}
                        <span className="text-sm font-normal text-white/50"> / night</span>
                      </p>
                      <span className="mt-4 text-sm font-semibold text-premium-gold">View &amp; book →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-white/10 bg-black/40 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-xl font-bold text-white">Ready to book?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/65">
            Use map search to set dates and guest count, or reach out and we will help you find the right stay in{" "}
            {cityLabel}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={mapHref}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              style={{ background: GOLD }}
            >
              Open BNHUB map
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
