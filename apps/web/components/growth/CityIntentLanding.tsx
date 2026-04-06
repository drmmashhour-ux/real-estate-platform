import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { searchListingsPaginated } from "@/lib/bnhub/listings";
import { CITY_SLUGS, type CitySlug } from "@/lib/geo/city-search";
import { getCityInsights } from "@/lib/city-insights";
import { CityInvestmentInsights } from "@/components/city/CityInvestmentInsights";
import {
  growthCityDisplayName,
  growthCityRegion,
  growthCitySearchQuery,
  growthFsboWhereForSlug,
  parseGrowthCitySlugParam,
  type GrowthCitySlug,
} from "@/lib/growth/geo-slugs";
import type { CityIntentKind } from "@/lib/growth/city-intent-seo";
import { intentBenefits, intentFaqs, faqJsonLd } from "@/lib/growth/city-intent-seo";
import { buildGrowthSeoMeshLinks, otherGrowthCityLinks } from "@/lib/growth/city-internal-links";
import { GrowthTestimonialsStrip, GrowthTrustStrip } from "@/components/growth/GrowthTrustStrip";
import { GrowthSeoPageView } from "@/components/growth/GrowthSeoPageView";
import { GrowthCityLeadCapture } from "@/components/growth/GrowthCityLeadCapture";
import { CityAiMarketingSection } from "@/components/growth/CityAiMarketingSection";
import { CityGeneratedContentSection } from "@/components/growth/CityGeneratedContentSection";

const GOLD = "var(--color-premium-gold)";

function firstBnhubPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  for (const p of photos) {
    if (typeof p === "string") return p;
  }
  return null;
}

function toCitySlugIfSupported(s: GrowthCitySlug): CitySlug | null {
  return (CITY_SLUGS as readonly string[]).includes(s) ? (s as CitySlug) : null;
}

function ListingThumb({
  src,
  alt,
  href,
  title,
  subtitle,
}: {
  src: string | null;
  alt: string;
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#141414]"
    >
      {src ? (
        src.startsWith("/") ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width:768px) 50vw,25vw"
            loading="lazy"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0b0b0b]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70">{subtitle}</p>
      </div>
    </Link>
  );
}

