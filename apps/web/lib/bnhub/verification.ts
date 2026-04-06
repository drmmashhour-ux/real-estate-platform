import { ListingStatus, VerificationStatus, Prisma } from "@prisma/client";
import {
  allModerationRequirementsComplete,
  buildModerationRequirements,
  type ModerationListingForRequirements,
  type ModerationRequirement,
} from "@/lib/bnhub/moderation-requirements";
import {
  formatAssistantApprovalMessage,
  formatAssistantChecklistMessage,
} from "@/lib/bnhub/host-verification-assistant";
import { notifyHostInAppAndEmail } from "@/lib/bnhub/notify-host-listing-verification";
import { prisma } from "@/lib/db";

const VERIFICATION_STEPS = ["HOST_IDENTITY", "ADDRESS", "PHOTO", "OWNERSHIP"] as const;

export type VerificationStep = (typeof VERIFICATION_STEPS)[number];

export class ModerationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ModerationError";
  }
}

/** Prisma include for `buildModerationRequirements` (admin queue, submit gate, host checklist API). */
export const shortTermListingRequirementsArgs = Prisma.validator<Prisma.ShortTermListingDefaultArgs>()({
  include: {
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        stripeOnboardingComplete: true,
        identityVerifications: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: {
            verificationStatus: true,
            governmentIdFileUrl: true,
            selfiePhotoUrl: true,
          },
        },
        brokerVerifications: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: { verificationStatus: true },
        },
        bnhubTrustIdentityVerifications: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { verificationStatus: true },
        },
      },
    },
    propertyVerification: {
      select: { verificationStatus: true, cadastreNumber: true },
    },
    propertyDocuments: { select: { id: true } },
    listingPhotos: { select: { id: true } },
  },
});

export async function loadShortTermListingForRequirements(
  listingId: string
): Promise<ModerationListingForRequirements | null> {
  return prisma.shortTermListing.findUnique({
    where: { id: listingId },
    ...shortTermListingRequirementsArgs,
  });
}

export async function getRequirementsForListingId(listingId: string) {
  const row = await loadShortTermListingForRequirements(listingId);
  if (!row) return null;
  return { row, requirements: buildModerationRequirements(row) };
}

export type ModerationQueueListing = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  address: string;
  country: string;
  listingAuthorityType: string | null;
  submittedForVerificationAt: string | null;
  rejectionReason: string | null;
  nightPriceCents: number;
  verificationDocUrl: string | null;
  owner: { id: string; name: string | null; email: string };
  _count: { reviews: number; bookings: number };
  requirements: ModerationRequirement[];
  recentVerificationLogs: Array<{
    id: string;
    step: string;
    status: string;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
  }>;
};

