import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pickListingDescription, pickListingTitle } from "@/lib/listing-localized";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import { getLocalizedPropertyCity, getLocalizedPropertyDistrict } from "@/lib/property-localization";
import { money } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { createBnhubBooking } from "@/actions/bookings";
import { createSybnbStayBooking } from "@/actions/sybnb-booking";
import { isBnhubInSyriaUI, syriaFlags } from "@/lib/platform-flags";
import { SYRIA_PRICING } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { darlinkMetadataBase, buildDarlinkPageMetadata } from "@/lib/seo/darlink-metadata";
import type { DarlinkLocale } from "@/lib/i18n/types";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { VerifiedBadge } from "@/components/ds/VerifiedBadge";
import { RelatedListings } from "@/components/listing/RelatedListings";
import { ListingTrustPanel } from "@/components/listing/ListingTrustPanel";
import { ListingShareActions } from "@/components/listing/ListingShareActions";
import { ListingPostSuccessNudge } from "@/components/listing/ListingPostSuccessNudge";
import { PostSuccessTopBanner } from "@/components/listing/PostSuccessTopBanner";
import { ListingAdCodeQrRow } from "@/components/listing/ListingAdCodeQrRow";
import { fuzzLatLngForDisplay } from "@/lib/geo";
import { ListingApproximateMap } from "@/components/listing/ListingApproximateMap";
import { ListingMobileBookingBar } from "@/components/listing/ListingMobileBookingBar";
import { ListingContactDock } from "@/components/listing/ListingContactDock";
import { ListingOwnerContactCard } from "@/components/listing/ListingOwnerContactCard";
import { buildListingWhatsAppInquiryHref, buildTelHref, isNewListing } from "@/lib/syria-phone";
import { SELF_MKT_VIEWS_HOT_BADGE_MIN } from "@/lib/self-marketing";
import { getMonetizationAdminContact } from "@/lib/monetization-contact";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { sybnbConfig } from "@/config/sybnb.config";
import { isSybnbCardCheckoutUiEnabled } from "@/lib/sybnb/payment-policy";
import { SybnbQuotePreview } from "@/components/sybnb/SybnbQuotePreview";
import { MakeFeaturedCta } from "@/components/listing/MakeFeaturedCta";
import { OwnerUpgradeStickyCta } from "@/components/listing/OwnerUpgradeStickyCta";
import { labelSyriaState } from "@/lib/syria/states";
import { labelSyriaAmenityForListing, normalizeSyriaAmenityKeys, sortSyriaAmenityKeysForListingDisplay } from "@/lib/syria/amenities";
import { getTrustWarningLines } from "@/lib/ai/trustAssistant";
import { ListingTrustAiSection } from "@/components/listing/ListingTrustAiSection";
import { ShortStayAvailabilityCalendar } from "@/components/listing/ShortStayAvailabilityCalendar";
import { incrementPublicListingView } from "@/lib/syria/listing-views";
import {
  getListingPhotoTrustTier,
  isSellerVerifiedForListingTrust,
  shouldShowTrustedListingBadge,
} from "@/lib/listing-trust-badges";
import { Sy8LocationQualityBadge } from "@/components/sy8/Sy8LocationQualityBadge";
import { SYBNB_SHOW_PHONE } from "@/lib/sybnb/config";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, locale } = await props.params;
  const listing = await prisma.syriaProperty.findUnique({
    where: { id },
  });
  if (!listing || listing.status !== "PUBLISHED" || listing.fraudFlag) {
    return {
      ...darlinkMetadataBase(),
      title: "Hadiah Link",
    };
  }

  const titleStr = pickListingTitle(listing, locale);
  const descriptionStr = pickListingDescription(listing, locale).slice(0, 170);

  return {
    ...darlinkMetadataBase(),
    ...buildDarlinkPageMetadata({
      locale: locale as DarlinkLocale,
      title: `${titleStr} · Hadiah Link`,
      description: descriptionStr,
      pathname: `/listing/${id}`,
    }),
  };
}

