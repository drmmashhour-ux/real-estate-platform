import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SYRIA_PRICING } from "@/lib/pricing";
import { onlyDigits, toWhatsAppPath } from "@/lib/syria-phone";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { normalizeSyriaAmenityKeysPreserveOrder } from "@/lib/syria/amenities";
import {
  defaultSubcategory,
  isMarketplaceCategory,
  isSubcategoryForCategory,
  listingTypeForMarketplace,
  type MarketplaceCategory,
} from "@/lib/marketplace-categories";
import { allocateAdCodeInTransaction } from "@/lib/syria/ad-code";
import { findSyriaCityByStored } from "@/data/syriaLocations";
import { runAntiFraudGuardsForPublish } from "@/lib/anti-fraud/guards";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { sybnbConfig } from "@/config/sybnb.config";
import { isSy8SellerVerified } from "@/lib/sy8/sy8-reputation";
import type { SyriaPropertyType } from "@/generated/prisma";
import { listingPhotoSafetyNeedsReview } from "@/lib/listing-photo-safety";
import { MAX_LISTING_IMAGES } from "@/lib/syria/photo-upload";
import { normalizeProofDocumentsPayload } from "@/lib/syria/property-proof-documents-normalize";
import { normalizeListingImagesForPersist } from "@/lib/syria/server-listing-images";
import { listingNeedsSmartArabicDescription, buildSmartListingDescriptionArEn } from "@/lib/listing-smart-description";
import {
  derivePostingKindFromMarketplace,
  isHighValuePostingKind,
  isKnownPostingKind,
  isLowValuePostingKind,
  requiresOwnershipMandateDeclaration,
  type PostingKind,
} from "@/lib/listing-posting-kind";
import { shouldAutoHoldListingForBurst } from "@/lib/syria/antispam-actions";
import { sybn108OptionalTestFields } from "@/lib/sybn/sybn108-test-mode";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";

