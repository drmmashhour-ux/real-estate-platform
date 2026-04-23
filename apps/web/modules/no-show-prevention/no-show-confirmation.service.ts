import type { LecipmVisitWorkflowState } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";
import { recordLecipmNoShowEvent } from "./lecipm-noshow-timeline.service";
import { buildPostBookReminderEmail } from "./no-show-reminder.service";
import { refreshVisitRiskScore } from "./no-show-risk.service";

type Engagement = { kindsSent: string[] };

function parseHints(raw: unknown): Engagement {
  if (!raw || typeof raw !== "object") return { kindsSent: [] };
  const k = (raw as { kindsSent?: unknown }).kindsSent;
  if (!Array.isArray(k)) return { kindsSent: [] };
  return { kindsSent: k.filter((x) => typeof x === "string") as string[] };
}

/**
 * On new scheduled visit: set workflow, initial risk, optional immediate confirmation email.
 */
export async function initializeLecipmVisitNoShow(visitId: string): Promise<void> {
  const visit = await prisma.lecipmVisit.findUnique({
    where: { id: visitId },
    include: { lead: { select: { email: true, name: true, optedOutOfFollowUp: true, id: true } }, listing: { select: { title: true } } },
  });
  if (!visit) return;

  const r = await refreshVisitRiskScore(visitId);
  if (r) {
    void recordLecipmNoShowEvent(visit.leadId, "RISK_RECALC", {
      visitId,
      riskScore: r.riskScore,
      band: r.riskBand,
    });
  }
  if (visit.lead.optedOutOfFollowUp) return;

  const hints = parseHints(visit.engagementHints);
  if (hints.kindsSent.includes("post_book")) return;
  const body = buildPostBookReminderEmail({
    name: visit.lead.name,
    whenLabel: formatInTimeZone(visit.startDateTime, DEFAULT_VISIT_TIME_ZONE, "EEEE, MMM d 'at' h:mm a"),
    listingTitle: visit.listing?.title ?? "Property",
  });
  if (visit.lead.email && !visit.lead.email.includes("@phone-only.invalid")) {
    void sendTransactionalEmail({
      to: visit.lead.email,
      subject: body.subject,
      html: body.html,
      template: "lecipm_visit_noshow_postbook",
    });
  }
  const next: Engagement = { ...hints, kindsSent: [...hints.kindsSent, "post_book"] };
  await prisma.lecipmVisit.update({
    where: { id: visitId },
    data: {
      lastReminderAt: new Date(),
      lastReminderKind: "post_book",
      reminderCount: { increment: 1 },
      engagementHints: next as object,
      workflowState: "REMINDER_SENT" as LecipmVisitWorkflowState,
    },
  });
  void recordLecipmNoShowEvent(visit.leadId, "REMINDER_SENT", { visitId, kind: "post_book" });
}

export async function reconfirmVisit(input: {
  visitId: string;
  method: "email_one_click" | "in_app" | "api";
}): Promise<{ ok: boolean; error?: string }> {
  const v = await prisma.lecipmVisit.findUnique({ where: { id: input.visitId }, select: { id: true, status: true, leadId: true, workflowState: true } });
  if (!v || v.status !== "scheduled") {
    return { ok: false, error: "Visit not found or not active." };
  }
  await prisma.lecipmVisit.update({
    where: { id: v.id },
    data: {
      reconfirmedAt: new Date(),
      reconfirmMethod: input.method,
      workflowState: "CONFIRMED" as LecipmVisitWorkflowState,
    },
  });
  void recordLecipmNoShowEvent(v.leadId, "CONFIRMATION_RECEIVED", { visitId: v.id, method: input.method });
  void refreshVisitRiskScore(v.id);
  return { ok: true };
}

export async function markCannotAttend(input: {
  visitId: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const v = await prisma.lecipmVisit.findUnique({ where: { id: input.visitId }, select: { id: true, leadId: true, status: true } });
  if (!v || v.status !== "scheduled") {
    return { ok: false, error: "Visit not found." };
  }
  await prisma.lecipmVisit.update({
    where: { id: v.id },
    data: {
      leadDeclineReason: input.reason ?? "cannot_attend",
      workflowState: "RESCHEDULE_REQUESTED" as LecipmVisitWorkflowState,
    },
  });
  void recordLecipmNoShowEvent(v.leadId, "RESCHEDULE_REQUESTED", { visitId: v.id, reason: input.reason });
  return { ok: true };
}
