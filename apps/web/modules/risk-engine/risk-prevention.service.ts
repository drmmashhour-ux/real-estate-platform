import type { LecipmDisputeCaseEntityType, Prisma } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import { createNotification } from "@/modules/notifications/services/create-notification";

import { logPrevention, logRisk } from "./risk-log";
import { computeRiskAssessment } from "./risk-score.engine";
import { collectBookingRiskSignals, collectDealRiskSignals } from "./risk-signal.service";
import type {
  PreDisputeRiskAttachment,
  PreDisputeRiskCommandMetrics,
  PreventionActionRecord,
  RiskAssessmentResult,
  RiskEvaluationSubject,
  RiskSignal,
} from "./risk.types";

export async function persistUnifiedBookingRiskAssessment(bookingId: string): Promise<void> {
  const signals = await collectBookingRiskSignals(bookingId);
  const result = computeRiskAssessment(signals);
  await prisma.lecipmPreDisputeRiskAssessment.create({
    data: {
      subjectType: "BOOKING",
      subjectId: bookingId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      signalsJson: result.signals as unknown as Prisma.InputJsonValue,
      explainJson: result.explainLines as unknown as Prisma.InputJsonValue,
    },
  });
  logRisk("booking_snapshot_persisted", {
    bookingId,
    score: result.riskScore,
    level: result.riskLevel,
  });
}

