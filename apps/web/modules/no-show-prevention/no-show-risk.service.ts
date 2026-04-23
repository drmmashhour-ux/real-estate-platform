import { differenceInHours, differenceInMinutes, getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";
import { bandForScore, NOSHOW_CONFIG } from "./no-show.config";
import type { LecipmVisitForRisk, NoShowRiskResult, NoShowSourceChannel } from "./no-show.types";

function parseSource(visitSource: string | null, dist: string | null): NoShowSourceChannel {
  const v = (visitSource ?? "").toUpperCase();
  if (v.includes("CENTRIS")) return "CENTRIS";
  if (v.includes("AI")) return "AI_CLOSER";
  if (v.includes("MOBILE")) return "MOBILE";
  if (v.includes("BROKER")) return "BROKER";
  if (v.includes("DIRECT")) return "DIRECT";
  if ((dist ?? "").toUpperCase().includes("CENTRIS")) return "CENTRIS";
  return "UNKNOWN";
}

const SOURCE_RISK: Record<NoShowSourceChannel, number> = {
  CENTRIS: 6,
  DIRECT: 2,
  AI_CLOSER: 4,
  BROKER: 1,
  MOBILE: 3,
  UNKNOWN: 3,
};

/**
 * Heuristic, non-diagnostic no-show *likelihood* support score (0–100).
 * Copy must always frame as probability / operational, not a medical or legal fact.
 */
export function computeNoShowRisk(input: {
  now: Date;
  visit: LecipmVisitForRisk;
  brokerTimeZone?: string;
}): NoShowRiskResult {
  const { now, visit } = input;
  const tz = input.brokerTimeZone ?? DEFAULT_VISIT_TIME_ZONE;
  const reasons: string[] = [];
  let score = 8;

  const start = visit.startDateTime;
  const leadHoursToAppt = differenceInHours(start, now);
  const leadMinsToAppt = differenceInMinutes(start, now);
  const leadDaysBooked = Math.max(0, differenceInHours(start, visit.createdAt) / 24);

  if (!visit.reconfirmedAt) {
    score += 18;
    reasons.push("Visit not re-confirmed after booking.");
  }

  if (leadHoursToAppt < 6 && !visit.reconfirmedAt) {
    score += 15;
    reasons.push("Appointment is soon and still unconfirmed.");
  }

  if (leadMinsToAppt < 24 * 60 && leadDaysBooked < 0.5) {
    score += 12;
    reasons.push("Short notice between booking and visit.");
  }

  const z = toZonedTime(start, tz);
  const h = getHours(z);
  if (h < 7 || h >= 21) {
    score += 8;
    reasons.push("Appointment time is outside common daytime hours in broker timezone (may reduce attendance).");
  }

  if (visit.rescheduleCount > 0) {
    score += 6 * Math.min(visit.rescheduleCount, 3);
    reasons.push("Lead has rescheduled at least once; monitor confirmation.");
  }

  const ch = parseSource(visit.visitRequest?.visitSource ?? null, lead.distributionChannel);
  score += SOURCE_RISK[ch];
  if (ch === "CENTRIS" || ch === "UNKNOWN") {
    reasons.push("Source channel is associated with slightly higher no-show *rates* in aggregate (not a judgment of this person).");
  }

  if (typeof lead.score === "number" && lead.score < 40) {
    score += 8;
    reasons.push("Lower engagement score on file.");
  }
  if (!lead.lastContactedAt) {
    score += 5;
  }

  if (lead.optedOutOfFollowUp) {
    // communications limited — risk handling shifts to in-person / broker; lower automated score bump
    score = Math.max(0, score - 5);
    reasons.push("Lead opted out of follow-up; automated reminders are constrained—broker visibility matters more.");
  }

  const band = bandForScore(Math.min(100, Math.round(score)));
  let suggestedAction = "Send a short confirmation ask and offer reschedule in one link.";
  if (band === "HIGH") {
    suggestedAction = "Propose one-click reconfirm and a fallback time window; keep broker in the loop.";
  } else if (band === "MEDIUM") {
    suggestedAction = "Single reminder 24h before with clear time + address.";
  } else {
    suggestedAction = "Standard reminder schedule is enough; watch for new reschedule signals.";
  }

  return {
    riskScore: Math.min(100, Math.round(score)),
    riskBand: band,
    reasons,
    suggestedAction,
  };
}

/**
 * Recompute and persist risk on `LecipmVisit` when schema fields exist.
 */
export async function refreshVisitRiskScore(visitId: string): Promise<NoShowRiskResult | null> {
  const { prisma } = await import("@/lib/db");
  const v = await prisma.lecipmVisit.findUnique({
    where: { id: visitId },
    include: {
      lead: {
        select: {
          id: true,
          score: true,
          source: true,
          distributionChannel: true,
          purchaseRegion: true,
          optedOutOfFollowUp: true,
          lastContactedAt: true,
          estimatedValue: true,
        },
      },
      visitRequest: { select: { visitSource: true } },
      listing: { select: { title: true, listingCode: true, ownerId: true } },
      broker: { select: { id: true } },
    },
  });
  if (!v) return null;
  const settings = await prisma.lecipmBrokerBookingSettings.findUnique({
    where: { brokerUserId: v.brokerUserId },
    select: { timeZone: true },
  });
  const visitForRisk: LecipmVisitForRisk = {
    id: v.id,
    startDateTime: v.startDateTime,
    endDateTime: v.endDateTime,
    createdAt: v.createdAt,
    status: v.status,
    workflowState: v.workflowState,
    reconfirmedAt: v.reconfirmedAt,
    noShowRiskScore: v.noShowRiskScore,
    noShowRiskBand: v.noShowRiskBand,
    rescheduleCount: v.rescheduleCount,
    engagementHints: v.engagementHints,
    lead: v.lead,
    visitRequest: v.visitRequest,
    listing: v.listing,
    broker: v.broker,
  };
  const r = computeNoShowRisk({
    now: new Date(),
    visit: visitForRisk,
    brokerTimeZone: settings?.timeZone,
  });
  const shouldFlagHigh =
    r.riskBand === "HIGH" &&
    v.status === "scheduled" &&
    !v.reconfirmedAt &&
    v.workflowState !== "CANCELED" &&
    v.workflowState !== "MISSED" &&
    v.workflowState !== "COMPLETED";
  const nextWorkflow = shouldFlagHigh ? "NO_SHOW_RISK_HIGH" : v.workflowState;

  await prisma.lecipmVisit.update({
    where: { id: visitId },
    data: {
      noShowRiskScore: r.riskScore,
      noShowRiskBand: r.riskBand,
      workflowState: nextWorkflow,
    },
  });
  return r;
}
