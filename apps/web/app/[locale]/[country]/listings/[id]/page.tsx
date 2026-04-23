import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { BuyerListingDetail } from "@/components/listings/BuyerListingDetail";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { publicListingPathLookupKeys } from "@/lib/seo/public-urls";
import { mapCrmListingToBuyerPayload, resolvePublicListing } from "@/lib/listings/resolve-public-listing";
import {
  breadcrumbJsonLd,
  realEstateListingJsonLd,
  realEstateProductJsonLd,
} from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { cityToSlug } from "@/lib/market/slug";
import { getGuestId } from "@/lib/auth/session";
import { cookies } from "next/headers";
import {
  CENTRIS_ATTRIBUTION_COOKIE,
  resolveCentrisFromSearchParams,
} from "@/modules/centris-conversion/centris-attribution";
import { trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { mergeTrafficAttributionIntoMetadata } from "@/lib/attribution/social-traffic";
import { fireViewListingGrowth } from "@/lib/growth/events";
import { PlatformRole } from "@prisma/client";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { DeferredListingInsuranceLeadSection } from "@/components/insurance/DeferredListingInsuranceLeadSection";
import { LecipmPublicStayDetail } from "@/components/listings/LecipmPublicStayDetail";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { OG_DEFAULT_BNHUB, OG_DEFAULT_LISTINGS } from "@/lib/seo/og-defaults";
import {
  buyerHasPaidListingContact,
  isListingContactPaywallEnabled,
} from "@/lib/leads";
import { isTestMode } from "@/lib/config/app-mode";
import { logInfo } from "@/lib/logger";
import { redactBuyerListingContactPayload } from "@/lib/leads/redact-public-contact";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { funnelVariantForListing } from "@/lib/funnel/listing-ab";
import { getLuxuryShowcaseProperty } from "@/components/listings/luxury-showcase-data";
import {
  buildCrmPublicDemandUi,
  buildFsboPublicDemandUi,
  incrementCrmListingView,
} from "@/lib/listings/listing-analytics-service";
import { buildPropertyConversionSurface } from "@/modules/conversion/property-conversion-surface";
import { prisma } from "@/lib/db";
import { isBrokerInsuranceValid, getBrokerInsuranceStatus } from "@/modules/compliance/insurance/insurance.service";
import { loadFsboListingScore } from "@/modules/listing-ranking/fsbo-score-loader";
import { ListingRankingBadges } from "@/components/listings/ListingRankingBadges";
import { getPublicEsgBadge, touchEsgOnListingView } from "@/modules/esg/esg.service";

export const dynamic = "force-dynamic";

async function collaborationForListingViewer(viewerId: string | null): Promise<{
  enabled: boolean;
  viewerId: string | null;
}> {
  if (!viewerId) return { enabled: false, viewerId: null };
  const u = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  const enabled =
    u?.role === PlatformRole.BROKER || u?.role === PlatformRole.ADMIN;
  return { enabled, viewerId };
}

type Props = {
  params: Promise<{ id: string; locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveListingFromParam(param: string) {
  for (const key of publicListingPathLookupKeys(param)) {
    const r = await resolvePublicListing(key);
    if (r) return r;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: param, locale, country } = await params;
  const showcase = getLuxuryShowcaseProperty(param);
  if (showcase) {
    return buildPageMetadata({
      title: `${showcase.title} | ${seoConfig.siteName}`,
      description: showcase.description.slice(0, 155),
      path: `/listings/showcase/${param}`,
      locale,
      country,
      ogImage: OG_DEFAULT_LISTINGS,
      ogImageAlt: showcase.title,
    });
  }
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    return { title: "Listing" };
  }
  if (resolved.kind === "bnhub") {
    const stay = await getCachedBnhubListingById(resolved.id);
    const path = `/listings/${encodeURIComponent(resolved.id)}`;
    const titleText = stay?.title?.trim() || "Short-term stay";
    const nightlyNum = stay ? stay.nightPriceCents / 100 : 0;
    const nightlyLabel = nightlyNum.toLocaleString("en-CA", {
      minimumFractionDigits: nightlyNum % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    const desc =
      stay?.description?.replace(/\s+/g, " ").trim().slice(0, 140) ||
      `${titleText} in ${stay?.city ?? "Québec"} — from $${nightlyLabel} CAD/night on BNHUB.`;
    const og = stay?.listingPhotos?.[0]?.url ?? (Array.isArray(stay?.photos) ? (stay.photos as string[])[0] : null);
    return buildPageMetadata({
      title: `${titleText} · $${nightlyLabel}/night · ${stay?.city ?? "Stay"} | BNHUB`,
      description: desc,
      path,
      locale,
      ogImage: og,
      ogImageFallback: OG_DEFAULT_BNHUB,
      ogImageAlt: `${titleText} — $${nightlyLabel}/night — ${stay?.city ?? "BNHUB stay"}`,
      ogProduct: stay ? { amount: nightlyNum.toFixed(2), currency: "CAD" } : undefined,
      keywords: [stay?.city ?? "", "BNHUB", "short-term rental", stay?.listingCode ?? ""].filter(Boolean),
    });
  }
  const canonicalPath = `/listings/${encodeURIComponent(resolved.row.id)}`;
  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) return { title: "Listing", robots: { index: false, follow: false } };
    const priceCad = (row.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
    const beds = row.bedrooms != null ? `${row.bedrooms} bed` : null;
    const baths = row.bathrooms != null ? `${row.bathrooms} bath` : null;
    const facts = [beds, baths].filter(Boolean).join(" · ");
    const desc =
      row.description.replace(/\s+/g, " ").trim().slice(0, 140) ||
      `${row.title} in ${row.city}. ${facts ? `${facts}. ` : ""}Listed for ${priceCad}.`;
    const og = row.coverImage ?? row.images[0] ?? null;
    const amount = (row.priceCents / 100).toFixed(2);
    return buildPageMetadata({
      title: `${row.title} · ${priceCad} · ${row.city}`,
      description: desc,
      path: canonicalPath,
      locale,
      country,
      ogImage: og,
      ogImageFallback: OG_DEFAULT_LISTINGS,
      ogImageAlt: `${row.title} — ${row.city}`,
      ogProduct: { amount, currency: "CAD" },
      keywords: [row.city, "for sale", "FSBO", "Quebec real estate", row.listingCode ?? ""].filter(Boolean),
    });
  }
  const row = resolved.row;
  const priceCad = (Number(row.price) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  const crmAmount = (Number(row.price) || 0).toFixed(2);
  return buildPageMetadata({
    title: `${row.title} · ${priceCad} · Marketplace`,
    description: `Listed at ${priceCad}. View details and request information from the listing representative on LECIPM.`,
    path: canonicalPath,
    locale,
    country,
    ogImage: null,
    ogImageFallback: OG_DEFAULT_LISTINGS,
    ogImageAlt: `${row.title} — marketplace listing`,
    ogProduct: { amount: crmAmount, currency: "CAD" },
    keywords: ["real estate", "marketplace", row.listingCode ?? ""].filter(Boolean),
  });
}

export default async function PublicListingRoute({ params, searchParams }: Props) {
  const { id: param, locale, country } = await params;
  if (getLuxuryShowcaseProperty(param)) {
    redirect(`/${locale}/${country}/listings/showcase/${param}`);
  }
  const sp = await searchParams;
  const cookieStore = await cookies();
  const fromParams = resolveCentrisFromSearchParams(sp);
  const cookieCentris = cookieStore.get(CENTRIS_ATTRIBUTION_COOKIE)?.value === "1";
  const inquiryDistributionChannel =
    fromParams === "CENTRIS" || cookieCentris ? ("CENTRIS" as const) : ("LECIPM" as const);
  if (fromParams === "CENTRIS") {
    cookieStore.set(CENTRIS_ATTRIBUTION_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  const cookieHeader = (await headers()).get("cookie");
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "bnhub") {
    const guestIdBnhub = await getGuestId();
    void trackEvent(
      "listing_view",
      mergeTrafficAttributionIntoMetadata(cookieHeader, {
        listingId: resolved.id,
        city: resolved.city,
        listingKind: "bnhub",
        step: "lecipm_listing_detail",
      }),
      { userId: guestIdBnhub }
    );
    void recordAnalyticsFunnelEvent({
      name: "listing_view",
      listingId: resolved.id,
      userId: guestIdBnhub,
      source: "bnhub",
      variant: funnelVariantForListing(resolved.id),
    });
    void persistLaunchEvent("VIEW_LISTING", {
      listingId: resolved.id,
      city: resolved.city,
      listingKind: "bnhub",
      ...(guestIdBnhub ? { userId: guestIdBnhub } : {}),
    });
    fireViewListingGrowth({
      userId: guestIdBnhub,
      listingId: resolved.id,
      city: resolved.city,
      listingKind: "bnhub",
      cookieHeader,
    });
    return <LecipmPublicStayDetail lookupKey={param} />;
  }

  if (resolved.kind === "fsbo" || resolved.kind === "crm") {
    const id = resolved.row.id;
    if (param !== id) {
      permanentRedirect(`/${locale}/${country}/listings/${id}`);
    }
  }

  const base = getSiteBaseUrl();
  const listingPath = `/listings/${resolved.row.id}`;
  const absUrl = `${base}${listingPath}`;
  const marketCitySlug = resolved.kind === "fsbo" ? cityToSlug(resolved.row.city) : null;

  const guestListingRollout = await getGuestId();
  let listingRolloutPrivileged = false;
  if (guestListingRollout) {
    const ur = await prisma.user.findUnique({
      where: { id: guestListingRollout },
      select: { role: true, accountStatus: true },
    });
    listingRolloutPrivileged = Boolean(
      ur?.accountStatus === "ACTIVE" &&
        ur?.role != null &&
        (ur.role === PlatformRole.ADMIN || ur.role === PlatformRole.ACCOUNTANT),
    );
  }

  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) {
      notFound();
    }
    const images = row.coverImage ? [row.coverImage, ...row.images.filter((u) => u !== row.coverImage)] : [...row.images];
    const productLd = realEstateProductJsonLd({
      url: absUrl,
      name: row.title,
      description: row.description.replace(/\s+/g, " ").trim().slice(0, 800) || `${row.title} in ${row.city}.`,
      city: row.city,
      priceCents: row.priceCents,
      currency: "CAD",
      imageUrls: images,
      numberOfRooms: row.bedrooms,
      propertyTypeHint: row.propertyType ?? "SingleFamilyResidence",
    });
    const listingLd = realEstateListingJsonLd({
      url: absUrl,
      name: row.title,
      description: row.description.replace(/\s+/g, " ").trim().slice(0, 800) || `${row.title} in ${row.city}.`,
      city: row.city,
      streetAddress: row.address,
      priceCents: row.priceCents,
      currency: "CAD",
      imageUrls: images,
      numberOfRooms: row.bedrooms,
    });
    const crumbLd = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Listings", path: "/listings" },
      { name: row.title, path: listingPath },
    ]);
    const guestFsbo = guestListingRollout;
    void trackEvent(
      "listing_view",
      mergeTrafficAttributionIntoMetadata(cookieHeader, {
        listingId: row.id,
        city: row.city,
        price: row.priceCents / 100,
        listingKind: "fsbo",
      }),
      { userId: guestFsbo }
    );
    void recordAnalyticsFunnelEvent({
      name: "listing_view",
      listingId: row.id,
      userId: guestFsbo,
      source: "fsbo",
      variant: funnelVariantForListing(row.id),
    });
    void persistLaunchEvent("VIEW_LISTING", {
      listingId: row.id,
      city: row.city,
      listingKind: "fsbo",
      ...(guestFsbo ? { userId: guestFsbo } : {}),
    });
    fireViewListingGrowth({
      userId: guestFsbo,
      listingId: row.id,
      city: row.city,
      listingKind: "fsbo",
      cookieHeader,
    });
    if (isTestMode()) {
      logInfo("[listing_view]", { listingId: row.id, userId: guestFsbo ?? null, kind: "fsbo" });
    }
    const ownerBrokerVerification = row.owner.brokerVerifications[0] ?? null;
    const insuredBroker =
      row.listingOwnerType === "BROKER" ? await isBrokerInsuranceValid(row.ownerId) : false;
    const insuranceStatus = 
      row.listingOwnerType === "BROKER" ? await getBrokerInsuranceStatus(row.ownerId) : null;
    const transactionFlag = await getListingTransactionFlag(row.id, row.status);
    const fsboPayload = {
      ...row,
      listingKind: "fsbo" as const,
      transactionFlag,
      insuredBroker,
      insuranceDetail: insuranceStatus?.policy ? {
        liabilityAmount: insuranceStatus.policy.coveragePerLoss,
        expiryDate: insuranceStatus.policy.endDate,
        status: insuranceStatus.status,
      } : null,
      representative: {
        name: row.owner.name ?? (row.listingOwnerType === "BROKER" ? "Listing broker" : "Property owner"),
        roleLabel: row.listingOwnerType === "BROKER" ? "Listing broker" : "Property owner",
        email: row.contactEmail,
        phone: row.contactPhone ?? row.owner.phone,
        company:
          row.listingOwnerType === "BROKER"
            ? ownerBrokerVerification?.brokerageCompany ?? "Brokerage on file"
            : "Sell Hub Free",
        licenseNumber: ownerBrokerVerification?.licenseNumber ?? null,
        licenseVerified: ownerBrokerVerification?.verificationStatus === "VERIFIED",
        address: row.owner.sellerProfileAddress ?? null,
      },
      propertyDetails: [
        { label: "Listing code", value: row.listingCode ?? null },
        { label: "Region", value: row.region ?? null },
        { label: "Country", value: row.country ?? null },
        { label: "Publishing path", value: row.listingOwnerType === "BROKER" ? "Sell Hub with broker" : "Sell Hub Free" },
      ],
      insuredBroker,
    };
    const paywallFsbo = isListingContactPaywallEnabled();
    const viewerFsbo = guestFsbo;
    const isOwnerFsbo = Boolean(viewerFsbo && viewerFsbo === row.ownerId);
    let contactUnlockedFsbo = !paywallFsbo || isOwnerFsbo;
    if (paywallFsbo && viewerFsbo && !isOwnerFsbo) {
      contactUnlockedFsbo = await buyerHasPaidListingContact(viewerFsbo, "FSBO_LISTING", row.id);
    }
    const fsboPayloadFinal =
      contactUnlockedFsbo ? fsboPayload : redactBuyerListingContactPayload(fsboPayload);
    const demandUiFsbo = await buildFsboPublicDemandUi(row.id, {
      priceCents: row.priceCents,
      city: row.city,
      bedrooms: row.bedrooms,
      propertyType: row.propertyType,
    });
    const conversionSurfaceFsbo = buildPropertyConversionSurface({
      priceCents: row.priceCents,
      city: row.city,
      verified: ownerBrokerVerification?.verificationStatus === "VERIFIED",
      featured: row.featuredUntil != null && new Date(row.featuredUntil).getTime() > Date.now(),
      listingUpdatedAt: row.updatedAt,
      demandUi: demandUiFsbo,
      pathname: listingPath,
      isPrivilegedUser: listingRolloutPrivileged,
    });
    const collaborationFsbo = await collaborationForListingViewer(guestFsbo);
    const lecipmRank =
      (await loadFsboListingScore(row.id).catch(() => null))?.result ?? null;
    return (
      <>
        <JsonLdScript data={productLd} />
        <JsonLdScript data={listingLd} />
        <JsonLdScript data={crumbLd} />
        <BuyerListingDetail
          listing={fsboPayloadFinal}
          inquiryDistributionChannel={inquiryDistributionChannel}
          demandUi={demandUiFsbo}
          conversionSurface={conversionSurfaceFsbo}
          funnelVariant={funnelVariantForListing(row.id)}
          shareUrl={absUrl}
          shareSummary={`${row.title} — ${(row.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })} · ${row.city}`}
          listingContactGate={{
            active: paywallFsbo && !isOwnerFsbo,
            unlocked: contactUnlockedFsbo,
            targetKind: "FSBO_LISTING",
          }}
          collaboration={{
            listingId: fsboPayloadFinal.id,
            enabled: collaborationFsbo.enabled,
            viewerId: collaborationFsbo.viewerId,
          }}
          lecipmRankingBadges={
            lecipmRank && lecipmRank.badges.length > 0 ? (
              <ListingRankingBadges badges={lecipmRank.badges} />
            ) : null
          }
        />
        <DeferredListingInsuranceLeadSection listingId={fsboPayloadFinal.id} />
        <section className="border-t border-slate-800 bg-slate-950 px-4 py-10 text-slate-300">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/listings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Browse all listings
            </Link>
            {marketCitySlug ? (
              <Link
                href={`/market/${marketCitySlug}`}
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                More in {row.city}
              </Link>
            ) : null}
            <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              BNHUB short-term stays
            </Link>
          </div>
        </section>
      </>
    );
  }

  const payload = mapCrmListingToBuyerPayload(resolved.row);
  const productLd = realEstateProductJsonLd({
    url: absUrl,
    name: payload.title,
    description: payload.description.replace(/\s+/g, " ").trim().slice(0, 800),
    city: payload.city,
    priceCents: payload.priceCents,
    currency: "CAD",
    imageUrls: payload.coverImage ? [payload.coverImage, ...payload.images] : payload.images,
    numberOfRooms: payload.bedrooms,
    propertyTypeHint: payload.propertyType ?? "Real estate listing",
  });
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Listings", path: "/listings" },
    { name: payload.title, path: listingPath },
  ]);
  const guestCrm = guestListingRollout;
  void trackEvent(
    "listing_view",
    mergeTrafficAttributionIntoMetadata(cookieHeader, {
      listingId: payload.id,
      city: payload.city,
      price: payload.priceCents / 100,
      listingKind: "crm",
    }),
    { userId: guestCrm }
  );
  void recordAnalyticsFunnelEvent({
    name: "listing_view",
    listingId: payload.id,
    userId: guestCrm,
    source: "crm",
    variant: funnelVariantForListing(payload.id),
  });
  void persistLaunchEvent("VIEW_LISTING", {
    listingId: payload.id,
    city: payload.city,
    listingKind: "crm",
    ...(guestCrm ? { userId: guestCrm } : {}),
  });
  fireViewListingGrowth({
    userId: guestCrm,
    listingId: payload.id,
    city: payload.city,
    listingKind: "crm",
    cookieHeader,
  });
  if (isTestMode()) {
    logInfo("[listing_view]", { listingId: payload.id, userId: guestCrm ?? null, kind: "crm" });
  }
  const paywallCrm = isListingContactPaywallEnabled();
  const viewerCrm = guestCrm;
  const isOwnerCrm = Boolean(viewerCrm && payload.ownerId && viewerCrm === payload.ownerId);
  let contactUnlockedCrm = !paywallCrm || isOwnerCrm;
  if (paywallCrm && viewerCrm && !isOwnerCrm) {
    contactUnlockedCrm = await buyerHasPaidListingContact(viewerCrm, "CRM_LISTING", payload.id);
  }
  const crmPayload =
    contactUnlockedCrm ? payload : redactBuyerListingContactPayload(payload);

  await incrementCrmListingView(payload.id);
  const demandUiCrm = await buildCrmPublicDemandUi(payload.id, { priceCents: payload.priceCents });
  const transactionFlagCrm = await getListingTransactionFlag(payload.id, null);
  const insuredBrokerCrm =
    payload.ownerId && payload.listingOwnerType === "BROKER"
      ? await isBrokerInsuranceValid(payload.ownerId)
      : false;
  const insuranceStatusCrm =
    payload.ownerId && payload.listingOwnerType === "BROKER"
      ? await getBrokerInsuranceStatus(payload.ownerId)
      : null;
  const conversionSurfaceCrm = buildPropertyConversionSurface({
    priceCents: payload.priceCents,
    city: payload.city,
    verified: payload.representative?.licenseVerified ?? false,
    featured: false,
    listingUpdatedAt: resolved.row.updatedAt,
    demandUi: demandUiCrm,
    pathname: listingPath,
    isPrivilegedUser: listingRolloutPrivileged,
  });

  const collaborationCrm = await collaborationForListingViewer(guestCrm);

  void touchEsgOnListingView(payload.id).catch(() => null);
  const esgBadgeData = await getPublicEsgBadge(payload.id);

  return (
    <>
      <JsonLdScript data={productLd} />
      <JsonLdScript data={crumbLd} />
      <BuyerListingDetail
        listing={{
          ...crmPayload,
          listingKind: "crm",
          transactionFlag: transactionFlagCrm,
          insuredBroker: insuredBrokerCrm,
          insuranceDetail: insuranceStatusCrm?.policy ? {
            liabilityAmount: insuranceStatusCrm.policy.coveragePerLoss,
            expiryDate: insuranceStatusCrm.policy.endDate,
            status: insuranceStatusCrm.status,
          } : null,
        }}
        inquiryDistributionChannel={inquiryDistributionChannel}
        demandUi={demandUiCrm}
        conversionSurface={conversionSurfaceCrm}
        funnelVariant={funnelVariantForListing(payload.id)}
        shareUrl={absUrl}
        shareSummary={`${payload.title} — ${(payload.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })} · ${payload.city}`}
        listingContactGate={{
          active: paywallCrm && !isOwnerCrm,
          unlocked: contactUnlockedCrm,
          targetKind: "CRM_LISTING",
        }}
        collaboration={{
          listingId: payload.id,
          enabled: collaborationCrm.enabled,
          viewerId: collaborationCrm.viewerId,
        }}
        esgBadge={
          esgBadgeData ? (
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-950/45 px-3 py-1 text-xs font-semibold text-emerald-100">
              {esgBadgeData.label}
            </span>
          ) : null
        }
      />
      <DeferredListingInsuranceLeadSection listingId={payload.id} />
      <section className="border-t border-slate-800 bg-slate-950 px-4 py-10 text-slate-300">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
          <Link href="/listings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            Browse all listings
          </Link>
          <Link href="/marketplace" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            Marketplace
          </Link>
          <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            BNHUB stays
          </Link>
        </div>
      </section>
    </>
  );
}
