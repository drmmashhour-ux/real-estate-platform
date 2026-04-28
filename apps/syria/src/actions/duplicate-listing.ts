"use server";

import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { allocateAdCodeInTransaction } from "@/lib/syria/ad-code";
import {
  SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_AR,
  SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_EN,
} from "@/lib/sybnb/automation-presets";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { SyriaSybnbListingReview } from "@/generated/prisma";

function trimTitleAr(raw: string): string {
  const max = 480;
  const t = raw.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Clone an owned listing as **DRAFT** with a fresh ad code — for scaling similar supply (SYBNB-18).
 */
export async function duplicateOwnListingFormAction(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const user = await requireSessionUser();
  const locale = await getLocale();
  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) {
    redirect({ href: "/dashboard/listings", locale });
    return;
  }

  const src = await prisma.syriaProperty.findUnique({ where: { id: listingId } });
  if (!src || src.ownerId !== user.id) {
    redirect({ href: "/dashboard/listings", locale });
    return;
  }

  const suffixAr = SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_AR;
  const titleArNext = trimTitleAr(`${src.titleAr}${suffixAr}`);
  const titleEnNext =
    src.titleEn?.trim() ?
      `${src.titleEn.trim()}${SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_EN}`.slice(0, 480)
    : null;

  const sybnbReviewNext =
    src.category === "stay" ? SyriaSybnbListingReview.PENDING : src.sybnbReview;

  const created = await prisma.$transaction(async (tx) => {
    const adCode = await allocateAdCodeInTransaction(tx, src.category);
    return tx.syriaProperty.create({
      data: {
        titleAr: titleArNext,
        titleEn: titleEnNext,
        descriptionAr: src.descriptionAr,
        descriptionEn: src.descriptionEn,
        price: src.price,
        pricePerNight: src.pricePerNight ?? undefined,
        currency: src.currency,
        type: src.type,
        state: src.state,
        governorate: src.governorate,
        city: src.city,
        cityAr: src.cityAr,
        cityEn: src.cityEn,
        area: src.area,
        districtAr: src.districtAr,
        districtEn: src.districtEn,
        placeName: src.placeName,
        addressText: src.addressText,
        addressDetails: src.addressDetails,
        latitude: src.latitude,
        longitude: src.longitude,
        images: [...src.images],
        amenities: [...src.amenities],
        availability: [],
        sybnbReview: sybnbReviewNext,
        ownerId: src.ownerId,
        status: "DRAFT",
        plan: "free",
        fraudFlag: false,
        needsReview: false,
        listingVerified: false,
        verified: false,
        isFeatured: false,
        featuredUntil: null,
        featuredPriority: 0,
        neighborhood: src.neighborhood,
        bedrooms: src.bedrooms,
        bathrooms: src.bathrooms,
        furnished: src.furnished,
        propertyCategory: src.propertyCategory,
        category: src.category,
        subcategory: src.subcategory,
        adStyle: src.adStyle,
        isDirect: src.isDirect,
        guestsMax: src.guestsMax,
        sybnbStayType: src.sybnbStayType,
        hotelName: src.hotelName,
        roomsAvailable: src.roomsAvailable,
        contactPhone: src.contactPhone,
        receptionAvailable: src.receptionAvailable,
        adCode,
        sy8FeedRankScore: 0,
      },
    });
  });

  await revalidateSyriaPaths("/dashboard/listings", "/sell", "/studio/" + created.id);
  redirect({ href: `/studio/${created.id}`, locale });
}
