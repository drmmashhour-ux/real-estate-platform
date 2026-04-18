"use server";

import { Prisma, SyriaPaymentMethod } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { SYRIA_PRICING } from "@/lib/pricing";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { validateListingGovernorateCityArea } from "@/lib/syria-location-catalog";

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function parseAmenities(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export async function createPropertyListing(formData: FormData): Promise<void> {
  const user = await requireSessionUser();

  const titleAr = String(formData.get("title_ar") ?? "").trim();
  const titleEn = String(formData.get("title_en") ?? "").trim() || null;
  const descriptionAr = String(formData.get("description_ar") ?? "").trim();
  const descriptionEn = String(formData.get("description_en") ?? "").trim() || null;
  const governorate = String(formData.get("governorate") ?? "").trim();
  const cityRaw = String(formData.get("city") ?? "").trim();
  const areaRaw = String(formData.get("area") ?? "").trim();
  const placeNameRaw = String(formData.get("place_name") ?? "").trim();
  const addressText = String(formData.get("address_text") ?? "").trim() || null;
  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();
  const latitude =
    latRaw !== "" && Number.isFinite(Number(latRaw)) ? Number(latRaw) : null;
  const longitude =
    lngRaw !== "" && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null;
  const coordsOk =
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
  const price = String(formData.get("price") ?? "").trim();
  const type = String(formData.get("type") ?? "SALE").toUpperCase();
  const images = parseImages(String(formData.get("images") ?? ""));
  const amenities = parseAmenities(String(formData.get("amenities") ?? ""));
  const featured = formData.get("featured") === "on";
  const manualRef = String(formData.get("manual_ref") ?? "").trim() || null;
  const proofUrl = String(formData.get("proof_url") ?? "").trim() || null;
  const rawMethod = String(formData.get("payment_method") ?? "MANUAL_TRANSFER").toUpperCase();
  const paymentMethod: SyriaPaymentMethod = ["MANUAL_TRANSFER", "CASH", "LOCAL_GATEWAY_PLACEHOLDER"].includes(rawMethod)
    ? (rawMethod as SyriaPaymentMethod)
    : "MANUAL_TRANSFER";

  if (!titleAr || !descriptionAr || !cityRaw || !governorate || !price) {
    return;
  }

  const locationOk = validateListingGovernorateCityArea(governorate, cityRaw, areaRaw || null, placeNameRaw || null);
  if (!locationOk.ok) {
    return;
  }

  const city = locationOk.cityEn;
  const area = locationOk.area;
  const governorateEn = locationOk.governorateEn;
  const placeName = locationOk.placeName;

  if (!["SALE", "RENT", "BNHUB"].includes(type)) {
    return;
  }

  if (!coordsOk) {
    return;
  }

  const listingFee = new Prisma.Decimal(SYRIA_PRICING.listingFeeAmount);
  const featuredFee = featured
    ? new Prisma.Decimal(SYRIA_PRICING.featuredBoostAmount)
    : null;

  const bnhubListingFee =
    type === "BNHUB" && syriaPlatformConfig.monetization.bnhubListingFeeAmount > 0
      ? new Prisma.Decimal(syriaPlatformConfig.monetization.bnhubListingFeeAmount)
      : null;

  const property = await prisma.syriaProperty.create({
    data: {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      governorate: governorateEn,
      city,
      area,
      placeName,
      addressText,
      latitude: coordsOk ? latitude : null,
      longitude: coordsOk ? longitude : null,
      price: new Prisma.Decimal(price),
      currency: SYRIA_PRICING.currency,
      type: type as "SALE" | "RENT" | "BNHUB",
      images,
      amenities,
      ownerId: user.id,
      status: "PENDING_REVIEW",
      isFeatured: false,
      featuredUntil: null,
    },
  });

  await prisma.syriaListingPayment.create({
    data: {
      propertyId: property.id,
      ownerId: user.id,
      amount: listingFee,
      currency: SYRIA_PRICING.currency,
      purpose: "LISTING_FEE",
      status: "PENDING",
      referenceNumber: manualRef,
      proofUrl,
      paymentMethod,
    },
  });

  if (featuredFee) {
    await prisma.syriaListingPayment.create({
      data: {
        propertyId: property.id,
        ownerId: user.id,
        amount: featuredFee,
        currency: SYRIA_PRICING.currency,
        purpose: "FEATURED",
        status: "PENDING",
        referenceNumber: manualRef,
        proofUrl,
        paymentMethod,
      },
    });
    await trackSyriaGrowthEvent({
      eventType: "featured_upgrade_selected",
      userId: user.id,
      propertyId: property.id,
      payload: { amount: SYRIA_PRICING.featuredBoostAmount, currency: SYRIA_PRICING.currency },
    });
  }

  if (bnhubListingFee) {
    await prisma.syriaListingPayment.create({
      data: {
        propertyId: property.id,
        ownerId: user.id,
        amount: bnhubListingFee,
        currency: SYRIA_PRICING.currency,
        purpose: "BNHUB_LISTING",
        status: "PENDING",
        referenceNumber: manualRef,
        proofUrl,
        paymentMethod,
      },
    });
  }

  await trackSyriaGrowthEvent({
    eventType: "listing_created",
    userId: user.id,
    propertyId: property.id,
    payload: {
      type,
      city,
      governorate: governorateEn,
      featuredRequested: featured,
      hasCoordinates: coordsOk,
      hasArea: Boolean(area),
    },
  });

  await revalidateSyriaPaths("/sell", "/dashboard/listings", "/admin/listings");
  const locale = await getLocale();
  redirect({ href: "/dashboard/listings", locale });
}
