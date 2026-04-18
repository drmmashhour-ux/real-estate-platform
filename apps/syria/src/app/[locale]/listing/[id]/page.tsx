import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pickListingDescription, pickListingTitle } from "@/lib/listing-localized";
import { money } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { createBnhubBooking } from "@/actions/bookings";
import { syriaFlags } from "@/lib/platform-flags";
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
import { resolveCityLabel } from "@/lib/syria-locations";
import { fuzzLatLngForDisplay } from "@/lib/geo";
import { ListingApproximateMap } from "@/components/listing/ListingApproximateMap";
import { ListingMobileBookingBar } from "@/components/listing/ListingMobileBookingBar";

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
      title: "Darlink",
    };
  }

  const titleStr = pickListingTitle(listing, locale);
  const descriptionStr = pickListingDescription(listing, locale).slice(0, 170);

  return {
    ...darlinkMetadataBase(),
    ...buildDarlinkPageMetadata({
      locale: locale as DarlinkLocale,
      title: `${titleStr} · Darlink`,
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

  await trackSyriaGrowthEvent({
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
  });

  const titleDisplay = pickListingTitle(listing, locale);
  const displayDescription = pickListingDescription(listing, locale);
  const cityDisplay = resolveCityLabel(listing.city, locale);
  const areaDisplay = listing.area ?? listing.neighborhood ?? null;
  const fuzz =
    listing.latitude != null && listing.longitude != null
      ? fuzzLatLngForDisplay(listing.id, listing.latitude, listing.longitude)
      : null;
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";

  const images = Array.isArray(listing.images)
    ? (listing.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const amenities = Array.isArray(listing.amenities)
    ? (listing.amenities as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const user = await getSessionUser();
  const showBooking =
    listing.type === "BNHUB" && syriaFlags.BNHUB_ENABLED && user && user.id !== listing.ownerId;

  const hostName = listing.owner.name?.trim() || listing.owner.email.split("@")[0];

  return (
    <>
      {showBooking ? <ListingMobileBookingBar amount={listing.price} currency={listing.currency} numberLoc={numberLoc} /> : null}
      <article className={showBooking ? "pb-24 md:pb-0" : undefined}>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-10">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color:var(--darlink-surface-muted)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[color:var(--darlink-text-muted)]">
                  {listing.type}
                </span>
                {listing.isFeatured ? <Badge tone="accent">{t("featuredBadge")}</Badge> : null}
                <VerifiedBadge label={t("reviewedBadge")} />
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--darlink-text)] sm:text-4xl">{titleDisplay}</h1>
              <p className="mt-2 text-[color:var(--darlink-text-muted)]">
                {cityDisplay}
                {areaDisplay ? ` · ${areaDisplay}` : ""}
              </p>
            </header>

            <PropertyImageGallery images={images} title={titleDisplay} />

            <Card className="border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/50 p-5 shadow-[var(--darlink-shadow-sm)]">
              <p className="text-sm leading-relaxed text-[color:var(--darlink-text)]">{t("trustNotice")}</p>
            </Card>

            <section>
              <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("description")}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">
                {displayDescription}
              </p>
            </section>

            {amenities.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("amenities")}</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
                    >
                      <span className="text-[color:var(--darlink-accent)]" aria-hidden>
                        ·
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("priceLabel")}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--darlink-text)]">
                {money(listing.price, listing.currency, numberLoc)}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">{t("priceHint")}</p>
            </Card>

            <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
              <h2 className="text-sm font-semibold text-[color:var(--darlink-text)]">{t("hostTitle")}</h2>
              <p className="mt-2 text-sm font-medium text-[color:var(--darlink-text)]">{hostName}</p>
              <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("hostHint")}</p>
            </Card>

            {listing.type === "BNHUB" && !syriaFlags.BNHUB_ENABLED ? (
              <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("bnhubDisabledShort")}</p>
              </Card>
            ) : listing.type === "BNHUB" && syriaFlags.BNHUB_ENABLED ? (
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
                      className="md:col-span-2 rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-accent)] py-3 text-sm font-semibold text-white shadow-[var(--darlink-shadow-sm)] hover:opacity-[0.96]"
                    >
                      {t("bookCta")}
                    </button>
                  </form>
                ) : null}
              </Card>
            ) : listing.type !== "BNHUB" ? (
              <Card className="border-[color:var(--darlink-border)] p-5 shadow-[var(--darlink-shadow-sm)]">
                <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("contactHint")}</p>
              </Card>
            ) : null}
          </aside>
        </div>
      </article>
    </>
  );
}
