"use server";

import { Prisma, SyriaListingPlan, SyriaPaymentMethod } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { SYRIA_PRICING } from "@/lib/pricing";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { validateListingGovernorateCityArea } from "@/lib/syria-location-catalog";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { findSyriaCityByStored } from "@/data/syriaLocations";
import { validateBilingualListingCopy } from "@/lib/listing-bilingual-validation";
import { allocateAdCodeInTransaction } from "@/lib/syria/ad-code";

function districtEnFromStored(cityCanonicalEn: string, areaStored: string | null | undefined): string | null {
  try {
    const a = typeof areaStored === "string" ? areaStored.trim() : "";
    if (!a) return null;
    const hit = findSyriaCityByStored(cityCanonicalEn);
    if (!hit) return null;
    for (const ar of hit.city.areas) {
      if (ar.name_ar === a) return ar.name_en;
    }
    return null;
  } catch {
    return null;
  }
}

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
  assertDarlinkRuntimeEnv();
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
  const isDirect = formData.getAll("isDirect").includes("1");
  const planRaw = String(formData.get("plan") ?? "free").toLowerCase();
  const plan: SyriaListingPlan = ["free", "featured", "premium"].includes(planRaw)
    ? (planRaw as SyriaListingPlan)
    : "free";
  const manualRef = String(formData.get("manual_ref") ?? "").trim() || null;
  const proofUrl = String(formData.get("proof_url") ?? "").trim() || null;
  const rawMethod = String(formData.get("payment_method") ?? "MANUAL_TRANSFER").toUpperCase();
  const paymentMethod: SyriaPaymentMethod = ["MANUAL_TRANSFER", "CASH", "LOCAL_GATEWAY_PLACEHOLDER"].includes(rawMethod)
    ? (rawMethod as SyriaPaymentMethod)
    : "MANUAL_TRANSFER";

  const bilingualOk = validateBilingualListingCopy({
    titleAr,
    descriptionAr,
    titleEn,
    descriptionEn,
  });
  if (!bilingualOk.ok || !cityRaw || !governorate || !price) {
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

  const cityHit = findSyriaCityByStored(city);
  const cityAr = cityHit?.city.name_ar ?? null;
  const cityEnStored = city;
  const districtEnStored = districtEnFromStored(city, area);

  if (!["SALE", "RENT", "BNHUB"].includes(type)) {
    return;
  }

  if (!coordsOk) {
    return;
  }

  const listingFee = new Prisma.Decimal(SYRIA_PRICING.listingFeeAmount);
  const featuredFee = plan === "featured" ? new Prisma.Decimal(SYRIA_PRICING.featuredBoostAmount) : null;
  const premiumFee = plan === "premium" ? new Prisma.Decimal(SYRIA_PRICING.premiumBoostAmount) : null;

  const bnhubListingFee =
    type === "BNHUB" && syriaPlatformConfig.monetization.bnhubListingFeeAmount > 0
      ? new Prisma.Decimal(syriaPlatformConfig.monetization.bnhubListingFeeAmount)
      : null;

  const property = await prisma.$transaction(async (tx) => {
    const adCode = await allocateAdCodeInTransaction(tx, "real_estate");
    const p = await tx.syriaProperty.create({
      data: {
        adCode,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        governorate: governorateEn,
        city,
        cityAr,
        cityEn: cityEnStored,
        area,
        districtAr: area,
        districtEn: districtEnStored,
        placeName,
        addressText,
        latitude: coordsOk ? latitude : null,
        longitude: coordsOk ? longitude : null,
        price: new Prisma.Decimal(price),
        currency: SYRIA_PRICING.currency,
        type: type as "SALE" | "RENT" | "BNHUB",
        category: "real_estate",
        subcategory:
          type === "RENT" ? "rent" : type === "BNHUB" ? "hotel" : "sale",
        images,
        amenities,
        ownerId: user.id,
        status: "PENDING_REVIEW",
        plan,
        isFeatured: false,
        featuredUntil: null,
        isDirect,
      },
    });

    await tx.syriaListingPayment.create({
      data: {
        propertyId: p.id,
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
      await tx.syriaListingPayment.create({
        data: {
          propertyId: p.id,
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
    }

    if (premiumFee) {
      await tx.syriaListingPayment.create({
        data: {
          propertyId: p.id,
          ownerId: user.id,
          amount: premiumFee,
          currency: SYRIA_PRICING.currency,
          purpose: "PREMIUM",
          status: "PENDING",
          referenceNumber: manualRef,
          proofUrl,
          paymentMethod,
        },
      });
    }

    if (bnhubListingFee) {
      await tx.syriaListingPayment.create({
        data: {
          propertyId: p.id,
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

    return p;
  });

  if (featuredFee) {
    await trackSyriaGrowthEvent({
      eventType: "featured_upgrade_selected",
      userId: user.id,
      propertyId: property.id,
      payload: { amount: SYRIA_PRICING.featuredBoostAmount, currency: SYRIA_PRICING.currency, plan: "featured" as const },
    });
  }

  if (premiumFee) {
    await trackSyriaGrowthEvent({
      eventType: "premium_upgrade_selected",
      userId: user.id,
      propertyId: property.id,
      payload: { amount: SYRIA_PRICING.premiumBoostAmount, currency: SYRIA_PRICING.currency, plan: "premium" as const },
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
      plan,
      hasCoordinates: coordsOk,
      hasArea: Boolean(area),
    },
  });

  await revalidateSyriaPaths("/sell", "/dashboard/listings", "/admin/listings");
  const locale = await getLocale();
  redirect({ href: "/dashboard?posted=1", locale });
}