export type PersistQuickListingResult =
  | {
      ok: true;
      id: string;
      userId: string;
      adCode: string;
      priceWarningKey?: "priceWarnGeneric" | "priceWarnStay";
    }
  | {
      ok: false;
      reason:
        | "validation"
        | "daily_limit"
        | "duplicate"
        | "verification_required"
        | "auth_required"
        | "ownership_required"
        | "ownership_phone_mismatch";
    };

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
  /** Optional Arabic description; SYBNB-68 auto-fills when empty or below quality threshold. */
  descriptionAr?: string;
  /** ORDER SYBNB-93 — optional display name for anonymous low-tier posts */
  posterName?: string;
  /** ORDER SYBNB-93 — explicit tier key; otherwise derived from category/subcategory */
  postingKind?: string;
  allowPhone?: boolean;
  allowWhatsApp?: boolean;
  allowEmail?: boolean;
  allowMessages?: boolean;
  contactEmail?: string;
  /** ORDER SYBNB-99 — real_estate apartment/house/land */
  isOwner?: boolean;
  hasMandate?: boolean;
  ownerName?: string;
  mandateDocumentUrl?: string | null;
  /** ORDER SYBNB-100 — JSON array `{ type, url }[]` (URLs from `/api/listings/upload-proof-document`). */
  proofDocuments?: unknown;
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
  const marketplaceType = listingTypeForMarketplace(category, subcategory);
  const rawPk = input.postingKind?.trim();
  if (rawPk && !isKnownPostingKind(rawPk)) {
    return { ok: false, reason: "validation" };
  }
  const postingKindResolved: PostingKind =
    rawPk && isKnownPostingKind(rawPk) ? rawPk : derivePostingKindFromMarketplace(category, subcategory);

  let finalType: SyriaPropertyType;
  if (category === "stay") {
    finalType = marketplaceType;
  } else if (input.type === "RENT") {
    finalType = "RENT";
  } else if (marketplaceType === "BNHUB") {
    finalType = "BNHUB";
  } else if (marketplaceType === "RENT") {
    finalType = "RENT";
  } else {
    finalType = "SALE";
  }
  const rawImages = (input.images?.filter((s): s is string => typeof s === "string" && s.length > 0) ?? []);
  if (rawImages.length > MAX_LISTING_IMAGES) {
    return { ok: false, reason: "validation" };
  }
  /** ORDER SYBNB-87 — production: HTTPS image URLs only (CDN); dev still allows data URLs for local testing without Cloudinary. */
  if (
    process.env.NODE_ENV === "production" &&
    rawImages.some(
      (u) =>
        u.startsWith("data:") ||
        (!/^https:\/\//i.test(u.trim()) && u.trim().length > 0),
    )
  ) {
    return { ok: false, reason: "validation" };
  }
  const images = await normalizeListingImagesForPersist(rawImages.slice(0, MAX_LISTING_IMAGES));
  const amenities = normalizeSyriaAmenityKeysPreserveOrder(input.amenities);
  const isDirect = input.isDirect !== false;

  const allowPhone = input.allowPhone !== false;
  const allowWhatsApp = input.allowWhatsApp !== false;
  const allowEmail = input.allowEmail === true;
  const allowMessages = input.allowMessages !== false;
  const contactEmail = input.contactEmail?.trim() || null;

  if (!allowPhone && !allowWhatsApp && !allowEmail && !allowMessages) {
    return { ok: false, reason: "validation" };
  }
  if (allowEmail && !contactEmail) {
    return { ok: false, reason: "validation" };
  }

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

  let isAnonymousFlag = false;
  let ownerUser = await getSessionUser();

  if (!ownerUser && isLowValuePostingKind(postingKindResolved)) {
    const guest = await ensureGuestUserForPhone(
      phone,
      input.posterName?.trim() || titleAr.slice(0, 120),
    );
    ownerUser = await prisma.syriaAppUser.findUniqueOrThrow({ where: { id: guest.id } });
    isAnonymousFlag = true;
  } else if (!ownerUser) {
    return { ok: false, reason: "auth_required" };
  } else {
    ownerUser = await prisma.syriaAppUser.findUniqueOrThrow({ where: { id: ownerUser.id } });
  }

  const user = ownerUser;

  const ownershipRequired = requiresOwnershipMandateDeclaration(category, postingKindResolved);
  const declaresOwner = input.isOwner === true;
  const declaresMandate = input.hasMandate === true;
  const ownerNameStored = input.ownerName?.trim() || null;
  const mandateUrl = input.mandateDocumentUrl?.trim() || null;

  const proofNormResult = normalizeProofDocumentsPayload(input.proofDocuments);
  if (proofNormResult === null) {
    return { ok: false, reason: "validation" };
  }
  const proofNorm = proofNormResult;
  if (proofNorm.length > 0 && category !== "real_estate") {
    return { ok: false, reason: "validation" };
  }

  if (ownershipRequired) {
    if (!declaresOwner && !declaresMandate) {
      return { ok: false, reason: "ownership_required" };
    }
    const accountDigits = onlyDigits(user.phone ?? "");
    if (accountDigits.length >= 8 && accountDigits !== phone) {
      return { ok: false, reason: "ownership_phone_mismatch" };
    }
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

  /** ORDER SYBNB-94 — apartments, houses, hotels, booking listings: phone verification (or manual admin verification). */
  if (isHighValuePostingKind(postingKindResolved)) {
    const ownerPick = await prisma.syriaAppUser.findUnique({
      where: { id: user.id },
      select: { phoneVerified: true, phoneVerifiedAt: true, verifiedAt: true, verificationLevel: true },
    });
    if (!isSy8SellerVerified(ownerPick)) {
      return { ok: false, reason: "verification_required" };
    }
  }
  const priceWarningKey = guards.priceWarningKey;

  const spamBurstPublishing = await shouldAutoHoldListingForBurst(user.id);

  let descriptionAr =
    input.descriptionAr?.trim() && input.descriptionAr.trim() !== "—"
      ? input.descriptionAr.trim().slice(0, 4000)
      : "";
  let descriptionEn: string | null = null;

  const cityResolvedAr = findSyriaCityByStored(city)?.city.name_ar ?? city;

  if (listingNeedsSmartArabicDescription(descriptionAr)) {
    const gen = buildSmartListingDescriptionArEn({
      cityAr: cityResolvedAr,
      cityCanonicalEn: city,
      area,
      price: priceStr,
      amenities,
      type: finalType,
      currency: SYRIA_PRICING.currency,
    });
    descriptionAr = gen.descriptionAr;
    descriptionEn = gen.descriptionEn;
  }

  const photoNeedsReview = listingPhotoSafetyNeedsReview(images);
  const needsReviewEffective = spamBurstPublishing || photoNeedsReview;

  const property = await prisma.$transaction(async (tx) => {
    await tx.syriaAppUser.update({
      where: { id: user.id },
      data: {
        phone,
        ...(spamBurstPublishing ? { flagged: true } : {}),
      },
    });
    const adCode = await allocateAdCodeInTransaction(tx, category);
    const sybnbReviewVal =
      category === "stay" ?
        spamBurstPublishing ? "PENDING"
        : sybnbConfig.autoApproveStays ? "APPROVED"
        : "PENDING"
      : undefined;

    return tx.syriaProperty.create({
      data: {
        adCode,
        titleAr,
        titleEn: null,
        descriptionAr,
        descriptionEn,
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
        /** Seller id — ORDER SYBNB-94 (listing ownership). */
        ownerId: user.id,
        status: spamBurstPublishing ? "NEEDS_REVIEW" : "PUBLISHED",
        plan: "free",
        isFeatured: false,
        featuredUntil: null,
        listingVerified: false,
        verified: false,
        isDirect,
        needsReview: needsReviewEffective,
        isAnonymous: isAnonymousFlag,
        postingKind: postingKindResolved,
        contactEmail,
        allowPhone,
        allowWhatsApp,
        allowEmail,
        allowMessages,
        ...(ownershipRequired ?
          {
            ownerName: ownerNameStored,
            ownerPhone: phone,
            isOwner: declaresOwner,
            hasMandate: declaresMandate,
            mandateDocumentUrl: mandateUrl || null,
            ownershipVerified: false,
          }
        : {}),
        proofDocumentsSubmitted: proofNorm.length > 0,
        ...(proofNorm.length > 0 ?
          {
            propertyDocuments: {
              create: proofNorm.map((d) => ({ type: d.type, url: d.url })),
            },
            ownershipMoreDocsRequestedAt: null,
          }
        : {}),
        ...(sybnbReviewVal ? { sybnbReview: sybnbReviewVal } : {}),
        ...sybn108OptionalTestFields(),
      },
    });
  });

  await recomputeReputationScoreForUser(user.id);

  await trackSyriaGrowthEvent({
    eventType: "listing_persisted",
    userId: user.id,
    propertyId: property.id,
    payload: {
      city,
      state,
      type: finalType,
      category,
      subcategory,
      source: input.source,
      postingKind: postingKindResolved,
      isAnonymous: isAnonymousFlag,
    },
  });

  return {
    ok: true,
    id: property.id,
    userId: user.id,
    adCode: property.adCode,
    ...(priceWarningKey ? { priceWarningKey } : {}),
  };
}
