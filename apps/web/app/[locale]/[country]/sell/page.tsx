import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { MvpNav } from "@/components/investment/MvpNav";
import TrustedBrokerCard from "@/components/fsbo/TrustedBrokerCard";
import { FsboCompareButton } from "@/components/compare/FsboCompareButton";
import { ConversionEducationStrip } from "@/components/marketing/ConversionEducationStrip";
import { SellFlowHints } from "@/components/marketing/SellFlowHints";
import { SellPageHero } from "@/components/marketing/SellPageHero";
import { SellPageLeadForm } from "@/components/fsbo/sell-page-lead-form";
import {
  CONTACT_EMAIL,
  getBrokerPhoneDisplay,
  getBrokerTelHref,
  getOfficeAddress,
  getSupportPhoneDisplay,
  getSupportTelHref,
} from "@/lib/config/contact";
import { getPublicContactMailto } from "@/lib/marketing-contact";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { prisma } from "@/lib/db";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { getFsboPremiumPublishPriceCents, getFsboPublishPriceCents } from "@/lib/fsbo/constants";
import { computeListingInvestmentRecommendation } from "@/lib/fsbo/listing-investment-recommendation";
import { ListingInvestmentRecommendationChip } from "@/components/fsbo/ListingInvestmentRecommendationCard";
import { getListingTransactionFlagsForListings } from "@/lib/fsbo/listing-transaction-flag";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";
import { listingsMapSearchUrl } from "@/lib/search/public-map-search-urls";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sell FSBO | Licensed real estate broker Montreal & Quebec",
  description:
    "Sell your property yourself or work with Mohamed Al Mashhour, OACIQ-licensed residential real estate broker (J1321). FREE consultation & property evaluation. Montreal, Quebec.",
  keywords: [
    "real estate broker Montreal",
    "sell property Quebec",
    "OACIQ broker",
    "FSBO",
    `licensed broker ${PLATFORM_CARREFOUR_NAME}`,
  ],
};

const GOLD = "var(--color-premium-gold)";

const BENEFITS = [
  {
    title: "No commission",
    body: "Keep more of your sale — no traditional listing commission on the FSBO path.",
    icon: IconPercent,
  },
  {
    title: "Full control",
    body: "You set price, showings, and negotiation terms on your timeline.",
    icon: IconControl,
  },
  {
    title: "Direct buyers",
    body: `Serious inquiries reach you first — clear, direct contact through ${PLATFORM_CARREFOUR_NAME}.`,
    icon: IconUsers,
  },
  {
    title: "Flexible selling process",
    body: "Set your pace — adjust pricing and strategy as the market responds.",
    icon: IconZap,
  },
] as const;

