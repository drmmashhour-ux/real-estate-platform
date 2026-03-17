/**
 * Trust & Safety enforcement: structured actions with reason codes and audit.
 * Integrates with fraud-response, account-restrictions, payout-hold.
 */

import { prisma } from "@/lib/db";
import type { TrustSafetyActionType } from "@prisma/client";
import { freezeListing, holdPayoutsForListing, restrictUser, setUserAccountStatus, removeListing, banUser } from "./fraud-response";
import { createPayoutHold, releasePayoutHoldsForBooking } from "./payout-hold-service";
import { ACTION_REASON_CODES } from "./engine-constants";

export type ActionReasonCode = (typeof ACTION_REASON_CODES)[number];

export interface ApplyEnforcementInput {
  incidentId: string;
  actionType: TrustSafetyActionType;
  reasonCode: ActionReasonCode | string;
  notes?: string | null;
  createdBy: string;
  /** For listing actions */
  listingId?: string | null;
  /** For user actions (account suspension/ban) */
  userId?: string | null;
  /** For payout hold */
  bookingId?: string | null;
  hostId?: string | null;
}

export async function applyEnforcement(input: ApplyEnforcementInput): Promise<{ actionId: string }> {
  const incident = await prisma.trustSafetyIncident.findUniqueOrThrow({
    where: { id: input.incidentId },
    include: { listing: { select: { id: true, ownerId: true } }, booking: { select: { id: true, listingId: true, listing: { select: { ownerId: true } } } } },
  });

  const listingId = input.listingId ?? incident.listingId ?? incident.booking?.listingId;
  const userId = input.userId ?? incident.accusedUserId ?? incident.listing?.ownerId ?? incident.booking?.listing?.ownerId;

  const action = await prisma.trustSafetyAction.create({
    data: {
      incidentId: input.incidentId,
      actionType: input.actionType,
      reasonCode: input.reasonCode,
      notes: input.notes ?? undefined,
      createdBy: input.createdBy,
      metadata: { listingId: listingId ?? undefined, userId: userId ?? undefined, bookingId: input.bookingId ?? undefined },
    },
  });

  switch (input.actionType) {
    case "WARNING":
      // Log only; optionally create HostAccountWarning
      if (userId) {
        await prisma.hostAccountWarning.create({
          data: {
            userId,
            warningType: "policy_breach",
            message: input.notes ?? `Trust & Safety warning: ${input.reasonCode}`,
            severity: "warning",
            createdBy: input.createdBy,
          },
        });
      }
      break;
    case "LISTING_WARNING":
      if (listingId) {
        await prisma.hostAccountWarning.create({
          data: {
            userId: userId!,
            warningType: "listing_violation",
            message: input.notes ?? `Listing warning: ${input.reasonCode}`,
            severity: "warning",
            createdBy: input.createdBy,
          },
        });
      }
      break;
    case "BOOKING_RESTRICTION":
      // Operational control or user-level flag; no direct DB change here beyond action log
      break;
    case "PAYOUT_HOLD":
      if (input.bookingId && input.hostId) {
        await createPayoutHold({
          bookingId: input.bookingId,
          hostId: input.hostId,
          reason: "dispute_escalation",
        });
        const pay = await prisma.payment.findUnique({ where: { bookingId: input.bookingId }, select: { id: true } });
        if (pay) {
          await prisma.payment.update({
            where: { id: pay.id },
            data: { payoutHoldReason: "dispute_escalation", hostPayoutReleasedAt: null },
          });
        }
      } else if (listingId) {
        await holdPayoutsForListing(listingId, "safety_complaint");
      }
      break;
    case "LISTING_FREEZE":
      if (listingId) {
        await freezeListing(listingId);
      }
      break;
    case "ACCOUNT_SUSPENSION":
      if (userId) {
        await setUserAccountStatus(userId, "SUSPENDED");
        if (listingId) {
          await prisma.shortTermListing.updateMany({
            where: { ownerId: userId },
            data: { listingStatus: "SUSPENDED" },
          });
        }
      }
      break;
    case "PERMANENT_LISTING_REMOVAL":
      if (listingId) {
        await removeListing(listingId);
      }
      break;
    case "PERMANENT_ACCOUNT_BAN":
      if (userId) {
        await banUser(userId);
        await prisma.shortTermListing.updateMany({
          where: { ownerId: userId },
          data: { listingStatus: "PERMANENTLY_REMOVED" },
        });
      }
      break;
    case "ADDITIONAL_VERIFICATION_REQUIRED":
    case "MANUAL_REVIEW_REQUIRED":
      // Policy flags; action log suffices unless we add verification state
      break;
    default:
      break;
  }

  return { actionId: action.id };
}

export async function getEnforcementActions(incidentId: string) {
  return prisma.trustSafetyAction.findMany({
    where: { incidentId },
    orderBy: { createdAt: "desc" },
  });
}
