import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { searchListingsPaginated } from "@/lib/bnhub/listings";
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
import { GrowthTestimonialsStrip, GrowthTrustStrip } from "@/components/growth/GrowthTrustStrip";

const GOLD = "#C9A646";

function firstBnhubPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  for (const p of photos) {
    if (typeof p === "string") return p;
  }
  return null;
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
}: {
  intent: CityIntentKind;
  cityParam: string;
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

  if (intent === "buy") {
    const [fs, bn] = await Promise.all([
      prisma.fsboListing.findMany({
        where: {
          AND: [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }, growthFsboWhereForSlug(slug)],
        },
        orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
        take: 8,
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
      searchListingsPaginated({ city: q, page: 1, limit: 4, sort: "newest" }),
    ]);
    fsboRows = fs;
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

  const fsBrowse = `/sell?city=${encodeURIComponent(q)}`;
  const bnBrowse = `/search/bnhub?location=${encodeURIComponent(q)}`;
  const regionLabel = growthCityRegion(slug) === "US" ? " · USA" : " · Canada";

  const heroTitle =
    intent === "buy"
      ? `Buy a home in ${city}`
      : intent === "rent"
        ? `Rent & stay in ${city}`
        : `Mortgages & pre-approval in ${city}`;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-white/10 bg-gradient-to-b from-black to-[#0B0B0B]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            {intent === "buy" ? "Homes & FSBO" : intent === "rent" ? "BNHub rentals" : "Mortgage hub"}
            {regionLabel}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            {intent === "mortgage"
              ? `Compare options, get matched with experts, and use free tools tailored to ${city}.`
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
                  className="rounded-xl border border-[#C9A646]/40 px-6 py-3 text-sm text-[#C9A646] hover:bg-[#C9A646]/10"
                >
                  Free mortgage estimate
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

      <section className="mx-auto max-w-6xl px-4 py-12">
        <GrowthTrustStrip />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b} className="rounded-xl border border-white/10 bg-[#111] p-5">
              <span className="text-[#C9A646]" aria-hidden>
                ✓
              </span>
              <p className="mt-2 text-sm text-white/85">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {intent === "buy" && fsboRows.length > 0 ? (
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
            <Link href={fsBrowse} className="mt-6 inline-block text-sm font-semibold text-[#C9A646] hover:underline">
              View all in {city} →
            </Link>
          </div>
        </section>
      ) : null}

      {(intent === "rent" || intent === "buy") && bnListings.length > 0 ? (
        <section className="border-t border-white/10 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-bold text-white">
              {intent === "rent" ? "Short-term stays" : "Featured stays nearby"}
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
            <Link href={bnBrowse} className="mt-6 inline-block text-sm font-semibold text-[#C9A646] hover:underline">
              Open BNHub search →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-white">FAQ</h2>
          <dl className="mt-6 space-y-4">
            {faqs.map((f) => (
              <div key={f.question} className="rounded-xl border border-white/10 bg-[#111] p-4">
                <dt className="font-semibold text-[#C9A646]">{f.question}</dt>
                <dd className="mt-2 text-sm text-white/80">{f.answer}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            <Link href="/blog" className="text-[#C9A646] hover:underline">
              Market guides (blog)
            </Link>
            <span className="text-white/30">|</span>
            <Link href={`/buy/${slug}`} className="text-white/70 hover:text-white">
              Buy in {city}
            </Link>
            <Link href={`/rent/${slug}`} className="text-white/70 hover:text-white">
              Rent in {city}
            </Link>
            <Link href={`/mortgage/${slug}`} className="text-white/70 hover:text-white">
              Mortgage in {city}
            </Link>
          </div>
        </div>
      </section>

      <GrowthTestimonialsStrip />
    </div>
  );
}
