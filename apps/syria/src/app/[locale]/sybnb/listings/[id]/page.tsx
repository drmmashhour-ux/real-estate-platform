import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { pickListingDescription, pickListingTitle } from "@/lib/listing-localized";
import { getLocalizedPropertyCity } from "@/lib/property-localization";
import { money } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { syriaFlags } from "@/lib/platform-flags";
import { SybnbReportForm } from "@/components/sybnb/SybnbReportForm";
import { SybnbV1RequestForm } from "@/components/sybnb/SybnbV1RequestForm";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { darlinkMetadataBase, buildDarlinkPageMetadata } from "@/lib/seo/darlink-metadata";
import type { DarlinkLocale } from "@/lib/i18n/types";
import { getHostSybnbStats } from "@/lib/sybnb/sybnb-public-data";
import { getSy8OwnerListingCounts } from "@/lib/sy8/sy8-owner-listing-counts";
import { SybnbTrustBadge } from "@/components/sybnb/SybnbTrustBadge";
import { labelSyriaAmenityForListing } from "@/lib/syria/amenities";
import { Sy8LocationQualityBadge } from "@/components/sy8/Sy8LocationQualityBadge";
import { buildHotelLeadWhatsAppHref, buildWhatsAppContactHref, buildTelHref } from "@/lib/syria-phone";
import { ListingOwnerContactCard } from "@/components/listing/ListingOwnerContactCard";
import { ListingContactDock } from "@/components/listing/ListingContactDock";
import { SybnbListingViewBeacon } from "@/components/sybnb/SybnbListingViewBeacon";
import { OfflineListingMessageDraft } from "@/components/offline/OfflineListingMessageDraft";
import { SYBNB_SHOW_PHONE, sybnbPrioritizeContactOverBooking } from "@/lib/sybnb/config";
import { isSybnbStayBookablePropertyType } from "@/lib/sybnb/sybnb-booking-rules";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, locale } = await props.params;
  const listing = await prisma.syriaProperty.findUnique({ where: { id } });
  if (!listing || listing.status !== "PUBLISHED" || listing.fraudFlag || listing.category !== "stay") {
    return { ...darlinkMetadataBase(), title: "SYBNB" };
  }
  const titleStr = pickListingTitle(listing, locale);
  return {
    ...darlinkMetadataBase(),
    ...buildDarlinkPageMetadata({
      locale: locale as DarlinkLocale,
      title: `${titleStr} · SYBNB`,
      description: pickListingDescription(listing, locale).slice(0, 160),
      pathname: `/sybnb/listings/${id}`,
    }),
  };
}

const AMENITY_KEYS = ["wifi", "furnished", "ac", "parking", "kitchen"] as const;

