import type { AiDisputeRiskLevel, AiDisputeRiskSignalType } from "@prisma/client";
import { differenceInHours } from "date-fns";
import { subDays } from "date-fns";
import { detectRisksForBooking } from "@/lib/ai/disputes/risk-detection";
import {
  buildBnhubBookingRiskContext,
  listingOpenIssueCount90d,
} from "@/lib/ai/disputes/run-bnhub-dispute-prevention";
import { prisma } from "@/lib/db";

import type { RiskSignal, RiskSignalKey } from "./risk.types";

function weightForAiLevel(level: AiDisputeRiskLevel): number {
  if (level === "HIGH") return 38;
  if (level === "MEDIUM") return 24;
  return 12;
}

function mapAiSignalType(t: AiDisputeRiskSignalType): RiskSignalKey {
  switch (t) {
    case "MISSING_CHECKIN_DETAILS":
    case "MISSING_CHECKIN_COMPLETION":
      return "compliance_missing_docs";
    case "GUEST_SLOW_RESPONSE":
    case "HOST_SLOW_RESPONSE":
      return "high_message_friction";
    case "REPEATED_BOOKING_ISSUES":
      return "repeated_issue_pattern";
    case "NEGATIVE_FEEDBACK_SIGNAL":
      return "negative_feedback_tension";
    case "INCOMPLETE_LISTING_SIGNAL":
      return "listing_readiness_gap";
    case "HOST_ROOM_READINESS_MISSING":
      return "listing_readiness_gap";
    default:
      return "repeated_issue_pattern";
  }
}

function iso(d: Date) {
  return d.toISOString();
}

/**
 * Booking-scoped signals: merges BNHub detector output with payment / comms / trust heuristics.
 */
export async function collectBookingRiskSignals(bookingId: string): Promise<RiskSignal[]> {
  const now = new Date();
  const signals: RiskSignal[] = [];

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          verificationStatus: true,
          photos: true,
        },
      },
      bookingIssues: { select: { status: true } },
      bookingMessages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { senderId: true, createdAt: true },
      },
      checkinDetails: true,
      review: {
        select: {
          propertyRating: true,
          accuracyRating: true,
          amenitiesAsAdvertised: true,
        },
      },
      payment: { select: { status: true } },
      bookingEvents: {
        where: { createdAt: { gte: subDays(now, 120) } },
        select: { eventType: true, createdAt: true },
      },
    },
  });

  if (!booking) return signals;

  const li = await listingOpenIssueCount90d(prisma, booking.listingId, now);
  const ctx = buildBnhubBookingRiskContext({
    booking,
    listingOpenIssueCount90d: li,
    now,
  });

  const detected = detectRisksForBooking(ctx);
  for (const d of detected) {
    signals.push({
      id: mapAiSignalType(d.signalType),
      weight: weightForAiLevel(d.riskLevel),
      source: "booking",
      evidence: d.summary.slice(0, 400),
      observedAt: iso(now),
    });
  }

  if (
    booking.guestConfirmationEmailSentAt == null &&
    (booking.status === "CONFIRMED" || booking.status === "PENDING" || booking.status === "AWAITING_HOST_APPROVAL")
  ) {
    signals.push({
      id: "booking_no_confirmation",
      weight: 16,
      source: "booking",
      evidence: "Guest confirmation email not recorded for this booking state — higher chance of crossed wires.",
      observedAt: iso(now),
    });
  }

  const hoursToCheckIn = differenceInHours(booking.checkIn, now);
  if (
    booking.payment?.status === "PENDING" &&
    hoursToCheckIn >= 0 &&
    hoursToCheckIn <= 72 &&
    booking.status !== "CANCELLED"
  ) {
    signals.push({
      id: "payment_delay",
      weight: 28,
      source: "payment",
      evidence: "Payment still pending close to check-in window — settlement friction risk.",
      observedAt: iso(now),
    });
  }

  const rescheduleLike = booking.bookingEvents.filter(
    (e) =>
      /reschedule|change|modify|alter/i.test(e.eventType) ||
      String(e.eventType).toLowerCase().includes("date")
  );
  if (rescheduleLike.length >= 2) {
    signals.push({
      id: "repeated_reschedule",
      weight: Math.min(34, 18 + rescheduleLike.length * 6),
      source: "booking",
      evidence: `Multiple schedule-related events (${rescheduleLike.length}) — coordination fatigue risk.`,
      observedAt: iso(now),
    });
  }

  const review = await prisma.listingComplianceReview.findUnique({
    where: { listingId: booking.listingId },
    select: { status: true },
  });
  if (review && (review.status === "pending" || review.status === "needs_correction")) {
    signals.push({
      id: "compliance_missing_docs",
      weight: 26,
      source: "compliance",
      evidence: `Listing compliance review status: ${review.status} — readiness gap vs guest expectations.`,
      observedAt: iso(now),
    });
  }

  const trustFlags = await prisma.bnhubTrustRiskFlag.findMany({
    where: {
      OR: [{ bookingId }, { listingId: booking.listingId }],
      flagStatus: "OPEN",
    },
    take: 6,
    select: { severity: true, summary: true },
  });
  for (const f of trustFlags) {
    const w =
      f.severity === "HIGH" || f.severity === "CRITICAL" ? 36 : f.severity === "MEDIUM" ? 24 : 14;
    signals.push({
      id: "trust_safety_flag",
      weight: w,
      source: "compliance",
      evidence: f.summary.slice(0, 280),
      observedAt: iso(now),
    });
  }

  const autopilotFails = await prisma.aiAutopilotAction.count({
    where: {
      listingId: booking.listingId,
      status: "FAILED",
      createdAt: { gte: subDays(now, 14) },
    },
  });
  if (autopilotFails >= 2) {
    signals.push({
      id: "autopilot_execution_friction",
      weight: Math.min(30, 14 + autopilotFails * 4),
      source: "autopilot",
      evidence: `${autopilotFails} recent autopilot failures on listing — automation drift may increase manual workload.`,
      observedAt: iso(now),
    });
  }

  return signals;
}

