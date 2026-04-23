import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ListingStatus, SearchEventType } from "@prisma/client";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { breadcrumbJsonLd, vacationRentalListingJsonLd } from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { getListingAverageRating } from "@/lib/bnhub/reviews";
import { getGuestId } from "@/lib/auth/session";
import { getExperimentBrowserSessionId } from "@/lib/experiments/browser-session";
import { EXPERIMENT_SURFACES } from "@/lib/experiments/constants";
import { resolveExperimentSurface } from "@/lib/experiments/get-variant-config";
import { ExperimentExposureTracker } from "@/components/experiments/ExperimentExposureTracker";
import { isTripleVerified } from "@/lib/verification/ownership";
import { requirePlatformAcceptance } from "@/lib/legal/require-acceptance";
import { BookingForm } from "./booking-form";
import { ListingImageGallery } from "./listing-image-gallery";
import { AvailabilityCalendar } from "./availability-calendar";
import { BuyerAdvisoryCard } from "@/components/ai/BuyerAdvisoryCard";
import { LogListingView } from "@/components/ai/LogListingView";
import { CopyListingCodeButton } from "@/components/bnhub/CopyListingCodeButton";
import { SaveListingButton } from "@/components/bnhub/SaveListingButton";
import { ListingStickyContactBar } from "@/components/bnhub/ListingStickyContactBar";
import { BrokerListingTopCtaStrip } from "@/components/bnhub/BrokerListingTopCtaStrip";
import { ListingSimilarProperties } from "@/components/bnhub/ListingSimilarProperties";
import { BnhubMobileStickyBookingBar } from "@/components/bnhub/BnhubMobileStickyBookingBar";
import { BnhubListingUrgencyStrip } from "@/components/bnhub/BnhubListingUrgencyStrip";
import { BnhubTrustSignals } from "@/components/bnhub/BnhubTrustSignals";
import { BnhubAdTrafficBanner } from "@/components/bnhub/BnhubAdTrafficBanner";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { VerifiedBrokerBadge } from "@/components/ui/VerifiedBrokerBadge";
import { parseListingDescription } from "@/lib/bnhub/listing-description";
import { BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT } from "@/lib/stripe/bnhubCheckoutConnectMode";
import { isStripeConfigured } from "@/lib/stripe";
import { getSimilarBnhubListings } from "@/lib/recommendations";
import { getListingPromotion } from "@/lib/promotions";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { ListingUserProvidedDisclaimer } from "@/components/legal/ListingUserProvidedDisclaimer";
import { GenerateOfferButton } from "@/components/offers/GenerateOfferButton";
import { prisma } from "@repo/db";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";
import { trackJourneyEvent } from "@/lib/journey/track-journey-event";
import { getBnhubWhyThisPropertyBullets } from "@/lib/ai/search/bnhubWhyThisProperty";
import { getLatestListingIntelligenceSnapshot } from "@/lib/ai/intelligence/getLatestListingIntelligence";
import {
  bnhubBookingPriceInsightDecisionLine,
  getBnhubMarketInsightForPublishedListing,
} from "@/lib/bnhub/market-price-insight";
import { resolveSoftDemandLineFromInsight } from "@/lib/bnhub/soft-demand-signals";
import { BnhubListingAiInsightPanels } from "@/components/bnhub/BnhubListingAiInsightPanels";
import { ListingLifestyleBadges } from "@/components/bnhub/ListingLifestyleBadges";
import { BnhubStayAiCards } from "@/components/ai/BnhubStayAiCards";
import { BnhubMarketPriceInsightCard } from "@/components/bnhub/BnhubMarketPriceInsightCard";
import { bnhubLimitedAvailabilityFromInsight, countBnhubListingViewsToday } from "@/lib/bnhub/bnhub-listing-urgency";
import {
  countListingBookingsLast7Days,
  defaultBnhubStayDateRange,
  guestReviewStrengthLabels,
} from "@/lib/bnhub/listing-conversion-stats";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";
import { BnhubAmenityIconGrid } from "@/components/bnhub/BnhubAmenityIconGrid";
import { BnhubHostCredibilityStrip } from "@/components/bnhub/BnhubHostCredibilityStrip";
import { FraudAlertBanner } from "@/components/bnhub/FraudAlertBanner";
import { loyaltyTierFromCompletedBookings } from "@/lib/loyalty/loyalty-engine";
import { ListingViewedBeacon } from "@/components/analytics/ListingViewedBeacon";
import { BnhubGuestConversionPropertyBoost } from "@/components/bnhub/BnhubGuestConversionPropertyBoost";
import { BnhubListingConversionBeacon } from "@/components/bnhub/BnhubListingConversionBeacon";
import { SocialAdLandingBeacon } from "@/components/analytics/SocialAdLandingBeacon";
import { BnhubListingContentAttribution } from "@/components/content-machine/BnhubListingContentAttribution";
import { BnhubStayScrollDepthBeacon } from "@/components/analytics/BnhubStayFunnelBeacons";
import { FunnelCtaAnchor } from "@/components/analytics/FunnelCtaAnchor";
import { ShareListingActions } from "@/components/sharing/ShareListingActions";
import { VerifiedListingBadge } from "@/components/listings/VerifiedListingBadge";
import { CroListingConversionTrustBlock } from "@/components/bnhub/CroListingConversionTrustBlock";
import {
  abTestingFlags,
  bnhubConversionLayerFlags,
  engineFlags,
  isBnhubConversionLayerFullyAligned,
} from "@/config/feature-flags";
import { buildListingConversionSummary } from "@/modules/bnhub/conversion/bnhub-listing-conversion.service";
import { conversionBoostFrictionMode } from "@/modules/bnhub/conversion/bnhub-conversion-funnel-diagnostics";
import { resolveBnhubListingCtas } from "@/modules/cro/cta-optimizer.service";
import { getPublicBadgesForListing } from "@/lib/trust/get-public-badges";
import { getReputationSurfaceForBnhubListing } from "@/lib/reputation/public-surface";
import { getPublicListingQualityBadge } from "@/lib/quality/public-surface";
import { LISTING_EXPLORE_NO_PAYMENT_LINE } from "@/lib/listings/listing-ad-trust-copy";
import type { LocaleCode } from "@/lib/i18n/types";
import { pickLocalizedField } from "@/lib/i18n/listing-localized";