export default async function SybnbListingPage(props: Props) {
  const { id, locale } = await props.params;
  const t = await getTranslations("Sybnb.listing");
  const tListing = await getTranslations("Listing");
  const user = await getSessionUser();

  const listing = await prisma.syriaProperty.findUnique({ where: { id }, include: { owner: true } });
  if (!listing || listing.status !== "PUBLISHED" || listing.fraudFlag || listing.category !== "stay" || !isSybnbStayBookablePropertyType(listing.type)) {
    notFound();
  }
  if (listing.sybnbReview === "PENDING" || listing.sybnbReview === "REJECTED") {
    notFound();
  }

  const city = getLocalizedPropertyCity(listing, locale);
  const isHotel = listing.type === "HOTEL";
  const hotelDisplayName = (listing.hotelName?.trim() || pickListingTitle(listing, locale)).trim();
  const isOwner = user?.id === listing.ownerId;
  const canBook =
    !syriaFlags.SYRIA_MVP &&
    listing.sybnbReview === "APPROVED" &&
    !listing.owner.sybnbSupplyPaused &&
    !listing.needsReview &&
    !listing.owner.flagged &&
    user &&
    !isOwner;

  const showBookingRequest = canBook && !isHotel;

  const [hostStats, sy8Counts] = await Promise.all([
    getHostSybnbStats(listing.ownerId),
    getSy8OwnerListingCounts(listing.ownerId),
  ]);
  const fromAmenities = listing.amenities
    .filter((a) => AMENITY_KEYS.includes(a as (typeof AMENITY_KEYS)[number]))
    .slice(0, 5);

  const ownerPhone = listing.owner.phone?.trim() ?? "";
  const hotelContactLine =
    listing.type === "HOTEL" && listing.contactPhone?.trim() ? listing.contactPhone.trim() : "";
  const primaryPhone = hotelContactLine || ownerPhone;
  let waOwnerHref: string | null = null;
  if (primaryPhone) {
    waOwnerHref =
      isHotel ?
        buildHotelLeadWhatsAppHref(primaryPhone, hotelDisplayName, locale) ?? buildWhatsAppContactHref(primaryPhone)
      : buildWhatsAppContactHref(primaryPhone);
  }
  let telOwnerHref = primaryPhone ? buildTelHref(primaryPhone) : null;
  const phoneVisibleForPolicy = listing.type === "HOTEL" || SYBNB_SHOW_PHONE;
  if (!phoneVisibleForPolicy) {
    waOwnerHref = null;
    telOwnerHref = null;
  }
  const prioritizeBookingAfterContactSoft = sybnbPrioritizeContactOverBooking();
  const canShowContact = !isOwner && Boolean(user) && Boolean(waOwnerHref || telOwnerHref);
  /** Logged-in visitor (not owner) — drives sidebar guest flows */
  const guest = Boolean(user && !isOwner);
  const hasContactChannels = Boolean(waOwnerHref || telOwnerHref);
  return (
    <>
      <SybnbListingViewBeacon listingId={listing.id} />
      {canShowContact ? (
        <ListingContactDock
          listingId={listing.id}
          whatsappHref={waOwnerHref}
          telHref={telOwnerHref}
          primaryHeading={isHotel ? t("hotelContactPrimaryHeading") : t("primaryContactTitle")}
          contactAnalytics={isHotel ? "hotel" : "listing"}
        />
      ) : null}
      <div
        className={`space-y-8 lg:grid lg:grid-cols-12 lg:gap-8 lg:pb-10 ${canShowContact ? "max-md:pb-52" : "pb-28 max-md:pb-28"}`}
      >
        <div className="space-y-6 lg:col-span-8">
          <PropertyImageGallery images={listing.images} title={pickListingTitle(listing, locale)} />
          <div>
            {listing.isTest ? (
              <div className="mb-2 [dir=rtl]:text-right">
                <span className="inline-flex rounded-full bg-fuchsia-900/90 px-3 py-1 text-xs font-bold text-white ring-1 ring-fuchsia-400/60">
                  {tListing("badgeTestData")}
                </span>
              </div>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 [dir=rtl]:text-right">
              {pickListingTitle(listing, locale)}
            </h1>
            {listing.type === "HOTEL" ? (
              <p className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-300/70">
                  {t("badgeHotel")}
                </span>
                {listing.plan === "hotel_featured" ? (
                  <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-950 ring-1 ring-indigo-300/60">
                    {t("badgeHotelFeaturedPartner")}
                  </span>
                ) : null}
              </p>
            ) : null}
            {listing.type === "HOTEL" && listing.hotelName?.trim() ? (
              <p className="mt-2 text-sm font-medium text-neutral-700 [dir=rtl]:text-right">{listing.hotelName.trim()}</p>
            ) : null}
            <p className="mt-1 text-sm text-neutral-500 [dir=rtl]:text-right">
              {city} · {listing.governorate ?? listing.state}
            </p>
            <div className="mt-3">
              <SybnbTrustBadge
                className="text-sm font-medium text-neutral-800"
                owner={{
                  phoneVerifiedAt: listing.owner.phoneVerifiedAt,
                  verifiedAt: listing.owner.verifiedAt,
                  verificationLevel: listing.owner.verificationLevel,
                }}
                activeListings={sy8Counts.activeListings}
                soldListings={sy8Counts.soldListings}
              />
            </div>
            <div className="mt-3 flex gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 [dir=rtl]:text-right">
              <span className="shrink-0" aria-hidden>
                ⚠️
              </span>
              <p>
                <span className="font-semibold">{t("payWarningShort")}</span>
                <span className="mt-0.5 block text-amber-900/90">{t("payWarning")}</span>
              </p>
            </div>
            <p className="mt-3">
              <Sy8LocationQualityBadge listing={listing} />
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-sm [dir=rtl]:text-right sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500">{t("hostListings")}</p>
              <p className="text-lg font-semibold text-neutral-900">{hostStats.listingCount}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">{t("hostCompleted")}</p>
              <p className="text-lg font-semibold text-neutral-900">{hostStats.completedStays}</p>
            </div>
          </div>

          {fromAmenities.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-neutral-800 [dir=rtl]:text-right">{t("amenities")}</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {fromAmenities.map((k) => {
                  const lab = labelSyriaAmenityForListing(k, locale);
                  return (
                    <li
                      key={k}
                      className="rounded-full border border-neutral-200/80 bg-white px-3 py-1 text-xs font-medium text-neutral-800"
                    >
                      {lab.primary}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="prose prose-sm max-w-none text-neutral-700 [dir=rtl]:text-right">
            <h2 className="text-sm font-semibold text-neutral-900">{t("description")}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{pickListingDescription(listing, locale)}</p>
          </div>

          <SybnbReportForm propertyId={listing.id} disabled={isOwner || !user} variant="section" />

          {guest ? (
            <div className="mt-8">
              <OfflineListingMessageDraft listingId={listing.id} disabled={isOwner || !user} />
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-lg">
              {listing.pricePerNight != null || listing.price ? (
                <p className="text-2xl font-bold text-neutral-900">
                  {money(
                    listing.pricePerNight != null ? listing.pricePerNight : listing.price.toString(),
                    listing.currency,
                  )}
                  <span className="text-sm font-normal text-neutral-500"> / {t("night")}</span>
                </p>
              ) : null}

              {guest && (hasContactChannels || canBook) ? (
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-100 pb-3 text-xs font-semibold text-neutral-700 [dir=rtl]:text-right">
                  <span className="text-neutral-500">{t("conversionQuickNav")}</span>
                  {hasContactChannels ? (
                    <a href="#sybnb-contact-panel" className="text-amber-900 underline underline-offset-2 hover:text-amber-950">
                      {t("jumpContact")}
                    </a>
                  ) : null}
                  {canBook ? (
                    <a href="#sybnb-request-anchor" className="text-amber-900 underline underline-offset-2 hover:text-amber-950">
                      {t("jumpRequest")}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {guest && hasContactChannels ? (
                <div id="sybnb-contact-panel" className="mt-4 min-w-0 scroll-mt-28">
                  <ListingOwnerContactCard
                    listingId={listing.id}
                    waOwnerHref={waOwnerHref}
                    telOwnerHref={telOwnerHref}
                    canContact
                    primaryHeading={t("primaryContactTitle")}
                  />
                </div>
              ) : null}

              {guest && hasContactChannels && canBook && !prioritizeBookingAfterContactSoft ? (
                <div id="sybnb-request-anchor" className="mt-4 min-w-0 scroll-mt-28">
                  <p className="mb-2 text-xs font-semibold text-neutral-600 [dir=rtl]:text-right">{t("requestAfterContact")}</p>
                  <SybnbV1RequestForm listingId={listing.id} guestsMax={listing.guestsMax} />
                </div>
              ) : null}

              {guest && hasContactChannels && !canBook ? (
                <p className="mt-4 text-sm text-amber-900/90 [dir=rtl]:text-right">{t("requestSignedInButBlocked")}</p>
              ) : null}

              {guest && !hasContactChannels && canBook ? (
                <div id="sybnb-request-anchor" className="mt-4 min-w-0 scroll-mt-28">
                  <p className="mb-2 text-sm font-semibold text-neutral-900 [dir=rtl]:text-right">{t("requestCta")}</p>
                  <SybnbV1RequestForm listingId={listing.id} guestsMax={listing.guestsMax} />
                </div>
              ) : null}

              {guest && !hasContactChannels && !showBookingRequest ? (
                <p className="mt-4 text-sm text-amber-900/90 [dir=rtl]:text-right">{t("requestSignedInButBlockedNoPhone")}</p>
              ) : null}

              {isOwner ? <p className="mt-2 text-sm text-neutral-600 [dir=rtl]:text-right">{t("ownerNote")}</p> : null}

              {!user && !isOwner ? (
                <p className="mt-2 text-sm text-neutral-600 [dir=rtl]:text-right">
                  <Link href="/login" className="font-semibold text-amber-800 underline">
                    {t("signIn")}
                  </Link>{" "}
                  {isHotel ? t("toContactHotel") : t("toBook")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
