import { Prisma, SyriaSybnbListingReview } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { SYRIA_PRICING } from "@/lib/pricing";
import { onlyDigits, toWhatsAppPath } from "@/lib/syria-phone";
import { findSyriaCityByStored } from "@/data/syriaLocations";
import { allocateAdCodeInTransaction } from "@/lib/syria/ad-code";
import { runAntiFraudGuardsForPublish } from "@/lib/anti-fraud/guards";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { getSessionUser, setSessionUserId } from "@/lib/auth";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import type { SybnbHotelLeadStatus } from "@/generated/prisma";
import { listingPhotoSafetyNeedsReview } from "@/lib/listing-photo-safety";
import { buildSmartListingDescriptionArEn } from "@/lib/listing-smart-description";
import { MAX_LISTING_IMAGES } from "@/lib/syria/photo-upload";

export type HotelOnboardPersistResult =
  | { ok: true; listingId: string; adCode: string; leadId: string; pricePerNight: number }
  | { ok: false; reason: "validation" | "daily_limit" | "duplicate" | "verification_required" };

const DEFAULT_NIGHTLY = (() => {
  const n = Number(process.env.SYBNB_HOTEL_ONBOARD_DEFAULT_NIGHTLY_SYP ?? "250000");
  return Number.isFinite(n) && n >= 2000 ? Math.floor(n) : 250_000;
})();

const TRIAL_FEATURED_DAYS = (() => {
  const n = Number(process.env.SYBNB_HOTEL_ONBOARD_FEATURED_TRIAL_DAYS ?? "14");
  return Number.isFinite(n) && n > 0 ? Math.min(90, Math.floor(n)) : 14;
})();

function featuredTrialUntil(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_FEATURED_DAYS);
  return d;
}

function normalizePhone(raw: string): string | null {
  const p = onlyDigits(raw.trim());
  if (p.length < 8 || !toWhatsAppPath(p)) return null;
  return p;
}

/**
 * ORDER SYBNB-53 — Auto-publish HOTEL stay listing (featured trial) + verify owner + CRM lead row.
 */
export async function persistSybnbHotelOnboarding(input: {
  hotelName: string;
  cityRaw: string;
  phoneRaw: string;
  images?: string[];
}): Promise<HotelOnboardPersistResult> {
  const titleAr = input.hotelName.trim();
  const cityRaw = input.cityRaw.trim();
  const phone = normalizePhone(input.phoneRaw);
  if (titleAr.length < 2 || cityRaw.length < 2 || !phone) {
    return { ok: false, reason: "validation" };
  }

  const resolved = findSyriaCityByStored(cityRaw);
  const stateLine = resolved?.governorate.name_en ?? "Damascus";
  const cityStored = resolved?.city.name_en ?? cityRaw;

  const rawImg = (input.images ?? []).filter((u): u is string => typeof u === "string" && u.length > 0);
  if (rawImg.length > MAX_LISTING_IMAGES) {
    return { ok: false, reason: "validation" };
  }
  const imgs = rawImg.slice(0, MAX_LISTING_IMAGES);

  const nightly = DEFAULT_NIGHTLY;
  const priceDec = new Prisma.Decimal(nightly);

  let user = await prisma.syriaAppUser.findFirst({ where: { phone } });
  if (!user) {
    const ensured = await ensureGuestUserForPhone(phone, titleAr.slice(0, 120));
    user = await prisma.syriaAppUser.findUniqueOrThrow({ where: { id: ensured.id } });
  }
  /** Agents/admins keep admin session when submitting on behalf of a hotel. */
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== "ADMIN") {
    await setSessionUserId(user.id);
  }

  const verifiedNow = new Date();
  await prisma.syriaAppUser.update({
    where: { id: user.id },
    data: {
      phone,
      verifiedAt: verifiedNow,
      phoneVerifiedAt: verifiedNow,
      verificationLevel: user.verificationLevel?.trim() ? user.verificationLevel : "phone",
    },
  });

  const guards = await runAntiFraudGuardsForPublish({
    ownerId: user.id,
    titleAr,
    priceDec,
    category: "stay",
  });
  if (!guards.ok) {
    return { ok: false, reason: guards.code };
  }

  const category = "stay" as const;
  const subcategory = "hotel";

  const smartDesc = buildSmartListingDescriptionArEn({
    cityAr: resolved?.city.name_ar ?? null,
    cityCanonicalEn: cityStored,
    area: null,
    price: nightly,
    amenities: [],
    type: "HOTEL",
    currency: SYRIA_PRICING.currency,
  });
  const descriptionAr = smartDesc.descriptionAr;
  const descriptionEn = smartDesc.descriptionEn;

  const featuredUntil = featuredTrialUntil();

  const property = await prisma.$transaction(async (tx) => {
    const adCode = await allocateAdCodeInTransaction(tx, category);
    return tx.syriaProperty.create({
      data: {
        adCode,
        titleAr,
        titleEn: null,
        descriptionAr,
        descriptionEn,
        state: stateLine,
        governorate: stateLine,
        city: cityStored,
        cityAr: cityStored,
        cityEn: cityStored,
        area: null,
        districtAr: null,
        districtEn: null,
        placeName: null,
        addressText: null,
        addressDetails: null,
        latitude: null,
        longitude: null,
        price: priceDec,
        pricePerNight: nightly,
        currency: SYRIA_PRICING.currency,
        type: "HOTEL",
        category,
        subcategory,
        images: imgs,
        amenities: [],
        ownerId: user.id,
        status: "PUBLISHED",
        plan: "featured",
        isFeatured: true,
        featuredUntil,
        featuredPriority: 2,
        listingVerified: true,
        verified: true,
        isDirect: true,
        needsReview: listingPhotoSafetyNeedsReview(imgs),
        sybnbReview: SyriaSybnbListingReview.APPROVED,
        hotelName: titleAr,
        contactPhone: phone,
        receptionAvailable: true,
        guestsMax: 4,
      },
    });
  });

  await recomputeSy8FeedRankForPropertyId(property.id);

  const leadNotesLine = `SYBNB-53 listing ${property.id} · ad ${property.adCode}`;
  const existingLead = await prisma.sybnbHotelLead.findFirst({
    where: { phone },
    orderBy: { updatedAt: "desc" },
  });

  let leadId: string;
  if (existingLead) {
    const merged = [existingLead.notes?.trim(), leadNotesLine].filter(Boolean).join("\n");
    const updated = await prisma.sybnbHotelLead.update({
      where: { id: existingLead.id },
      data: {
        name: titleAr,
        city: cityStored,
        status: "onboarded" as SybnbHotelLeadStatus,
        notes: merged.slice(0, 12000),
      },
    });
    leadId = updated.id;
  } else {
    const created = await prisma.sybnbHotelLead.create({
      data: {
        name: titleAr,
        phone,
        city: cityStored,
        status: "onboarded",
        notes: leadNotesLine,
      },
    });
    leadId = created.id;
  }

  await trackSyriaGrowthEvent({
    eventType: "listing_persisted",
    userId: user.id,
    propertyId: property.id,
    payload: {
      city: cityStored,
      state: stateLine,
      type: "HOTEL",
      category,
      subcategory,
      source: "sybnb_hotel_onboard",
      leadId,
    },
  });

  return { ok: true, listingId: property.id, adCode: property.adCode, leadId, pricePerNight: nightly };
}