function extractSqft(amenities: string[], description: string): string | null {
  const blob = [...amenities, description].join(" ");
  const m = blob.match(/(\d{2,5})\s*(sq\.?\s*ft|sf|sqft)\b/i);
  return m ? `${Number(m[1]).toLocaleString()} sq ft` : null;
}

function hasParking(amenities: string[], parkingDetails: string | null | undefined): string {
  if (parkingDetails?.trim()) return "Yes";
  const a = amenities.map((x) => x.toLowerCase());
  if (a.some((x) => x.includes("parking") || x.includes("garage") || x.includes("carport"))) return "Yes";
  return "—";
}

function normalizeAmenityLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function StatIcon({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="lecipm-bg-light-elevated flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl border border-neutral-200 px-4 py-4 text-center sm:min-w-0 sm:flex-1">
      <span className="text-[#006ce4] [&>svg]:h-6 [&>svg]:w-6">{children}</span>
      <span className="text-xs font-medium text-slate-800">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}

type BnhubListingForSeo = NonNullable<Awaited<ReturnType<typeof getCachedBnhubListingById>>>;

export function bnhubGalleryUrls(listing: BnhubListingForSeo): string[] {
  if (listing.listingPhotos?.length) {
    return listing.listingPhotos.map((p) => p.url).filter(Boolean);
  }
  const photos = listing.photos;
  return Array.isArray(photos) ? photos.filter((x): x is string => typeof x === "string") : [];
}

export async function BnhubListingView(opts: {
  routeLookupKey: string;
  /** Canonical path for JSON-LD + breadcrumbs (default: `/bnhub/{code}`). */
  seoCanonicalPath?: string;
  /** From URL query — prefill booking form after sign-in redirect */
  prefill?: { checkIn?: string; checkOut?: string; guests?: string };
  /** UTM present — ad-landing layout (banner, price emphasis). */
  adLanding?: boolean;
}) {
  const routeLookupKey = opts.routeLookupKey;
  const adLanding = opts.adLanding === true;
  const sessionIdForExperiments = await getExperimentBrowserSessionId();
  const [listing, guestId] = await Promise.all([
    getCachedBnhubListingById(routeLookupKey),
    getGuestId(),
  ]);
  if (!listing) notFound();

  const [expListingCta, expTrustLine, expBookingReassurance] = await Promise.all([
    resolveExperimentSurface(prisma, EXPERIMENT_SURFACES.BNHUB_LISTING_CTA, {
      sessionId: sessionIdForExperiments,
      userId: guestId,
    }),
    resolveExperimentSurface(prisma, EXPERIMENT_SURFACES.BNHUB_LISTING_TRUST_LINE, {
      sessionId: sessionIdForExperiments,
      userId: guestId,
    }),
    resolveExperimentSurface(prisma, EXPERIMENT_SURFACES.BNHUB_BOOKING_REASSURANCE, {
      sessionId: sessionIdForExperiments,
      userId: guestId,
    }),
  ]);

  const prefill = opts.prefill;
  const defaultDates = defaultBnhubStayDateRange();
  const initialCheckIn =
    typeof prefill?.checkIn === "string" && prefill.checkIn.trim() !== "" ? prefill.checkIn.trim() : defaultDates.checkIn;
  const initialCheckOut =
    typeof prefill?.checkOut === "string" && prefill.checkOut.trim() !== ""
      ? prefill.checkOut.trim()
      : defaultDates.checkOut;
  const guestsRaw = prefill?.guests;
  const initialGuestCountParsed =
    guestsRaw != null && String(guestsRaw).trim() !== ""
      ? Math.floor(Number.parseInt(String(guestsRaw), 10))
      : NaN;
  const initialGuestCount = Number.isFinite(initialGuestCountParsed)
    ? initialGuestCountParsed
    : Math.min(2, Math.max(1, listing.maxGuests));
  const listingStaySlug = listing.listingCode?.trim() || listing.id;

  const uiLocale = (await getLocale()) as LocaleCode;
  const displayTitle = pickLocalizedField(uiLocale, listing.title, listing.titleFr, listing.titleAr);
  const displayDescription = pickLocalizedField(
    uiLocale,
    listing.description ?? "",
    listing.descriptionFr,
    listing.descriptionAr
  );

  await requirePlatformAcceptance(guestId);

  await trackSearchEvent({
    eventType: SearchEventType.VIEW,
    userId: guestId,
    listingId: listing.id,
  });
  void trackJourneyEvent({
    name: "listing_view",
    listingId: listing.id,
    userId: guestId,
    source: "bnhub_stay_detail",
    metadata: { listingCode: listing.listingCode },
  });

  const whyThisProperty = await getBnhubWhyThisPropertyBullets(
    { id: listing.id, city: listing.city, nightPriceCents: listing.nightPriceCents },
    guestId
  );

  const intelligenceSnapshot = await getLatestListingIntelligenceSnapshot(listing.id);

  const [tripleVerified, promotion, similar, loyaltyProfile, trustPack, repSurface, qualityBadge] =
    await Promise.all([
    isTripleVerified(listing.id),
    getListingPromotion(listing.id),
    getSimilarBnhubListings({
      listingId: listing.id,
      city: listing.city,
      country: listing.country,
      nightPriceCents: listing.nightPriceCents,
      propertyType: listing.propertyType,
      maxGuests: initialGuestCount,
      beds: listing.beds,
      region: listing.region,
      amenities: listing.amenities,
      ownerId: listing.ownerId,
      checkIn: initialCheckIn,
      checkOut: initialCheckOut,
      limit: 6,
    }),
    guestId
      ? prisma.userLoyaltyProfile.findUnique({
          where: { userId: guestId },
          select: { completedBookings: true },
        })
      : Promise.resolve(null),
    getPublicBadgesForListing(listing.id, listing.ownerId).catch(() => ({
      listingBadges: [],
      hostBadges: [],
      listingTrust: undefined,
      hostTrust: undefined,
    })),
    getReputationSurfaceForBnhubListing(listing.id, listing.ownerId).catch(() => ({
      listing: null,
      host: null,
      listingBadges: [],
      hostBadges: [],
    })),
    getPublicListingQualityBadge(listing.id).catch(() => null),
  ]);

  const loyaltyTierInfo = loyaltyTierFromCompletedBookings(loyaltyProfile?.completedBookings ?? 0);
  const loyaltyTierBadge = guestId
    ? loyaltyTierInfo.tier === "NONE"
      ? `Member · ${loyaltyTierInfo.explanation}`
      : `${loyaltyTierInfo.label} tier · up to ${loyaltyTierInfo.discountPercent}% off lodging`
    : null;

  const avgRating = getListingAverageRating(listing.reviews);
  const hostDisplayRating =
    avgRating ??
    (listing.owner.hostQuality?.qualityScore != null
      ? Math.round(listing.owner.hostQuality.qualityScore * 10) / 10
      : null);
  const hostCredibilityRatingSource =
    avgRating != null
      ? "reviews"
      : listing.owner.hostQuality?.qualityScore != null
        ? "host_quality"
        : "none";
  const galleryPhotos = listing.listingPhotos?.length
    ? listing.listingPhotos.map((p) => p.url)
    : Array.isArray(listing.photos)
      ? (listing.photos as string[])
      : [];
  const amenities = Array.isArray(listing.amenities) ? (listing.amenities as string[]) : [];
  const descParsed = parseListingDescription(displayDescription || listing.description);
  const sqft = extractSqft(amenities, displayDescription ?? listing.description ?? "");
  const parkingLabel = hasParking(amenities, listing.parkingDetails);

  const bnhubAiListing = {
    listingId: listing.id,
    title: displayTitle,
    city: listing.city,
    country: listing.country,
    nightPriceCents: listing.nightPriceCents,
    cleaningFeeCents: listing.cleaningFeeCents ?? 0,
    maxGuests: listing.maxGuests,
    beds: listing.beds,
    baths: listing.baths,
    petsAllowed: listing.petsAllowed,
    partyAllowed: listing.partyAllowed,
    smokingAllowed: listing.smokingAllowed,
    kidsAllowed: listing.kidsAllowed,
    familyFriendly: listing.familyFriendly,
    noiseLevel: listing.noiseLevel ?? null,
    cancellationPolicy: listing.cancellationPolicy ?? null,
    houseRulesExcerpt: (listing.houseRules ?? "").slice(0, 1200),
    amenitiesSample: amenities.slice(0, 14),
  };

  const createdAt = new Date(listing.createdAt);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
  const isNew = createdAt >= fourteenDaysAgo;
  const isFeatured = promotion != null;
  const priceDrop = false;

  const hostPayoutReady = BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT
    ? true
    : Boolean(listing.owner.stripeAccountId && listing.owner.stripeOnboardingComplete);

  const isBrokerListing = listing.listingAuthorityType === "BROKER";
  const contactLabel = isBrokerListing ? "Contact broker" : "Contact host";
  const supportTel = getPhoneTelLink();
  const supportDisplay = getPhoneNumber();

  const locationLine = [listing.city, listing.region || listing.province, listing.country]
    .filter(Boolean)
    .join(", ");

  const viewer = guestId
    ? await prisma.user.findUnique({ where: { id: guestId }, select: { role: true } })
    : null;
  const canGenerateOffer = viewer?.role === "BROKER" || viewer?.role === "ADMIN";

  const [trustSnapshot, fraudAgg, bnhubMarketInsight, viewsToday, bookingsThisWeek] = await Promise.all([
    generateListingTrustScore(listing.id).catch(() => ({
      score: 50,
      badge: "medium" as const,
      breakdown: { completeness: 0, verification: 0, reviews: 0 },
    })),
    prisma.propertyFraudScore.findUnique({ where: { listingId: listing.id } }),
    getBnhubMarketInsightForPublishedListing(listing.id),
    countBnhubListingViewsToday(listing.id),
    countListingBookingsLast7Days(listing.id),
  ]);

  const limitedAvailability = bnhubLimitedAvailabilityFromInsight(bnhubMarketInsight);

  const bookingPriceInsightLine = bnhubMarketInsight
    ? bnhubBookingPriceInsightDecisionLine(bnhubMarketInsight)
    : "Not enough comparable stays in this area on BNHUB to benchmark — use photos, reviews, and amenities to decide.";
  const listingSoftDemandLine = bnhubMarketInsight
    ? resolveSoftDemandLineFromInsight(bnhubMarketInsight)
    : null;

  const seoPath =
    opts.seoCanonicalPath ??
    `/bnhub/${encodeURIComponent(listing.listingCode || routeLookupKey)}`;
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const listingShareUrl = `${base}/listings/${listing.id}`;
  const absUrl = `${base}${seoPath}`;
  const nightlyNum = listing.nightPriceCents / 100;
  const nightlyLabel = nightlyNum.toLocaleString("en-CA", {
    minimumFractionDigits: nightlyNum % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  /** Sample 2-night total for above-the-fold estimate (matches booking form service-fee heuristic). */
  const SAMPLE_STAY_NIGHTS: number = 2;
  const sampleLodgingCents = listing.nightPriceCents * SAMPLE_STAY_NIGHTS;
  const sampleCleaningCents = listing.cleaningFeeCents ?? 0;
  const sampleServiceFeeCents = Math.round((sampleLodgingCents * 12) / 100);
  const sampleTotalEstimateCents = sampleLodgingCents + sampleCleaningCents + sampleServiceFeeCents;
  const currencyCode = (listing.currency ?? "CAD").toUpperCase();
  const conversionAligned = isBnhubConversionLayerFullyAligned();
  const conversionFrictionMode = conversionBoostFrictionMode(
    bnhubConversionLayerFlags.conversionV1 && conversionAligned
      ? (await buildListingConversionSummary(listing.id).catch(() => null))?.metrics ?? null
      : null,
    conversionAligned,
  );
  const formatListingMoney = (cents: number) =>
    (cents / 100).toLocaleString(undefined, { style: "currency", currency: currencyCode });
  const stripeCheckoutAvailable = isStripeConfigured() && hostPayoutReady;
  const resolvedHeroCtas = resolveBnhubListingCtas({
    listingId: listing.id,
    experimentPrimary: expListingCta?.config.ctaText ?? null,
    rotationEnabled: engineFlags.croEngineV1 || abTestingFlags.abTestingV1,
  });
  const primaryBookCta = resolvedHeroCtas.primary;
  const secondaryHeroCta = resolvedHeroCtas.secondary;
  const trustLineExperimentActive = Boolean(expTrustLine);
  const showStripeTrustLine = trustLineExperimentActive
    ? expTrustLine!.config.showTrustLine === true
    : Boolean(stripeCheckoutAvailable);
  const stripeTrustLineCaption =
    trustLineExperimentActive && expTrustLine!.config.showTrustLine === true
      ? expTrustLine!.config.trustLineText?.trim() || "Secure payment via Stripe"
      : "Secure payment via Stripe";
  const reassuranceUnderCta =
    expBookingReassurance?.config.reassuranceText?.trim() ||
    expBookingReassurance?.config.reassuranceCopy?.trim() ||
    "No charge until confirmation";
  const bnhubShareSummary = `${displayTitle} — $${nightlyLabel} CAD/night · ${listing.city} · LECIPM BNHUB`;
  const galleryForLd = bnhubGalleryUrls(listing);
  const galleryAbsForLd = galleryForLd.map((u) =>
    u.startsWith("http://") || u.startsWith("https://") ? u : `${base}${u.startsWith("/") ? u : `/${u}`}`,
  );
  const vacationLd =
    listing.listingStatus === ListingStatus.PUBLISHED
      ? vacationRentalListingJsonLd({
          url: absUrl,
          name: displayTitle,
          description:
            (displayDescription || (listing.description ?? "")).replace(/\s+/g, " ").trim().slice(0, 500) ||
            `Vacation rental in ${listing.city}.`,
          city: listing.city,
          region: listing.region ?? listing.province,
          country: listing.country,
          nightPriceCents: listing.nightPriceCents,
          currency: listing.currency ?? "CAD",
          imageUrls: galleryForLd,
          numberOfRooms: listing.bedrooms ?? listing.beds,
          roomTypeLabel: listing.roomType,
          latitude: listing.latitude,
          longitude: listing.longitude,
        })
      : null;
  const stayProductLd =
    listing.listingStatus === ListingStatus.PUBLISHED
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: displayTitle,
          description:
            (displayDescription || (listing.description ?? "")).replace(/\s+/g, " ").trim().slice(0, 500) ||
            `Short-term stay in ${listing.city}.`,
          url: absUrl,
          ...(galleryAbsForLd.length ? { image: galleryAbsForLd } : {}),
          offers: {
            "@type": "Offer",
            priceCurrency: (listing.currency ?? "CAD").toUpperCase(),
            price: (listing.nightPriceCents / 100).toFixed(2),
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: (listing.nightPriceCents / 100).toFixed(2),
              priceCurrency: (listing.currency ?? "CAD").toUpperCase(),
              unitCode: "DAY",
            },
            availability: "https://schema.org/InStock",
            url: absUrl,
          },
        }
      : null;
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Stays", path: "/bnhub/stays" },
    { name: displayTitle, path: seoPath },
  ]);

  const sortedGuestReviews = [...listing.reviews].sort((a, b) => b.propertyRating - a.propertyRating);
  const guestStrengthLabels = guestReviewStrengthLabels(listing.reviews);

  return (
    <>
      <ExperimentExposureTracker
        surfaces={[
          expListingCta ? { experimentId: expListingCta.experimentId, variantId: expListingCta.variantId } : null,
          expTrustLine ? { experimentId: expTrustLine.experimentId, variantId: expTrustLine.variantId } : null,
          expBookingReassurance
            ? { experimentId: expBookingReassurance.experimentId, variantId: expBookingReassurance.variantId }
            : null,
        ].filter((x): x is { experimentId: string; variantId: string } => Boolean(x))}
        eventName="listing_view"
        metadata={{ listingId: listing.id }}
      />
      {vacationLd ? <JsonLdScript data={vacationLd} /> : null}
      {stayProductLd ? <JsonLdScript data={stayProductLd} /> : null}
      <JsonLdScript data={crumbLd} />
      <main
        className={`lecipm-bg-light-page min-h-screen scroll-smooth text-slate-900 ${isBrokerListing ? "pb-28" : "pb-36 lg:pb-32"}`}
      >
      <SocialAdLandingBeacon listingId={listing.id} surface="bnhub_stay" />
      <Suspense fallback={null}>
        <BnhubListingContentAttribution listingId={listing.id} />
      </Suspense>
      <ListingViewedBeacon
        listingId={listing.id}
        surface="bnhub"
        city={listing.city}
        listingKind="bnhub"
      />
      <BnhubStayScrollDepthBeacon listingId={listing.id} />
      {guestId ? <LogListingView listingId={listing.id} /> : null}

      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="lecipm-safe-gutter-x mx-auto max-w-6xl py-2 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/bnhub/stays" className="text-sm font-medium text-[#006ce4] hover:underline">
              ← Back to search
            </Link>
            <Link
              href="/search/bnhub"
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Search by location, price, or listing ID (e.g. LEC-10001)
            </Link>
          </div>
        </div>
      </section>

      {adLanding ? (
        <section className="border-b border-[#006ce4]/15 bg-gradient-to-b from-sky-50/90 to-neutral-50">
          <div className="lecipm-safe-gutter-x mx-auto max-w-6xl py-3 sm:py-4">
            <BnhubAdTrafficBanner
              city={listing.city}
              verified={listing.verificationStatus === "VERIFIED"}
              stripeCheckoutAvailable={stripeCheckoutAvailable}
            />
          </div>
        </section>
      ) : null}

      {/* Above the fold: price, location, key facts, ID — optimized for scan + conversion */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        {isBrokerListing ? <BrokerListingTopCtaStrip listingId={listing.id} /> : null}
        <div className="lecipm-safe-gutter-x mx-auto max-w-6xl pb-6 pt-4 md:pb-8 md:pt-5">
          {/* Mobile: title + price + Book first. Desktop: gallery left, booking column right — all above the fold on xl */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
            <div className="order-2 flex min-w-0 flex-col lg:order-2 lg:col-span-5 lg:sticky lg:top-20 lg:z-10 lg:self-start">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl xl:text-4xl">
                {displayTitle}
              </h1>
              <p className="mt-1.5 text-base font-medium text-slate-700">{locationLine}</p>
              {hostDisplayRating != null && hostDisplayRating > 0 ? (
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  ★ {hostDisplayRating.toFixed(1)} · {listing.reviews.length} review{listing.reviews.length !== 1 ? "s" : ""}
                  {listing.verificationStatus === "VERIFIED" ? (
                    <span className="ml-2 text-xs font-medium text-emerald-700">· Verified</span>
                  ) : null}
                </p>
              ) : listing.reviews.length > 0 ? (
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {listing.reviews.length} guest review{listing.reviews.length !== 1 ? "s" : ""}
                </p>
              ) : null}
              <div className="mt-3">
                <BnhubListingUrgencyStrip
                  viewsToday={viewsToday}
                  limitedAvailability={limitedAvailability}
                  bookingsThisWeek={bookingsThisWeek}
                  showEarlyAccessPricing={isNew}
                  compact
                />
              </div>

              {/* Above-the-fold conversion — price, estimate, primary CTA, trust (scan in ~3s) */}
              <div
                className={`mt-4 rounded-2xl border-2 border-[#006ce4]/25 bg-white p-4 sm:p-5 ${
                  adLanding ? "shadow-xl ring-2 ring-[#006ce4]/35" : "shadow-md ring-1 ring-black/[0.04]"
                }`}
              >
                {!hostPayoutReady ? (
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                    Host is finishing payout setup — booking may be limited until then.
                  </p>
                ) : null}
                <dl className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt
                      className={
                        adLanding
                          ? "text-base font-semibold text-slate-700"
                          : "text-sm font-medium text-slate-600"
                      }
                    >
                      Price per night
                    </dt>
                    <dd
                      className={
                        adLanding
                          ? "text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl"
                          : "text-lg font-bold tabular-nums text-slate-900 sm:text-xl"
                      }
                    >
                      {formatListingMoney(listing.nightPriceCents)}
                      <span
                        className={
                          adLanding
                            ? "ml-1.5 text-base font-semibold text-slate-500 sm:text-lg"
                            : "ml-1 text-sm font-semibold text-slate-500"
                        }
                      >
                        / night
                      </span>
                      {listing.instantBookEnabled ? (
                        <span className="ml-2 text-xs font-semibold text-[#006ce4]">· Instant book</span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-200/80 pt-3">
                    <dt className="text-sm font-medium text-slate-600">Nights</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">
                      {SAMPLE_STAY_NIGHTS}{" "}
                      {SAMPLE_STAY_NIGHTS === 1 ? "night" : "nights"}{" "}
                      <span className="text-xs font-normal text-slate-500">(example stay)</span>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-200/80 pt-3">
                    <dt className="text-sm font-semibold text-slate-800">Total before payment</dt>
                    <dd
                      className={
                        adLanding
                          ? "text-3xl font-bold tabular-nums text-slate-900 sm:text-[2rem]"
                          : "text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl"
                      }
                    >
                      {formatListingMoney(sampleTotalEstimateCents)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 rounded-lg bg-emerald-50/90 px-3 py-2 text-center text-[12px] font-semibold leading-snug text-emerald-950 ring-1 ring-emerald-200/80">
                  No hidden fees — total is built from nightly rate, cleaning, service fee, and taxes shown before you
                  pay.
                </p>
                <p className="mt-3 text-[11px] leading-snug text-slate-600">
                  Example for {SAMPLE_STAY_NIGHTS} nights: lodging
                  {sampleCleaningCents > 0 ? ` + cleaning (${formatListingMoney(sampleCleaningCents)})` : " + no cleaning fee"} +
                  service fee. Government taxes may be added at checkout. Choose your dates below for an exact total
                  before payment.
                </p>
                {bookingPriceInsightLine ? (
                  <p className="mt-2 rounded-lg bg-sky-50/90 px-3 py-2 text-[12px] font-medium leading-snug text-sky-950 ring-1 ring-sky-100">
                    {bookingPriceInsightLine}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                  <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:max-w-md">
                    <FunnelCtaAnchor
                      listingId={listing.id}
                      cta="reserve_hero"
                      href="#availability"
                      className="inline-flex min-h-[58px] w-full items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 px-8 text-base font-extrabold tracking-tight text-slate-900 shadow-[0_4px_14px_rgba(180,83,9,0.45)] ring-2 ring-amber-300/90 ring-offset-2 ring-offset-white transition hover:from-amber-300 hover:via-amber-400 hover:to-amber-600 hover:shadow-[0_6px_20px_rgba(180,83,9,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-[0.99] sm:min-w-[220px]"
                    >
                      {primaryBookCta}
                    </FunnelCtaAnchor>
                    <FunnelCtaAnchor
                      listingId={listing.id}
                      cta="check_availability_hero"
                      href="#availability"
                      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                      {secondaryHeroCta}
                    </FunnelCtaAnchor>
                    <p className="text-center text-[12px] font-semibold leading-snug text-slate-700 sm:text-left">
                      {reassuranceUnderCta}
                    </p>
                    {showStripeTrustLine ? (
                      <p className="text-center text-[11px] font-medium text-slate-500 sm:text-left">{stripeTrustLineCaption}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/messages?host=${listing.owner.id}&listing=${listing.id}`}
                    className="inline-flex min-h-[56px] flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 text-base font-semibold text-slate-800 transition hover:bg-slate-50 sm:mt-0 sm:flex-none"
                    title="Secondary: message the host or broker"
                  >
                    {contactLabel}
                  </Link>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <BnhubTrustSignals stripeCheckoutAvailable={stripeCheckoutAvailable} variant="light" />
                </div>
                {engineFlags.croEngineV1 || engineFlags.conversionOptimizationV1 ? (
                  <CroListingConversionTrustBlock
                    listingVerified={listing.verificationStatus === "VERIFIED"}
                    stripeCheckoutAvailable={stripeCheckoutAvailable}
                  />
                ) : null}
                {bnhubConversionLayerFlags.conversionV1 ? (
                  <BnhubGuestConversionPropertyBoost
                    verified={tripleVerified || listing.verificationStatus === "VERIFIED"}
                    highDemandArea={bnhubMarketInsight?.demandLevel === "high"}
                    recentlyViewed={viewsToday > 0}
                    recentlyBooked={bookingsThisWeek > 0}
                    frictionMode={conversionFrictionMode}
                    conversionAligned={conversionAligned}
                    sampleStayNights={SAMPLE_STAY_NIGHTS}
                    nightPriceCents={listing.nightPriceCents}
                    cleaningFeeCents={listing.cleaningFeeCents ?? 0}
                    sampleTotalEstimateCents={sampleTotalEstimateCents}
                    currencyCode={currencyCode}
                  />
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isNew ? (
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-200">
                    New listing
                  </span>
                ) : null}
                {listing.verificationStatus === "VERIFIED" && (
                  <VerifiedListingBadge variant="light" layout="inline" className="shrink-0" />
                )}
                {qualityBadge ? (
                  <span
                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/90"
                    title={qualityBadge.title}
                  >
                    {qualityBadge.label}
                  </span>
                ) : null}
                {trustPack.listingBadges.map((b) => (
                  <span
                    key={b.id}
                    className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200"
                    title="Platform trust signal"
                  >
                    {b.label}
                  </span>
                ))}
                {trustPack.hostBadges.map((b) => (
                  <span
                    key={`h-${b.id}`}
                    className="rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-xs font-medium text-fuchsia-900 ring-1 ring-fuchsia-200"
                    title="Host trust signal"
                  >
                    {b.label}
                  </span>
                ))}
                {repSurface.listingBadges.map((b) => (
                  <span
                    key={`r-l-${b.id}`}
                    className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-900 ring-1 ring-teal-200"
                    title="Reputation"
                  >
                    {b.label}
                  </span>
                ))}
                {repSurface.hostBadges.map((b) => (
                  <span
                    key={`r-h-${b.id}`}
                    className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-900 ring-1 ring-cyan-200"
                    title="Host reputation"
                  >
                    {b.label}
                  </span>
                ))}
                {repSurface.listing || repSurface.host ? (
                  <span className="text-[11px] font-medium text-slate-600" title="Platform reputation score (0–100)">
                    Rep {repSurface.listing?.score ?? "—"}/100 listing · {repSurface.host?.score ?? "—"}/100 host
                  </span>
                ) : null}
                {isBrokerListing ? (
                  <VerifiedBrokerBadge className="bg-emerald-50 text-emerald-900 ring-emerald-200" />
                ) : null}
                {tripleVerified && (
                  <span
                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                    title="Cadastre verified; identity verified; location verified"
                  >
                    Verified property
                  </span>
                )}
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                  Protected booking
                </span>
                {listing.owner?.hostQuality?.avgResponseMinutes != null &&
                listing.owner.hostQuality.avgResponseMinutes > 0 &&
                listing.owner.hostQuality.avgResponseMinutes <= 24 * 60 ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                    Fast response
                  </span>
                ) : null}
                {listing.owner?.hostQuality?.isSuperHost && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    Super Host
                  </span>
                )}
              </div>
              <BnhubHostCredibilityStrip
                displayRating={hostDisplayRating}
                ratingSource={hostCredibilityRatingSource}
                reviewCount={listing.reviews.length}
                avgResponseMinutes={listing.owner.hostQuality?.avgResponseMinutes ?? null}
              />
              <div className="mt-4 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <SaveListingButton listingId={listing.id} />
                <ShareListingActions
                  shareTitle={`${displayTitle} · ${listing.city}`}
                  shareText={bnhubShareSummary}
                  url={listingShareUrl}
                  tone="light"
                  variant="unified"
                  className="w-full min-w-0 sm:max-w-md"
                />
              </div>
              <div className="mt-3 max-w-2xl">
                <FraudAlertBanner fraudScore={fraudAgg?.fraudScore ?? null} riskLevel={fraudAgg?.riskLevel ?? null} />
              </div>
              {listingSoftDemandLine ? (
                <p className="mt-3 text-xs font-medium leading-snug text-slate-600">{listingSoftDemandLine}</p>
              ) : null}
              {limitedAvailability ? (
                <p className="mt-1 text-[11px] font-medium text-amber-900/90">
                  Strong demand in this area — pick dates early for the best rates.
                </p>
              ) : null}
            </div>

            <div className="order-1 min-w-0 lg:order-1 lg:col-span-7">
              <ListingImageGallery
                photos={galleryPhotos}
                listingId={listing.id}
                imageAltBase={displayTitle}
                verified={listing.verificationStatus === "VERIFIED"}
                badges={{
                  isNew,
                  isFeatured,
                  priceDrop,
                }}
              />
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-neutral-200/80 pt-6">
            {whyThisProperty.length > 0 ? (
              <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Why this property?</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                  {whyThisProperty.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {bnhubMarketInsight ? (
              <div>
                <BnhubListingAiInsightPanels
                  market={bnhubMarketInsight}
                  trustScore0to100={trustSnapshot.score}
                  snapshot={intelligenceSnapshot}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-100/80 p-4 text-sm text-slate-600 md:p-5">
                AI Market Insight and AI Investment Score load when BNHUB pricing data is available for this stay.
              </div>
            )}
            <p className="text-sm text-slate-500">
              {listing.beds} beds · {listing.baths} baths
              {listing.propertyType ? ` · ${listing.propertyType}` : ""}
              {listing.roomType ? ` · ${listing.roomType}` : ""}
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stay environment</p>
              <ListingLifestyleBadges
                noiseLevel={listing.noiseLevel}
                familyFriendly={listing.familyFriendly}
                petsAllowed={listing.petsAllowed}
                allowedPetTypes={listing.allowedPetTypes}
                maxPetWeightKg={listing.maxPetWeightKg}
                petRules={listing.petRules}
                experienceTags={listing.experienceTags}
                servicesOffered={listing.servicesOffered}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Listing ID</span>
              <span className="font-mono text-sm font-medium text-slate-800">{listing.listingCode}</span>
              <CopyListingCodeButton listingCode={listing.listingCode} variant="light" />
            </div>
          </div>

          <ListingUserProvidedDisclaimer className="mt-4 max-w-3xl" />

          {canGenerateOffer ? <GenerateOfferButton listingId={listing.id} offerType="purchase_offer" /> : null}

          <div className="mt-4 flex flex-wrap justify-between gap-3 sm:gap-4">
            <StatIcon label="Bedrooms" value={String(listing.beds)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008z"
                />
              </svg>
            </StatIcon>
            <StatIcon label="Bathrooms" value={String(listing.baths)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008z"
                />
              </svg>
            </StatIcon>
            <StatIcon label="Area" value={sqft ?? "—"}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </StatIcon>
            <StatIcon label="Parking" value={parkingLabel}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375A1.125 1.125 0 012.25 17.625V9.75A2.25 2.25 0 014.5 7.5h15a2.25 2.25 0 012.25 2.25v7.875a1.125 1.125 0 01-1.125 1.125H18m-9.75-9h9.75"
                />
              </svg>
            </StatIcon>
          </div>

          <div className="mt-4">
            <TrustStrip audience="stays" dense />
          </div>
          <nav className="mt-4 overflow-x-auto border-b border-neutral-200">
            <div className="flex min-w-max gap-4 text-sm font-semibold text-slate-600">
              <a href="#overview" className="border-b-2 border-[#006ce4] pb-3 text-[#006ce4]">Overview</a>
              <FunnelCtaAnchor
                listingId={listing.id}
                cta="nav_apartment_info"
                href="#availability"
                className="pb-3 hover:text-slate-900"
              >
                Apartment info & price
              </FunnelCtaAnchor>
              <a href="#facilities" className="pb-3 hover:text-slate-900">Facilities</a>
              <a href="#house-rules" className="pb-3 hover:text-slate-900">House rules</a>
              <a href="#reviews" className="pb-3 hover:text-slate-900">Guest reviews</a>
              <a href="#area-info" className="pb-3 hover:text-slate-900">Area info</a>
            </div>
          </nav>
        </div>
      </section>

      <section className="lecipm-bg-light-page" id="overview">
        <div className="lecipm-safe-gutter-x mx-auto max-w-6xl py-8 md:py-10">
          <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:gap-6">
            <div>
              <BuyerAdvisoryCard listingId={listing.id} />

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:p-5">
                <h2 className="text-base font-semibold text-slate-900">Popular amenities</h2>
                <p className="mt-1 text-xs text-slate-500">Key features at a glance</p>
                <div className="mt-4">
                  <BnhubAmenityIconGrid
                    items={
                      amenities.length
                        ? amenities.slice(0, 10)
                        : ["Free WiFi", "Kitchen", "Air conditioning", "Private bathroom", "Non-smoking rooms"]
                    }
                    normalize={normalizeAmenityLabel}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                <h2 className="text-lg font-semibold text-slate-900">What this place offers</h2>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <li>{listing.beds} bed{listing.beds !== 1 ? "s" : ""}</li>
                  <li>{listing.baths} bath{listing.baths !== 1 ? "s" : ""}</li>
                  <li>Up to {listing.maxGuests} guests</li>
                  <li>
                    {listing.city}, {listing.country}
                  </li>
                  {amenities.length ? amenities.slice(0, 6).map((a) => <li key={a}>{a}</li>) : null}
                </ul>
              </div>

              {listing.houseRules && (
                <div id="house-rules" className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                  <h2 className="text-lg font-semibold text-slate-900">House rules</h2>
                  <p className="mt-2 text-sm text-slate-600">{listing.houseRules}</p>
                  {listing.checkInTime && (
                    <p className="mt-2 text-sm text-slate-600">
                      Check-in: {listing.checkInTime}
                      {listing.checkOutTime && ` · Check-out: ${listing.checkOutTime}`}
                    </p>
                  )}
                </div>
              )}

                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Hosted by {listing.owner.name ?? "Host"}
                  {listing.owner?.hostQuality?.isSuperHost && <span className="ml-2 text-amber-400">Super Host</span>}
                </h2>
                {listing.owner?.hostQuality && (
                  <p className="mt-1 text-sm text-slate-600">
                    Host quality score: {listing.owner.hostQuality.qualityScore.toFixed(1)} / 5
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-600">Your host for this stay.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/messages?host=${listing.owner.id}&listing=${listing.id}`}
                    className="rounded-lg bg-[#006ce4] px-3 py-2 text-sm font-medium text-white hover:bg-[#0057b8]"
                  >
                    {contactLabel}
                  </Link>
                  <Link
                    href={`/bnhub/report-issue?listingId=${listing.id}`}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-neutral-100 hover:text-slate-900"
                  >
                    Report this listing
                  </Link>
                </div>
                {supportDisplay ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Platform support:{" "}
                    <a href={supportTel || `tel:${supportDisplay}`} className="text-[#006ce4] hover:underline">
                      {supportDisplay}
                    </a>
                  </p>
                ) : null}
              </div>

              {listing.description && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                  <h2 className="text-lg font-semibold text-slate-900">About this place</h2>
                  {descParsed.intro ? (
                    <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/80">In short</p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">{descParsed.intro}</p>
                    </div>
                  ) : null}
                  {descParsed.bullets.length > 0 ? (
                    <>
                      <h3 className="mt-5 text-sm font-semibold text-slate-900">Highlights</h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                        {descParsed.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {descParsed.fullDescription ? (
                    <div className="mt-4 border-t border-neutral-200 pt-4">
                      <h3 className="text-sm font-medium text-slate-500">Full description</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{descParsed.fullDescription}</p>
                    </div>
                  ) : !descParsed.intro && !descParsed.bullets.length ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{listing.description}</p>
                  ) : null}
                </div>
              )}

              <ListingSimilarProperties items={similar} />

              {listing.latitude != null && listing.longitude != null && (
                <div id="area-info" className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Location</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {listing.address}, {listing.city}, {listing.country}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#006ce4] hover:underline"
                  >
                    View on map →
                  </a>
                  <iframe
                    title="Map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.02}%2C${listing.latitude - 0.01}%2C${listing.longitude + 0.02}%2C${listing.latitude + 0.01}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                    className="mt-3 h-64 w-full rounded-lg border-0"
                    loading="lazy"
                  />
                  <p className="mt-4 text-sm text-slate-600">
                    Use the map to explore the area — distances and routes depend on how you travel. Ask the host about
                    nearby favorites for your stay.
                  </p>
                </div>
              )}

              {listing.reviews.length > 0 && (
                <div id="reviews" className="mt-8">
                  <h2 className="text-lg font-semibold text-slate-900">Guest reviews</h2>
                  {guestStrengthLabels.length > 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Guests often mention:{" "}
                      <span className="font-semibold text-slate-800">{guestStrengthLabels.join(" · ")}</span>
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-3">
                    {sortedGuestReviews.map((r) => (
                      <li key={r.id} className="rounded-xl border border-neutral-200 bg-neutral-100 p-3">
                        <p className="text-sm font-medium text-slate-800">
                          ★ {r.propertyRating} · {r.guest.name ?? "Guest"}
                        </p>
                        {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">Travelers are asking</h2>
                  <FunnelCtaAnchor
                    listingId={listing.id}
                    cta="see_availability_faq"
                    href="#availability"
                    className="text-sm font-semibold text-[#006ce4] hover:underline"
                  >
                    See availability
                  </FunnelCtaAnchor>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    "What are the check-in and check-out times?",
                    "How far is this stay from downtown?",
                    "Is there parking available?",
                    "What is the Wi-Fi policy?",
                    "Is airport pickup available?",
                    "Are pets allowed?",
                  ].map((q) => (
                    <details key={q} className="rounded-xl border border-neutral-200 bg-neutral-100 p-4">
                      <summary className="cursor-pointer list-none font-medium text-slate-800">{q}</summary>
                      <p className="mt-3 text-sm text-slate-600">
                        Contact the host or continue to booking to see the most accurate policy details for your selected dates.
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            <div id="availability" className="scroll-mt-24 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-4 shadow-sm md:p-5">
                <BnhubListingUrgencyStrip
                  viewsToday={viewsToday}
                  limitedAvailability={limitedAvailability}
                  bookingsThisWeek={bookingsThisWeek}
                  showEarlyAccessPricing={isNew}
                  compact
                />
                <dl className="mt-3 space-y-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600">Price per night</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">
                      {formatListingMoney(listing.nightPriceCents)}
                      {listing.instantBookEnabled ? (
                        <span className="ml-1.5 text-[10px] font-medium text-[#006ce4]">· Instant</span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-neutral-100 pt-2.5">
                    <dt className="text-slate-600">Nights</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">
                      {SAMPLE_STAY_NIGHTS} {SAMPLE_STAY_NIGHTS === 1 ? "night" : "nights"}{" "}
                      <span className="text-[11px] font-normal text-slate-500">(example)</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-neutral-100 pt-2.5">
                    <dt className="font-semibold text-slate-800">Total before payment</dt>
                    <dd className="text-lg font-bold tabular-nums text-slate-900">{formatListingMoney(sampleTotalEstimateCents)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                  Example total includes lodging, cleaning, and service fee. Taxes may be added at checkout.
                </p>
                {listing.cleaningFeeCents > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Cleaning fee (per stay): {formatListingMoney(listing.cleaningFeeCents)}</p>
                )}
                <div className="mt-3 border-t border-neutral-200/80 pt-3">
                  <BnhubTrustSignals stripeCheckoutAvailable={stripeCheckoutAvailable} variant="sidebar" />
                </div>
                <BnhubMarketPriceInsightCard listingId={listing.id} />
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-100 p-4">
                  <p className="text-sm font-semibold text-slate-900">Good to know</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    <li>You&apos;ll get the entire place to yourself if available for your dates.</li>
                    <li>Protected booking support is included through the platform.</li>
                    <li>Hosts and guests are both notified after payment confirmation.</li>
                  </ul>
                </div>
                <p className="mb-1 text-center text-xs font-semibold text-slate-700">
                  {LISTING_EXPLORE_NO_PAYMENT_LINE}
                </p>
                <p className="mt-4 text-center text-sm text-slate-600">
                  Select check-in and check-out below for your <span className="font-semibold text-slate-800">exact</span>{" "}
                  total before payment.
                </p>
                <BookingForm
                  listingId={listing.id}
                  listingStaySlug={listingStaySlug}
                  initialCheckIn={initialCheckIn}
                  initialCheckOut={initialCheckOut}
                  initialGuestCount={initialGuestCount}
                  nightPriceCents={listing.nightPriceCents}
                  cleaningFeeCents={listing.cleaningFeeCents ?? 0}
                  instantBookEnabled={listing.instantBookEnabled ?? false}
                  guestId={guestId}
                  houseRules={listing.houseRules}
                  cancellationPolicy={listing.cancellationPolicy}
                  hostPayoutReady={hostPayoutReady}
                  petsAllowed={listing.petsAllowed}
                  maxPetWeightKg={listing.maxPetWeightKg ?? null}
                  maxGuests={listing.maxGuests}
                  listingVerified={listing.bnhubListingHostVerified ?? false}
                  stripeConfigured={isStripeConfigured()}
                  loyaltyTierBadge={loyaltyTierBadge}
                  hostAvgRating={hostDisplayRating}
                  hostReviewCount={listing._count.reviews}
                  hostResponseMinutes={listing.owner.hostQuality?.avgResponseMinutes ?? null}
                  hostIsSuperHost={listing.owner.hostQuality?.isSuperHost ?? false}
                  priceInsightLine={bookingPriceInsightLine}
                  listingSoftDemandLine={listingSoftDemandLine}
                  bookingInsightMarket={
                    bnhubMarketInsight
                      ? {
                          demandLevel: bnhubMarketInsight.demandLevel,
                          peerListingCount: bnhubMarketInsight.peerListingCount,
                          yourNightCents: bnhubMarketInsight.yourNightCents,
                          recommendedNightCents: bnhubMarketInsight.recommendedNightCents,
                        }
                      : null
                  }
                />
                <BnhubStayAiCards listing={bnhubAiListing} />
                <p className="mt-4 text-center text-xs text-slate-500">
                  <Link href="/bnhub/guest-protection" className="underline hover:text-slate-400">
                    Guest Protection
                  </Link>
                  By booking, you agree to our{" "}
                  <Link href="/legal/terms" className="underline hover:text-slate-400">
                    Terms
                  </Link>
                  {" and "}
                  <Link href="/bnhub/guest-protection" className="underline hover:text-slate-400">
                    Guest Protection Policy
                  </Link>
                  . Refunds and support if the place isn&apos;t as described.
                </p>
                <div className="mt-6">
                  <AvailabilityCalendar listingId={listing.id} />
                </div>
                <div id="facilities" className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 md:p-5">
                  <h3 className="text-base font-semibold text-slate-900">Most popular facilities</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenities.slice(0, 12).map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {normalizeAmenityLabel(a)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isBrokerListing ? (
        <BnhubMobileStickyBookingBar
          listingId={listing.id}
          nightPriceFormatted={formatListingMoney(listing.nightPriceCents)}
          exampleTotalFormatted={formatListingMoney(sampleTotalEstimateCents)}
          hostPayoutReady={hostPayoutReady}
          contactHref={`/messages?host=${listing.owner.id}&listing=${listing.id}`}
          contactLabel={contactLabel}
          primaryCtaLabel={primaryBookCta}
          reassuranceLine={reassuranceUnderCta}
          stripeTrustLine={showStripeTrustLine ? stripeTrustLineCaption : null}
          listingCtaExperiment={
            expListingCta
              ? { experimentId: expListingCta.experimentId, variantId: expListingCta.variantId }
              : undefined
          }
        />
      ) : null}
      <ListingStickyContactBar
        listingId={listing.id}
        listingCode={listing.listingCode}
        hostId={listing.owner.id}
        hostPhone={listing.owner.phone}
        supportTel={supportTel || undefined}
        contactLabel={contactLabel}
        suppressMobileFixed={!isBrokerListing}
        introducedByBrokerId={isBrokerListing ? listing.owner.id : undefined}
        immoListing={
          isBrokerListing
            ? {
                listingTitle: displayTitle,
                location: locationLine,
                city: listing.city ?? undefined,
              }
            : undefined
        }
      />
    </main>
    </>
  );
}
