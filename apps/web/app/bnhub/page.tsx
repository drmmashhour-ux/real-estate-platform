import type { Metadata } from "next";
import Link from "next/link";
import { Gem, Shield, Sparkles } from "lucide-react";
import { BnhubHomeHero } from "@/components/bnhub/BnhubHomeHero";
import { ListingCard } from "@/components/bnhub/ListingCard";
import { TrustStrip } from "@/components/bnhub/TrustStrip";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { prisma } from "@/lib/db";
import { getMarketingFeaturedListingIds } from "@/src/modules/bnhub-marketing/services/marketingFeaturedSearchBridge";
import { getGrowthFeaturedListingIds } from "@/src/modules/bnhub-growth-engine/services/growthFeaturedBridge";
import { ListingStatus, VerificationStatus } from "@prisma/client";
import { bnhubLaunchBadgesFromTags } from "@/lib/bnhub/bnhub-launch-quality";
import { annotateBnhubListingsForGuest, sortBnhubListingsByGuestAppeal } from "@/modules/bnhub/recommendationEngine";

export const metadata: Metadata = {
  title: "BNHub — Find your perfect stay",
  description:
    "Verified short-term stays with smart recommendations, transparent pricing, and a booking flow designed for trust.",
};

const SEARCH_BASE = "/en/ca/search/bnhub";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

async function loadFeaturedForHome() {
  const [promoIds, marketingIds, growthIds] = await Promise.all([
    getActivePromotedListingIds({ placement: "FEATURED", limit: 12 }),
    getMarketingFeaturedListingIds(12),
    getGrowthFeaturedListingIds(12),
  ]);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const id of [...promoIds, ...marketingIds, ...growthIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
    if (merged.length >= 12) break;
  }

  if (merged.length > 0) {
    const rows = await prisma.shortTermListing.findMany({
      where: { id: { in: merged.slice(0, 8) }, listingStatus: ListingStatus.PUBLISHED },
      select: {
        id: true,
        listingCode: true,
        title: true,
        city: true,
        nightPriceCents: true,
        beds: true,
        maxGuests: true,
        photos: true,
        verificationStatus: true,
        operationalRiskScore: true,
        bnhubListingRatingAverage: true,
        bnhubListingReviewCount: true,
        experienceTags: true,
      },
    });
    const order = new Map(merged.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    return rows.slice(0, 6);
  }

  return prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      beds: true,
      maxGuests: true,
      photos: true,
      verificationStatus: true,
      operationalRiskScore: true,
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      experienceTags: true,
    },
  });
}

export default async function BnhubHomePage() {
  const featuredRaw = await loadFeaturedForHome();
  const featured = sortBnhubListingsByGuestAppeal(annotateBnhubListingsForGuest(featuredRaw));

  return (
    <main className="scroll-smooth bg-[#000] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#000]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link
            href="/bnhub"
            className="min-h-[44px] min-w-[44px] text-lg font-semibold tracking-tight text-[#D4AF37] transition hover:text-[#e5c35c]"
          >
            BNHub
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href={SEARCH_BASE}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full px-5 text-sm font-medium text-white/80 transition hover:text-[#D4AF37]"
            >
              Browse
            </Link>
            <Link
              href="/bnhub/become-host"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
            >
              Host
            </Link>
          </nav>
        </div>
      </header>

      <BnhubHomeHero searchBasePath={SEARCH_BASE} />

      <TrustStrip />

      <section className="bg-[#000] px-4 py-20 sm:py-24 md:py-28" id="featured">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">Featured listings</h2>
            <p className="mx-auto mt-4 max-w-sm text-sm text-white/50">
              Hand-picked stays — clear nightly rates and verified hosts.
            </p>
          </div>
          {featured.length === 0 ? (
            <p className="text-center text-sm text-white/45">
              New stays are on the way.{" "}
              <Link href={SEARCH_BASE} className="text-[#D4AF37] underline-offset-4 hover:underline">
                Search all listings
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => (
                <ListingCard
                  key={l.id}
                  href={`/bnhub/${l.listingCode || l.id}`}
                  imageUrl={photoFirst(l.photos)}
                  title={l.title}
                  city={l.city}
                  nightPriceCents={l.nightPriceCents}
                  rating={l.displayRating ?? l.bnhubListingRatingAverage}
                  reviewCount={l.displayReviewCount}
                  verified={l.verificationStatus === VerificationStatus.VERIFIED}
                  riskLevel={l.riskLevel}
                  valueLabel={l.valueLabel}
                  fraud={l.fraud}
                  launchBadges={bnhubLaunchBadgesFromTags(l.experienceTags)}
                />
              ))}
            </div>
          )}
          <div className="mt-14 flex justify-center sm:mt-16">
            <Link
              href={SEARCH_BASE}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[#D4AF37]/45 px-10 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
            >
              See all stays
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#050505] px-4 py-20 sm:py-24 md:py-28" id="why">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">Why BNHub</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              {
                icon: Sparkles,
                title: "Smart matching",
                body: "Recommendations tuned to price, quality, and fit.",
              },
              {
                icon: Shield,
                title: "Safer stays",
                body: "Verified listings and clear signals before you book.",
              },
              {
                icon: Gem,
                title: "Better value",
                body: "Transparent nightly pricing — fewer surprises at checkout.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 sm:min-h-[200px] sm:p-8"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000] px-4 py-20 sm:py-24 md:py-28">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/10 to-transparent px-6 py-14 text-center sm:px-12 sm:py-16 md:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">List your property</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55 sm:text-base">
            Join hosts who lead with clarity and trust.
          </p>
          <Link
            href="/bnhub/become-host"
            className="mt-10 inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-2xl bg-[#D4AF37] px-10 text-base font-semibold text-black transition hover:brightness-110"
          >
            Start hosting
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-white/40 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} BNHub · LECIPM</span>
          <Link href={SEARCH_BASE} className="min-h-[44px] inline-flex items-center text-[#D4AF37] hover:underline">
            Search stays
          </Link>
        </div>
      </footer>
    </main>
  );
}
