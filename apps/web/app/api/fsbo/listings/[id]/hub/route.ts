import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { migrateLegacySellerDeclaration, syncSellerFullNameFromParties } from "@/lib/fsbo/seller-declaration-schema";
import { parseSellerDeclarationJson } from "@/lib/fsbo/seller-hub-validation";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { getFsboMaxPhotosForSellerPlan } from "@/lib/fsbo/photo-limits";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { refreshListingTrustGraphOnSave } from "@/lib/trustgraph/application/integrations/sellerDeclarationIntegration";
import { isOpenAiConfigured } from "@/lib/ai/openai";
import { assessListingPhotoForPropertyUse } from "@/lib/fsbo/assess-listing-photo-relevance";
import { fetchRemoteImageBufferForAssessment } from "@/lib/fsbo/fetch-remote-image-buffer";
import { getDeclarationListingConsistencyWarnings } from "@/lib/fsbo/listing-property-consistency";
import { setCentrisDistributionIntent } from "@/modules/distribution/distribution.service";
import { CENTRIS_PLATFORM } from "@/modules/distribution/centris.service";
import { safeRunFsboListingLegalCompliance } from "@/modules/legal/legal-compliance-runner";

export const dynamic = "force-dynamic";

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number.parseFloat(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function int(v: unknown): number | undefined {
  const n = num(v);
  if (n === undefined) return undefined;
  return Math.round(n);
}

/** PATCH — partial Seller Hub fields (owner; admin may edit for support). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const isAdmin = await isPlatformAdmin(userId);
  const existing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true, propertyType: true, images: true },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = existing.ownerId === userId;
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }
  if (!isAdmin && existing.status === "PENDING_VERIFICATION") {
    return Response.json({ error: "Listing is under review; edits are locked." }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const publishOnCentris = typeof body.publishOnCentris === "boolean" ? body.publishOnCentris : undefined;

  const data: Parameters<typeof prisma.fsboListing.update>[0]["data"] = {};
  let runDeclarationAiReview = false;
  let listingConsistencyWarnings: string[] | undefined;

  // DIY seller tier limits for photo uploads (not publish plan).
  let maxPhotos = 50;
  if (isOwner) {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { sellerPlan: true } });
    maxPhotos = getFsboMaxPhotosForSellerPlan(me?.sellerPlan);
  }

  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 200);
  if (typeof body.description === "string") data.description = body.description.trim().slice(0, 50_000);
  if (typeof body.address === "string") data.address = body.address.trim().slice(0, 500);
  if (typeof body.city === "string") data.city = body.city.trim().slice(0, 120);
  if (typeof body.contactEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail.trim())) {
    data.contactEmail = body.contactEmail.trim().slice(0, 320);
  }
  if (body.contactPhone === null || typeof body.contactPhone === "string") {
    data.contactPhone = body.contactPhone ? String(body.contactPhone).trim().slice(0, 40) : null;
  }

  const priceCents = int(body.priceCents) ?? (num(body.price) !== undefined ? Math.round((num(body.price) as number) * 100) : undefined);
  if (priceCents !== undefined && priceCents >= 1_000) {
    data.priceCents = priceCents;
  }

  const bedrooms = int(body.bedrooms);
  if (bedrooms !== undefined) data.bedrooms = Math.min(99, Math.max(0, bedrooms));
  const bathrooms = int(body.bathrooms);
  if (bathrooms !== undefined) data.bathrooms = Math.min(99, Math.max(0, bathrooms));
  const surfaceSqft = int(body.surfaceSqft);
  if (surfaceSqft !== undefined) data.surfaceSqft = Math.min(999_999_999, Math.max(0, surfaceSqft));

  if (typeof body.propertyType === "string") {
    data.propertyType = body.propertyType.trim().slice(0, 64) || null;
  }
  if (typeof body.cadastreNumber === "string") {
    data.cadastreNumber = body.cadastreNumber.trim().slice(0, 120) || null;
  }
  const yearBuilt = int(body.yearBuilt);
  if (yearBuilt !== undefined) {
    data.yearBuilt = yearBuilt > 1700 && yearBuilt <= new Date().getFullYear() + 1 ? yearBuilt : null;
  }
  const annualTaxesCents = int(body.annualTaxesCents);
  if (annualTaxesCents !== undefined && annualTaxesCents >= 0) {
    data.annualTaxesCents = annualTaxesCents;
  }
  const condoFeesCents = int(body.condoFeesCents);
  if (condoFeesCents !== undefined && condoFeesCents >= 0) {
    data.condoFeesCents = condoFeesCents;
  }

  if (Array.isArray(body.images)) {
    const nextImages = body.images
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim().slice(0, 2048))
      .slice(0, maxPhotos);
    const oldArr = Array.isArray(existing.images) ? (existing.images as string[]) : [];
    const oldFirst = oldArr[0] ?? null;
    const newFirst = nextImages[0] ?? null;

    if (
      newFirst &&
      newFirst !== oldFirst &&
      process.env.FSBO_LISTING_PHOTO_AI_CHECK !== "false" &&
      isOpenAiConfigured()
    ) {
      const buf = await fetchRemoteImageBufferForAssessment(newFirst);
      if (!buf) {
        return Response.json(
          { error: "Could not verify the cover photo. Re-upload the first image or try again." },
          { status: 400 }
        );
      }
      const coverCheck = await assessListingPhotoForPropertyUse(buf, {
        propertyType: existing.propertyType,
        role: "cover",
      });
      if (!coverCheck.ok) {
        return Response.json({ error: coverCheck.userMessage }, { status: 400 });
      }
    }

    data.images = nextImages;
    const imgs = data.images as string[];
    data.coverImage = imgs[0] ?? null;

    // Photos changed => reset match decision & confirmation.
    data.photoVerificationStatus = "PENDING";
    data.photoConfirmationAcceptedAt = null;
  }

  // Per-photo tags (same order/length as `images`).
  if (Array.isArray(body.photoTagsJson)) {
    const tags = body.photoTagsJson
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);
    data.photoTagsJson = tags.slice(0, maxPhotos) as any;

    // Tags changed => reset match decision & confirmation.
    data.photoVerificationStatus = "PENDING";
    data.photoConfirmationAcceptedAt = null;
  }

  // User confirmation (required before submit/publish).
  if (body.photoConfirmationAccepted === true) {
    data.photoConfirmationAcceptedAt = new Date();
    const statusRaw = typeof body.photoVerificationStatusOverride === "string" ? body.photoVerificationStatusOverride : null;
    if (statusRaw === "FLAGGED") data.photoVerificationStatus = "FLAGGED";
    else data.photoVerificationStatus = "VERIFIED";
  }

  if (body.legalAccuracyAccepted === true) {
    data.legalAccuracyAcceptedAt = new Date();
  }

  if (body.sellerDeclarationJson !== undefined) {
    if (body.sellerDeclarationJson === null) {
      data.sellerDeclarationJson = Prisma.JsonNull;
      data.sellerDeclarationCompletedAt = null;
      data.sellerDeclarationAiReviewJson = Prisma.JsonNull;
    } else if (typeof body.sellerDeclarationJson === "object") {
      const normalized = syncSellerFullNameFromParties(migrateLegacySellerDeclaration(body.sellerDeclarationJson));
      const effectivePropertyType =
        typeof body.propertyType === "string" && body.propertyType.trim()
          ? body.propertyType.trim().slice(0, 64)
          : existing?.propertyType ?? null;
      const warn = getDeclarationListingConsistencyWarnings(normalized, effectivePropertyType);
      if (warn.length > 0) listingConsistencyWarnings = warn;
      if (body.markDeclarationComplete === true) {
        const parsed = parseSellerDeclarationJson(normalized, { propertyType: effectivePropertyType });
        if (!parsed.ok) {
          return Response.json({ error: parsed.error }, { status: 400 });
        }
        data.sellerDeclarationJson = parsed.data as object;
        data.sellerDeclarationCompletedAt = new Date();
        await prisma.fsboListingVerification.updateMany({
          where: { fsboListingId: id },
          data: { sellerDeclarationStatus: "PENDING" },
        });
      } else {
        data.sellerDeclarationJson = normalized as object;
      }
      const declForAddr = migrateLegacySellerDeclaration(
        body.markDeclarationComplete === true ? (data.sellerDeclarationJson as object) : normalized
      );
      const pa = declForAddr.propertyAddressStructured;
      if (pa?.street?.trim() && pa.city?.trim()) {
        const unitPart = pa.unit?.trim();
        data.address = unitPart ? `${unitPart} - ${pa.street.trim()}` : pa.street.trim();
        data.city = pa.city.trim();
      }
      runDeclarationAiReview = true;
    }
  }

  if (Object.keys(data).length === 0 && publishOnCentris === undefined) {
    return Response.json({ error: "No valid fields" }, { status: 400 });
  }

  if (Object.keys(data).length > 0) {
    await prisma.fsboListing.update({
      where: { id },
      data,
    });
  }

  if (publishOnCentris !== undefined) {
    await setCentrisDistributionIntent({ prisma, listingId: id, enabled: publishOnCentris });
  }

  if (body.legalAccuracyAccepted === true && isOwner) {
    await prisma.user.update({
      where: { id: userId },
      data: { sellerLegalAccuracyAcceptedAt: new Date() },
    });
  }

  let insights: Awaited<ReturnType<typeof persistSellerDeclarationAiReview>> = null;
  if (runDeclarationAiReview) {
    insights = await persistSellerDeclarationAiReview(id);
  }

  let trustGraphPayload: Awaited<ReturnType<typeof refreshListingTrustGraphOnSave>> = null;
  if (isTrustGraphEnabled()) {
    try {
      trustGraphPayload = await refreshListingTrustGraphOnSave({ listingId: id, actorUserId: userId });
    } catch {
      trustGraphPayload = null;
    }
  }

  const centrisRow = await prisma.externalListing.findUnique({
    where: { listingId_platform: { listingId: id, platform: CENTRIS_PLATFORM } },
  });
  const centrisDistribution = centrisRow
    ? {
        enabled: true,
        status: centrisRow.status,
        externalId: centrisRow.externalId,
        lastSyncAt: centrisRow.lastSyncAt?.toISOString() ?? null,
        errorMessage: centrisRow.errorMessage,
      }
    : {
        enabled: false,
        status: null as string | null,
        externalId: null as string | null,
        lastSyncAt: null as string | null,
        errorMessage: null as string | null,
      };

  return Response.json({
    ok: true,
    centrisDistribution,
    ...(legalCompliance ? { legalCompliance } : {}),
    ...(listingConsistencyWarnings ? { listingConsistencyWarnings } : {}),
    ...(insights
      ? { sellerDeclarationAiReview: insights.review, listingAiScores: insights.scores }
      : {}),
    ...(trustGraphPayload ? { trustGraph: trustGraphPayload } : {}),
  });
}