export async function evaluateBookingRisk(
  bookingId: string,
  opts?: { triggerPrevention?: boolean }
): Promise<{ result: RiskAssessmentResult; actions: PreventionActionRecord[] }> {
  const signals = await collectBookingRiskSignals(bookingId);
  const result = computeRiskAssessment(signals);
  const actions =
    opts?.triggerPrevention === true ?
      await executePreventionActions({ type: "BOOKING", id: bookingId }, result)
    : [];

  await prisma.lecipmPreDisputeRiskAssessment.create({
    data: {
      subjectType: "BOOKING",
      subjectId: bookingId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      signalsJson: result.signals as unknown as Prisma.InputJsonValue,
      explainJson: result.explainLines as unknown as Prisma.InputJsonValue,
      actionsJson:
        actions.length > 0 ? (actions as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  logRisk("booking_evaluated", {
    bookingId,
    score: result.riskScore,
    level: result.riskLevel,
    preventionActions: actions.length,
  });

  return { result, actions };
}

export async function evaluateDealRisk(
  dealId: string,
  opts?: { triggerPrevention?: boolean }
): Promise<{ result: RiskAssessmentResult; actions: PreventionActionRecord[] }> {
  const signals = await collectDealRiskSignals(dealId);
  const result = computeRiskAssessment(signals);
  const actions =
    opts?.triggerPrevention === true ?
      await executePreventionActions({ type: "DEAL", id: dealId }, result)
    : [];

  await prisma.lecipmPreDisputeRiskAssessment.create({
    data: {
      subjectType: "DEAL",
      subjectId: dealId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      signalsJson: result.signals as unknown as Prisma.InputJsonValue,
      explainJson: result.explainLines as unknown as Prisma.InputJsonValue,
      actionsJson:
        actions.length > 0 ? (actions as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  logRisk("deal_evaluated", {
    dealId,
    score: result.riskScore,
    level: result.riskLevel,
    preventionActions: actions.length,
  });

  return { result, actions };
}

export function scheduleBookingRiskEvaluation(bookingId: string): void {
  void evaluateBookingRisk(bookingId, { triggerPrevention: false }).catch((e) => {
    console.warn("[risk] scheduleBookingRiskEvaluation failed", e);
  });
}

/** Lightweight re-score for assistant / audit hooks — does not send prevention notifications. */
export function scheduleDealRiskEvaluation(dealId: string): void {
  void evaluateDealRisk(dealId, { triggerPrevention: false }).catch((e) => {
    console.warn("[risk] scheduleDealRiskEvaluation failed", e);
  });
}

async function executePreventionActions(
  subject: RiskEvaluationSubject,
  result: RiskAssessmentResult
): Promise<PreventionActionRecord[]> {
  const actions: PreventionActionRecord[] = [];
  const now = new Date().toISOString();
  const level = result.riskLevel;

  if (level === "LOW") return actions;

  if (subject.type === "BOOKING") {
    const booking = await prisma.booking.findUnique({
      where: { id: subject.id },
      select: {
        guestId: true,
        listingId: true,
        listing: { select: { ownerId: true } },
      },
    });
    if (!booking) return actions;

    const url = `/bnhub/booking/${subject.id}`;
    const explain = result.explainLines[1] ?? result.explainLines[0] ?? "Please review booking details on-platform.";

    if (level === "MEDIUM") {
      await createNotification({
        userId: booking.guestId,
        type: "REMINDER",
        title: "Stay checklist — reduce friction",
        message: explain.slice(0, 500),
        actionUrl: url,
        actionLabel: "Open booking",
        listingId: booking.listingId,
        metadata: { kind: "pre_dispute_prevention", channel: "medium_reminder", bookingId: subject.id },
        skipIfDuplicateUnread: true,
      }).catch(() => {});
      actions.push({ kind: "send_reminder", detail: "guest_reminder", at: now });
      logPrevention("medium_reminder", { bookingId: subject.id });
    }

    if (level === "HIGH") {
      await createNotification({
        userId: booking.guestId,
        type: "SYSTEM",
        title: "Confirmation suggested — itinerary clarity",
        message:
          "Please confirm arrival details and payment status in the booking thread to avoid crossed signals.",
        priority: "HIGH",
        actionUrl: url,
        listingId: booking.listingId,
        metadata: { kind: "pre_dispute_prevention", channel: "force_confirmation_prompt", bookingId: subject.id },
        skipIfDuplicateUnread: true,
      }).catch(() => {});
      await createNotification({
        userId: booking.listing.ownerId,
        type: "SYSTEM",
        title: "Guest-side friction signal — broker-style assist",
        message: explain.slice(0, 500),
        priority: "NORMAL",
        actionUrl: url,
        listingId: booking.listingId,
        metadata: { kind: "pre_dispute_prevention", channel: "notify_host", bookingId: subject.id },
        skipIfDuplicateUnread: true,
      }).catch(() => {});
      actions.push({ kind: "notify_host", detail: "high_friction_dual_ping", at: now });
      logPrevention("high_confirmation_ping", { bookingId: subject.id });
    }

    if (level === "CRITICAL") {
      const adminUserId = process.env.DISPUTE_PREVENTION_ADMIN_USER_ID?.trim();
      if (adminUserId) {
        await createNotification({
          userId: adminUserId,
          type: "SYSTEM",
          title: "Manual review suggested — elevated pre-dispute signals",
          message: `${explain.slice(0, 360)} — Booking ${subject.id}. Not a legal finding.`,
          priority: "HIGH",
          actionUrl: `/dashboard/risk`,
          metadata: {
            kind: "pre_dispute_prevention",
            channel: "manual_review_queue",
            bookingId: subject.id,
            riskScore: result.riskScore,
          },
          skipIfDuplicateUnread: true,
        }).catch(() => {});
      }
      actions.push({
        kind: "require_manual_review",
        detail: adminUserId ? "admin_notified" : "admin_env_missing",
        at: now,
      });
      actions.push({
        kind: "hold_automation_hint",
        detail:
          "Route sensitive automation through manual review — execution blocking is feature-flagged outside this module.",
        at: now,
      });
      logPrevention("critical_manual_review", { bookingId: subject.id, score: result.riskScore });
    }
  }

  if (subject.type === "DEAL") {
    const deal = await prisma.deal.findUnique({
      where: { id: subject.id },
      select: { brokerId: true, buyerId: true },
    });
    if (!deal?.brokerId) return actions;

    if (level === "MEDIUM") {
      await createNotification({
        userId: deal.brokerId,
        type: "REMINDER",
        title: "Deal friction signals — assistant follow-up",
        message: result.explainLines[0]?.slice(0, 480) ?? "Review pipeline documents and replies.",
        actionUrl: `/deals/${subject.id}`,
        metadata: { kind: "pre_dispute_prevention", dealId: subject.id },
        skipIfDuplicateUnread: true,
      }).catch(() => {});
      actions.push({ kind: "assistant_follow_up", detail: "broker_ping", at: now });
      logPrevention("deal_medium_broker", { dealId: subject.id });
    }

    if (level === "HIGH" || level === "CRITICAL") {
      await createNotification({
        userId: deal.brokerId,
        type: "SYSTEM",
        title: "Elevated deal friction — prioritize neutral coordination",
        message: result.explainLines.slice(0, 3).join("\n").slice(0, 900),
        priority: level === "CRITICAL" ? "HIGH" : "NORMAL",
        actionUrl: `/deals/${subject.id}`,
        metadata: { kind: "pre_dispute_prevention", dealId: subject.id, riskScore: result.riskScore },
        skipIfDuplicateUnread: true,
      }).catch(() => {});
      actions.push({ kind: "notify_broker", detail: level, at: now });
      logPrevention("deal_escalated_broker", { dealId: subject.id, level });
    }
  }

  return actions;
}

export async function loadPreDisputeRiskAttachmentForEntity(
  relatedEntityType: LecipmDisputeCaseEntityType,
  relatedEntityId: string
): Promise<PreDisputeRiskAttachment | null> {
  const latest = await prisma.lecipmPreDisputeRiskAssessment.findFirst({
    where: { subjectType: relatedEntityType, subjectId: relatedEntityId },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return {
      priorAssessmentAt: null,
      riskScore: null,
      riskLevel: null,
      signals: [],
      explainLines: [],
      preventableInsight: "no_prior_assessment",
    };
  }

  const signals = (latest.signalsJson as unknown as RiskSignal[]) ?? [];
  const explainLines = (latest.explainJson as unknown as string[]) ?? [];

  let preventableInsight: PreDisputeRiskAttachment["preventableInsight"] = "limited_prior_signals";
  if (latest.riskLevel === "HIGH" || latest.riskLevel === "CRITICAL") {
    preventableInsight = "elevated_prior_risk";
  } else if (latest.riskLevel === "MEDIUM") {
    preventableInsight = "moderate_prior_signals";
  }

  return {
    priorAssessmentAt: latest.createdAt.toISOString(),
    riskScore: latest.riskScore,
    riskLevel: latest.riskLevel,
    signals: signals.map((s) => ({ id: s.id, source: s.source, evidence: s.evidence })),
    explainLines,
    preventableInsight,
  };
}

export async function loadPreDisputeRiskCommandMetrics(): Promise<PreDisputeRiskCommandMetrics> {
  const since = subDays(new Date(), 30);
  const rows = await prisma.lecipmPreDisputeRiskAssessment.findMany({
    where: { createdAt: { gte: since } },
    select: { riskLevel: true, actionsJson: true, signalsJson: true },
  });

  const highOrCritical = rows.filter((r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL").length;
  let preventedActions = 0;
  const keyCounts = new Map<string, number>();

  for (const r of rows) {
    const aj = r.actionsJson;
    if (aj != null && Array.isArray(aj) && aj.length > 0) preventedActions += 1;

    const sigs = (r.signalsJson as unknown as RiskSignal[]) ?? [];
    for (const s of sigs) {
      keyCounts.set(s.id, (keyCounts.get(s.id) ?? 0) + 1);
    }
  }

  const topSignalKeys = [...keyCounts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const bookings30 = await prisma.booking.count({ where: { createdAt: { gte: since } } }).catch(() => 0);

  return {
    assessmentsLast30d: rows.length,
    highOrCriticalLast30d: highOrCritical,
    riskRateApprox: bookings30 > 0 ? highOrCritical / bookings30 : null,
    preventedActionsLast30d: preventedActions,
    topSignalKeys,
    note:
      "Risk rate ≈ high/critical assessments per booking created (directional). Prevention counts assessments where at least one automated prevention action was recorded.",
  };
}