export async function CityIntentLanding({
  intent,
  cityParam,
  pathVariant = "root",
}: {
  intent: CityIntentKind;
  cityParam: string;
  /** `city` = URLs under /city/[slug]/… (canonical SEO mesh). */
  pathVariant?: "root" | "city";
}) {
  const slug = parseGrowthCitySlugParam(cityParam);
  if (!slug) notFound();

  const city = growthCityDisplayName(slug);
  const q = growthCitySearchQuery(slug);
  const benefits = intentBenefits(intent, slug);
  const faqs = intentFaqs(intent, slug);
  const jsonLd = faqJsonLd(faqs);
  type FsboCard = {
    id: string;
    title: string;
    priceCents: number;
    city: string;
    bedrooms: number | null;
    images: unknown;
    coverImage: string | null;
  };
  let fsboRows: FsboCard[] = [];
  let bnListings: Awaited<ReturnType<typeof searchListingsPaginated>>["listings"] = [];
  let insights = null as Awaited<ReturnType<typeof getCityInsights>> | null;

  if (intent === "buy" || intent === "investment") {
    const [fs, bn] = await Promise.all([
      prisma.fsboListing.findMany({
        where: {
          AND: [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }, growthFsboWhereForSlug(slug)],
        },
        orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
        take: intent === "investment" ? 8 : 8,
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
      searchListingsPaginated({ city: q, page: 1, limit: intent === "investment" ? 6 : 4, sort: "newest" }),
    ]);
    fsboRows = fs;
    bnListings = bn.listings;
    if (intent === "investment") {
      const cs = toCitySlugIfSupported(slug);
      if (cs) {
        insights = await getCityInsights(cs).catch(() => null);
      }
    }
  } else if (intent === "stays") {
    const bn = await searchListingsPaginated({ city: q, page: 1, limit: 12, sort: "newest" });
    fsboRows = [];
    bnListings = bn.listings;
  } else if (intent === "rent") {
    const [fs, bn] = await Promise.all([
      prisma.fsboListing.findMany({
        where: {
          AND: [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }, growthFsboWhereForSlug(slug)],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 4,
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
      searchListingsPaginated({ city: q, page: 1, limit: 8, sort: "newest" }),
    ]);
    fsboRows = fs;
    bnListings = bn.listings;
  }

  const pageKind =
    intent === "mortgage"
      ? null
      : intent === "investment"
        ? ("investment" as const)
        : intent === "buy" || intent === "rent"
          ? intent
          : intent === "stays"
            ? ("rent" as const)
            : null;

  let seoProgrammatic: {
    blockBestProperties: string;
    blockTopInvestment: string;
    blockRentVsBuy: string;
  } | null = null;
  if (pageKind) {
    try {
      const row = await prisma.seoPageContent.findUnique({
        where: { citySlug_pageKind: { citySlug: slug, pageKind } },
      });
      if (row) {
        seoProgrammatic = {
          blockBestProperties: row.blockBestProperties,
          blockTopInvestment: row.blockTopInvestment,
          blockRentVsBuy: row.blockRentVsBuy,
        };
      }
    } catch {
      seoProgrammatic = null;
    }
  }

  const fsBrowse = `/sell?city=${encodeURIComponent(q)}`;
  const bnBrowse = `/search/bnhub?location=${encodeURIComponent(q)}`;
  const regionLabel = growthCityRegion(slug) === "US" ? " · USA" : " · Canada";

  const heroTitle =
    intent === "buy"
      ? `Buy a home in ${city}`
      : intent === "rent"
        ? `Rent & stay in ${city}`
        : intent === "stays"
          ? `Short-term stays in ${city}`
          : intent === "investment"
            ? `Invest in ${city} real estate`
            : `Mortgages & pre-approval in ${city}`;

  const heroEyebrow =
    intent === "buy"
      ? "Homes & FSBO"
      : intent === "rent"
        ? "BNHub rentals"
        : intent === "stays"
          ? "BNHub stays"
          : intent === "investment"
            ? "Yields & acquisitions"
            : "Mortgage hub";

  const meshLinks = buildGrowthSeoMeshLinks(slug);
  const otherCities = otherGrowthCityLinks(slug);
  const inventoryCount = fsboRows.length + bnListings.length;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <GrowthSeoPageView intent={intent} citySlug={slug} pathVariant={pathVariant} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-white/10 bg-gradient-to-b from-black to-[#0B0B0B]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            {heroEyebrow}
            {regionLabel}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            {intent === "mortgage"
              ? `Compare options, get matched with experts, and use free tools tailored to ${city}.`
              : intent === "investment"
                ? `Stack FSBO deals, BNHub performance, and rent vs buy context — then validate with licensed pros.`
                : intent === "stays"
                  ? `Browse nightly stays with dates-first search, clear pricing on listings, and a simple path to book on BNHub.`
                  : `Discover curated listings, structured FAQs, and tools — built to scale from Canada to the US.`}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {intent === "mortgage" ? (
              <>
                <Link
                  href="/mortgage"
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  style={{ background: GOLD }}
                >
                  Get pre-approved
                </Link>
                <Link
                  href="/experts"
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
                >
                  Talk to an expert
                </Link>
                <Link
                  href="/evaluate"
                  className="rounded-xl border border-premium-gold/40 px-6 py-3 text-sm text-premium-gold hover:bg-premium-gold/10"
                >
                  Free mortgage estimate
                </Link>
              </>
            ) : intent === "investment" ? (
              <>
                <Link
                  href={fsBrowse}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  style={{ background: GOLD }}
                >
                  Browse FSBO inventory
                </Link>
                <Link
                  href="/tools/deal-analyzer"
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
                >
                  Deal analyzer
                </Link>
                <Link
                  href="/tools/roi-calculator"
                  className="rounded-xl border border-premium-gold/40 px-6 py-3 text-sm text-premium-gold hover:bg-premium-gold/10"
                >
                  ROI calculator
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={intent === "buy" ? fsBrowse : bnBrowse}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  style={{ background: GOLD }}
                >
                  {intent === "buy" ? "Browse homes" : "Browse stays"}
                </Link>
                <Link href="/evaluate" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium hover:bg-white/5">
                  Free estimate
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <CityAiMarketingSection slug={slug} intent={intent} city={city} inventoryCount={inventoryCount} />

      <CityGeneratedContentSection city={city} category={intent} />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <GrowthTrustStrip />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b} className="rounded-xl border border-white/10 bg-[#111] p-5">
              <span className="text-premium-gold" aria-hidden>
                ✓
              </span>
              <p className="mt-2 text-sm text-white/85">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Filters & search</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={bnBrowse}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-premium-gold/40"
            >
              BNHub — dates, guests, neighbourhood
            </Link>
            <Link
              href={fsBrowse}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-premium-gold/40"
            >
              FSBO — {city}
            </Link>
            <Link
              href={`/city/${slug}`}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-premium-gold/40"
            >
              City hub (map + mixed inventory)
            </Link>
          </div>
        </div>
      </section>

      {(intent === "buy" || intent === "investment") && fsboRows.length > 0 ? (
        <section className="border-t border-white/10 bg-black/50 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-bold text-white">FSBO & homes in {city}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {fsboRows.map((l) => {
                const imgs = Array.isArray(l.images) ? (l.images as string[]) : [];
                const hero = l.coverImage ?? imgs[0] ?? null;
                const price = l.priceCents ? `$${Math.round(l.priceCents / 100).toLocaleString()}` : "Price on request";
                return (
                  <ListingThumb
                    key={l.id}
                    src={hero}
                    alt={l.title}
                    href={`/sell/${l.id}`}
                    title={l.title}
                    subtitle={`${price} · ${l.bedrooms ?? "—"} br · ${l.city ?? city}`}
                  />
                );
              })}
            </div>
            <Link href={fsBrowse} className="mt-6 inline-block text-sm font-semibold text-premium-gold hover:underline">
              View all in {city} →
            </Link>
          </div>
        </section>
      ) : null}

      {(intent === "rent" || intent === "buy" || intent === "investment" || intent === "stays") &&
      bnListings.length > 0 ? (
        <section className="border-t border-white/10 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-bold text-white">
              {intent === "rent"
                ? "Short-term stays"
                : intent === "stays"
                  ? `Stays in ${city}`
                  : intent === "investment"
                    ? "BNHub nightly comps"
                    : "Featured stays nearby"}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bnListings.map((l) => (
                <ListingThumb
                  key={l.id}
                  src={firstBnhubPhoto(l.photos)}
                  alt={l.title ?? "Stay"}
                  href={`/bnhub/${l.listingCode || l.id}`}
                  title={l.title ?? "Stay"}
                  subtitle={`$${(l.nightPriceCents / 100).toFixed(0)}/night · ${l.city ?? ""}`}
                />
              ))}
            </div>
            <Link href={bnBrowse} className="mt-6 inline-block text-sm font-semibold text-premium-gold hover:underline">
              Open BNHub search →
            </Link>
          </div>
        </section>
      ) : null}

      {intent === "investment" && insights ? (
        <div className="border-t border-white/10 px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <CityInvestmentInsights data={insights} bnhubHref={bnBrowse} fsboHref={fsBrowse} />
          </div>
        </div>
      ) : null}

      {seoProgrammatic ? (
        <section className="border-t border-white/10 py-12">
          <div className="mx-auto max-w-6xl space-y-10 px-4">
            <article>
              <h2 className="text-xl font-bold text-premium-gold">Best properties in {city}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">{seoProgrammatic.blockBestProperties}</p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-premium-gold">Top investment areas in {city}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">{seoProgrammatic.blockTopInvestment}</p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-premium-gold">Rent vs buy in {city}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">{seoProgrammatic.blockRentVsBuy}</p>
            </article>
          </div>
        </section>
      ) : null}

      {intent !== "mortgage" ? <GrowthCityLeadCapture citySlug={slug} cityQuery={q} intent={intent} /> : null}

      <section className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-white">FAQ</h2>
          <dl className="mt-6 space-y-4">
            {faqs.map((f) => (
              <div key={f.question} className="rounded-xl border border-white/10 bg-[#111] p-4">
                <dt className="font-semibold text-premium-gold">{f.question}</dt>
                <dd className="mt-2 text-sm text-white/80">{f.answer}</dd>
              </div>
            ))}
          </dl>

          <nav className="mt-10 flex flex-wrap gap-2 text-sm" aria-label="Related city and intent pages">
            {meshLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-white/15 px-3 py-1 text-white/75 hover:border-premium-gold/40 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <nav className="mt-6 text-sm text-white/60" aria-label="Other cities">
            <span className="font-medium text-white/80">Other cities: </span>
            {otherCities.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? " · " : ""}
                <Link href={l.href} className="text-premium-gold hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </section>

      <GrowthTestimonialsStrip />
    </div>
  );
}