export async function getListingsPendingVerification(): Promise<ModerationQueueListing[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: { verificationStatus: "PENDING" },
    include: {
      ...shortTermListingRequirementsArgs.include,
      _count: { select: { reviews: true, bookings: true } },
      verificationLogs: {
        select: {
          id: true,
          step: true,
          status: true,
          notes: true,
          createdBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
    orderBy: { submittedForVerificationAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    listingCode: row.listingCode,
    title: row.title,
    city: row.city,
    address: row.address,
    country: row.country,
    listingAuthorityType: row.listingAuthorityType,
    submittedForVerificationAt: row.submittedForVerificationAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    nightPriceCents: row.nightPriceCents,
    verificationDocUrl: row.verificationDocUrl,
    owner: {
      id: row.owner.id,
      name: row.owner.name,
      email: row.owner.email,
    },
    _count: row._count,
    requirements: buildModerationRequirements(row),
    recentVerificationLogs: row.verificationLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12)
      .map((log) => ({
        id: log.id,
        step: log.step,
        status: log.status,
        notes: log.notes ?? null,
        createdBy: log.createdBy ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
  }));
}

export async function approveListing(listingId: string, createdBy?: string) {
  const rowForRules = await loadShortTermListingForRequirements(listingId);
  if (!rowForRules) {
    throw new ModerationError(404, "Listing not found");
  }
  const approvalRequirements = buildModerationRequirements(rowForRules);
  if (!allModerationRequirementsComplete(approvalRequirements)) {
    throw new ModerationError(
      400,
      "Cannot approve: every verification checklist item must be complete (including photos, identity, documents, and host payouts)."
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const listing = await tx.shortTermListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new ModerationError(404, "Listing not found");
    }
    if (listing.verificationStatus !== VerificationStatus.PENDING) {
      throw new ModerationError(409, "Listing is not pending verification");
    }

    const data: Prisma.ShortTermListingUpdateInput = {
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      rejectionReason: null,
    };
    if (
      listing.listingStatus === ListingStatus.PENDING_REVIEW ||
      listing.listingStatus === ListingStatus.APPROVED ||
      listing.listingStatus === ListingStatus.DRAFT
    ) {
      data.listingStatus = ListingStatus.PUBLISHED;
    }

    const next = await tx.shortTermListing.update({
      where: { id: listingId },
      data,
    });

    await tx.listingVerificationLog.createMany({
      data: VERIFICATION_STEPS.map((step) => ({
        listingId,
        step,
        status: "PASSED",
        notes: "Approved by admin",
        createdBy: createdBy ?? null,
      })),
    });

    return next;
  });

  const owner = await prisma.user.findUnique({
    where: { id: updated.ownerId },
    select: { email: true },
  });
  if (owner) {
    void notifyHostInAppAndEmail({
      ownerId: updated.ownerId,
      ownerEmail: owner.email,
      listingId,
      title: "Listing approved — your host reference codes",
      message: formatAssistantApprovalMessage({
        listingTitle: updated.title,
        listingCode: updated.listingCode,
        internalId: updated.id,
      }),
      actionUrl: "/dashboard/host",
      actionLabel: "Host hub & tracking",
      emailSubject: `Approved: ${updated.title} (${updated.listingCode})`,
      metadata: {
        kind: "bnhub_listing_approved",
        listingCode: updated.listingCode,
        internalListingId: updated.id,
      },
    });
  }

  return updated;
}

export async function rejectListing(listingId: string, reason: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const listing = await tx.shortTermListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new ModerationError(404, "Listing not found");
    }
    if (listing.verificationStatus !== VerificationStatus.PENDING) {
      throw new ModerationError(409, "Listing is not pending verification");
    }

    const data: Prisma.ShortTermListingUpdateInput = {
      verificationStatus: VerificationStatus.REJECTED,
      rejectionReason: reason,
      verifiedAt: null,
    };
    if (
      listing.listingStatus === ListingStatus.PUBLISHED ||
      listing.listingStatus === ListingStatus.PENDING_REVIEW ||
      listing.listingStatus === ListingStatus.APPROVED
    ) {
      data.listingStatus = ListingStatus.UNLISTED;
    }

    return tx.shortTermListing.update({
      where: { id: listingId },
      data,
    });
  });

  const row = await loadShortTermListingForRequirements(listingId);
  const owner = await prisma.user.findUnique({
    where: { id: updated.ownerId },
    select: { email: true },
  });
  if (row && owner) {
    const requirements = buildModerationRequirements(row);
    const assistant = formatAssistantChecklistMessage(row.title, requirements);
    const message = `Admin note:\n${reason}\n\n---\n\n${assistant}`;
    void notifyHostInAppAndEmail({
      ownerId: updated.ownerId,
      ownerEmail: owner.email,
      listingId,
      title: "Listing needs updates — verification assistant",
      message,
      actionUrl: `/bnhub/host/listings/${listingId}/edit`,
      actionLabel: "Upload what is missing",
      emailSubject: `Action needed: ${row.title}`,
      metadata: { kind: "bnhub_listing_rejected_checklist", reason },
    });
  }

  return updated;
}

export async function logVerificationStep(
  listingId: string,
  step: VerificationStep,
  status: "PASSED" | "FAILED" | "PENDING",
  notes?: string,
  createdBy?: string
) {
  return prisma.listingVerificationLog.create({
    data: { listingId, step, status, notes, createdBy },
  });
}

export async function logModerationAdminNote(listingId: string, note: string, createdBy?: string) {
  const trimmed = note.trim();
  if (!trimmed) {
    throw new ModerationError(400, "Admin note is required");
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, verificationStatus: true },
  });
  if (!listing) {
    throw new ModerationError(404, "Listing not found");
  }

  return prisma.listingVerificationLog.create({
    data: {
      listingId,
      step: "ADMIN_NOTE",
      status: listing.verificationStatus === VerificationStatus.PENDING ? "PENDING" : "PASSED",
      notes: trimmed,
      createdBy: createdBy ?? null,
    },
  });
}

export async function resubmitForVerification(listingId: string) {
  return prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      verificationStatus: "PENDING",
      rejectionReason: null,
      submittedForVerificationAt: new Date(),
    },
  });
}
