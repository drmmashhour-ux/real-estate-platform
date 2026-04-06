import type { Metadata } from "next";
import type { ReactNode } from "react";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { QuebecCanadaFlagsPair } from "@/components/brand/QuebecCanadaFlagsPair";
import {
  getPublicContactEmail,
  getPublicContactMailto,
  getPublicSocialLinks,
} from "@/lib/marketing-contact";
import { PLATFORM_MODULES } from "@/lib/platform-modules";
import { getOfficeAddress } from "@/lib/config/contact";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { VerifiedBrokerBadge } from "@/components/ui/VerifiedBrokerBadge";
import { getGuestId } from "@/lib/auth/session";
import { getFeedbackRatingSummary } from "@/lib/feedback/rating-summary";
import { prisma } from "@/lib/db";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { getStaysRecommendedForYou, type SimilarListingCard } from "@/lib/recommendations";
import { getFeaturedTestimonialsForHome } from "@/lib/marketing/trust-content";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_NAME,
  platformBrandGoldTextClass,
  platformCarrefourGoldGradientClass,
} from "@/lib/brand/platform";
import { INVESTMENT_HUB_FOCUS, LAUNCH_LIGHT_HOME_FETCH } from "@/lib/product-focus";
import { LeadCTA } from "@/components/ui/LeadCTA";
import { MvpNav } from "@/components/investment/MvpNav";
import { TrackedAnalyzeCta } from "@/components/marketing/TrackedAnalyzeCta";
import { ConversionSteps, TrustBadgesRow } from "@/components/marketing/ConversionFunnelBlocks";
import { InvestmentGrowthHome } from "@/components/marketing/InvestmentGrowthHome";
import { HomeHeroFeatureCards } from "@/components/home/HomeHeroFeatureCards";
import { LogoCipmHero } from "@/components/brand/LogoCipmHero";

const ContinueInvestmentBannerLazy = nextDynamic(
  () => import("@/components/marketing/ContinueInvestmentBanner").then((m) => m.ContinueInvestmentBanner),
  { loading: () => null }
);

const MainSearchBarLazy = nextDynamic(
  () => import("@/components/search/MainSearchBar").then((m) => m.MainSearchBar),
  {
    loading: () => (
      <div className="mx-auto h-[72px] w-full max-w-4xl rounded-2xl bg-white/[0.04] animate-pulse" aria-hidden />
    ),
  }
);

const StaysRecommendationGridLazy = nextDynamic(
  () => import("@/components/recommendations/StaysRecommendationGrid").then((m) => m.StaysRecommendationGrid),
  {
    loading: () => (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-7 w-56 animate-pulse rounded bg-white/10" aria-hidden />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" aria-hidden />
          ))}
        </div>
      </div>
    ),
  }
);

const TrustCredibilitySectionsLazy = nextDynamic(
  () => import("@/components/marketing/TrustCredibilitySections").then((m) => m.TrustCredibilitySections),
  { loading: () => <div className="min-h-[100px] border-t border-white/10 bg-[#0B0B0B]" aria-hidden /> }
);

const LecipmPlatformExplainSectionsLazy = nextDynamic(
  () =>
    import("@/components/marketing/LecipmPlatformExplainSections").then((m) => m.LecipmPlatformExplainSections),
  { loading: () => <div className="min-h-[160px] w-full animate-pulse rounded-2xl bg-white/[0.03]" aria-hidden /> }
);

const EarlyAccessCaptureFormLazy = nextDynamic(
  () => import("@/components/marketing/EarlyAccessCaptureForm").then((m) => m.EarlyAccessCaptureForm),
  {
    loading: () => <div className="h-36 animate-pulse rounded-2xl bg-white/[0.04]" aria-hidden />,
  }
);

const GOLD = "var(--color-premium-gold)";
const SURFACE = "#121212";

/** Hero primary CTAs — identical gold pill footprint (analyzer + dashboard). */
const HERO_GOLD_BASE =
  "inline-flex w-full min-h-[88px] rounded-full bg-premium-gold px-6 py-4 text-center shadow-[0_16px_48px_rgb(var(--premium-gold-channels) / 0.38)] ring-2 ring-premium-gold/80 ring-offset-2 ring-offset-[#0B0B0B] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:min-h-[96px] sm:px-10";
const HERO_GOLD_SINGLE = `${HERO_GOLD_BASE} items-center justify-center text-base font-extrabold tracking-wide text-[#0B0B0B]`;
/** Smaller matching gold pills (Sign up / Sign in under View Dashboard). */
const HERO_GOLD_MINI =
  "inline-flex min-h-[44px] min-w-[7.5rem] flex-1 items-center justify-center rounded-full bg-premium-gold px-5 text-sm font-semibold text-[#0B0B0B] shadow-[0_8px_24px_rgb(var(--premium-gold-channels) / 0.28)] ring-2 ring-premium-gold/75 ring-offset-2 ring-offset-[#0B0B0B] transition hover:brightness-105 sm:min-h-[48px] sm:min-w-[8.5rem] sm:text-base";

