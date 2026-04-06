import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { parseFsboListingBody, toFsboUpdateData } from "@/lib/fsbo/validation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { getFsboListingTrustSummary } from "@/lib/fsbo/listing-trust-summary";
import { refreshListingTrustGraphOnSave } from "@/lib/trustgraph/application/integrations/sellerDeclarationIntegration";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export const dynamic = "force-dynamic";

/** GET — owner, admin, or public when visible */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getGuestId();
  await syncFsboListingExpiryState(id, { sendReminder: Boolean(userId) }).catch(() => null);
  const row = await prisma.fsboListing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true, sellerPlan: true } },
      _count: { select: { leads: true } },
      documents: true,
      verification: true,
    },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = Boolean(userId && row.ownerId === userId);
  const isAdmin = await isPlatformAdmin(userId);
  const publicOk = isFsboPubliclyVisible(row);
  if (!publicOk && !isOwner && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const trust =
    isOwner || isAdmin ? await getFsboListingTrustSummary(id).catch(() => null) : null;

  return Response.json({
    listing: {
      id: row.id,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      priceCents: row.priceCents,
      address: row.address,
      city: row.city,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      surfaceSqft: row.surfaceSqft,
      images: row.images,
      coverImage: row.coverImage,
      publishPlan: row.publishPlan,
      status: row.status,
      moderationStatus: row.moderationStatus,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      rejectReason: isOwner || isAdmin ? row.rejectReason : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      leadCount: row._count.leads,
      ...(isOwner || isAdmin
        ? {
            listingCode: row.listingCode,
            listingOwnerType: row.listingOwnerType,
            propertyType: row.propertyType,
            cadastreNumber: row.cadastreNumber,
            yearBuilt: row.yearBuilt,
            annualTaxesCents: row.annualTaxesCents,
            condoFeesCents: row.condoFeesCents,
            sellerDeclarationJson: row.sellerDeclarationJson,
            sellerDeclarationAiReviewJson: row.sellerDeclarationAiReviewJson,
            riskScore: row.riskScore,
            trustScore: row.trustScore,
            aiScoreReasonsJson: row.aiScoreReasonsJson,
            sellerDeclarationCompletedAt: row.sellerDeclarationCompletedAt,
            legalAccuracyAcceptedAt: row.legalAccuracyAcceptedAt,
            sellerPlan: row.owner.sellerPlan,
            photoTagsJson: row.photoTagsJson,
            photoVerificationStatus: row.photoVerificationStatus,
            photoConfirmationAcceptedAt: row.photoConfirmationAcceptedAt,
            documents: row.documents,
            verification: row.verification,
            ownerAccountEmail: row.owner.email,
            publishPriceCents: row.publishPriceCents,
            paidPublishAt: row.paidPublishAt,
            featuredUntil: row.featuredUntil,
            expiresAt: row.expiresAt,
            expiryReminderSentAt: row.expiryReminderSentAt,
            archivedAt: row.archivedAt,
            paymentLabel:
              row.status === "DRAFT" ? "unpaid" : row.paidPublishAt ? "paid" : "active_no_timestamp",
          }
        : {}),
      ...(publicOk
        ? {
            listingOwnerType: row.listingOwnerType,
            expiresAt: row.expiresAt,
          }
        : {}),
    },
    ...(trust ? { trust } : {}),
  });
}

/** PATCH — owner only; cannot edit SOLD */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const existing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true },
  });
  if (!existing || existing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseFsboListingBody(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const addingMedia =
    Array.isArray(parsed.data.images) && parsed.data.images.some((u) => typeof u === "string" && u.trim().length > 0);
  if (addingMedia) {
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
  }

  const data = toFsboUpdateData(parsed.data);
  if (existing.status !== "DRAFT") {
    delete (data as { publishPlan?: unknown }).publishPlan;
  }

  await prisma.fsboListing.update({
    where: { id },
    data,
  });

  let trustGraph: Awaited<ReturnType<typeof refreshListingTrustGraphOnSave>> = null;
  if (isTrustGraphEnabled()) {
    try {
      trustGraph = await refreshListingTrustGraphOnSave({ listingId: id, actorUserId: userId });
    } catch {
      trustGraph = null;
    }
  }

  const trust = await getFsboListingTrustSummary(id).catch(() => null);

  return Response.json({
    ok: true,
    ...(trustGraph ? { trustGraph } : {}),
    ...(trust ? { trust } : {}),
  });
}

/** DELETE — owner may remove draft or in-review listings; admin may remove any listing. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const existing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = await isPlatformAdmin(userId);
  const isOwner = existing.ownerId === userId;
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAdmin && (existing.status === "ACTIVE" || existing.status === "SOLD")) {
    return Response.json(
      { error: "Active or sold listings cannot be deleted from your account. Contact support if needed." },
      { status: 409 }
    );
  }

  await prisma.fsboListing.delete({ where: { id } });
  return Response.json({ ok: true });
}