export default async function ListingDetailPage(props: Props) {
  const { id, locale } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const t = await getTranslations("Listing");

  const listing = await prisma.syriaProperty.findUnique({
    where: { id },
    include: { owner: true },
  });

  if (!listing || listing.status !== "PUBLISHED" || listing.fraudFlag) {
    notFound();
  }

  await Promise.all([
    trackSyriaGrowthEvent({
      eventType: "listing_view",
      propertyId: id,
      payload: { locale },
      utm: {
        source: typeof sp.utm_source === "string" ? sp.utm_source : Array.isArray(sp.utm_source) ? sp.utm_source[0] : null,
        medium: typeof sp.utm_medium === "string" ? sp.utm_medium : Array.isArray(sp.utm_medium) ? sp.utm_medium[0] : null,
        campaign:
          typeof sp.utm_campaign === "string"
            ? sp.utm_campaign
            : Array.isArray(sp.utm_campaign)
              ? sp.utm_campaign[0]
              : null,
      },
    }),
    incrementPublicListingView(id),
  ]);

  const localized = backfillLocalizedPropertyShape(listing);
  const titleDisplay = pickListingTitle(listing, locale);
  const displayDescription = pickListingDescription(listing, locale);
  const cityDisplay = getLocalizedPropertyCity(localized, locale);
  const districtDisplay = getLocalizedPropertyDistrict(localized, locale);
  const areaDisplay = districtDisplay ?? listing.area ?? listing.neighborhood ?? null;
  const stateLine =
    listing.state?.trim() ? labelSyriaState(listing.state, locale) : listing.governorate?.trim() ? listing.governorate : null;
  const fuzz =
    listing.latitude != null && listing.longitude != null
      ? fuzzLatLngForDisplay(listing.id, listing.latitude, listing.longitude)
      : null;
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const isSybnbStay = listing.category === "stay";
  const nightlyForUi = listing.pricePerNight != null ? listing.pricePerNight : Number(listing.price);
  const sharePriceLine = isSybnbStay
    ? `${money(nightlyForUi, listing.currency, numberLoc)} · ${t("cardPerNight")}`
    : money(listing.price, listing.currency, numberLoc);
  const sharePriceAmount = isSybnbStay ? nightlyForUi : Number(listing.price);

  const images = listing.images.filter((x) => x.length > 0);
  const sellerVerified = isSellerVerifiedForListingTrust({
    verified: listing.verified,
    listingVerified: listing.listingVerified,
    owner: listing.owner,
  });
  const photoTrustTier = getListingPhotoTrustTier(images.length);
  const showTrustedListingBadgeUi = shouldShowTrustedListingBadge({
    sellerVerified,
    imageCount: images.length,
    fraudFlag: listing.fraudFlag,
  });
  const showVerifiedSellerOnly = sellerVerified && !showTrustedListingBadgeUi && !listing.fraudFlag;
  const rawAmenities: string[] = Array.isArray(listing.amenities)
    ? (listing.amenities as string[]).filter((x): x is string => typeof x === "string")
    : [];
  const normAmenities = normalizeSyriaAmenityKeys(rawAmenities);
  const catalogSortedForDisplay = sortSyriaAmenityKeysForListingDisplay(rawAmenities);
  const amenityDisplayOrder = [
    ...catalogSortedForDisplay,
    ...rawAmenities.filter((k) => typeof k === "string" && !normAmenities.includes(k)),
  ];

  const aiTrustLines = getTrustWarningLines(
    {
      photoCount: images.length,
      amenityCount: rawAmenities.length,
      verified: listing.verified,
      listingVerified: listing.listingVerified,
    },
    locale,
  );

  const user = await getSessionUser();
  const allowBnhubBooking =
    !syriaFlags.SYRIA_MVP &&
    isBnhubInSyriaUI() &&
    listing.type === "BNHUB" &&
    syriaFlags.BNHUB_ENABLED &&
    user &&
    user.id !== listing.ownerId;

  const showBooking = allowBnhubBooking;

  const hostName = listing.owner.name?.trim() || listing.owner.email.split("@")[0];
  const ownerPhone = listing.owner.phone?.trim() ?? "";
  const hotelContact =
    listing.type === "HOTEL" && listing.contactPhone?.trim() ? listing.contactPhone.trim() : "";
  const primaryPhoneLine = hotelContact || ownerPhone;
  let waOwnerHref = primaryPhoneLine ? buildListingWhatsAppInquiryHref(primaryPhoneLine, titleDisplay, locale) : null;
  let telOwnerHref = primaryPhoneLine ? buildTelHref(primaryPhoneLine) : null;
  if (isSybnbStay && !SYBNB_SHOW_PHONE && listing.type !== "HOTEL") {
    waOwnerHref = null;
    telOwnerHref = null;
  }
  const showNewBadge = isNewListing(listing.createdAt);
  const isOwner = user?.id === listing.ownerId;
  const canContact = !isOwner && Boolean(waOwnerHref || telOwnerHref);
  const showBnhubInUi = isBnhubInSyriaUI() && syriaFlags.BNHUB_ENABLED;
  const showSybnbRequestCard =
    !syriaFlags.SYRIA_MVP &&
    isSybnbStay &&
    listing.sybnbReview === "APPROVED" &&
    !listing.owner.sybnbSupplyPaused &&
    !listing.needsReview &&
    !listing.fraudFlag &&
    !listing.owner.flagged &&
    user &&
    user.id !== listing.ownerId;
  const showContactAside =
    !isOwner &&
    (listing.type === "SALE" ||
      (listing.type === "RENT" && !isSybnbStay) ||
      (listing.type === "BNHUB" && !showBnhubInUi)) &&
    !showSybnbRequestCard;
  const monetizationContact = getMonetizationAdminContact();
  const showMakeFeatured = isOwner && (listing.plan === "free" || listing.plan === "featured");
  const f1PendingPayment = isOwner
    ? await prisma.syriaPaymentRequest.findFirst({
        where: { listingId: id, status: "pending" },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const justPosted = sp.posted === "1" || (Array.isArray(sp.posted) && sp.posted[0] === "1");
  const showAfterPostShare = Boolean(justPosted && isOwner);

  const displayViews = (listing.views ?? 0) + 1;
  const isHot = displayViews >= SELF_MKT_VIEWS_HOT_BADGE_MIN;

  const fromAmenities = amenityDisplayOrder.slice(0, 3).map((k) => labelSyriaAmenityForListing(k, locale).primary);
  const defHi = [t("convDefHighlight1"), t("convDefHighlight2"), t("convDefHighlight3")];
  const highlightLines: string[] = [];
  const seenH = new Set<string>();
  for (const a of fromAmenities) {
    if (highlightLines.length >= 3) break;
    if (seenH.has(a)) continue;
    seenH.add(a);
    highlightLines.push(a);
  }
  for (const d of defHi) {
    if (highlightLines.length >= 3) break;
    if (seenH.has(d)) continue;
    seenH.add(d);
    highlightLines.push(d);
  }
  /** Visitors with a contact card get share in the aside; main column for everyone else. After-post CTA is under the title. */
  const showShareInMain = !showContactAside;
  const showShareBlockAfterGallery = showShareInMain && !showAfterPostShare;
  const viewCountStored = listing.views ?? 0;
  const showOwnerUpgradeSticky = isOwner && listing.plan === "free" && viewCountStored >= 10;

  return (
    <>
      {showBooking ? <ListingMobileBookingBar amount={listing.price} currency={listing.currency} numberLoc={numberLoc} /> : null}
      {canContact ? <ListingContactDock listingId={listing.id} whatsappHref={waOwnerHref} telHref={telOwnerHref} /> : null}
      {showOwnerUpgradeSticky ? <OwnerUpgradeStickyCta /> : null}
      <article
        className={
          canContact
            ? "max-w-full overflow-x-hidden pb-52 max-md:pb-56 md:pb-0"
            : showOwnerUpgradeSticky
              ? "max-w-full overflow-x-hidden max-md:pb-28 md:pb-0"
              : "max-w-full overflow-x-hidden"
        }
      >
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-10">
            {showAfterPostShare ? (
              <Suspense fallback={null}>
                <PostSuccessTopBanner />
              </Suspense>
            ) : null}
            <header>
              <ListingAdCodeQrRow listingId={id} adCode={listing.adCode} />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color:var(--darlink-surface-muted)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[color:var(--darlink-text-muted)]">
                  {listing.type === "HOTEL" ? t("badgeHotel") : listing.type}
                </span>
                {!syriaFlags.SYRIA_MVP && showTrustedListingBadgeUi ? (
                  <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-teal-400/60">
                    {t("badgeTrustedListing")}
                  </span>
                ) : null}
                {!syriaFlags.SYRIA_MVP && showVerifiedSellerOnly ? (
                  <div className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">{t("verifiedBadge")}</div>
                ) : null}
                {!syriaFlags.SYRIA_MVP && photoTrustTier === "full" ? (
                  <span className="rounded-full bg-violet-100/95 px-2.5 py-1 text-xs font-bold text-violet-950 ring-1 ring-violet-300/65">
                    {t("badgePhotoGalleryFull")}
                  </span>
                ) : !syriaFlags.SYRIA_MVP && photoTrustTier === "clear" ? (
                  <span className="rounded-full bg-emerald-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200">
                    {t("badgePhotoQuality")}
                  </span>
                ) : null}
                {showNewBadge ? (
                  <div className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-medium text-white">{t("badgeNew")}</div>
                ) : null}
                {listing.plan === "hotel_featured" ? (
                  <>
                    <span className="rounded-full bg-indigo-100/95 px-2.5 py-1 text-xs font-bold text-indigo-950 ring-1 ring-indigo-300/60">
                      {t("badgeHotelFeaturedPartner")}
                    </span>
                    {listing.isDirect ? (
                      <span className="rounded-full bg-gradient-to-r from-emerald-100 to-amber-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-300/70">
                        {t("badgeDirect")}
                      </span>
                    ) : null}
                  </>
                ) : listing.isDirect && (listing.plan === "featured" || listing.plan === "premium") ? (
                  <span className="rounded-full bg-gradient-to-r from-emerald-100 to-amber-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-300/70">
                    {listing.plan === "premium" ? t("badgeDirectPlusPremium") : t("badgeDirectPlusBoost")}
                  </span>
                ) : (
                  <>
                    {listing.isDirect ? (
                      <span className="rounded-full bg-gradient-to-r from-emerald-100 to-amber-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-300/70">
                        {t("badgeDirect")}
                      </span>
                    ) : null}
                    {listing.plan === "premium" ? (
                      <span className="rounded-full bg-gradient-to-r from-[color:var(--darlink-sand)]/30 to-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-950 ring-1 ring-[color:var(--darlink-sand)]/50">
                        {t("premiumBadge")}
                      </span>
                    ) : null}
                    {listing.plan === "featured" ? <Badge tone="accent">{t("featuredBadge")}</Badge> : null}
                  </>
                )}
                {isHot ? (
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-900 ring-1 ring-orange-200/80">
                    {t("badgeHot")}
                  </span>
                ) : null}
                {!syriaFlags.SYRIA_MVP && normAmenities.includes("electricity_24h") ? (
                  <span className="rounded-full bg-amber-100/95 px-2.5 py-1 text-xs font-bold text-amber-950 ring-1 ring-amber-300/70">
                    ⚡ {t("electricity24Badge")}
                  </span>
                ) : null}
                {!syriaFlags.SYRIA_MVP ? <VerifiedBadge label={t("reviewedBadge")} /> : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--darlink-text)] sm:text-4xl">{titleDisplay}</h1>
              {showMakeFeatured ? (
                <div
                  id="r1-upgrade"
                  className="mt-4 space-y-4 [dir:rtl]:text-right"
                  dir={locale.startsWith("ar") ? "rtl" : "ltr"}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
                      {isSybnbStay ? t("sybnbNightlyLabel") : t("priceLabel")}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[color:var(--darlink-text)] sm:text-3xl">
                      {money(nightlyForUi, listing.currency, numberLoc)}
                    </p>
                    {isSybnbStay ? (
                      <p className="mt-0.5 text-xs font-medium text-[color:var(--darlink-text-muted)]">{t("cardPerNight")}</p>
                    ) : null}
                  </div>
                  <MakeFeaturedCta
                    listingId={listing.id}
                    currentPlan={
                      listing.plan === "premium" ? "premium" : listing.plan === "featured" ? "featured" : "free"
                    }
                    contact={monetizationContact}
                    featuredDurationDays={syriaPlatformConfig.monetization.featuredDurationDays}
                    viewCount={viewCountStored}
                    isDirect={listing.isDirect === true}
                  />
                </div>
              ) : null}
              {showAfterPostShare ? (
                <Suspense fallback={null}>
                  <ListingPostSuccessNudge urlGated>
                    <ListingShareActions
                      variant="growth"
                      listingId={id}
                      shareTitle={titleDisplay}
                      sharePriceLine={sharePriceLine}
                      shareCity={cityDisplay ?? undefined}
                      sharePriceAmount={sharePriceAmount}
                      whatsappLabel={t("shareViaWhatsappCta")}
                      copyButtonLabel={t("copyLink")}
                    />
                  </ListingPostSuccessNudge>
                </Suspense>
              ) : null}
              {listing.isDirect ? (
                <p className="mt-2 text-sm font-medium text-[color:var(--darlink-text)]">{t("directTrustLine")}</p>
              ) : null}
              <ul
                className="mt-3 list-none space-y-1.5 [dir:rtl]:text-right"
                dir={locale.startsWith("ar") ? "rtl" : "ltr"}
              >
                {highlightLines.map((line) => (
                  <li key={line} className="flex items-baseline gap-2 text-sm font-medium text-[color:var(--darlink-text)]">
                    <span className="shrink-0 text-emerald-600" aria-hidden>
                      ✔
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {isSybnbStay && normAmenities.includes("electricity_24h") && normAmenities.includes("wifi") ? (
                <p className="mt-2 text-sm font-semibold text-emerald-800 [dir=rtl]:text-right">{t("convComfortStayLine")}</p>
              ) : null}
              <p className="mt-2 text-xs text-[color:var(--darlink-text-muted)]">{t("viewCountLine", { count: displayViews })}</p>
              <div className="mt-2 space-y-0.5 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">
                {stateLine ? <p className="font-medium text-[color:var(--darlink-text)]">{stateLine}</p> : null}
                {cityDisplay ? <p>{cityDisplay}</p> : null}
                {areaDisplay ? <p>{areaDisplay}</p> : null}
                {listing.addressDetails?.trim() ? <p className="whitespace-pre-wrap">{listing.addressDetails.trim()}</p> : null}
              </div>
              {isSybnbStay ? (
                <div className="mt-2 [dir=rtl]:text-right">
                  <Sy8LocationQualityBadge listing={listing} />
                </div>
              ) : null}
              {!showMakeFeatured ? (
                <div className="mt-3 lg:hidden">
                  <p className="text-2xl font-bold tabular-nums text-[color:var(--darlink-text)]">
                    {isSybnbStay ? money(nightlyForUi, listing.currency, numberLoc) : money(listing.price, listing.currency, numberLoc)}
                  </p>
                  {isSybnbStay ? (
                    <p className="mt-0.5 text-xs font-medium text-[color:var(--darlink-text-muted)]">{t("cardPerNight")}</p>
                  ) : null}
                </div>
              ) : null}
            </header>

            <PropertyImageGallery images={images} title={titleDisplay} />

            <div className="min-w-0 max-w-full space-y-2">
              {showShareBlockAfterGallery ? (
                <ListingShareActions
                  listingId={id}
                  shareTitle={titleDisplay}
                  sharePriceLine={sharePriceLine}
                  shareCity={cityDisplay ?? undefined}
                  sharePriceAmount={sharePriceAmount}
                />
              ) : null}
              <p className="text-xs text-[color:var(--darlink-text-muted)]" aria-live="polite">
                {t("leadTapsLine", { count: (listing.whatsappClicks ?? 0) + (listing.phoneClicks ?? 0) })}
              </p>
            </div>

            <div className="min-w-0 max-w-full">
              <ListingTrustPanel
                listingId={listing.id}
                phoneRaw={ownerPhone}
                isOwner={isOwner}
                isSybnbStay={isSybnbStay}
                canReport={!!user}
              />
            </div>

            <div className="min-w-0 max-w-full">
              <ListingTrustAiSection title={t("aiTrustTipsTitle")} lines={aiTrustLines} />
            </div>

            {!syriaFlags.SYRIA_MVP ? (
              <Card className="border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/50 p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm leading-relaxed text-[color:var(--darlink-text)]">{t("trustNotice")}</p>
              </Card>
            ) : null}

            {displayDescription.trim() !== "—" ? (
              <section>
                <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("description")}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">
                  {displayDescription}
                </p>
              </section>
            ) : null}

            {!syriaFlags.SYRIA_MVP && amenityDisplayOrder.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("amenities")}</h2>
                <ul
                  className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 [dir=rtl]:text-right"
                  dir={locale.startsWith("ar") ? "rtl" : "ltr"}
                >
                  {amenityDisplayOrder.map((key) => {
                    const { primary, secondary } = labelSyriaAmenityForListing(key, locale);
                    return (
                      <li
                        key={key}
                        className="flex items-start gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
                      >
                        <span className="shrink-0 text-base leading-tight text-emerald-700" aria-hidden>
                          ✔
                        </span>
                        <span>
                          <span className="font-medium leading-snug">{primary}</span>
                          {secondary ? (
                            <span className="mt-0.5 block text-xs text-[color:var(--darlink-text-muted)]">{secondary}</span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {listing.type === "BNHUB" ? (
              <ShortStayAvailabilityCalendar
                listingId={listing.id}
                initialBooked={Array.isArray(listing.availability) ? listing.availability : []}
                isOwner={isOwner}
              />
            ) : null}

            <section className="rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-5 shadow-[var(--darlink-shadow-sm)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("locationTitle")}</h2>
              <p className="mt-2 text-base font-medium text-[color:var(--darlink-text)]">{cityDisplay}</p>
              {areaDisplay ? (
                <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{areaDisplay}</p>
              ) : null}
              {listing.addressText ? (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{listing.addressText}</p>
              ) : null}
              {listing.latitude != null && listing.longitude != null ? (
                <>
                  <div className="mt-6">
                    <ListingApproximateMap latitude={listing.latitude} longitude={listing.longitude} listingId={listing.id} />
                  </div>
                  {fuzz ? (
                    <p className="mt-4">
                      <a
                        href={`https://www.google.com/maps?q=${fuzz.lat},${fuzz.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[color:var(--darlink-accent)] hover:underline"
                      >
                        {t("openApproximateMap")}
                      </a>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-xs text-[color:var(--darlink-text-muted)]">{t("approximateLocationNote")}</p>
              )}
            </section>

            <RelatedListings excludeId={listing.id} city={listing.city} type={listing.type} locale={locale} />
          </div>

          <aside className="mt-10 space-y-4 lg:sticky lg:top-24 lg:mt-0">
            <Card className="overflow-hidden border-[color:var(--darlink-border)] p-6 shadow-[var(--darlink-shadow-md)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
                {isSybnbStay ? t("sybnbNightlyLabel") : t("priceLabel")}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--darlink-text)]">
                {money(nightlyForUi, listing.currency, numberLoc)}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">
                {isSybnbStay ? t("sybnbNightlyHint") : t("priceHint")}
              </p>
            </Card>

            {isOwner ? (
              <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
                <h2 className="text-sm font-semibold text-[color:var(--darlink-text)]">{t("adStudioTitle")}</h2>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">{t("adStudioBlurb")}</p>
                <Link
                  href={`/studio/${id}`}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--darlink-radius-lg)] bg-[color:var(--darlink-surface-muted)] px-4 text-sm font-semibold text-[color:var(--darlink-accent)] ring-1 ring-inset ring-[color:var(--darlink-border)] hover:bg-[color:var(--darlink-surface)]"
                >
                  {t("adStudioCta")}
                </Link>
              </Card>
            ) : null}

            <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
              <h2 className="text-sm font-semibold text-[color:var(--darlink-text)]">{t("hostTitle")}</h2>
              <p className="mt-2 text-sm font-medium text-[color:var(--darlink-text)]">{hostName}</p>
              <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("hostHint")}</p>
            </Card>

            {f1PendingPayment && isOwner ? (
              <Card className="border-amber-200/80 bg-amber-50/90 p-4 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-semibold text-amber-950">{t("f1PaymentPending")}</p>
                <p className="mt-1 text-xs text-amber-900/90">{t("f1PaymentPendingHint")}</p>
              </Card>
            ) : null}
            {isOwner &&
            (listing.plan === "featured" || listing.plan === "premium" || listing.plan === "hotel_featured") ? (
              <Card className="border-[color:var(--darlink-sand)]/30 bg-amber-50/30 p-4 shadow-[var(--darlink-shadow-sm)]">
                {listing.plan === "premium" && listing.isDirect ? (
                  <p className="text-sm font-bold text-amber-950">{t("premiumDirectHeadline")}</p>
                ) : null}
                <p
                  className={`text-sm font-medium text-[color:var(--darlink-text)] ${listing.plan === "premium" && listing.isDirect ? "mt-1" : ""}`}
                >
                  {listing.plan === "featured" ?
                    t("makeFeaturedActiveFeatured")
                  : listing.plan === "premium" ?
                    t("makeFeaturedActiveLuxury")
                  : t("makeFeaturedActiveHotelFeatured")}
                </p>
                <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("makeFeaturedActiveHint")}</p>
              </Card>
            ) : null}

            {!syriaFlags.SYRIA_MVP && isSybnbStay && !isOwner && listing.sybnbReview === "PENDING" ? (
              <Card className="border-amber-200/80 bg-amber-50/90 p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-semibold text-amber-950">{t("sybnbReviewPendingTitle")}</p>
                <p className="mt-1 text-xs text-amber-900/90">{t("sybnbReviewPendingHint")}</p>
              </Card>
            ) : null}
            {!syriaFlags.SYRIA_MVP && isSybnbStay && !isOwner && listing.sybnbReview === "REJECTED" ? (
              <Card className="border-stone-200 p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("sybnbReviewRejectedTitle")}</p>
                <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("sybnbReviewRejectedHint")}</p>
              </Card>
            ) : null}
            {!syriaFlags.SYRIA_MVP && isSybnbStay && !isOwner && listing.owner.sybnbSupplyPaused ? (
              <Card className="border-stone-200 p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("sybnbSupplyPausedTitle")}</p>
              </Card>
            ) : null}
            {showSybnbRequestCard ? (
              <Card className="p-6 shadow-[var(--darlink-shadow-md)]" id="sybnb-booking">
                <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("sybnbRequestTitle")}</h2>
                <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">
                  {t("sybnbRequestSubtitle", { rate: (SYRIA_PRICING.bnhubCommissionRate * 100).toFixed(1) })}
                </p>
                {!isSybnbCardCheckoutUiEnabled(sybnbConfig.provider) ? (
                  <p className="mt-2 text-xs text-[color:var(--darlink-text-muted)]">{t("sybnbPaymentsOffNotice")}</p>
                ) : null}
                <SybnbQuotePreview propertyId={listing.id} />
                <form action={createSybnbStayBooking} className="mt-4 grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="propertyId" value={listing.id} />
                  {typeof sp.utm_source === "string" ? <input type="hidden" name="utm_source" value={sp.utm_source} /> : null}
                  {typeof sp.utm_medium === "string" ? <input type="hidden" name="utm_medium" value={sp.utm_medium} /> : null}
                  {typeof sp.utm_campaign === "string" ? (
                    <input type="hidden" name="utm_campaign" value={sp.utm_campaign} />
                  ) : null}
                  <label className="block text-sm text-[color:var(--darlink-text)]">
                    {t("fieldCheckIn")}
                    <Input required type="datetime-local" name="check_in" className="mt-1" />
                  </label>
                  <label className="block text-sm text-[color:var(--darlink-text)]">
                    {t("fieldCheckOut")}
                    <Input required type="datetime-local" name="check_out" className="mt-1" />
                  </label>
                  <label className="block text-sm text-[color:var(--darlink-text)] md:col-span-2">
                    {t("fieldGuestCountOptional")}
                    <Input name="guest_count" type="number" min={1} step={1} className="mt-1" />
                  </label>
                  <div className="md:col-span-2 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-warning)]/35 bg-[color:var(--darlink-surface-muted)] p-4 text-sm text-[color:var(--darlink-text)]">
                    <p className="font-medium">{t("manualTitle")}</p>
                    <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("sybnbManualHint")}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
                        {t("fieldManualRef")}
                        <Input name="manual_ref" className="mt-1 bg-[color:var(--darlink-surface)]" />
                      </label>
                      <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
                        {t("fieldProof")}
                        <Input name="proof_url" className="mt-1 bg-[color:var(--darlink-surface)]" />
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="hadiah-btn-primary md:col-span-2 w-full rounded-[var(--darlink-radius-xl)] py-3 text-sm font-semibold sm:w-auto"
                  >
                    {t("sybnbRequestCta")}
                  </button>
                </form>
              </Card>
            ) : null}
            {listing.type === "BNHUB" && !showBnhubInUi ? (
              <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("bnhubDisabledShort")}</p>
              </Card>
            ) : listing.type === "BNHUB" && showBnhubInUi ? (
              <Card className="p-6 shadow-[var(--darlink-shadow-md)]" id="darlink-booking">
                <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("bnhubTitle")}</h2>
                <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">
                  {t("bnhubCommission", { rate: (SYRIA_PRICING.bnhubCommissionRate * 100).toFixed(1) })}
                </p>
                {!user ? (
                  <p className="mt-4 text-sm text-[color:var(--darlink-text-muted)]">
                    <Link href="/login" className="font-medium text-[color:var(--darlink-accent)] hover:underline">
                      {t("signInPrompt")}
                    </Link>{" "}
                    {t("signInSuffix")}
                  </p>
                ) : user.id === listing.ownerId ? (
                  <p className="mt-4 text-sm text-[color:var(--darlink-text-muted)]">{t("ownerNote")}</p>
                ) : showBooking ? (
                  <form action={createBnhubBooking} className="mt-4 grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="propertyId" value={listing.id} />
                    {typeof sp.utm_source === "string" ? <input type="hidden" name="utm_source" value={sp.utm_source} /> : null}
                    {typeof sp.utm_medium === "string" ? <input type="hidden" name="utm_medium" value={sp.utm_medium} /> : null}
                    {typeof sp.utm_campaign === "string" ? (
                      <input type="hidden" name="utm_campaign" value={sp.utm_campaign} />
                    ) : null}
                    <label className="block text-sm text-[color:var(--darlink-text)]">
                      {t("fieldCheckIn")}
                      <Input required type="datetime-local" name="check_in" className="mt-1" />
                    </label>
                    <label className="block text-sm text-[color:var(--darlink-text)]">
                      {t("fieldCheckOut")}
                      <Input required type="datetime-local" name="check_out" className="mt-1" />
                    </label>
                    <label className="block text-sm text-[color:var(--darlink-text)] md:col-span-2">
                      {t("fieldTotal", { currency: listing.currency })}
                      <Input required name="total_price" type="number" min={1} step={1} className="mt-1" />
                    </label>
                    <div className="md:col-span-2 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-warning)]/35 bg-[color:var(--darlink-surface-muted)] p-4 text-sm text-[color:var(--darlink-text)]">
                      <p className="font-medium">{t("manualTitle")}</p>
                      <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">
                        {locale.startsWith("ar")
                          ? "إدخال المرجع إثباتاً للتحويل اليدوي فقط — لا يُعتبر تأكيداً آلياً للدفع."
                          : "Reference fields support manual payment proof only — not live payment confirmation."}
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
                          {t("fieldManualRef")}
                          <Input name="manual_ref" className="mt-1 bg-[color:var(--darlink-surface)]" />
                        </label>
                        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
                          {t("fieldProof")}
                          <Input name="proof_url" className="mt-1 bg-[color:var(--darlink-surface)]" />
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="hadiah-btn-primary md:col-span-2 w-full rounded-[var(--darlink-radius-xl)] py-3 text-sm font-semibold sm:w-auto"
                    >
                      {t("bookCta")}
                    </button>
                  </form>
                ) : null}
              </Card>
            ) : showContactAside ? (
              <ListingOwnerContactCard
                listingId={listing.id}
                waOwnerHref={waOwnerHref}
                telOwnerHref={telOwnerHref}
                canContact={canContact}
                ownerHasPhone={Boolean(ownerPhone)}
                primaryHeading={isSybnbStay ? t("contactPrimaryOwner") : null}
                shareTitle={titleDisplay}
                sharePriceLine={sharePriceLine}
                shareCity={cityDisplay ?? undefined}
                sharePriceAmount={sharePriceAmount}
                adCode={listing.adCode}
              />
            ) : null}
          </aside>
        </div>
      </article>
    </>
  );
}