/**
 * Deal-scoped signals: documents, assistant rejections, compliance cases, idle negotiation.
 */
export async function collectDealRiskSignals(dealId: string): Promise<RiskSignal[]> {
  const now = new Date();
  const signals: RiskSignal[] = [];

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      documents: { select: { workflowStatus: true, createdAt: true } },
      suggestionDecisionLogs: {
        where: { createdAt: { gte: subDays(now, 45) } },
        select: { action: true, createdAt: true },
      },
      complianceCases: {
        where: { status: { notIn: ["resolved", "dismissed", "archived"] } },
        select: { severity: true, summary: true, status: true },
      },
    },
  });
  if (!deal) return signals;

  const docsPending = deal.documents.filter(
    (d) => !d.workflowStatus || !["approved", "signed", "exported"].includes(String(d.workflowStatus))
  );
  if (docsPending.length >= 3) {
    signals.push({
      id: "compliance_missing_docs",
      weight: 22,
      source: "compliance",
      evidence: `${docsPending.length} documents not in an executed-ready workflow state.`,
      observedAt: iso(now),
    });
  }

  const rejects = deal.suggestionDecisionLogs.filter((l) => l.action.toLowerCase() === "reject").length;
  if (rejects >= 4) {
    signals.push({
      id: "assistant_rejection_friction",
      weight: Math.min(36, 16 + rejects * 3),
      source: "assistant",
      evidence: `${rejects} assistant suggestion rejections — higher negotiation friction (assistive signal only).`,
      observedAt: iso(now),
    });
  }

  const idleHours = differenceInHours(now, deal.updatedAt);
  if ((deal.crmStage === "negotiation" || deal.status === "initiated") && idleHours >= 14 * 24) {
    signals.push({
      id: "negotiation_stall",
      weight: 26,
      source: "deal",
      evidence: `Deal idle ~${Math.floor(idleHours / 24)}d while stage suggests active negotiation.`,
      observedAt: iso(now),
    });
  }

  for (const c of deal.complianceCases) {
    const isCrit = c.severity === "critical";
    signals.push({
      id: isCrit ? "compliance_critical_failure" : "compliance_missing_docs",
      weight: isCrit ? 55 : c.severity === "high" ? 40 : 22,
      source: "compliance",
      evidence: c.summary.slice(0, 320),
      observedAt: iso(now),
    });
  }

  return signals;
}
