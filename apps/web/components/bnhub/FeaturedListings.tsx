import Link from "next/link";
import { Heart } from "lucide-react";
import { ListingCodeBadge } from "@/components/bnhub/ListingCodeBadge";
import { BrandLogo } from "@/components/ui/Logo";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getMarketingFeaturedListingIds } from "@/src/modules/bnhub-marketing/services/marketingFeaturedSearchBridge";
import { getGrowthFeaturedListingIds } from "@/src/modules/bnhub-growth-engine/services/growthFeaturedBridge";
import { prisma } from "@/lib/db";
import { ListingStatus, VerificationStatus } from "@prisma/client";
import { TrustBadge } from "@/components/bnhub/TrustBadge";
import { computeBnhubTrustRiskLevel } from "@/modules/bnhub/recommendationEngine";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

type FeaturedVariant = "dark" | "booking" | "hub";

/** Demand boost: paid promotions + internal marketing engine homepage slots. */
export async function FeaturedListings({ variant = "dark" }: { variant?: FeaturedVariant } = {}) {
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
  if (merged.length === 0) {
    if (variant === "booking") {
      return (
        <div className="lecipm-prestige-surface col-span-full rounded-xl p-4 md:p-5">
          <div className="lecipm-prestige-surface__inner flex flex-col items-center gap-5 text-center">
            <p className="max-w-md text-sm leading-relaxed text-premium-gold/85">
              Featured stays will appear here when promotions are active.
            </p>
            <div className="flex justify-center pt-1">
              <BrandLogo variant="default" href="/bnhub" className="[&_img]:max-h-10 sm:[&_img]:max-h-11" priority />
            </div>
          </div>
        </div>
      );
    }
    if (variant === "hub") {
      return (
        <section className="lecipm-prestige-surface rounded-2xl p-4 text-center md:p-5">
          <div className="lecipm-prestige-surface__inner flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-premium-gold">Featured stays coming soon</p>
            <p className="max-w-md text-sm text-premium-gold/75">Browse all verified stays on the map while we load promotions.</p>
            <Link
              href={PUBLIC_MAP_SEARCH_URL.bnhubStays}
              className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-full border border-premium-gold/45 bg-premium-gold/10 px-6 text-sm font-bold text-premium-gold transition hover:border-premium-gold hover:bg-premium-gold/18"
            >
              Open map search
            </Link>
            <div className="mt-3 flex justify-center">
              <BrandLogo variant="default" href="/bnhub" className="[&_img]:max-h-10 sm:[&_img]:max-h-11" priority />
            </div>
          </div>
        </section>
      );
    }
    return null;
  }
  const campaignFeatured = new Set(
    [...marketingIds, ...growthIds].filter((id) => !promoIds.includes(id))
  );

  const promoSet = new Set(promoIds);
  const classRows = await prisma.bnhubPropertyClassification.findMany({
    where: { listingId: { in: merged } },
    select: { listingId: true, starRating: true },
  });
  const starMap = new Map(classRows.map((r) => [r.listingId, r.starRating]));
  function starTier(listingId: string): number {
    const s = starMap.get(listingId) ?? 0;
    if (s >= 5) return 2;
    if (s >= 4) return 1;
    return 0;
  }
  const paid = merged.filter((id) => promoSet.has(id));
  const unpaid = merged.filter((id) => !promoSet.has(id));
  const unpaidSorted = [...unpaid].sort((a, b) => {
    const d = starTier(b) - starTier(a);
    if (d !== 0) return d;
    return (starMap.get(b) ?? 0) - (starMap.get(a) ?? 0);
  });
  const displayIds = [...paid, ...unpaidSorted].slice(0, 12);

  const listings = await prisma.shortTermListing.findMany({
    where: { id: { in: displayIds }, listingStatus: ListingStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
      verificationStatus: true,
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      operationalRiskScore: true,
      bnhubListingHostVerified: true,
    },
  });

  if (listings.length === 0) {
    if (variant === "booking") {
      return (
        <div className="lecipm-prestige-surface col-span-full rounded-xl p-4 md:p-5">
          <div className="lecipm-prestige-surface__inner flex flex-col items-center gap-5 text-center">
            <p className="max-w-md text-sm leading-relaxed text-premium-gold/85">
              Featured stays will appear here when promotions are active.
            </p>
            <div className="flex justify-center pt-1">
              <BrandLogo variant="default" href="/bnhub" className="[&_img]:max-h-10 sm:[&_img]:max-h-11" priority />
            </div>
          </div>
        </div>
      );
    }
    if (variant === "hub") {
      return (
        <section className="lecipm-prestige-surface rounded-2xl p-4 text-center md:p-5">
          <div className="lecipm-prestige-surface__inner flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-premium-gold">Featured stays coming soon</p>
            <p className="max-w-md text-sm text-premium-gold/75">Browse all verified stays on the map.</p>
            <Link
              href={PUBLIC_MAP_SEARCH_URL.bnhubStays}
              className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-full border border-premium-gold/45 bg-premium-gold/10 px-6 text-sm font-bold text-premium-gold transition hover:border-premium-gold hover:bg-premium-gold/18"
            >
              Open map search
            </Link>
            <div className="mt-3 flex justify-center">
              <BrandLogo variant="default" href="/bnhub" className="[&_img]:max-h-10 sm:[&_img]:max-h-11" priority />
            </div>
          </div>
        </section>
      );
    }
    return null;
  }
  const order = new Map(displayIds.map((id, i) => [id, i]));
  listings.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));

  if (variant === "hub") {
    return (
      <section aria-labelledby="bnhub-hub-featured-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-0.5">
          <div>
            <h2 id="bnhub-hub-featured-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Popular stays
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Swipe on your phone or scroll sideways — same discovery pattern as top travel hubs.
            </p>
          </div>
          <Link
            href={PUBLIC_MAP_SEARCH_URL.bnhubStays}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#006ce4] underline-offset-4 hover:underline"
          >
            Show all <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
          {listings.map((l) => {
            const href = `/bnhub/stays/${l.listingCode || l.id}`;
            const img = photoFirst(l.photos);
            const stars = starMap.get(l.id) ?? 0;
            const luxury = stars >= 5;
            const verified = l.verificationStatus === VerificationStatus.VERIFIED || l.bnhubListingHostVerified;
            const risk = computeBnhubTrustRiskLevel({
              verificationStatus: l.verificationStatus,
              reviewCount: l.bnhubListingReviewCount,
              avgRating: l.bnhubListingRatingAverage,
              operationalRiskScore: l.operationalRiskScore,
            });
            return (
              <Link
                key={l.id}
                href={href}
                className="group snap-start shrink-0 w-[min(17.5rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[20/13] bg-slate-100">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">Photo</div>
                  )}
                  {luxury ? (
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
                      Guest favourite
                    </span>
                  ) : null}
                  <span
                    className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/95 text-slate-500 shadow-sm backdrop-blur-sm"
                    aria-hidden
                  >
                    <Heart className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="p-3.5">
                  {campaignFeatured.has(l.id) ? (
                    <span className="mb-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800">
                      Featured
                    </span>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-[#006ce4]">{l.title}</p>
                    <ListingCodeBadge code={l.listingCode} className="shrink-0" />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{l.city}</p>
                  <TrustBadge
                    className="mt-2"
                    variant="light"
                    verified={verified}
                    hostRating={l.bnhubListingRatingAverage}
                    reviewCount={l.bnhubListingReviewCount}
                    riskLevel={risk}
                  />
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    <span className="font-semibold text-slate-600">from </span>
                    ${(l.nightPriceCents / 100).toFixed(0)}
                    <span className="text-sm font-normal text-slate-500"> / night</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (variant === "booking") {
    return (
      <>
        {listings.map((l) => {
          const href = `/bnhub/stays/${l.listingCode || l.id}`;
          const img = photoFirst(l.photos);
          const stars = starMap.get(l.id) ?? 0;
          const luxury = stars >= 5;
          const price = (l.nightPriceCents / 100).toFixed(0);
          const verified = l.verificationStatus === VerificationStatus.VERIFIED || l.bnhubListingHostVerified;
          const risk = computeBnhubTrustRiskLevel({
            verificationStatus: l.verificationStatus,
            reviewCount: l.bnhubListingReviewCount,
            avgRating: l.bnhubListingRatingAverage,
            operationalRiskScore: l.operationalRiskScore,
          });
          return (
            <Link
              key={l.id}
              href={href}
              className="group overflow-hidden rounded-[12px] border border-bnhub-border bg-bnhub-card shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-bnhub-gold/40 hover:shadow-[0_16px_48px_-12px_rgba(212,175,55,0.1)] active:scale-[0.98]"
            >
              <div className="relative aspect-[16/10] bg-neutral-900">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">Photo</div>
                )}
                <span
                  className="pointer-events-none absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-black/55 text-[#D4AF37] shadow-md backdrop-blur-sm"
                  aria-hidden
                >
                  <Heart className="h-4 w-4" strokeWidth={2} />
                </span>
                {luxury ? (
                  <span className="absolute left-3 top-3 rounded-full border border-[#D4AF37]/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37] backdrop-blur-sm">
                    Luxury
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                {campaignFeatured.has(l.id) ? (
                  <span className="inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">
                    Featured
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="line-clamp-2 font-semibold leading-snug text-white group-hover:text-[#D4AF37]">{l.title}</p>
                    <ListingCodeBadge code={l.listingCode} className="shrink-0 !text-[10px]" />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <span className="line-clamp-1">{l.city}</span>
                  </p>
                  <TrustBadge
                    className="mt-2"
                    variant="dark"
                    verified={verified}
                    hostRating={l.bnhubListingRatingAverage}
                    reviewCount={l.bnhubListingReviewCount}
                    riskLevel={risk}
                  />
                </div>
                <div className="flex items-end justify-between gap-2 border-t border-white/5 pt-2">
                  <p className="text-lg font-bold tabular-nums text-[#D4AF37]">
                    ${price}
                    <span className="text-xs font-normal text-neutral-500"> / night</span>
                  </p>
                  <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
                    View
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Featured stays</h2>
          <p className="text-sm text-slate-400">Promoted listings — visibility for hosts, discovery for guests.</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-500/40 px-2 py-0.5 text-xs font-medium text-amber-200">
          Featured
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => {
          const href = `/bnhub/stays/${l.listingCode || l.id}`;
          const img = photoFirst(l.photos);
          const stars = starMap.get(l.id) ?? 0;
          const luxury = stars >= 5;
          const verified = l.verificationStatus === VerificationStatus.VERIFIED || l.bnhubListingHostVerified;
          const risk = computeBnhubTrustRiskLevel({
            verificationStatus: l.verificationStatus,
            reviewCount: l.bnhubListingReviewCount,
            avgRating: l.bnhubListingRatingAverage,
            operationalRiskScore: l.operationalRiskScore,
          });
          return (
            <li key={l.id}>
              <Link href={href} className="group block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="relative aspect-[16/10] bg-slate-800">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                  ) : null}
                </div>
                <div className="p-3">
                  {luxury ? (
                    <span className="mb-1 mr-1 inline-block rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      Luxury pick
                    </span>
                  ) : null}
                  {campaignFeatured.has(l.id) ? (
                    <span className="mb-1 inline-block rounded bg-premium-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
                      Promoted by campaign
                    </span>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="line-clamp-1 font-medium text-white group-hover:text-amber-200">{l.title}</p>
                    <ListingCodeBadge code={l.listingCode} className="!text-[9px]" />
                  </div>
                  <p className="text-xs text-slate-500">{l.city}</p>
                  <TrustBadge
                    className="mt-2"
                    variant="dark"
                    verified={verified}
                    hostRating={l.bnhubListingRatingAverage}
                    reviewCount={l.bnhubListingReviewCount}
                    riskLevel={risk}
                  />
                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    ${(l.nightPriceCents / 100).toFixed(0)} / night
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
