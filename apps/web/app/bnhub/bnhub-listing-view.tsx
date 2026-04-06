import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingStatus, SearchEventType } from "@prisma/client";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { breadcrumbJsonLd, vacationRentalListingJsonLd } from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { getListingAverageRating } from "@/lib/bnhub/reviews";
import { getGuestId } from "@/lib/auth/session";
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
import { prisma } from "@/lib/db";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";
import { getBnhubWhyThisPropertyBullets } from "@/lib/ai/search/bnhubWhyThisProperty";
import { getLatestListingIntelligenceSnapshot } from "@/lib/ai/intelligence/getLatestListingIntelligence";
import { BnhubAiInsightsCard } from "@/components/bnhub/BnhubAiInsightsCard";
import { ListingLifestyleBadges } from "@/components/bnhub/ListingLifestyleBadges";
import { BnhubStayAiCards } from "@/components/ai/BnhubStayAiCards";
import { BnhubMarketPriceInsightCard } from "@/components/bnhub/BnhubMarketPriceInsightCard";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";
import { TrustBadge } from "@/components/bnhub/TrustBadge";
import { FraudAlertBanner } from "@/components/bnhub/FraudAlertBanner";
import { loyaltyTierFromCompletedBookings } from "@/lib/loyalty/loyalty-engine";

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
    <div className="flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center sm:min-w-0 sm:flex-1">
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
}) {
  const routeLookupKey = opts.routeLookupKey;
  const [listing, guestId] = await Promise.all([
    getCachedBnhubListingById(routeLookupKey),
    getGuestId(),
  ]);
  if (!listing) notFound();

  await requirePlatformAcceptance(guestId);

  void trackSearchEvent({
    eventType: SearchEventType.VIEW,
    userId: guestId,
    listingId: listing.id,
  });

  const whyThisProperty = await getBnhubWhyThisPropertyBullets(
    { id: listing.id, city: listing.city, nightPriceCents: listing.nightPriceCents },
    guestId
  );

  const intelligenceSnapshot = await getLatestListingIntelligenceSnapshot(listing.id);

  const [tripleVerified, promotion, similar, loyaltyProfile] = await Promise.all([
    isTripleVerified(listing.id),
    getListingPromotion(listing.id),
    getSimilarBnhubListings({
      listingId: listing.id,
      city: listing.city,
      country: listing.country,
      nightPriceCents: listing.nightPriceCents,
      propertyType: listing.propertyType,
      limit: 6,
    }),
    guestId
      ? prisma.userLoyaltyProfile.findUnique({
          where: { userId: guestId },
          select: { completedBookings: true },
        })
      : Promise.resolve(null),
  ]);

  const loyaltyTierInfo = loyaltyTierFromCompletedBookings(loyaltyProfile?.completedBookings ?? 0);
  const loyaltyTierBadge = guestId
    ? loyaltyTierInfo.tier === "NONE"
      ? `Member · ${loyaltyTierInfo.explanation}`
      : `${loyaltyTierInfo.label} tier · up to ${loyaltyTierInfo.discountPercent}% off lodging`
    : null;

  const avgRating = getListingAverageRating(listing.reviews);
  const galleryPhotos = listing.listingPhotos?.length
    ? listing.listingPhotos.map((p) => p.url)
    : Array.isArray(listing.photos)
      ? (listing.photos as string[])
      : [];
  const amenities = Array.isArray(listing.amenities) ? (listing.amenities as string[]) : [];
  const descParsed = parseListingDescription(listing.description);
  const sqft = extractSqft(amenities, listing.description ?? "");
  const parkingLabel = hasParking(amenities, listing.parkingDetails);

  const bnhubAiListing = {
    listingId: listing.id,
    title: listing.title,
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

  const [trustSnapshot, fraudAgg] = await Promise.all([
    generateListingTrustScore(listing.id).catch(() => ({
      score: 50,
      badge: "medium" as const,
      breakdown: { completeness: 0, verification: 0, reviews: 0 },
    })),
    prisma.propertyFraudScore.findUnique({ where: { listingId: listing.id } }),
  ]);

  const seoPath =
    opts.seoCanonicalPath ??
    `/bnhub/${encodeURIComponent(listing.listingCode || routeLookupKey)}`;
  const base = getSiteBaseUrl();
  const absUrl = `${base}${seoPath}`;
  const galleryForLd = bnhubGalleryUrls(listing);
  const galleryAbsForLd = galleryForLd.map((u) =>
    u.startsWith("http://") || u.startsWith("https://") ? u : `${base}${u.startsWith("/") ? u : `/${u}`}`,
  );
  const vacationLd =
    listing.listingStatus === ListingStatus.PUBLISHED
      ? vacationRentalListingJsonLd({
          url: absUrl,
          name: listing.title,
          description:
            (listing.description ?? "").replace(/\s+/g, " ").trim().slice(0, 500) ||
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
          name: listing.title,
          description:
            (listing.description ?? "").replace(/\s+/g, " ").trim().slice(0, 500) ||
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
    { name: listing.title, path: seoPath },
  ]);

  return (
    <>
      {vacationLd ? <JsonLdScript data={vacationLd} /> : null}
      {stayProductLd ? <JsonLdScript data={stayProductLd} /> : null}
      <JsonLdScript data={crumbLd} />
      <main className="min-h-screen scroll-smooth bg-[#f5f7fa] pb-28 text-slate-900 lg:pb-10">
      {guestId ? <LogListingView listingId={listing.id} /> : null}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
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

      {/* Above the fold: price, location, key facts, ID — optimized for scan + conversion */}
      <section className="border-b border-slate-200 bg-white">
        {isBrokerListing ? <BrokerListingTopCtaStrip listingId={listing.id} /> : null}
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">{listing.title}</h1>
                {listing.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    Verified host
                  </span>
                )}
                {!hostPayoutReady ? (
                  <span
                    className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
                    title="Host must finish Stripe payout setup before paid bookings can complete."
                  >
                    Host not ready to receive payments
                  </span>
                ) : null}
                {isBrokerListing ? (
                  <VerifiedBrokerBadge className="bg-emerald-500/15 text-emerald-200 ring-emerald-500/30" />
                ) : null}
                <TrustBadge score={trustSnapshot.score} tier={trustSnapshot.badge} />
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
                {listing.owner?.hostQuality?.isSuperHost && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    Super Host
                  </span>
                )}
              </div>
              <div className="mt-3 max-w-2xl">
                <FraudAlertBanner fraudScore={fraudAgg?.fraudScore ?? null} riskLevel={fraudAgg?.riskLevel ?? null} />
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                ${(listing.nightPriceCents / 100).toLocaleString()}
                <span className="ml-2 text-lg font-normal text-slate-500">/ night</span>
                {listing.instantBookEnabled && (
                  <span className="ml-2 align-middle text-xs font-semibold text-[#006ce4]">· Instant book</span>
                )}
              </p>
              <p className="mt-2 text-base text-slate-800">{locationLine}</p>
              {whyThisProperty.length > 0 ? (
                <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Why this property?</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                    {whyThisProperty.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4">
                <BnhubAiInsightsCard snapshot={intelligenceSnapshot} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {listing.beds} beds · {listing.baths} baths
                {listing.propertyType ? ` · ${listing.propertyType}` : ""}
                {listing.roomType ? ` · ${listing.roomType}` : ""}
              </p>
              <div className="mt-4">
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Listing ID</span>
                <span className="font-mono text-sm font-medium text-slate-800">{listing.listingCode}</span>
                <CopyListingCodeButton listingCode={listing.listingCode} variant="light" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
              <SaveListingButton listingId={listing.id} />
              {avgRating != null && (
                <p className="text-sm text-slate-600 sm:ml-2 lg:ml-0">
                  ★ {avgRating} ({listing.reviews.length} review{listing.reviews.length !== 1 ? "s" : ""})
                </p>
              )}
            </div>
          </div>

          <ListingUserProvidedDisclaimer className="mt-5 max-w-3xl" />

          {canGenerateOffer ? <GenerateOfferButton listingId={listing.id} offerType="purchase_offer" /> : null}

          <div className="mt-5 flex flex-wrap justify-between gap-2 sm:gap-3">
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

          <div className="mt-5">
            <ListingImageGallery
              photos={galleryPhotos}
              listingId={listing.id}
              imageAltBase={listing.title}
              badges={{
                isNew,
                isFeatured,
                priceDrop,
              }}
            />
          </div>

          <div className="mt-5">
            <TrustStrip audience="stays" dense />
          </div>
          <nav className="mt-6 overflow-x-auto border-b border-slate-200">
            <div className="flex min-w-max gap-6 text-sm font-semibold text-slate-600">
              <a href="#overview" className="border-b-2 border-[#006ce4] pb-3 text-[#006ce4]">Overview</a>
              <a href="#availability" className="pb-3 hover:text-slate-900">Apartment info & price</a>
              <a href="#facilities" className="pb-3 hover:text-slate-900">Facilities</a>
              <a href="#house-rules" className="pb-3 hover:text-slate-900">House rules</a>
              <a href="#reviews" className="pb-3 hover:text-slate-900">Guest reviews</a>
              <a href="#area-info" className="pb-3 hover:text-slate-900">Area info</a>
            </div>
          </nav>
          <p className="mt-3 text-center text-xs text-slate-500">
            Typical host response time: <span className="text-slate-700">within 24 hours</span>
          </p>
        </div>
      </section>

      <section className="bg-[#f5f7fa]" id="overview">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <BuyerAdvisoryCard listingId={listing.id} />

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {(amenities.length ? amenities.slice(0, 10) : [
                    "Free WiFi",
                    "Kitchen",
                    "Air conditioning",
                    "Private bathroom",
                    "Non-smoking rooms",
                  ]).map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      {normalizeAmenityLabel(item)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
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
                <div id="house-rules" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
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

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
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
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-900">About this place</h2>
                  {descParsed.intro ? <p className="mt-3 text-sm leading-relaxed text-slate-700">{descParsed.intro}</p> : null}
                  {descParsed.bullets.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {descParsed.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  {descParsed.fullDescription ? (
                    <div className="mt-4 border-t border-slate-800 pt-4">
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
                <div id="area-info" className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
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
                  <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">What&apos;s nearby</h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        <li>City center · 0.8 km</li>
                        <li>Old Montreal · 1.2 km</li>
                        <li>Public square · 500 m</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Top attractions</h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        <li>Museum district · 1.1 km</li>
                        <li>Waterfront walk · 1.3 km</li>
                        <li>Historic center · 2.2 km</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Restaurants & cafes</h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        <li>Local cafe · 50 m</li>
                        <li>Bistro · 100 m</li>
                        <li>Bakery · 200 m</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Public transit</h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        <li>Metro station · 400 m</li>
                        <li>Train station · 850 m</li>
                        <li>Airport · 16 km</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {listing.reviews.length > 0 && (
                <div id="reviews" className="mt-8">
                  <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
                  <ul className="mt-3 space-y-3">
                    {listing.reviews.map((r) => (
                      <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-medium text-slate-800">
                          ★ {r.propertyRating} · {r.guest.name ?? "Guest"}
                        </p>
                        {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">Travelers are asking</h2>
                  <a href="#availability" className="text-sm font-semibold text-[#006ce4] hover:underline">
                    See availability
                  </a>
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
                    <details key={q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <summary className="cursor-pointer list-none font-medium text-slate-800">{q}</summary>
                      <p className="mt-3 text-sm text-slate-600">
                        Contact the host or continue to booking to see the most accurate policy details for your selected dates.
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            <div id="availability" className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-semibold text-slate-900">
                  ${(listing.nightPriceCents / 100).toLocaleString()}{" "}
                  <span className="text-base font-normal text-slate-500">/ night</span>
                  {listing.instantBookEnabled && (
                    <span className="ml-2 rounded border border-[#006ce4]/20 bg-[#006ce4]/5 px-2 py-0.5 text-xs font-medium text-[#006ce4]">
                      Instant book
                    </span>
                  )}
                </p>
                {listing.cleaningFeeCents > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Cleaning fee ${(listing.cleaningFeeCents / 100).toFixed(0)}</p>
                )}
                <BnhubMarketPriceInsightCard listingId={listing.id} />
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Good to know</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    <li>You&apos;ll get the entire place to yourself if available for your dates.</li>
                    <li>Protected booking support is included through the platform.</li>
                    <li>Hosts and guests are both notified after payment confirmation.</li>
                  </ul>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/messages?host=${listing.owner.id}&listing=${listing.id}`}
                    className="flex w-full items-center justify-center rounded-xl bg-[#006ce4] py-3 text-center text-sm font-bold text-white transition hover:bg-[#0057b8]"
                  >
                    {contactLabel}
                  </Link>
                  {supportTel ? (
                    <a
                      href={supportTel}
                      className="flex w-full items-center justify-center rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Call {supportDisplay || "support"}
                    </a>
                  ) : null}
                </div>
                <BookingForm
                  listingId={listing.id}
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
                <div id="facilities" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">Most popular facilities</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenities.slice(0, 12).map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
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

      <ListingStickyContactBar
        listingId={listing.id}
        listingCode={listing.listingCode}
        hostId={listing.owner.id}
        hostPhone={listing.owner.phone}
        supportTel={supportTel || undefined}
        contactLabel={contactLabel}
        introducedByBrokerId={isBrokerListing ? listing.owner.id : undefined}
        immoListing={
          isBrokerListing
            ? {
                listingTitle: listing.title,
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
