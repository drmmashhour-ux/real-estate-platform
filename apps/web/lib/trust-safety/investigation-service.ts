/**
 * Listing fraud investigation workflow:
 * 1. Fraud signal → open investigation, freeze listing, hide from public, pause payouts
 * 2. Admin reviews cadastre, identity, documents, broker license, duplicate history
 * 3. Admin decision: restore | request_documents | reject | suspend | ban
 * All actions are logged (ListingInvestigation, ListingEnforcementAction).
 */

import { prisma } from "@/lib/db";
import type { ListingFraudEnforcementType } from "@prisma/client";
import {
  freezeListing,
  holdPayoutsForListing,
  releasePayoutHoldsForListing,
  restrictUser,
  setUserAccountStatus,
} from "./fraud-response";
import { FRAUD_REASON_CODES, type AccountStatusValue } from "./constants";

export type FraudReasonCode = (typeof FRAUD_REASON_CODES)[number];

export interface OpenInvestigationInput {
  listingId: string;
  fraudReason: FraudReasonCode | string;
  openedBy: string;
  /** If true, also set listing to UNDER_INVESTIGATION and hold payouts */
  freezeListing?: boolean;
}

/** Step 1–2: Open investigation, optionally freeze listing and hold payouts. */
export async function openInvestigation(input: OpenInvestigationInput): Promise<{ investigationId: string }> {
  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: input.listingId },
    select: { id: true, ownerId: true, listingStatus: true },
  });

  const investigation = await prisma.listingInvestigation.create({
    data: {
      listingId: input.listingId,
      fraudReason: input.fraudReason,
      status: "OPEN",
      openedBy: input.openedBy,
    },
  });

  if (input.freezeListing !== false) {
    await freezeListing(input.listingId);
    await holdPayoutsForListing(input.listingId, "fraud_investigation");
  }

  return { investigationId: investigation.id };
}

export type InvestigationResolution =
  | "restore_listing"
  | "request_documents"
  | "reject_listing"
  | "permanently_remove"
  | "suspend_user"
  | "ban_user";

export interface ResolveInvestigationInput {
  investigationId: string;
  resolvedBy: string;
  resolution: InvestigationResolution;
  resolutionNotes?: string | null;
  /** For restore: set listing to DRAFT or PUBLISHED */
  publishAfterRestore?: boolean;
  /** For request_documents: message to lister */
  requestMessage?: string | null;
}

/** Step 7: Admin decision. Logs enforcement actions and updates listing/user. */
export async function resolveInvestigation(input: ResolveInvestigationInput): Promise<void> {
  const investigation = await prisma.listingInvestigation.findUniqueOrThrow({
    where: { id: input.investigationId },
    include: { listing: { select: { id: true, ownerId: true } } },
  });

  if (investigation.status === "CLOSED") {
    throw new Error("Investigation already closed");
  }

  const now = new Date();
  const listingId = investigation.listingId;
  const userId = investigation.listing.ownerId;

  await prisma.listingInvestigation.update({
    where: { id: input.investigationId },
    data: {
      status: "CLOSED",
      closedAt: now,
      resolutionNotes: input.resolutionNotes ?? undefined,
    },
  });

  switch (input.resolution) {
    case "restore_listing": {
      await releasePayoutHoldsForListing(listingId);
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: {
          listingStatus: input.publishAfterRestore ? "PUBLISHED" : "DRAFT",
        },
      });
      // No enforcement action; listing cleared. Investigation resolutionNotes capture the decision.
      break;
    }
    case "request_documents": {
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: { listingVerificationStatus: "PENDING_DOCUMENTS" },
      });
      await logEnforcement(listingId, userId, "REQUIRE_STRONGER_VERIFICATION", "DOCUMENTS_REQUESTED", input.resolvedBy, input.requestMessage ?? undefined);
      break;
    }
    case "reject_listing": {
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: { listingStatus: "REJECTED_FOR_FRAUD" },
      });
      await logEnforcement(listingId, userId, "REJECT_LISTING", "FRAUD_CONFIRMED", input.resolvedBy, input.resolutionNotes ?? undefined);
      break;
    }
    case "permanently_remove": {
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: { listingStatus: "PERMANENTLY_REMOVED" },
      });
      await logEnforcement(listingId, userId, "PERMANENTLY_REMOVE_LISTING", "FRAUD_CONFIRMED", input.resolvedBy, input.resolutionNotes ?? undefined);
      break;
    }
    case "suspend_user": {
      await prisma.shortTermListing.updateMany({
        where: { ownerId: userId },
        data: { listingStatus: "SUSPENDED" },
      });
      await setUserAccountStatus(userId, "SUSPENDED" as AccountStatusValue);
      await logEnforcement(listingId, userId, "SUSPEND_LISTING_ACCOUNT", "FRAUD_CONFIRMED", input.resolvedBy, input.resolutionNotes ?? undefined);
      break;
    }
    case "ban_user": {
      await prisma.shortTermListing.updateMany({
        where: { ownerId: userId },
        data: { listingStatus: "PERMANENTLY_REMOVED" },
      });
      await setUserAccountStatus(userId, "BANNED");
      await logEnforcement(listingId, userId, "BAN_USER_ACCOUNT", "FRAUD_CONFIRMED", input.resolvedBy, input.resolutionNotes ?? undefined);
      break;
    }
    default:
      throw new Error("Unknown resolution");
  }
}

async function logEnforcement(
  listingId: string,
  userId: string,
  actionType: ListingFraudEnforcementType,
  reasonCode: string,
  createdBy: string,
  notes?: string
): Promise<void> {
  await prisma.listingEnforcementAction.create({
    data: {
      listingId,
      userId,
      actionType,
      reasonCode,
      notes: notes ?? undefined,
      createdBy,
    },
  });
}

/** Get investigation with listing and case history. */
export async function getInvestigation(investigationId: string) {
  return prisma.listingInvestigation.findUniqueOrThrow({
    where: { id: investigationId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          listingStatus: true,
          cadastreNumber: true,
          ownerId: true,
          owner: { select: { id: true, name: true, email: true, accountStatus: true } },
        },
      },
    },
  });
}

/** List investigations by status. */
export async function listInvestigations(status?: "OPEN" | "UNDER_REVIEW" | "CLOSED") {
  return prisma.listingInvestigation.findMany({
    where: status ? { status } : undefined,
    orderBy: { openedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          listingStatus: true,
          ownerId: true,
        },
      },
    },
  });
}
