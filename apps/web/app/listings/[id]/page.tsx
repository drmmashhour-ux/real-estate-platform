import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { BuyerListingDetail } from "@/components/listings/BuyerListingDetail";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildFsboPublicListingPath, publicListingPathLookupKeys } from "@/lib/seo/public-urls";
import { mapCrmListingToBuyerPayload, resolvePublicListing } from "@/lib/listings/resolve-public-listing";
import {
  breadcrumbJsonLd,
  realEstateListingJsonLd,
  realEstateProductJsonLd,
} from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { cityToSlug } from "@/lib/market/slug";
import { getGuestId } from "@/lib/auth/session";
import { trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { fireViewListingGrowth } from "@/lib/growth/events";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { PrintPageButton } from "@/components/ui/PrintPageButton";
import { DeferredListingInsuranceLeadSection } from "@/components/insurance/DeferredListingInsuranceLeadSection";
import { LecipmPublicStayDetail } from "@/components/listings/LecipmPublicStayDetail";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import {
  buyerHasPaidListingContact,
  isListingContactPaywallEnabled,
} from "@/lib/leads";
import { isTestMode } from "@/lib/config/app-mode";
import { logInfo } from "@/lib/logger";
import { redactBuyerListingContactPayload } from "@/lib/leads/redact-public-contact";
import {
  buildCrmPublicDemandUi,
  buildFsboPublicDemandUi,
  incrementCrmListingView,
} from "@/lib/listings/listing-analytics-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function resolveListingFromParam(param: string) {
  for (const key of publicListingPathLookupKeys(param)) {
    const r = await resolvePublicListing(key);
    if (r) return r;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: param } = await params;
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    return { title: "Listing" };
  }
  const base = getSiteBaseUrl();
  if (resolved.kind === "bnhub") {
    const stay = await getCachedBnhubListingById(resolved.id);
    const path = `/listings/${encodeURIComponent(resolved.id)}`;
    const titleText = stay?.title?.trim() || "Short-term stay";
    const desc =
      stay?.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
      `Book ${titleText} on LECIPM — nightly rates, verified hosts, secure checkout.`;
    const og = stay?.listingPhotos?.[0]?.url ?? (Array.isArray(stay?.photos) ? (stay.photos as string[])[0] : null);
    return buildPageMetadata({
      title: `${titleText} · ${stay?.city ?? "Stay"}`,
      description: desc,
      path,
      ogImage: og,
      keywords: [stay?.city ?? "", "BNHub", "short-term rental", stay?.listingCode ?? ""].filter(Boolean),
    });
  }
  const canonicalPath =
    resolved.kind === "fsbo"
      ? buildFsboPublicListingPath(resolved.row)
      : `/listings/${encodeURIComponent(resolved.row.id)}`;
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
    return buildPageMetadata({
      title: `${row.title} · ${row.city} | ${priceCad}`,
      description: desc,
      path: canonicalPath,
      ogImage: og,
      keywords: [row.city, "for sale", "FSBO", "Quebec real estate", row.listingCode ?? ""].filter(Boolean),
    });
  }
  const row = resolved.row;
  const priceCad = (Number(row.price) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  return buildPageMetadata({
    title: `${row.title} · Marketplace`,
    description: `Listed at ${priceCad}. View details and request information from the listing representative on LECIPM.`,
    path: canonicalPath,
    keywords: ["real estate", "marketplace", row.listingCode ?? ""].filter(Boolean),
  });
}

export default async function PublicListingRoute({ params }: Props) {
  const { id: param } = await params;
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "bnhub") {
    const guestIdBnhub = await getGuestId();
    void trackEvent(
      "listing_view",
      {
        listingId: resolved.id,
        city: resolved.city,
        listingKind: "bnhub",
        step: "lecipm_listing_detail",
      },
      { userId: guestIdBnhub }
    );
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
    });
    return <LecipmPublicStayDetail lookupKey={param} />;
  }

  if (resolved.kind === "fsbo") {
    const canon = buildFsboPublicListingPath(resolved.row);
    if (`/listings/${param}` !== canon) {
      permanentRedirect(canon);
    }
  }

  const base = getSiteBaseUrl();
  const listingPath =
    resolved.kind === "fsbo"
      ? buildFsboPublicListingPath(resolved.row)
      : `/listings/${encodeURIComponent(resolved.row.id)}`;
  const absUrl = `${base}${listingPath}`;
  const marketCitySlug = resolved.kind === "fsbo" ? cityToSlug(resolved.row.city) : null;

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
    const guestFsbo = await getGuestId();
    void trackEvent(
      "listing_view",
      {
        listingId: row.id,
        city: row.city,
        price: row.priceCents / 100,
        listingKind: "fsbo",
      },
      { userId: guestFsbo }
    );
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
    });
    if (isTestMode()) {
      logInfo("[listing_view]", { listingId: row.id, userId: guestFsbo ?? null, kind: "fsbo" });
    }
    const ownerBrokerVerification = row.owner.brokerVerifications[0] ?? null;
    const transactionFlag = await getListingTransactionFlag(row.id, row.status);
    const fsboPayload = {
      ...row,
      listingKind: "fsbo" as const,
      transactionFlag,
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
    return (
      <>
        <JsonLdScript data={productLd} />
        <JsonLdScript data={listingLd} />
        <JsonLdScript data={crumbLd} />
        <div className="print:hidden px-4 pt-6">
          <div className="mx-auto flex max-w-4xl justify-end gap-3">
            <Link
              href={`/api/listings/${encodeURIComponent(row.id)}/brochure`}
              target="_blank"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Open brochure
            </Link>
            <PrintPageButton label="Print listing" />
          </div>
        </div>
        <BuyerListingDetail
          listing={fsboPayloadFinal}
          demandUi={demandUiFsbo}
          listingContactGate={{
            active: paywallFsbo && !isOwnerFsbo,
            unlocked: contactUnlockedFsbo,
            targetKind: "FSBO_LISTING",
          }}
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
              BNHub short-term stays
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
  const guestCrm = await getGuestId();
  void trackEvent(
    "listing_view",
    {
      listingId: payload.id,
      city: payload.city,
      price: payload.priceCents / 100,
      listingKind: "crm",
    },
    { userId: guestCrm }
  );
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

  return (
    <>
      <JsonLdScript data={productLd} />
      <JsonLdScript data={crumbLd} />
      <div className="print:hidden px-4 pt-6">
        <div className="mx-auto flex max-w-4xl justify-end gap-3">
          <Link
            href={`/api/listings/${encodeURIComponent(payload.id)}/brochure`}
            target="_blank"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-premium-gold/40 hover:bg-white/5"
          >
            Open brochure
          </Link>
          <PrintPageButton label="Print listing" />
        </div>
      </div>
      <BuyerListingDetail
        listing={{ ...crmPayload, listingKind: "crm" }}
        demandUi={demandUiCrm}
        listingContactGate={{
          active: paywallCrm && !isOwnerCrm,
          unlocked: contactUnlockedCrm,
          targetKind: "CRM_LISTING",
        }}
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
            BNHub stays
          </Link>
        </div>
      </section>
    </>
  );
}
