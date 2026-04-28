/**
 * Safe single-step handlers — Syria Prisma only; never throw; validate before write.
 */

import type { MarketplaceActionProposal } from "./darlink-marketplace-autonomy.types";
import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { mergeStayBookingDatesIntoListingAvailability } from "@/lib/sybnb/sybnb-stay-availability";

export type ActionHandlerResult = {
  ok: boolean;
  code: string;
  detail?: Record<string, unknown>;
};

export async function executeDarlinkMarketplaceAction(params: {
  proposal: MarketplaceActionProposal;
  actorUserId: string | null;
  dryRun: boolean;
}): Promise<ActionHandlerResult> {
  if (params.dryRun) {
    return { ok: true, code: "dry_run_no_op", detail: { actionType: params.proposal.actionType } };
  }
  try {
    const a = params.proposal.actionType;
    const entityId = params.proposal.entityId;

    switch (a) {
      case "FLAG_LISTING_REVIEW":
        return await handleFlagListingReview(entityId);
      case "CREATE_INTERNAL_TASK":
        return await handleCreateInternalTask(params.proposal, params.actorUserId);
      case "ADD_INTERNAL_NOTE":
        return await handleAddInternalNote(params.proposal, params.actorUserId);
      case "APPROVE_LISTING":
        return await handleApproveListing(entityId);
      case "REJECT_LISTING":
        return await handleRejectListing(entityId);
      case "MARK_BOOKING_GUEST_PAID":
        return await handleMarkGuestPaid(entityId);
      case "RECORD_CHECKIN":
        return await handleRecordCheckin(entityId);
      case "APPROVE_PAYOUT":
        return await handleApprovePayout(entityId);
      case "MARK_PAYOUT_PAID":
        return await handleMarkPayoutPaid(entityId);
      default:
        return { ok: false, code: "unsupported_action" };
    }
  } catch {
    return { ok: false, code: "handler_error" };
  }
}

async function handleFlagListingReview(listingId: string | null): Promise<ActionHandlerResult> {
  if (!listingId) return { ok: false, code: "missing_listing_id" };
  const p = await prisma.syriaProperty.findUnique({ where: { id: listingId } });
  if (!p) return { ok: false, code: "listing_not_found" };
  if (p.status !== "PUBLISHED") {
    return { ok: false, code: "invalid_status_for_flag", detail: { status: p.status } };
  }
  await prisma.syriaProperty.update({
    where: { id: listingId },
    data: { status: "PENDING_REVIEW" },
  });
  await trackSyriaGrowthEvent({
    eventType: "marketplace_autonomy_flag_listing_review",
    propertyId: listingId,
    payload: { source: "darlink_autonomy" },
  });
  return { ok: true, code: "flagged_pending_review" };
}

async function handleCreateInternalTask(
  proposal: MarketplaceActionProposal,
  actorUserId: string | null,
): Promise<ActionHandlerResult> {
  await prisma.syriaMarketplaceAutonomyAuditLog.create({
    data: {
      eventType: "autonomy_internal_task",
      payloadJson: {
        opportunityId: proposal.opportunityId,
        title: proposal.payload.opportunityTitle,
        entity: proposal.entityId,
      } as object,
      actorUserId: actorUserId ?? undefined,
    },
  });
  return { ok: true, code: "internal_task_logged" };
}

async function handleAddInternalNote(proposal: MarketplaceActionProposal, actorUserId: string | null): Promise<ActionHandlerResult> {
  await prisma.syriaMarketplaceAutonomyAuditLog.create({
    data: {
      eventType: "autonomy_internal_note",
      payloadJson: {
        opportunityId: proposal.opportunityId,
        reasons: [...proposal.reasons],
      } as object,
      actorUserId: actorUserId ?? undefined,
    },
  });
  return { ok: true, code: "note_logged" };
}

async function handleApproveListing(listingId: string | null): Promise<ActionHandlerResult> {
  if (!listingId) return { ok: false, code: "missing_listing_id" };
  const p = await prisma.syriaProperty.findUnique({ where: { id: listingId } });
  if (!p) return { ok: false, code: "listing_not_found" };
  if (p.status !== "PENDING_REVIEW" && p.status !== "NEEDS_REVIEW") {
    return { ok: false, code: "not_pending_review", detail: { status: p.status } };
  }
  await prisma.syriaProperty.update({
    where: { id: listingId },
    data: { status: "PUBLISHED" },
  });
  return { ok: true, code: "listing_published" };
}

async function handleRejectListing(listingId: string | null): Promise<ActionHandlerResult> {
  if (!listingId) return { ok: false, code: "missing_listing_id" };
  const p = await prisma.syriaProperty.findUnique({ where: { id: listingId } });
  if (!p) return { ok: false, code: "listing_not_found" };
  await prisma.syriaProperty.update({
    where: { id: listingId },
    data: { status: "REJECTED" },
  });
  return { ok: true, code: "listing_rejected" };
}

async function handleMarkGuestPaid(bookingId: string | null): Promise<ActionHandlerResult> {
  if (!bookingId) return { ok: false, code: "missing_booking_id" };
  const b = await prisma.syriaBooking.findUnique({ where: { id: bookingId } });
  if (!b) return { ok: false, code: "booking_not_found" };
  if (b.fraudFlag) return { ok: false, code: "fraud_blocked" };
  await prisma.syriaBooking.update({
    where: { id: bookingId },
    data: { guestPaymentStatus: "PAID", status: "CONFIRMED" },
  });
  await mergeStayBookingDatesIntoListingAvailability(b.propertyId, b.checkIn, b.checkOut);
  return { ok: true, code: "guest_marked_paid" };
}

async function handleRecordCheckin(bookingId: string | null): Promise<ActionHandlerResult> {
  if (!bookingId) return { ok: false, code: "missing_booking_id" };
  const b = await prisma.syriaBooking.findUnique({ where: { id: bookingId } });
  if (!b) return { ok: false, code: "booking_not_found" };
  await prisma.syriaBooking.update({
    where: { id: bookingId },
    data: { checkedInAt: new Date() },
  });
  return { ok: true, code: "checkin_recorded" };
}

async function handleApprovePayout(payoutId: string | null): Promise<ActionHandlerResult> {
  if (!payoutId) return { ok: false, code: "missing_payout_id" };
  const p = await prisma.syriaPayout.findUnique({ where: { id: payoutId }, include: { booking: true } });
  if (!p) return { ok: false, code: "payout_not_found" };
  if (p.booking.fraudFlag) return { ok: false, code: "fraud_blocked" };
  if (p.status !== "PENDING") return { ok: false, code: "payout_not_pending", detail: { status: p.status } };
  await prisma.syriaPayout.update({
    where: { id: payoutId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  return { ok: true, code: "payout_approved" };
}

async function handleMarkPayoutPaid(payoutId: string | null): Promise<ActionHandlerResult> {
  if (!payoutId) return { ok: false, code: "missing_payout_id" };
  const p = await prisma.syriaPayout.findUnique({ where: { id: payoutId }, include: { booking: true } });
  if (!p) return { ok: false, code: "payout_not_found" };
  if (p.booking.fraudFlag) return { ok: false, code: "fraud_blocked" };
  await prisma.syriaPayout.update({
    where: { id: payoutId },
    data: { status: "PAID", paidAt: new Date() },
  });
  return { ok: true, code: "payout_marked_paid" };
}