/** Avoid SSG hanging on self-fetch when no dev server is up during `next build`. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: PLATFORM_DEFAULT_SITE_TITLE },
  description: PLATFORM_DEFAULT_DESCRIPTION,
  keywords: [
    "LECIPM",
    "real estate investment platform",
    "AI real estate analysis",
    "Airbnb vs long-term rental",
    "Montreal real estate",
    "ROI analysis",
    "portfolio tracking",
    "Quebec real estate platform",
    "immobilier investissement",
    "BNHub Montreal",
  ],
  openGraph: {
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

const FEATURED_FETCH_MS = 8_000;

async function getFeaturedProjects() {
  if (!process.env.DATABASE_URL) return [];
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getPublicAppUrl();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FEATURED_FETCH_MS);
  try {
    const res = await fetch(`${base}/api/projects?featuredOnly=true`, {
      next: { revalidate: 60 },
      signal: ac.signal,
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function getFeaturedListings() {
  if (!process.env.DATABASE_URL) return [];
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getPublicAppUrl();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FEATURED_FETCH_MS);
  try {
    const res = await fetch(`${base}/api/bnhub/search?limit=12&page=1`, {
      next: { revalidate: 60 },
      signal: ac.signal,
    });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function IconStay() {
  return (
    <svg className="h-6 w-6 text-premium-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconBuy() {
  return (
    <svg className="h-6 w-6 text-premium-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconInvest() {
  return (
    <svg className="h-6 w-6 text-premium-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="h-6 w-6 text-premium-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function quickActions(isLoggedIn: boolean) {
  return [
    { title: "Rent stays", href: "/search/bnhub", sub: "Nightly & short-term", Icon: IconStay },
    { title: "Buy property", href: "/dashboard/real-estate", sub: "Homes & long-term", Icon: IconBuy },
    { title: "Invest", href: "/analyze#analyzer", sub: "Analyze deals & ROI", Icon: IconInvest },
    {
      title: "Portfolio",
      href: isLoggedIn ? "/dashboard" : "/demo/dashboard",
      sub: isLoggedIn ? "Saved deals" : "Demo portfolio",
      Icon: IconList,
    },
  ] as const;
}

type HStripProps = {
  title: string;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel?: string;
  children: React.ReactNode;
};

function HorizontalStrip({ title, subtitle, viewAllHref, viewAllLabel = "View all", children }: HStripProps) {
  return (
    <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-xl text-[#B3B3B3]">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="btn-secondary shrink-0 rounded-full px-5 py-2.5 text-sm"
          >
            {viewAllLabel}
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-0 sm:px-0">
          {children}
        </div>
      </div>
    </section>
  );
}

const LUXURY_PLACEHOLDER = [
  { id: "l1", title: "Sky Residence Collection", city: "Montreal", price: "From $2.4M", img: "https://images.pexels.com/photos/32870/pexels-photo.jpg?auto=compress&w=800" },
  { id: "l2", title: "Harbour Penthouse", city: "Laval", price: "From $1.8M", img: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&w=800" },
  { id: "l3", title: "Estate Vineyard Lane", city: "Laurentians", price: "From $3.1M", img: "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&w=800" },
  { id: "l4", title: "Private Summit Lodge", city: "Quebec City", price: "From $1.2M", img: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&w=800" },
];

const BROKER_CARDS = [
  { name: "Institutional desk", region: "Greater Montreal", href: "/broker" },
  { name: "Luxury advisory", region: "Premium tier", href: "/broker" },
  { name: "Investment sales", region: "Multi-res & land", href: "/dashboard/broker" },
  { name: "Relocation & expat", region: "Concierge", href: "/auth/signup" },
];

function LocalImageSection({
  id,
  title,
  body,
  imageSrc,
  imageAlt,
}: {
  id: string;
  title: string;
  body: ReactNode;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-[380px] items-center border-t border-white/10 sm:min-h-[440px] lg:min-h-[480px]"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_50%,rgb(var(--premium-gold-channels) / 0.1),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/95 sm:text-lg">{body}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          Montreal · Laval · Greater Québec
        </p>
      </div>
    </section>
  );
}

async function loadHomeTestimonials() {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await getFeaturedTestimonialsForHome(3);
  } catch {
    return [];
  }
}

function toSimilarCardsFromFeatured(
  rows: Array<{
    id: string;
    title?: string;
    city?: string;
    nightPriceCents?: number;
    photos?: string[] | unknown;
  }>
): SimilarListingCard[] {
  return rows.slice(0, 6).map((item) => {
    const photos = Array.isArray(item.photos)
      ? item.photos.filter((p): p is string => typeof p === "string")
      : [];
    return {
      id: String(item.id),
      listingCode: String(item.id),
      title: item.title || "Featured stay",
      city: item.city || "Quebec",
      country: "Canada",
      beds: 2,
      baths: 1,
      nightPriceCents: item.nightPriceCents ?? 18500,
      propertyType: "Condo",
      coverUrl: photos[0] ?? null,
    };
  });
}

export default async function HomePage() {
  const officeAddress = getOfficeAddress();
  const lightHome = LAUNCH_LIGHT_HOME_FETCH && INVESTMENT_HUB_FOCUS;
  const [featuredProjects, featuredListings, guestId, testimonials, feedbackSummary] = await Promise.all([
    lightHome ? Promise.resolve([] as Awaited<ReturnType<typeof getFeaturedProjects>>) : getFeaturedProjects(),
    lightHome ? Promise.resolve([] as Awaited<ReturnType<typeof getFeaturedListings>>) : getFeaturedListings(),
    getGuestId(),
    lightHome ? Promise.resolve([] as Awaited<ReturnType<typeof loadHomeTestimonials>>) : loadHomeTestimonials(),
    getFeedbackRatingSummary(),
  ]);
  const homepageRecos = lightHome ? [] : await getStaysRecommendedForYou(guestId, 6);

  /** Session cookie holds authenticated user id — skip DB on homepage for faster TTFB. */
  const isLoggedIn = Boolean(guestId);

  const social = getPublicSocialLinks();
  const socialEntries: Array<[string, string, string]> = [];
  if (social.linkedin) socialEntries.push(["linkedin", "LinkedIn", social.linkedin]);
  if (social.instagram) socialEntries.push(["instagram", "Instagram", social.instagram]);
  if (social.x) socialEntries.push(["x", "X", social.x]);

  const displayListings =
    featuredListings.length >= 4
    ? featuredListings
    : [
        {
          id: "1",
          title: "Waterfront Villa, Palm District",
          city: "Montreal",
          nightPriceCents: 18500,
          photos: ["https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800"],
        },
        {
          id: "2",
          title: "City Center Loft",
          city: "Laval",
          nightPriceCents: 12000,
          photos: ["https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800"],
        },
        {
          id: "3",
          title: "Cozy Cabin by the Lake",
          city: "Quebec City",
          nightPriceCents: 9500,
          photos: ["https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"],
        },
        {
          id: "4",
          title: "Downtown Apartment",
          city: "Toronto",
          nightPriceCents: 14000,
          photos: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800"],
        },
      ];

  const recoItems =
    homepageRecos.length > 0 ? homepageRecos : toSimilarCardsFromFeatured(displayListings);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white antialiased">
      <div className="relative z-10 border-b border-emerald-500/25 bg-[#0f1714]/95 px-4 py-2.5 text-center text-sm text-emerald-50 sm:text-[15px]">
        <span className="font-semibold text-emerald-300">Get instant analysis + connect with a verified broker</span>
        <span className="text-emerald-200/50"> · </span>
        <span className="text-emerald-100/85">Early access — Québec &amp; Ontario investors</span>
      </div>
      <MvpNav variant={isLoggedIn ? "live" : "demo"} />
      <ContinueInvestmentBannerLazy />
      <InvestmentGrowthHome isLoggedIn={isLoggedIn} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0B] px-4 pb-24 pt-10 text-center sm:px-6 sm:pb-28 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgb(var(--premium-gold-channels) / 0.16),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgb(var(--premium-gold-channels) / 0.1),transparent)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-5xl page-enter">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-2 text-center">
            <LogoCipmHero />
            <p className="mt-5 max-w-lg text-xs font-semibold uppercase leading-snug tracking-[0.2em] text-brand-gold sm:text-sm md:text-[15px]">
              Real Estate Investment Intelligence Platform
            </p>
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl px-2 text-2xl font-semibold leading-[1.15] tracking-tight text-white/95 sm:text-4xl md:text-5xl">
            Analyze your real estate deal in seconds
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm">
            <span className={`font-serif ${platformCarrefourGoldGradientClass}`}>{PLATFORM_CARREFOUR_NAME}</span>
            <span className="text-[#9CA3AF]"> · Québec</span>
          </p>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm font-medium leading-relaxed text-[#B8B8B8] sm:text-base">
            AI-powered ROI, cash flow, and financing paths — built for serious investors
          </p>
          {feedbackSummary && feedbackSummary.count > 0 ? (
            <p className="mx-auto mt-4 text-center text-sm font-semibold text-premium-gold">
              ⭐ {feedbackSummary.average.toFixed(1)}/5 from users
            </p>
          ) : null}
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-[#C4C4C4] sm:text-xl">
            Compare long-term vs short-term, see cash flow, and unlock broker support when you’re ready
          </p>
          <div className="mx-auto mt-8 w-full max-w-4xl">
            <TrustBadgesRow />
          </div>
          <div className="mx-auto mt-8 w-full max-w-5xl px-1">
            <ConversionSteps />
          </div>
          <div className="mx-auto mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:max-w-4xl sm:grid-cols-2 sm:gap-5 sm:items-stretch">
            <div className="flex min-w-0 flex-col items-center gap-2.5">
              <TrackedAnalyzeCta href="/analyze#analyzer" label="home_start_free" className={HERO_GOLD_SINGLE}>
                Start analyzing now
              </TrackedAnalyzeCta>
              <p className="w-full text-center text-xs leading-relaxed text-[#9CA3AF]">
                No signup required
                <span className="text-[#6B7280]"> · </span>
                Takes less than 30 seconds
              </p>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2.5">
              {isLoggedIn ? (
                <Link href="/dashboard" className={HERO_GOLD_SINGLE}>
                  View Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/demo/dashboard" className={HERO_GOLD_SINGLE}>
                    View Dashboard
                  </Link>
                  <div className="mx-auto flex w-full max-w-[20rem] flex-row items-stretch justify-center gap-3 px-1 sm:max-w-md">
                    <Link href="/auth/signup" className={HERO_GOLD_MINI}>
                      Sign up
                    </Link>
                    <Link href="/auth/login?next=/dashboard" className={HERO_GOLD_MINI}>
                      Sign in
                    </Link>
                  </div>
                </>
              )}
              {!isLoggedIn ? (
                <p className="w-full text-center text-[11px] leading-relaxed text-[#9CA3AF]">
                  <span className="text-[#6B7280]">Mortgage broker: </span>
                  <Link href="/auth/signup-broker" className="font-semibold text-premium-gold hover:underline">
                    Sign up
                  </Link>
                  <span className="text-[#6B7280]"> · </span>
                  <Link
                    href="/auth/login?next=/broker/complete-profile"
                    className="font-semibold text-premium-gold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
          <HomeHeroFeatureCards isLoggedIn={isLoggedIn} />

          <section
            className="mx-auto mt-12 max-w-5xl rounded-2xl border border-white/10 bg-[#121212]/60 px-6 py-10 text-center sm:px-10"
            aria-labelledby="social-proof-heading"
          >
            <h2 id="social-proof-heading" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Used by investors
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#9CA3AF]">
              A growing early-access community testing the analyzer — illustrative numbers; always verify with your own diligence.
            </p>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { t: "Québec & Ontario", d: "Early users" },
                { t: "Side-by-side strategies", d: "Long-term vs short-term" },
                { t: "Portfolio pilots", d: "Saved deals" },
              ].map((row) => (
                <li
                  key={row.t}
                  className="min-w-[140px] rounded-xl border border-white/10 bg-[#0B0B0B]/90 px-4 py-3 text-left shadow-inner"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{row.t}</p>
                  <p className="mt-1 text-xs text-[#737373]">{row.d}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[#6B7280]">Named testimonials and logos — coming soon.</p>
          </section>

          <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#121212]/80 px-5 py-6 text-left sm:px-8">
            <EarlyAccessCaptureFormLazy source="homepage" />
          </div>

          {!INVESTMENT_HUB_FOCUS ? (
            <>
              <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/real-estate"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-[#E5E5E5] transition hover:border-premium-gold/40 hover:text-white"
                >
                  Buy
                </Link>
                <Link
                  href="/sell"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-[#E5E5E5] transition hover:border-premium-gold/40 hover:text-white"
                >
                  Sell
                </Link>
                <Link href="/search/bnhub" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-[#E5E5E5] transition hover:border-premium-gold/40 hover:text-white">
                  Rent stays
                </Link>
                <Link
                  href="/evaluate"
                  className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-5 py-2.5 text-xs font-semibold text-premium-gold transition hover:bg-premium-gold/15"
                >
                  Free evaluation
                </Link>
              </div>
              <div className="mb-6 mt-12 flex flex-wrap items-center justify-center gap-2">
                <VerifiedBrokerBadge />
                <span
                  className="rounded-full border border-premium-gold/30 px-3 py-1 text-xs font-medium text-premium-gold"
                  style={{ backgroundColor: `${SURFACE}` }}
                >
                  Secure payments · Stripe
                </span>
              </div>
              <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/search/bnhub"
                  className="inline-flex items-center justify-center rounded-full px-10 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:brightness-110"
                  style={{ backgroundColor: GOLD, boxShadow: "0 12px 40px rgb(var(--premium-gold-channels) / 0.25)" }}
                >
                  Explore BNHub stays
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur hover:border-premium-gold/50"
                >
                  Open your account
                </Link>
              </div>
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/mortgage"
                  className="rounded-full border border-premium-gold/45 bg-[#121212]/90 px-5 py-2 text-xs font-bold text-premium-gold hover:bg-premium-gold/10"
                >
                  Get pre-approved FREE
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-semibold text-white hover:border-premium-gold/50"
                >
                  Talk to an expert
                </Link>
                <Link
                  href="/properties"
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-semibold text-white hover:border-premium-gold/50"
                >
                  Find your property
                </Link>
              </div>
              <p className="mx-auto mt-3 max-w-2xl text-center text-xs font-medium text-premium-gold/95">
                FREE mortgage help · FREE consultation · FREE home evaluation — no obligation.
              </p>
              <div className="mx-auto mt-10 w-full max-w-4xl">
                <MainSearchBarLazy />
              </div>
            </>
          ) : null}

          {/* Quick actions */}
          <div
            className={`mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 ${
              INVESTMENT_HUB_FOCUS ? "lg:mx-auto lg:max-w-2xl lg:grid-cols-2" : "lg:grid-cols-4"
            }`}
          >
            {(INVESTMENT_HUB_FOCUS
              ? quickActions(isLoggedIn).filter((a) => a.title === "Invest" || a.title === "Portfolio")
              : quickActions(isLoggedIn)
            ).map(({ title, href, sub, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-premium-gold/45 hover:shadow-[0_16px_40px_rgb(var(--premium-gold-channels) / 0.12)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-premium-gold/10 transition group-hover:bg-premium-gold/20">
                  <Icon />
                </span>
                <span>
                  <span className="block font-semibold text-white group-hover:text-premium-gold">{title}</span>
                  <span className="mt-0.5 block text-xs text-[#B3B3B3]">{sub}</span>
                </span>
              </Link>
            ))}
          </div>

          {/* LECIPM explanation + how it works + FAQ */}
          <div className="mx-auto mt-20 w-full max-w-5xl border-t border-white/10 pt-16 text-left">
            <LecipmPlatformExplainSectionsLazy accent="gold" showAboutLink />
          </div>

          {/* Value proposition */}
          <div className="mx-auto mt-20 w-full max-w-5xl text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Why investors use this platform</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Value proposition</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Data-driven decisions",
                  desc: "Transparent numbers and scenario modeling so you defend every line item.",
                },
                {
                  title: "Market insights",
                  desc: "Benchmarks and comparisons that reflect local Québec context, not generic templates.",
                },
                {
                  title: "Portfolio tracking",
                  desc: "Saved deals, dashboards, and history — built for repeat investors, not one-off PDFs.",
                },
                {
                  title: "AI-powered analysis",
                  desc: "Natural-language explanations layered on top of structured financials for faster review.",
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-[#0B0B0B] p-5 transition hover:border-premium-gold/30"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-premium-gold/12 text-premium-gold" aria-hidden>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{v.title}</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo flow */}
          <div className="mx-auto mt-20 w-full max-w-5xl text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Demo flow</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Analyze → Save → Compare → Track</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#9CA3AF] sm:text-base">
              Walk investors through the full lifecycle in minutes: underwrite a deal, save it to your workspace, compare
              against alternatives, and follow performance from the dashboard.
            </p>
            <div className="mt-8 rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-6 sm:p-8">
              <ol className="flex list-none flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-2">
                {[
                  { label: "Analyze", href: "/analyze#analyzer", sub: "Run the model" },
                  { label: "Save", href: "/analyze#analyzer", sub: "Save from analyzer" },
                  { label: "Compare", href: isLoggedIn ? "/compare" : "/demo/compare", sub: "2–4 deals" },
                  { label: "Track", href: isLoggedIn ? "/dashboard" : "/demo/dashboard", sub: "Portfolio" },
                ].flatMap((step, i, arr) => {
                  const card = (
                    <li key={step.label}>
                      <Link
                        href={step.href}
                        className="block w-full rounded-xl border border-white/10 bg-[#0B0B0B]/80 px-4 py-4 text-center transition hover:border-premium-gold/45 md:min-w-[140px] md:max-w-[200px]"
                      >
                        <span className="block text-sm font-bold text-premium-gold">{step.label}</span>
                        <span className="mt-1 block text-xs text-[#9CA3AF]">{step.sub}</span>
                      </Link>
                    </li>
                  );
                  if (i >= arr.length - 1) return [card];
                  const sep = (
                    <li
                      key={`${step.label}-sep`}
                      className="flex list-none items-center justify-center py-0.5 text-lg font-bold text-premium-gold md:py-0 md:px-1"
                      aria-hidden
                    >
                      <span className="md:hidden">↓</span>
                      <span className="hidden md:inline">→</span>
                    </li>
                  );
                  return [card, sep];
                })}
              </ol>
              <p className="border-t border-white/10 pt-4 text-center text-xs text-[#737373]">
                Tip: use <strong className="text-[#B3B3B3]">Compare</strong> after saving at least two deals — highlights
                best ROI, cash flow, and lowest risk automatically.
              </p>
            </div>
          </div>

          {/* Monetization — tiers */}
          <div className="mx-auto mt-20 w-full max-w-5xl text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Plans</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Built for every stage</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#9CA3AF]">
              Illustrative tiers for investor conversations — adjust pricing and limits in product when you launch.
            </p>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                {
                  name: "Free",
                  badge: "Try the engine",
                  price: "$0",
                  period: "",
                  highlights: ["Basic deal analysis", "Limited saved deals", "Core ROI & cash-flow views"],
                  cta: "Start analyzing",
                  href: "/analyze",
                  emphasis: false,
                },
                {
                  name: "Pro",
                  badge: "Most popular",
                  price: "Custom",
                  period: "/ month",
                  highlights: ["Advanced analytics & scenarios", "Portfolio tools & exports", "Priority support"],
                  cta: "Request early access",
                  href: "/contact",
                  emphasis: true,
                },
                {
                  name: "Enterprise",
                  badge: "Teams & brokerages",
                  price: "Let's talk",
                  period: "",
                  highlights: ["Broker & investor workflows", "White-label options", "API & dedicated success"],
                  cta: "Talk to sales",
                  href: "/contact",
                  emphasis: false,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={[
                    "relative flex flex-col rounded-2xl border p-6 shadow-xl",
                    tier.emphasis
                      ? "border-premium-gold/50 bg-[#121212] ring-1 ring-premium-gold/35"
                      : "border-white/10 bg-[#121212]/80",
                  ].join(" ")}
                >
                  {tier.emphasis ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-premium-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0B0B0B]">
                      {tier.badge}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">{tier.badge}</span>
                  )}
                  <h3 className="mt-4 text-xl font-bold text-white">{tier.name}</h3>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-premium-gold">{tier.price}</span>
                    {tier.period ? <span className="text-sm text-[#737373]">{tier.period}</span> : null}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-[#B3B3B3]">
                    {tier.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-premium-gold" aria-hidden>
                          ✓
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.href}
                    className={[
                      "mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition",
                      tier.emphasis
                        ? "bg-premium-gold text-[#0B0B0B] hover:brightness-110"
                        : "border border-white/20 bg-white/5 text-white hover:border-premium-gold/50",
                    ].join(" ")}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Strong CTA — investor demo */}
          <div className="mx-auto mt-20 w-full max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-premium-gold/40 bg-gradient-to-br from-[#1a1510] via-[#121212] to-[#0B0B0B] px-6 py-12 text-center sm:px-12 sm:py-14">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgb(var(--premium-gold-channels) / 0.2),transparent)]"
                aria-hidden
              />
              <div className="relative z-10 mx-auto max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to invest smarter?</h2>
                <p className="mt-3 text-sm text-[#C4C4C4] sm:text-base">
                  Join the early cohort for advanced analytics, portfolio tools, and partner integrations.
                </p>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-premium-gold px-8 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg shadow-premium-gold/20 transition hover:brightness-110 sm:flex-none"
                  >
                    Request Early Access
                  </Link>
                  <Link
                    href="/analyze"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-premium-gold/50 hover:text-premium-gold sm:flex-none"
                  >
                    Start Investing Smarter
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Explore by city */}
          <div className="mx-auto mt-12 w-full max-w-5xl text-left">
            <h2 className="text-lg font-semibold text-white sm:text-xl">Explore by city</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { name: "Montreal", href: "/city/montreal", img: "/images/montreal/montreal-hero.jpg" },
                { name: "Laval", href: "/city/laval", img: "/images/laval/laval-hero.jpg" },
                { name: "Quebec", href: "/city/quebec", img: "/images/laval/laval-city.jpg" },
              ].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg transition hover:-translate-y-0.5 hover:border-premium-gold/40"
                >
                  <Image
                    src={c.img}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/55 transition group-hover:bg-black/50" aria-hidden />
                  <span className="absolute bottom-4 left-4 text-xl font-bold text-white drop-shadow-md sm:text-2xl">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Useful tools */}
          <div className="mx-auto mt-12 w-full max-w-5xl text-left">
            <h2 className="text-lg font-semibold text-white sm:text-xl">Useful tools &amp; services</h2>
            <p className="mt-1 text-sm text-[#B3B3B3]">
              Estimates only — not financial, legal, or tax advice. Verify with licensed professionals.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Compare properties", href: "/compare/fsbo", sub: "FSBO side-by-side (up to 5)" },
                { title: "Compare saved deals", href: "/compare", sub: "Investment deals (2–4, sign in)" },
                { title: "Investor tools", href: "/invest/tools", sub: "ROI & yield hub" },
                { title: "ROI calculator", href: "/invest/tools/roi", sub: "Rental cash flow model" },
                { title: "Welcome tax", href: "/tools/welcome-tax", sub: "Land transfer estimate" },
                { title: "First home buyer", href: "/first-home-buyer", sub: "Affordability & incentives" },
                { title: "Mortgage calculator", href: "/mortgage", sub: "Pre-approval & rates" },
                {
                  title: "Municipality & school tax",
                  href: "/tools/municipality-school-tax",
                  sub: "Property tax from roll & rates",
                },
              ].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-2xl border border-white/10 bg-[#121212]/90 p-4 transition hover:border-premium-gold/45"
                >
                  <span className="block font-semibold text-premium-gold">{c.title}</span>
                  <span className="mt-1 block text-xs text-[#B3B3B3]">{c.sub}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Property value CTA */}
          <div className="relative mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-2xl border border-premium-gold/30 bg-[#121212] px-6 py-8 text-left sm:px-10 sm:py-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              aria-hidden
            >
              <Image src="/images/montreal/montreal-night.jpg" alt="" fill className="object-cover" sizes="(max-width:1024px) 100vw, 896px" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/95 via-[#0B0B0B]/88 to-[#0B0B0B]/75" aria-hidden />
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Homeowners</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Find your property value</h2>
              <p className="mt-3 text-sm text-[#B3B3B3] sm:text-base">
                Instant results for Montreal, Laval &amp; Quebec.{" "}
                <span className="font-semibold text-premium-gold">100% free — no obligation.</span>
              </p>
              <Link
                href="/evaluate"
                className="mt-6 inline-flex rounded-full bg-premium-gold px-8 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg hover:bg-premium-gold"
              >
                Free evaluation
              </Link>
            </div>
          </div>

          {/* Sell path: FSBO vs broker */}
          <div className="relative mx-auto mt-14 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#121212] px-6 py-8 text-left sm:px-10 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Selling</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Sell your property</h2>
            <p className="mt-3 max-w-2xl text-sm text-[#B3B3B3]">
              Choose how you want to move forward — list yourself on {PLATFORM_CARREFOUR_NAME} or get expert help from a
              licensed broker.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sell/create"
                className="inline-flex rounded-full border border-white/25 px-8 py-3 text-sm font-semibold text-white hover:border-premium-gold/50 hover:text-premium-gold"
              >
                Sell by yourself
              </Link>
              <Link
                href="/sell/compare"
                className="inline-flex rounded-full bg-premium-gold px-8 py-3 text-sm font-bold text-[#0B0B0B] shadow-lg hover:bg-premium-gold"
              >
                Work with a broker
              </Link>
            </div>
          </div>

          {/* What clients say */}
          <section className="relative mx-auto mt-14 w-full max-w-5xl rounded-2xl border border-premium-gold/25 bg-[#121212] px-6 py-10 text-left sm:px-10 sm:py-12">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Trust &amp; social proof</p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Success stories &amp; trust messages
                </h2>
                <p className="mt-2 max-w-lg text-sm text-[#9CA3AF]">
                  Real testimonials when published in admin; defaults below highlight free value and platform safety.
                </p>
              </div>
              <Link
                href="/why-lecipm"
                className="text-sm font-medium text-premium-gold hover:underline"
              >
                Why {PLATFORM_NAME} →
              </Link>
            </div>
            {testimonials.length === 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {[
                  {
                    quote:
                      "We wanted clarity on financing and timing — the team connected us with the right people fast.",
                    name: "Success story",
                    sub: "Montreal buyer",
                  },
                  {
                    quote: "Free evaluation helped us understand our numbers before we shopped seriously.",
                    name: "Trust message",
                    sub: "Laval homeowners",
                  },
                  {
                    quote:
                      "Licensed pathway + vetted experts made the process feel safer than random marketplace leads.",
                    name: "Platform promise",
                    sub: "Quebec",
                  },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0B0B0B] p-5"
                  >
                    <p className="text-premium-gold" aria-hidden>
                      ★★★★★
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#E5E5E5]">&ldquo;{t.quote}&rdquo;</p>
                    <p className="mt-4 text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-[#737373]">{t.sub}</p>
                  </div>
                ))}
                <p className="md:col-span-3 text-center text-xs text-[#737373]">
                  Published testimonials appear here when added in admin — these are default trust messages.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0B0B0B] p-5 transition hover:-translate-y-0.5 hover:border-premium-gold/35"
                  >
                    <p className="text-premium-gold" aria-hidden>
                      {"★".repeat(Math.min(5, Math.max(1, t.rating)))}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#E5E5E5]">&ldquo;{t.quote}&rdquo;</p>
                    <p className="mt-4 text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-[#737373]">
                      {[t.role, t.city].filter(Boolean).join(" · ") || "Quebec"}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-10 max-w-2xl border-t border-white/10 pt-8">
              <LeadCTA variant="evaluation" compactTrust />
            </div>
          </section>

        {/* FSBO */}
        <section className="relative mx-auto mt-14 max-w-5xl rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-[#121212] to-[#0B0B0B] px-6 py-10 text-left sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Private sale</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Sell your property yourself</h2>
          <p className="mt-3 max-w-2xl text-[#B3B3B3]">
            List your home FSBO on {PLATFORM_CARREFOUR_NAME} — one-time publish fee, you manage inquiries. Separate from
            BNHub short-term stays.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sell/create"
              className="inline-flex rounded-full bg-premium-gold px-8 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
            >
              Create your listing
            </Link>
            <Link
              href="/sell/learn"
              className="inline-flex rounded-full border border-white/25 px-8 py-3 text-sm font-semibold text-white hover:border-premium-gold/50"
            >
              Learn more
            </Link>
            <Link href="/sell" className="inline-flex items-center px-4 py-3 text-sm font-medium text-premium-gold hover:underline">
              Browse FSBO →
            </Link>
          </div>
        </section>
      </section>

      <LocalImageSection
        id="discover-montreal"
        title="Discover Montreal"
        body={
          <>
            Montreal is one of Canada&apos;s most dynamic cities — a bilingual hub for culture, innovation, and resilient
            housing demand. From the vibrant downtown core to established neighbourhoods and transit-oriented corridors,
            the region offers diverse opportunities for buyers, hosts, and investors.{" "}
            <span className={platformBrandGoldTextClass}>{PLATFORM_CARREFOUR_NAME}</span> is built with Greater Montreal
            in mind: clear listings, verified professionals, and secure payments.
          </>
        }
        imageSrc="/images/montreal/montreal-night.jpg"
        imageAlt="Montreal skyline at night"
      />

      <LocalImageSection
        id="living-laval"
        title="Living in Laval"
        body="Laval is a fast-growing city just north of Montreal — families, commuters, and new developments shape one of Québec's most active suburban markets. Strong demand for well-priced housing, proximity to highways and transit, and ongoing investment make Laval a natural focus for our platform alongside Montreal. Whether you're searching for a home or listing a property, we surface local context you can trust."
        imageSrc="/images/laval/laval-hero.jpg"
        imageAlt="Open landscape and community near Laval region"
      />

      {/* Québec identity */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#0B0B0B] px-4 py-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
        >
          <Image
            src="/images/laval/laval-city.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[#0B0B0B]/90" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
            <QuebecCanadaFlagsPair gapClass="gap-3" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-premium-gold sm:text-3xl">Proudly a Quebec platform</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#B3B3B3]">
            Québec is known for its strong real estate market, clear regulatory frameworks, and deep local expertise.
            {PLATFORM_CARREFOUR_NAME} embraces that identity: we are a{" "}
            <strong className="font-semibold text-white">Quebec real estate platform</strong> connecting serious buyers,
            sellers, and guests with transparent economics — from{" "}
            <strong className="text-premium-gold">real estate Montreal</strong> searches to{" "}
            <strong className="text-premium-gold">Laval property</strong> listings and stays across the province.
          </p>
          <p className="mt-6 text-sm font-medium text-premium-gold">
            OACIQ-minded professionalism · BNHub · FSBO · Investments
          </p>
        </div>
      </section>

      {/* Services · Mission · Vision · Contact */}
      <section className="border-t border-white/10 bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Services</h2>
              <p className="mt-3 text-2xl font-semibold text-white">Everything in one verified marketplace</p>
              <ul className="mt-6 space-y-4 text-[#B3B3B3]">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" />
                  <span>
                    <strong className="text-white">BNHub</strong> — short-term stays with secure Stripe checkout & host
                    payouts.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" />
                  <span>
                    <strong className="text-white">Residential & luxury</strong> — acquisition and advisory with licensed
                    brokers.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-premium-gold" />
                  <span>
                    <strong className="text-white">Projects & investments</strong> — curated developments and yield-focused
                    inventory.
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-10">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Mission</h2>
                <p className="mt-3 text-lg leading-relaxed text-[#B3B3B3]">
                  To simplify real estate, rentals, and investment through one premium platform.
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Vision</h2>
                <p className="mt-3 text-lg leading-relaxed text-[#B3B3B3]">
                  To become the trusted intelligent real estate ecosystem for Québec and beyond.
                </p>
              </div>
              <div className="rounded-2xl border border-premium-gold/30 bg-[#0B0B0B] p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Contact us</h2>
                <p className="mt-3 text-sm text-[#B3B3B3]">
                  Partnerships, press, or concierge — we respond to serious inquiries quickly.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href={getPhoneTelLink()}
                      className="inline-flex items-center gap-2 font-medium text-white hover:text-premium-gold"
                    >
                      <span className="text-premium-gold" aria-hidden>
                        📞
                      </span>
                      {getPhoneNumber()}
                    </a>
                  </li>
                  <li>
                    <a
                      href={getPublicContactMailto()}
                      className="inline-flex items-center gap-2 font-medium text-white hover:text-premium-gold"
                    >
                      <span className="text-premium-gold" aria-hidden>
                        ✉️
                      </span>
                      {getPublicContactEmail()}
                    </a>
                  </li>
                  {socialEntries.length > 0 ? (
                    <li className="pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/90">Social</p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {socialEntries.map(([key, label, href]) => (
                          <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#B3B3B3] transition hover:text-premium-gold"
                          >
                            {label}
                          </a>
                        ))}
                      </div>
                    </li>
                  ) : null}
                </ul>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex rounded-full px-6 py-2.5 text-sm font-bold text-[#0B0B0B]"
                  style={{ backgroundColor: GOLD }}
                >
                  Reach the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!INVESTMENT_HUB_FOCUS ? (
        <>
      {/* Featured stays */}
      <HorizontalStrip
        title="Featured stays"
        subtitle="Exceptional homes available for your next trip"
        viewAllHref="/search/bnhub"
      >
        {displayListings.slice(0, 8).map((item: { id: string; title?: string; city?: string; nightPriceCents?: number; photos?: string[] | unknown }) => {
          const photos = Array.isArray(item.photos)
            ? item.photos.filter((p): p is string => typeof p === "string")
            : [];
          const img =
            photos[0] ||
            "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800";
          const price =
            item.nightPriceCents != null ? `$${(item.nightPriceCents / 100).toLocaleString()}` : "$—";
          return (
                <Link
                  key={item.id}
                  href={featuredListings.length >= 4 ? `/bnhub/${item.id}` : "/search/bnhub"}
              className="card-premium group min-w-[260px] max-w-[280px] shrink-0 snap-start sm:min-w-[280px]"
                >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                    <div
                  className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${img}')` }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-1 font-semibold text-white group-hover:text-premium-gold">
                      {item.title || "Property"}
                    </h3>
                <p className="mt-1 text-sm text-[#B3B3B3]">{item.city || ""}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                      {price}
                  <span className="font-normal text-[#B3B3B3]"> / night</span>
                    </p>
                  </div>
                </Link>
              );
            })}
      </HorizontalStrip>

      <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <StaysRecommendationGridLazy
            title="Recommended for you"
            subtitle={
              homepageRecos.length > 0
                ? guestId
                  ? "Based on stays you’ve recently viewed."
                  : `Popular stays travellers are booking on ${PLATFORM_CARREFOUR_NAME}.`
                : "Popular stays on the platform — explore more after your analysis."
            }
            items={recoItems}
            variant="dark"
            viewAllHref="/search/bnhub"
            viewAllLabel="Browse all stays →"
            sectionId="homepage-recommended"
          />
        </div>
      </section>

      {/* Luxury listings */}
      <HorizontalStrip
        title="Luxury listings"
        subtitle="Signature residences and curated premium inventory"
        viewAllHref="/dashboard/luxury"
        viewAllLabel="Luxury hub"
      >
        {LUXURY_PLACEHOLDER.map((l) => (
              <Link
            key={l.id}
            href="/dashboard/luxury"
            className="card-premium group min-w-[260px] max-w-[280px] shrink-0 snap-start overflow-hidden sm:min-w-[280px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <div
                className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${l.img}')` }}
              />
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                style={{ backgroundColor: GOLD }}
              >
                Luxury
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-premium-gold">{l.title}</h3>
              <p className="mt-1 text-sm text-[#B3B3B3]">{l.city}</p>
              <p className="mt-2 text-sm font-medium" style={{ color: GOLD }}>
                {l.price}
              </p>
            </div>
          </Link>
        ))}
      </HorizontalStrip>

      {/* Investment opportunities */}
      <HorizontalStrip
        title="Investment opportunities"
        subtitle="Developments and yield-focused projects"
        viewAllHref="/projects"
        viewAllLabel="All projects"
      >
        {(featuredProjects.length > 0
          ? featuredProjects.slice(0, 8)
          : [
              {
                id: "p1",
                name: "Latitude Towers",
                city: "Montreal",
                startingPrice: 450000,
                heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
              },
              {
                id: "p2",
                name: "Riverfront Commons",
                city: "Laval",
                startingPrice: 520000,
                heroImage: "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?w=800",
              },
            ]
        ).map((p: { id: string; name: string; city: string; startingPrice: number; heroImage?: string | null }) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
            className="card-premium group min-w-[260px] max-w-[300px] shrink-0 snap-start overflow-hidden sm:min-w-[300px]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div
                className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${p.heroImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"}')`,
                      }}
                    />
                  </div>
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-premium-gold">{p.name}</h3>
              <p className="mt-1 text-sm text-[#B3B3B3]">{p.city}</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: GOLD }}>
                From $
                {p.startingPrice >= 1000
                  ? `${(p.startingPrice / 1000).toFixed(0)}k`
                  : p.startingPrice.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
      </HorizontalStrip>

      {/* Verified brokers */}
      <HorizontalStrip
        title="Verified brokers"
        subtitle="Work with licensed professionals across our network"
        viewAllHref="/broker"
        viewAllLabel="Broker desk"
      >
        {BROKER_CARDS.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="card-premium min-w-[240px] max-w-[260px] shrink-0 snap-start p-5 sm:min-w-[260px]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-gold/15 text-premium-gold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <VerifiedBrokerBadge />
            </div>
            <h3 className="mt-4 font-semibold text-white">{b.name}</h3>
            <p className="mt-1 text-sm text-[#B3B3B3]">{b.region}</p>
            <span className="mt-3 inline-flex text-xs font-semibold text-premium-gold">
              Connect →
            </span>
          </Link>
        ))}
      </HorizontalStrip>
        </>
      ) : null}

      <TrustCredibilitySectionsLazy />

      {/* CTA — investor demo close */}
      <section className="border-t border-white/10 bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Get started</p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            {INVESTMENT_HUB_FOCUS ? "Try the analyzer — sign in only to sync" : "Request early access or try the product"}
          </h2>
          <p className="mt-4 text-[#B3B3B3]">
            {INVESTMENT_HUB_FOCUS
              ? "Run your first analysis without an account. Create one when you want cloud-saved deals and dashboard sync."
              : "Create an account for the full marketplace — or jump straight into analysis for your next deal."}
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/analyze#analyzer"
              className="btn-primary inline-flex min-h-[48px] items-center justify-center rounded-full px-10 py-3 text-sm font-bold"
            >
              Start analyzing now
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-10 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-premium-gold/50 hover:text-premium-gold"
            >
              {INVESTMENT_HUB_FOCUS ? "Contact us" : "Request Early Access"}
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-premium-gold/35 px-10 py-3 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/10"
            >
              {INVESTMENT_HUB_FOCUS ? "Create account to sync" : "Create account"}
            </Link>
          </div>
        </div>
      </section>

      {!INVESTMENT_HUB_FOCUS ? (
        <section className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-sm text-[#B3B3B3]">
              Travel & stays: BNHub · Hotel · Flights · Packages
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {PLATFORM_MODULES.map((mod) => (
                <Link
                  key={mod.key}
                  href={mod.href}
                  className="rounded-xl border border-white/15 bg-[#121212] px-4 py-2 text-sm font-medium text-[#B3B3B3] transition hover:border-premium-gold/40 hover:text-white"
                >
                  {mod.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Bottom contact strip */}
      <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2
              className={`font-serif text-lg font-semibold sm:text-xl ${platformCarrefourGoldGradientClass}`}
            >
              {PLATFORM_CARREFOUR_NAME}
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#B3B3B3]">
              Premium real estate, BNHub, and advisory across Greater Montreal and Quebec.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-premium-gold">Location</p>
              <p className="mt-2 text-sm font-medium text-white">{officeAddress}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-premium-gold">Email</p>
              <a
                href={getPublicContactMailto()}
                className="mt-2 block text-sm font-medium text-white hover:text-premium-gold"
              >
                {getPublicContactEmail()}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-premium-gold">Phone</p>
              <a
                href={getPhoneTelLink()}
                className="mt-2 block text-sm font-medium text-white hover:text-premium-gold"
              >
                {getPhoneNumber()}
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-premium-gold">Social</p>
            {socialEntries.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {socialEntries.map(([key, label, href]) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B3B3B3] hover:text-premium-gold"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#B3B3B3]">
                <Link href="/contact" className="text-premium-gold hover:text-premium-gold">
                  Contact us
                </Link>{" "}
                — social profiles are added at deploy time.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
