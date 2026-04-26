"use server";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { SYRIA_PRICING } from "@/lib/pricing";
import { onlyDigits } from "@/lib/syria-phone";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";

function parseImagesMvp(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * Real-market MVP: minimal fields, live on publish, owner phone for contact.
 */
export async function createMvpPropertyListing(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const user = await requireSessionUser();

  const titleAr = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = onlyDigits(String(formData.get("phone") ?? "").trim());
  const type = String(formData.get("type") ?? "SALE").toUpperCase();
  const images = parseImagesMvp(String(formData.get("images") ?? ""));

  if (titleAr.length < 2 || !city || !price || phone.length < 8) {
    return;
  }

  if (!["SALE", "RENT"].includes(type)) {
    return;
  }

  const priceDec = new Prisma.Decimal(price);
  if (priceDec.lte(0)) {
    return;
  }

  const descriptionAr = "—";
  const titleEn: string | null = null;
  const descriptionEn: string | null = null;

  const property = await prisma.$transaction(async (tx) => {
    await tx.syriaAppUser.update({
      where: { id: user.id },
      data: { phone: phone || undefined },
    });

    return tx.syriaProperty.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        governorate: null,
        city,
        cityAr: city,
        cityEn: city,
        area: null,
        districtAr: null,
        districtEn: null,
        placeName: null,
        addressText: null,
        latitude: null,
        longitude: null,
        price: priceDec,
        currency: SYRIA_PRICING.currency,
        type: type as "SALE" | "RENT",
        images,
        amenities: [],
        ownerId: user.id,
        status: "PUBLISHED",
        plan: "free",
        isFeatured: false,
        featuredUntil: null,
        listingVerified: false,
      },
    });
  });

  await trackSyriaGrowthEvent({
    eventType: "listing_created_mvp",
    userId: user.id,
    propertyId: property.id,
    payload: { city, type },
  });

  await revalidateSyriaPaths("/sell", "/dashboard/listings", "/buy", "/rent", "/");
  const locale = await getLocale();
  redirect({ href: "/dashboard/listings?posted=1", locale });
}
