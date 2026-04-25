import type { AiDisputeRiskLevel, AiDisputeRiskSignalType } from "@prisma/client";
import { differenceInHours } from "date-fns";
import { preventionActionForLevel } from "./prevention-actions";
import { getDisputePreventionDrafts } from "./message-guidance";
import type { BookingRiskContext, DetectedRisk } from "./types";

function cooldownKey(bookingId: string, signal: AiDisputeRiskSignalType) {
  return `${bookingId}:${signal}`;
}

function draftsFor(
  signal: AiDisputeRiskSignalType,
  listingTitle: string
): Pick<DetectedRisk, "messageDraftHost" | "messageDraftGuest"> {
  const d = getDisputePreventionDrafts({ signalType: signal, listingTitle });
  return { messageDraftHost: d.host, messageDraftGuest: d.guest };
}

/**
 * Detects early dispute-risk signals for a single booking. Does not resolve or judge outcomes; outputs guidance only.
 */
export function detectRisksForBooking(ctx: BookingRiskContext): DetectedRisk[] {
  const out: DetectedRisk[] = [];
  const { now, bookingId, listingTitle } = ctx;

  const skipEntirely = new Set([
    "CANCELLED",
    "CANCELLED_BY_GUEST",
    "CANCELLED_BY_HOST",
    "DECLINED",
    "EXPIRED",
  ]);
  if (skipEntirely.has(ctx.status)) {
    return out;
  }

  /** Completed stays: only repeated-issue + review signals (no pre-arrival checklist noise). */
  const postStayOnly = ctx.status === "COMPLETED";

  const hoursToCheckIn = differenceInHours(ctx.checkIn, now);
  const hoursSinceCheckIn = differenceInHours(now, ctx.checkIn);

  // --- Repeated issues (same signal type; severity varies) ---
  const repeatedHigh =
    ctx.activeIssueCount >= 2 || ctx.listingOpenIssueCount90d >= 5;
  const repeatedMedium =
    !repeatedHigh && ctx.listingOpenIssueCount90d >= 3;
  if (repeatedHigh || repeatedMedium) {
    const level: AiDisputeRiskLevel = repeatedHigh ? "HIGH" : "MEDIUM";
    const signal: AiDisputeRiskSignalType = "REPEATED_BOOKING_ISSUES";
    out.push({
      riskLevel: level,
      signalType: signal,
      summary: repeatedHigh
        ? "Multiple booking issues detected — higher chance of misunderstanding or escalation."
        : "Several listing-level issues were opened recently — monitor communication closely.",
      recommendedAction:
        "Review open issues in the booking thread; keep communication on-platform; request admin review only through official channels if safety is at risk.",
      preventionAction: preventionActionForLevel(level),
      ...draftsFor(signal, listingTitle),
      cooldownKey: cooldownKey(bookingId, signal),
      metadata: {
        activeIssueCount: ctx.activeIssueCount,
        listingOpenIssueCount90d: ctx.listingOpenIssueCount90d,
      },
    });
  }

  // --- Review / feedback (post-stay signal still useful for pattern) ---
  if (ctx.review) {
    const r = ctx.review;
    const strongNegative =
      r.propertyRating <= 1 ||
      (r.propertyRating <= 2 && r.amenitiesAsAdvertised === false) ||
      (r.accuracyRating != null && r.accuracyRating <= 1);
    const mediumNegative =
      r.propertyRating <= 2 || r.amenitiesAsAdvertised === false || (r.accuracyRating != null && r.accuracyRating <= 2);

    if (strongNegative) {
      const level: AiDisputeRiskLevel = "HIGH";
      const signal: AiDisputeRiskSignalType = "NEGATIVE_FEEDBACK_SIGNAL";
      out.push({
        riskLevel: level,
        signalType: signal,
        summary: "Strong negative stay signals recorded — tension may carry into support requests.",
        recommendedAction:
          "Encourage factual, on-thread communication; platform does not auto-refund or auto-resolve from this signal alone.",
        preventionAction: preventionActionForLevel(level),
        ...draftsFor(signal, listingTitle),
        cooldownKey: cooldownKey(bookingId, signal),
        metadata: { propertyRating: r.propertyRating },
      });
    } else if (mediumNegative) {
      const level: AiDisputeRiskLevel = "MEDIUM";
      const signal: AiDisputeRiskSignalType = "NEGATIVE_FEEDBACK_SIGNAL";
      out.push({
        riskLevel: level,
        signalType: signal,
        summary: "Negative feedback signals detected — clarify expectations on-thread.",
        recommendedAction:
          "Host: verify listing accuracy. Guest: use booking messages for factual questions.",
        preventionAction: preventionActionForLevel(level),
        ...draftsFor(signal, listingTitle),
        cooldownKey: cooldownKey(bookingId, signal),
        metadata: { propertyRating: r.propertyRating },
      });
    }
  }

  if (postStayOnly) {
    return out;
  }

  const listingIncompleteWindow =
    ctx.status === "CONFIRMED" &&
    ctx.checkOut >= now &&
    ctx.checkIn <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // --- Incomplete listing (only when stay is imminent or in progress) ---
  if (
    listingIncompleteWindow &&
    (!ctx.listingHasPhotos || ctx.listingVerificationStatus !== "VERIFIED")
  ) {
    const level: AiDisputeRiskLevel = "MEDIUM";
    const signal: AiDisputeRiskSignalType = "INCOMPLETE_LISTING_SIGNAL";
    out.push({
      riskLevel: level,
      signalType: signal,
      summary: "Listing may be incomplete or not fully verified — guests can misinterpret what they booked.",
      recommendedAction: "Complete photos and verification to reduce mismatch disputes.",
      preventionAction: preventionActionForLevel(level),
      ...draftsFor(signal, listingTitle),
      cooldownKey: cooldownKey(bookingId, signal),
      metadata: {
        listingHasPhotos: ctx.listingHasPhotos,
        listingVerificationStatus: ctx.listingVerificationStatus,
      },
    });
  }

  // --- Check-in details before arrival ---
  if (ctx.status === "CONFIRMED" && hoursToCheckIn >= 0 && hoursToCheckIn <= 72 && !ctx.hasAdequateCheckinDetails) {
    const level: AiDisputeRiskLevel = "MEDIUM";
    const signal: AiDisputeRiskSignalType = "MISSING_CHECKIN_DETAILS";
    out.push({
      riskLevel: level,
      signalType: signal,
      summary: "Check-in access details appear incomplete before arrival.",
      recommendedAction: "Host: publish instructions/key info. Guest: confirm you can access the unit as described.",
      preventionAction: preventionActionForLevel(level),
      ...draftsFor(signal, listingTitle),
      cooldownKey: cooldownKey(bookingId, signal),
    });
  }

  // --- Room readiness (host checklist) ---
  if (
    ctx.status === "CONFIRMED" &&
    !ctx.checklistDeclaredByHostAt &&
    hoursToCheckIn >= 0 &&
    hoursToCheckIn <= 48
  ) {
    const level: AiDisputeRiskLevel = "MEDIUM";
    const signal: AiDisputeRiskSignalType = "HOST_ROOM_READINESS_MISSING";
    out.push({
      riskLevel: level,
      signalType: signal,
      summary: "Host has not confirmed room/unit readiness before check-in.",
      recommendedAction: "Host: complete readiness confirmation. Guest: you may politely ask for confirmation in-thread.",
      preventionAction: preventionActionForLevel(level),
      ...draftsFor(signal, listingTitle),
      cooldownKey: cooldownKey(bookingId, signal),
    });
  }

  // --- Missing check-in completion (operational record) ---
  if (
    ctx.status === "CONFIRMED" &&
    !ctx.checkedInAt &&
    hoursSinceCheckIn >= 6 &&
    now < ctx.checkOut
  ) {
    const level: AiDisputeRiskLevel = "MEDIUM";
    const signal: AiDisputeRiskSignalType = "MISSING_CHECKIN_COMPLETION";
    out.push({
      riskLevel: level,
      signalType: signal,
      summary: "Check-in time has passed with no recorded check-in completion.",
      recommendedAction:
        "Confirm arrival/check-in status in the booking timeline or messages to keep a clear shared record.",
      preventionAction: preventionActionForLevel(level),
      ...draftsFor(signal, listingTitle),
      cooldownKey: cooldownKey(bookingId, signal),
    });
  }

  // --- Messaging responsiveness ---
  if (ctx.lastMessageAt && ctx.lastMessageSenderId) {
    const hoursSinceLast = differenceInHours(now, ctx.lastMessageAt);
    if (hoursSinceLast < 48) {
      // still fresh
    } else if (ctx.lastMessageSenderId === ctx.hostId) {
      const level: AiDisputeRiskLevel = "LOW";
      const signal: AiDisputeRiskSignalType = "GUEST_SLOW_RESPONSE";
      out.push({
        riskLevel: level,
        signalType: signal,
        summary: "Guest may not have replied to the host’s latest message.",
        recommendedAction: "Guest: reply when you can. Host: keep tone neutral and factual.",
        preventionAction: preventionActionForLevel(level),
        ...draftsFor(signal, listingTitle),
        cooldownKey: cooldownKey(bookingId, signal),
        reminderTarget: "guest",
      });
    } else if (ctx.lastMessageSenderId === ctx.guestId) {
      const level: AiDisputeRiskLevel = "LOW";
      const signal: AiDisputeRiskSignalType = "HOST_SLOW_RESPONSE";
      out.push({
        riskLevel: level,
        signalType: signal,
        summary: "Host may not have replied to the guest’s latest message.",
        recommendedAction: "Host: reply when you can. Guest: allow reasonable time for a response.",
        preventionAction: preventionActionForLevel(level),
        ...draftsFor(signal, listingTitle),
        cooldownKey: cooldownKey(bookingId, signal),
        reminderTarget: "host",
      });
    }
  }

  return out;
}