function IconPercent(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 7h.01M12 3v1m0 16v1m8-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconControl(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}
function IconUsers(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconZap(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

type SearchParams = {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
};

export default async function FsboSellPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const officeAddress = getOfficeAddress();
  const city = sp.city?.trim();
  const minPrice = sp.minPrice;
  const maxPrice = sp.maxPrice;
  const bedrooms = sp.bedrooms;

  const and: Prisma.FsboListingWhereInput[] = [
    { status: "ACTIVE" },
    { moderationStatus: "APPROVED" },
  ];
  if (city) and.push(fsboCityWhereFromParam(city));
  if (minPrice) {
    const n = parseInt(minPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { gte: n * 100 } });
  }
  if (maxPrice) {
    const n = parseInt(maxPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { lte: n * 100 } });
  }
  if (bedrooms) {
    const n = parseInt(bedrooms, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ bedrooms: { gte: n } });
  }

  const listings = await prisma.fsboListing.findMany({
    where: { AND: and },
    orderBy: [
      { featuredUntil: { sort: "desc", nulls: "last" } },
      { updatedAt: "desc" },
    ],
    take: 60,
    select: {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      bedrooms: true,
      surfaceSqft: true,
      propertyType: true,
      riskScore: true,
      trustScore: true,
      images: true,
      coverImage: true,
      featuredUntil: true,
      publishPlan: true,
      status: true,
    },
  });
  const transactionFlags = await getListingTransactionFlagsForListings(
    listings.map((listing) => ({ id: listing.id, status: listing.status }))
  );

  const fsboBasicCents = getFsboPublishPriceCents();
  const fsboPremiumCents = getFsboPremiumPublishPriceCents();
  const basicPrice = (fsboBasicCents / 100).toLocaleString(undefined, { style: "currency", currency: "CAD" });
  const premiumPrice = (fsboPremiumCents / 100).toLocaleString(undefined, { style: "currency", currency: "CAD" });
  /* eslint-disable react-hooks/purity -- single snapshot per request for “featured” badge */
  const featuredNowMs = Date.now();
  /* eslint-enable react-hooks/purity */

  return (
    <>
      <MvpNav variant="live" />
      <main className="min-h-screen bg-[#0B0B0B] text-white">
      {/* 1. Hero — coastal luxury lifestyle background + glass “tablet” panel */}
      <SellPageHero>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            FSBO · Sell yourself
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Sell your property yourself
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#B3B3B3]">
            No broker fees. Full control. Direct contact with buyers.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/sell/create"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(var(--premium-gold-channels) / 0.25)]"
              style={{ backgroundColor: GOLD }}
            >
              Create your listing
            </Link>
            <a
              href="#sell-consultation"
              className="inline-flex items-center justify-center rounded-xl border-2 border-premium-gold px-8 py-3.5 text-sm font-semibold text-premium-gold transition hover:-translate-y-0.5 hover:bg-premium-gold/10"
            >
              Talk to a broker
            </a>
          </div>
          <p className="mx-auto mt-10 max-w-xl text-sm text-[#B3B3B3]/90">
            Trusted by property owners for fast and secure transactions
          </p>
          <p className="sr-only">
            OACIQ licensed real estate broker Montreal. Sell property Quebec with legal protection and full transaction
            guidance.
          </p>
          <SellFlowHints />
        </div>
      </SellPageHero>

      {/* FSBO benefits */}
      <section className="border-b border-white/10 px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="fsbo-benefits-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="fsbo-benefits-heading" className="sr-only">
            FSBO benefits
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-premium-gold/35 hover:shadow-[0_16px_40px_rgb(var(--premium-gold-channels) / 0.08)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-premium-gold/15 text-premium-gold">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#B3B3B3]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConversionEducationStrip variant="sell" />

      {/* Pricing plans */}
      <section
        className="border-b border-white/10 bg-[#121212] px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="fsbo-pricing-heading"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Pricing
          </p>
          <h2 id="fsbo-pricing-heading" className="mt-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Choose your selling plan
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#B3B3B3]">
            Create your listing first, pick a plan on the form, then complete secure checkout to go live.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-white/15 bg-[#0B0B0B] p-8 shadow-lg transition hover:border-premium-gold/45">
              <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Basic</p>
              <p className="mt-3 text-4xl font-bold text-white">{basicPrice}</p>
              <p className="mt-2 text-sm text-[#B3B3B3]">Standard FSBO listing in the directory.</p>
              <Link
                href="/sell/create?plan=basic"
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Start with Basic
              </Link>
            </div>
            <div
              className="relative rounded-2xl border-2 border-premium-gold/50 bg-gradient-to-br from-[#1a1508] to-[#0B0B0B] p-8 shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.12)] transition hover:border-premium-gold"
            >
              <span className="absolute right-4 top-4 rounded-full bg-premium-gold/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-premium-gold">
                Best visibility
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Premium</p>
              <p className="mt-3 text-4xl font-bold text-white">{premiumPrice}</p>
              <p className="mt-2 text-sm text-[#B3B3B3]">Featured placement — highlighted in search & browse results.</p>
              <Link
                href="/sell/create?plan=premium"
                className="mt-6 inline-flex w-full justify-center rounded-xl py-3 text-sm font-bold text-[#0B0B0B] hover:opacity-95"
                style={{ backgroundColor: GOLD }}
              >
                Start with Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How we make money */}
      <section className="border-b border-white/10 bg-[#0B0B0B] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="how-we-make-money">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#121212] p-8">
          <h2 id="how-we-make-money" className="text-lg font-semibold text-white">
            How we make money
          </h2>
          <p className="mt-2 text-sm text-[#B3B3B3]">
            We believe in simple, published economics — no surprise deductions from your sale price on FSBO.
          </p>
          <ul className="mt-6 space-y-4 text-sm text-[#B3B3B3]">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" aria-hidden />
              <span>
                <strong className="text-white">BNHUB (stays):</strong> guests pay through Stripe; we retain a{" "}
                <strong className="text-premium-gold">15%</strong> platform commission on each booking (configurable). The rest
                is transferred to hosts via Stripe Connect.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" aria-hidden />
              <span>
                <strong className="text-white">FSBO (sell):</strong> you pay a{" "}
                <strong className="text-premium-gold">one-time flat fee</strong> ({basicPrice} standard, {premiumPrice}{" "}
                featured) to publish; <strong className="text-white">the platform keeps 100% of that listing fee</strong>{" "}
                — it is not a commission on your home price.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" aria-hidden />
              <span>
                <strong className="text-white">Brokers & deals:</strong> traditional brokerage and closing flows may use
                separate agreements; we do not hide booking or FSBO fees in small print.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Create listing CTA */}
      <section className="border-y border-white/10 bg-[#121212] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <p className="text-sm text-[#B3B3B3]">
            Ready to go live? Publish once, reach verified buyers on {PLATFORM_CARREFOUR_NAME}.
          </p>
          <Link
            href="/sell/create"
            className="inline-flex w-full max-w-md items-center justify-center rounded-xl px-8 py-4 text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:scale-[1.02] sm:w-auto"
            style={{ backgroundColor: GOLD }}
          >
            Create your listing
          </Link>
          <Link href="/sell/learn" className="text-sm font-medium text-premium-gold hover:underline">
            How FSBO works →
          </Link>
        </div>
      </section>

      {/* 4–5. Divider + Trusted broker */}
      <section className="px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="trusted-broker-heading">
        <div className="mx-auto max-w-5xl">
          <h2
            id="trusted-broker-heading"
            className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-premium-gold"
          >
            Or work with a trusted broker
          </h2>
          <div className="mt-8">
            <TrustedBrokerCard
              name="Mohamed Al Mashhour"
              title="Residential Real Estate Broker"
              licenseNumber="J1321"
              image="/images/broker.jpg"
              email={CONTACT_EMAIL}
              consultationHref="#sell-consultation"
            />
          </div>
        </div>
      </section>

      {/* Compare FSBO vs broker */}
      <section className="border-y border-white/10 bg-[#121212] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Not sure yet?</p>
          <h2 className="font-serif mt-3 text-2xl font-semibold text-white sm:text-3xl">
            Sell by yourself vs work with a broker
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#B3B3B3]">
            See a side-by-side comparison — FREE consultation available, no obligation.
          </p>
          <Link
            href="/sell/compare"
            className="btn-primary mt-8 inline-flex rounded-full px-10 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
          >
            Compare options →
          </Link>
        </div>
      </section>

      {/* Contact / lead capture */}
      <section
        id="sell-consultation"
        className="scroll-mt-24 border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 sm:scroll-mt-28 lg:px-8"
        aria-labelledby="sell-consultation-heading"
      >
        <div className="mx-auto max-w-2xl">
          <h2 id="sell-consultation-heading" className="text-center text-2xl font-bold text-white sm:text-3xl">
            Talk to a licensed broker
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[#B3B3B3]">
            Request your <span className="font-semibold text-premium-gold">FREE</span> consultation — FSBO coaching or
            full brokerage. No obligation.
          </p>
          <div className="mt-8">
            <SellPageLeadForm />
          </div>
        </div>
      </section>

      {/* 7. Footer info (mission + contact) */}
      <section className="border-t border-white/10 bg-[#121212] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
              To simplify real estate, rentals, and investment through one premium platform — with transparent tools and
              optional licensed guidance when you want it.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#B3B3B3]">
              <li>
                <a href={getPublicContactMailto()} className="font-medium text-white hover:text-premium-gold">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Support</span>
                <br />
                <a href={getSupportTelHref()} className="font-medium text-white hover:text-premium-gold">
                  {getSupportPhoneDisplay()}
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Broker</span>
                <br />
                <a href={getBrokerTelHref()} className="font-medium text-white hover:text-premium-gold">
                  {getBrokerPhoneDisplay()}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-[#B3B3B3]/70">{officeAddress}</p>
          </div>
        </div>

        {/* Optional testimonials placeholder */}
        <div className="mx-auto mt-12 max-w-6xl rounded-2xl border border-dashed border-white/15 bg-[#0B0B0B]/60 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/80">Testimonials</p>
          <p className="mt-2 text-sm text-[#B3B3B3]">Owner stories coming soon — we&apos;re collecting verified reviews.</p>
        </div>
      </section>

      {/* Browse FSBO listings (preserved) */}
      <section id="browse-listings" className="border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Directory</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Browse FSBO listings</h2>
              <p className="mt-1 text-sm text-[#B3B3B3]">Private sale properties — contact owners directly.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={listingsMapSearchUrl({ city: city?.trim() || undefined })}
                className="inline-flex justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Search on map
              </Link>
              <Link
                href="/sell/create"
                className="inline-flex justify-center rounded-xl bg-premium-gold px-5 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
              >
                Create your listing
              </Link>
            </div>
          </div>

          <form
            className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4 sm:grid-cols-2 lg:grid-cols-4"
            method="get"
          >
            <div>
              <label className="block text-xs text-[#B3B3B3]">City</label>
              <input
                name="city"
                defaultValue={city ?? ""}
                placeholder="Montreal"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#B3B3B3]">Min price ($)</label>
              <input
                name="minPrice"
                type="number"
                min={0}
                defaultValue={minPrice ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#B3B3B3]">Max price ($)</label>
              <input
                name="maxPrice"
                type="number"
                min={0}
                defaultValue={maxPrice ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#B3B3B3]">Min bedrooms</label>
              <input
                name="bedrooms"
                type="number"
                min={0}
                defaultValue={bedrooms ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Apply filters
              </button>
              <Link
                href="/sell"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-[#B3B3B3] hover:text-white"
              >
                Clear
              </Link>
            </div>
          </form>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const img = l.coverImage ?? l.images[0];
              const isFeatured =
                l.publishPlan === "premium" &&
                l.featuredUntil &&
                l.featuredUntil.getTime() > featuredNowMs;
              const investmentRec = computeListingInvestmentRecommendation({
                riskScore: l.riskScore,
                trustScore: l.trustScore,
                priceCents: l.priceCents,
                surfaceSqft: l.surfaceSqft,
                propertyType: l.propertyType,
              });
              return (
                <article
                  key={l.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-lg transition hover:border-premium-gold/40"
                >
                  <Link href={`/sell/${l.id}`} className="relative block aspect-[4/3] bg-[#1a1a1a]">
                    {isFeatured ? (
                      <span className="absolute left-2 top-2 z-10 rounded-md bg-premium-gold px-2 py-0.5 text-[10px] font-bold uppercase text-[#0B0B0B]">
                        Featured
                      </span>
                    ) : null}
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
                    )}
                  </Link>
                  <div className="p-4">
                    {transactionFlags.get(l.id) ? (
                      <div className="mb-3">
                        <ListingTransactionFlag flag={transactionFlags.get(l.id)!} />
                      </div>
                    ) : null}
                    <h3 className="line-clamp-2 font-semibold text-white">
                      <Link href={`/sell/${l.id}`} className="hover:text-premium-gold">
                        {l.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-[#B3B3B3]">{l.city}</p>
                    <p className="mt-2 text-lg font-bold text-premium-gold">
                      ${(l.priceCents / 100).toLocaleString()}
                      {l.bedrooms != null ? (
                        <span className="ml-2 text-sm font-normal text-[#B3B3B3]">{l.bedrooms} bd</span>
                      ) : null}
                    </p>
                    {investmentRec ? (
                      <div className="mt-2">
                        <ListingInvestmentRecommendationChip recommendation={investmentRec} />
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <FsboCompareButton listingId={l.id} className="w-full sm:flex-1" />
                      <Link
                        href={`/sell/${l.id}#contact`}
                        className="inline-flex w-full flex-1 items-center justify-center rounded-xl border border-premium-gold/50 py-2.5 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
                      >
                        Contact owner
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {listings.length === 0 ? (
            <div className="mt-12">
              <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
                <>
                  <Link
                    href="/sell"
                    className="lecipm-cta-gold-solid inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm"
                  >
                    Reset filters
                  </Link>
                  <Link
                    href="/explore"
                    className="lecipm-cta-gold-outline inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm"
                  >
                    Browse featured listings
                  </Link>
                </>
              </EmptyState>
            </div>
          ) : null}
        </div>
      </section>
    </main>
    </>
  );
}
