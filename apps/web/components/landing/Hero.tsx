import Link from "next/link";

import type { UserProfile } from "@/lib/ai/userProfile";
import { SmartSearchBar } from "@/components/search/SmartSearchBar";
import {
  buildExploreHrefWithCityPrefill,
  DEFAULT_SUBCOPY,
  defaultListingDetailBaseFromListingsHref,
  formatHeroTrustStrip,
  getHeroHeadline,
  getHeroSubcopy,
  getPrimaryCtaEmphasis,
} from "@/lib/landing/heroCopy";
import { getGuestId } from "@/lib/auth/session";
import { HeroCtaRowWithExperiment } from "@/components/experiments/HeroCtaRowWithExperiment";
import { HERO_CTA_EXPERIMENT_KEY, getExperimentVariant } from "@/lib/experiments/engine";
import { flags } from "@/lib/flags";
import { getTrustSignals } from "@/lib/market/trustSignals";
import { earlyUserHeroSubline, getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";
import { cn } from "@/lib/utils";

export type HeroProps = {
  /** e.g. `/${locale}/${country}/listings` */
  exploreListingsHref?: string;
  listPropertyHref?: string;
  /** City name for demand-aware headline and trust signals. */
  city?: string;
  userProfile?: UserProfile;
  /** When recommendations ship seller emphasis, set `"list"` to highlight “List Property”. */
  ctaEmphasisOverride?: "explore" | "list";
  /** When set, stay listing links use this base (default: `…/listings` → `…/bnhub/listings`). */
  listingDetailBaseHref?: string;
};

type HeroStaticContentProps = {
  headline: string;
  subcopy: string;
  exploreHref: string;
  listHref: string;
  /** Which CTA is visually primary (glow) */
  emphasis: "explore" | "list";
  trustLines?: string[];
  defaultCity?: string;
  userProfile?: UserProfile;
  /** Smart search: typeahead when `FEATURE_RECO=1` from the server. */
  suggestionsEnabled: boolean;
  /** Used for `?city=` search + `SmartSearchBar` `listingsBaseHref`. */
  listingsBaseForSearch: string;
  listingDetailBaseHref: string;
  /** When set (early cohort, real count), shown under primary CTAs. */
  earlyUserLine?: string | null;
  /** Order 59 — explore primary button label; default “Explore Listings”. */
  exploreCtaLabel?: string;
  /** When set with RECO, use client row that logs `hero_view` / `cta_click`. */
  experimentTrackingKey?: string;
};

const explorePrimaryClass =
  "ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/25 border border-amber-500/20";
const listPrimaryClass =
  "ring-2 ring-zinc-400/50 shadow-lg shadow-zinc-500/10 border border-zinc-300/30 dark:ring-amber-500/30 dark:shadow-amber-500/10 dark:border-amber-500/20";

/**
 * Reusable CTA + headline block (static or pre-resolved from server).
 * Buttons stay `Link` for navigation + accessibility.
 */
function HeroCtas({
  headline,
  subcopy,
  exploreHref,
  listHref,
  emphasis,
  trustLines,
  defaultCity,
  userProfile,
  suggestionsEnabled,
  listingsBaseForSearch,
  listingDetailBaseHref,
  earlyUserLine,
  exploreCtaLabel = "Explore Listings",
  experimentTrackingKey,
}: HeroStaticContentProps) {
  const explorePrimary = emphasis === "explore";
  const listPrimary = emphasis === "list";
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h1 className="text-5xl font-bold">{headline}</h1>

      <p className="mt-6 text-lg text-muted-foreground">{subcopy}</p>

      <div className="mt-6">
        <SmartSearchBar
          defaultCity={defaultCity}
          userProfile={userProfile}
          suggestionsEnabled={suggestionsEnabled}
          listingsBaseHref={listingsBaseForSearch}
          listingDetailBaseHref={listingDetailBaseHref}
        />
      </div>

      {trustLines && trustLines.length > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground/90" aria-live="polite">
          {trustLines.join(" · ")}
        </p>
      ) : null}

      {experimentTrackingKey ? (
        <HeroCtaRowWithExperiment
          experimentKey={experimentTrackingKey}
          exploreHref={exploreHref}
          listHref={listHref}
          exploreCtaLabel={exploreCtaLabel}
          explorePrimary={explorePrimary}
          listPrimary={listPrimary}
        />
      ) : (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={exploreHref}
            aria-label="Explore available property listings"
            className={cn(
              "inline-flex rounded-xl bg-black px-6 py-3 text-white transition hover:bg-black/90",
              explorePrimary && explorePrimaryClass
            )}
          >
            {exploreCtaLabel}
          </Link>

          <Link
            href={listHref}
            aria-label="List your property for sale or rent"
            className={cn(
              "inline-flex rounded-xl border border-zinc-200 bg-background px-6 py-3 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/50",
              listPrimary && listPrimaryClass
            )}
          >
            List Your Property
          </Link>
        </div>
      )}

      {earlyUserLine ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          {earlyUserLine}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Unpersonalized marketing hero. Used when `FEATURE_RECO` is off or as structural fallback.
 * Does not read async market data.
 */
export function HeroStatic({
  exploreListingsHref = "/listings",
  listPropertyHref = "/onboarding/broker",
  headline = "Smarter real estate starts here",
  subcopy = DEFAULT_SUBCOPY,
  userProfile,
  defaultCity,
  listingDetailBaseHref: listingDetailOverride,
}: {
  exploreListingsHref?: string;
  listPropertyHref?: string;
  headline?: string;
  subcopy?: string;
  userProfile?: UserProfile;
  defaultCity?: string;
  listingDetailBaseHref?: string;
}) {
  const listingDetail = listingDetailOverride ?? defaultListingDetailBaseFromListingsHref(exploreListingsHref);
  return (
    <HeroCtas
      headline={headline}
      subcopy={subcopy}
      exploreHref={exploreListingsHref}
      listHref={listPropertyHref}
      emphasis="explore"
      defaultCity={defaultCity}
      userProfile={userProfile}
      suggestionsEnabled={false}
      listingsBaseForSearch={exploreListingsHref}
      listingDetailBaseHref={listingDetail}
    />
  );
}

/**
 * High-conversion hero with optional personalization and demand-aware copy.
 * When `flags.RECOMMENDATIONS` is false, defers to {@link HeroStatic} (no async signals).
 */
export async function Hero({
  exploreListingsHref = "/listings",
  listPropertyHref = "/onboarding/broker",
  city,
  userProfile,
  ctaEmphasisOverride,
  listingDetailBaseHref: listingDetailOverride,
}: HeroProps) {
  if (!flags.RECOMMENDATIONS) {
    return (
      <HeroStatic
        exploreListingsHref={exploreListingsHref}
        listPropertyHref={listPropertyHref}
        userProfile={userProfile}
        defaultCity={city}
        listingDetailBaseHref={listingDetailOverride}
      />
    );
  }

  const signals = await getTrustSignals(city);
  const headline = getHeroHeadline(city, signals.demandLevel);
  const subcopy = getHeroSubcopy(userProfile?.behaviorType, DEFAULT_SUBCOPY);
  const preferredCity = userProfile?.preferredCities?.[0];
  const explorePrepared = buildExploreHrefWithCityPrefill(exploreListingsHref, preferredCity);
  const emphasis = getPrimaryCtaEmphasis(userProfile?.behaviorType, ctaEmphasisOverride);
  const trustLines = formatHeroTrustStrip(signals);
  const listingDetail = listingDetailOverride ?? defaultListingDetailBaseFromListingsHref(explorePrepared);
  const earlyUserSignals = await getEarlyUserSignals();
  const earlyUserLine =
    earlyUserSignals.remaining > 0 ? earlyUserHeroSubline(earlyUserSignals) : null;

  const userId = await getGuestId();
  const experimentVariant = await getExperimentVariant(userId, HERO_CTA_EXPERIMENT_KEY);
  const exploreCtaLabel = experimentVariant?.copy ?? "Explore Listings";
  const experimentTrackingKey = experimentVariant ? HERO_CTA_EXPERIMENT_KEY : undefined;

  return (
    <HeroCtas
      headline={headline}
      subcopy={subcopy}
      exploreHref={explorePrepared}
      listHref={listPropertyHref}
      emphasis={emphasis}
      trustLines={trustLines}
      defaultCity={city}
      userProfile={userProfile}
      suggestionsEnabled
      listingsBaseForSearch={explorePrepared}
      listingDetailBaseHref={listingDetail}
      earlyUserLine={earlyUserLine}
      exploreCtaLabel={exploreCtaLabel}
      experimentTrackingKey={experimentTrackingKey}
    />
  );
}
