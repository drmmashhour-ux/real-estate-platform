import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickListingTitle } from "@/lib/listing-localized";
import { getLocalizedPropertyCity } from "@/lib/property-localization";
import { backfillLocalizedPropertyShape } from "@/lib/property-legacy-compat";
import { money } from "@/lib/format";
import { AdStudioClient } from "@/components/studio/AdStudioClient";
import { darlinkMetadataBase, buildDarlinkPageMetadata } from "@/lib/seo/darlink-metadata";
import type { DarlinkLocale } from "@/lib/i18n/types";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; listingId: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { listingId, locale } = await props.params;
  const listing = await prisma.syriaProperty.findUnique({ where: { id: listingId } });
  if (!listing) {
    return { ...darlinkMetadataBase(), title: "Ad Studio" };
  }
  const titleStr = pickListingTitle(listing, locale);
  return {
    ...darlinkMetadataBase(),
    ...buildDarlinkPageMetadata({
      locale: locale as DarlinkLocale,
      title: `Ad Studio · ${titleStr}`,
      description: "Promo preview for your listing",
      pathname: `/studio/${listingId}`,
    }),
  };
}

export default async function AdStudioPage(props: Props) {
  const { listingId, locale } = await props.params;
  const t = await getTranslations("AdStudio");
  const user = await requireSessionUser();

  const listing = await prisma.syriaProperty.findFirst({
    where: { id: listingId, ownerId: user.id, fraudFlag: false },
  });
  if (!listing || listing.status !== "PUBLISHED") {
    notFound();
  }

  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const loc = await getLocale();
  const localized = backfillLocalizedPropertyShape(listing);
  const titleDisplay = pickListingTitle(listing, loc);
  const cityDisplay = getLocalizedPropertyCity(localized, loc) || listing.city;
  const sharePriceLine = money(listing.price, listing.currency, numberLoc);
  const images = Array.isArray(listing.images) ? listing.images.filter((x) => x.length > 0) : [];

  return (
    <div className="mx-auto max-w-2xl p-4">
      <AdStudioClient
        listingId={listing.id}
        initialAdStyle={listing.adStyle}
        title={titleDisplay}
        priceLine={sharePriceLine}
        city={cityDisplay}
        images={images}
      />
      <p className="mt-6 text-center text-xs text-[color:var(--darlink-text-muted)]" dir={loc.startsWith("ar") ? "rtl" : "ltr"}>
        {t("disclaimer")}
      </p>
    </div>
  );
}
