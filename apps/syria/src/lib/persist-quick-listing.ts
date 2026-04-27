import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getSessionUser, setSessionUserId } from "@/lib/auth";
import { SYRIA_PRICING } from "@/lib/pricing";
import { onlyDigits, toWhatsAppPath } from "@/lib/syria-phone";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { normalizeSyriaAmenityKeys } from "@/lib/syria/amenities";
import {
  defaultSubcategory,
  isMarketplaceCategory,
  isSubcategoryForCategory,
  listingTypeForMarketplace,
  type MarketplaceCategory,
} from "@/lib/marketplace-categories";
import { allocateAdCodeInTransaction } from "@/lib/syria/ad-code";
import { runAntiFraudGuardsForPublish } from "@/lib/anti-fraud/guards";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { sybnbConfig } from "@/config/sybnb.config";

export type PersistQuickListingResult =
  | {
      ok: true;
      id: string;
      userId: string;
      adCode: string;
      priceWarningKey?: "priceWarnGeneric" | "priceWarnStay";
    }
  | { ok: false; reason: "validation" | "daily_limit" | "duplicate" };

/**
 * Minimal create for SyriaProperty — maps to existing Prisma model (titleAr, Decimal price, owner phone, etc.).
 */
export async function persistQuickListing(input: {
  title: string;
  /** English key from `SYRIA_STATES` */
  state: string;
  city: string;
  area?: string;
  addressDetails?: string;
  price: string | number;
  phoneRaw: string;
  type?: "SALE" | "RENT";
  images?: string[];
  /** e.g. "quick_post" | "mvp_sell" */
  source: string;
  /** SY-22: default true (direct owner, no broker). */
  isDirect?: boolean;
  /** Marketplace vertical; default `real_estate` / `sale` */
  category?: string;
  subcategory?: string;
  amenities?: string[];
  /** Optional Arabic description; defaults to short placeholder when empty. */
  descriptionAr?: string;
}): Promise<PersistQuickListingResult> {
  const titleAr = input.title.trim();
  const state = input.state?.trim() ?? "";
  const city = input.city.trim();
  const area = input.area?.trim() || null;
  const addressDetails = input.addressDetails?.trim() || null;
  const priceStr = typeof input.price === "number" ? String(input.price) : input.price.trim();
  const phone = onlyDigits(input.phoneRaw.trim());
  let category: MarketplaceCategory = "real_estate";
  let subcategory = "sale";
  const cr = (input.category ?? "").trim();
  const sr = (input.subcategory ?? "").trim();
  if (cr && isMarketplaceCategory(cr)) {
    category = cr;
    if (sr && isSubcategoryForCategory(cr, sr)) {
      subcategory = sr;
    } else {
      subcategory = defaultSubcategory(cr);
    }
  }
  const type = listingTypeForMarketplace(category, subcategory);
  const typeOverride: "SALE" | "RENT" | "BNHUB" =
    input.type === "RENT" ? "RENT" : type === "BNHUB" ? "BNHUB" : type === "RENT" ? "RENT" : "SALE";
  let finalType: "SALE" | "RENT" | "BNHUB" = input.type === "RENT" ? "RENT" : typeOverride;
  if (category === "stay") {
    finalType = "RENT";
  }
  const images = (input.images?.filter((s): s is string => typeof s === "string" && s.length > 0) ?? []).slice(0, 5);
  const amenities = normalizeSyriaAmenityKeys(input.amenities);
  const isDirect = input.isDirect !== false;

  if (titleAr.length < 2 || !state || !city || !priceStr || phone.length < 8) {
    return { ok: false, reason: "validation" };
  }
  if (!toWhatsAppPath(phone)) {
    return { ok: false, reason: "validation" };
  }

  const priceDec = new Prisma.Decimal(priceStr);
  if (priceDec.lte(0)) {
    return { ok: false, reason: "validation" };
  }
  const nightlyInt = category === "stay" ? Math.trunc(Number(priceStr)) : null;

  let user = await getSessionUser();
  if (!user) {
    const ensured = await ensureGuestUserForPhone(phone, titleAr.slice(0, 120));
    user = await prisma.syriaAppUser.findUniqueOrThrow({ where: { id: ensured.id } });
    await setSessionUserId(user.id);
  }

  const guards = await runAntiFraudGuardsForPublish({
    ownerId: user.id,
    titleAr,
    priceDec,
    category,
  });
  if (!guards.ok) {
    if (guards.code === "daily_limit") return { ok: false, reason: "daily_limit" };
    if (guards.code === "duplicate") return { ok: false, reason: "duplicate" };
    return { ok: false, reason: "validation" };
  }
  const priceWarningKey = guards.priceWarningKey;

  const descriptionAr =
    input.descriptionAr?.trim() && input.descriptionAr.trim() !== "—"
      ? input.descriptionAr.trim().slice(0, 4000)
      : "—";
  const property = await prisma.$transaction(async (tx) => {
    await tx.syriaAppUser.update({
      where: { id: user.id },
      data: { phone },
    });
    const adCode = await allocateAdCodeInTransaction(tx, category);
    return tx.syriaProperty.create({
      data: {
        adCode,
        titleAr,
        titleEn: null,
        descriptionAr,
        descriptionEn: null,
        state,
        governorate: state,
        city,
        cityAr: city,
        cityEn: city,
        area,
        districtAr: null,
        districtEn: null,
        placeName: null,
        addressText: null,
        addressDetails,
        latitude: null,
        longitude: null,
        price: priceDec,
        ...(nightlyInt != null && nightlyInt > 0 ? { pricePerNight: nightlyInt } : {}),
        currency: SYRIA_PRICING.currency,
        type: finalType,
        category,
        subcategory,
        images,
        amenities,
        ownerId: user.id,
        status: "PUBLISHED",
        plan: "free",
        isFeatured: false,
        featuredUntil: null,
        listingVerified: false,
        verified: false,
        isDirect,
        ...(category === "stay" ?
          {
            sybnbReview: sybnbConfig.autoApproveStays ? "APPROVED" : "PENDING",
          }
        : {}),
      },
    });
  });

  await trackSyriaGrowthEvent({
    eventType: "listing_persisted",
    userId: user.id,
    propertyId: property.id,
    payload: { city, state, type: finalType, category, subcategory, source: input.source },
  });

  return {
    ok: true,
    id: property.id,
    userId: user.id,
    adCode: property.adCode,
    ...(priceWarningKey ? { priceWarningKey } : {}),
  };
}
