import { differenceInHours, differenceInMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";
import { isTwilioSmsConfigured, sendTwilioSms } from "@/modules/messaging/services/twilio-sms";
import { recordLecipmNoShowEvent } from "./lecipm-noshow-timeline.service";
import { NOSHOW_CONFIG } from "./no-show.config";
import { refreshVisitRiskScore } from "./no-show-risk.service";
import type { ReminderKind } from "./no-show.types";

type Engagement = { kindsSent: string[] };

function parseHints(raw: unknown): Engagement {
  if (!raw || typeof raw !== "object") return { kindsSent: [] };
  const k = (raw as { kindsSent?: unknown }).kindsSent;
  if (!Array.isArray(k)) return { kindsSent: [] };
  return { kindsSent: k.filter((x) => typeof x === "string") as string[] };
}

export function buildPostBookReminderEmail(input: { name: string; whenLabel: string; listingTitle: string }): { subject: string; html: string } {
  return {
    subject: `Visit confirmed – ${input.listingTitle}`,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>Hi ${input.name || "there"},</p>
<p>Your visit is on <strong>${input.whenLabel}</strong> for <strong>${input.listingTitle}</strong>.</p>
<p>Reply to this message or use your LECIPM link if you need a different time.</p>
<p style="font-size:12px;color:#555">Helpful tip: add it to your calendar. We're here if plans change—no question is too small.</p>
</body></html>`,
  };
}

function shortLine(kind: ReminderKind, whenLabel: string, listingTitle: string): { subject: string; html: string; sms: string } {
  if (kind === "h24") {
    return {
      subject: `Reminder: visit tomorrow – ${listingTitle}`,
      html: `<p>Your visit is <strong>tomorrow</strong> at ${whenLabel} — ${listingTitle}.</p><p><a href="#">Confirm or reschedule</a> in one tap (web).</p>`,
      sms: `LECIPM: Your visit is tomorrow ${whenLabel} — ${listingTitle}. Reply if you need to reschedule.`,
    };
  }
  if (kind === "h3") {
    return {
      subject: `Soon: your visit in ~3 hours`,
      html: `<p>Your visit is coming up: ${whenLabel} — ${listingTitle}.</p><p>Running late or need a new time? Reschedule in the app.</p>`,
      sms: `LECIPM: Visit in ~3h (${whenLabel}). ${listingTitle}.`,
    };
  }
  if (kind === "m30") {
    return {
      subject: `Heads up: high-value visit soon`,
      html: `<p>Your important visit is in about 30 minutes: ${whenLabel} — ${listingTitle}.</p>`,
      sms: `LECIPM: Visit in ~30m — ${listingTitle}.`,
    };
  }
  return { subject: "Visit", html: "<p>Reminder</p>", sms: "LECIPM reminder" };
}

/**
 * Scans near-future visits and sends at most one new reminder per run / anti-spam window.
 * Intended for `/api/cron/lecipm-noshow-reminders`.
 */
export async function processLecipmNoShowReminderBatch(): Promise<{
  sent: number;
  skipped: number;
}> {
  const now = new Date();
  const until = new Date(now.getTime() + 4 * 24 * 3600 * 1000);
  const visits = await prisma.lecipmVisit.findMany({
    where: { status: "scheduled", startDateTime: { gte: now, lte: until } },
    take: 80,
    include: {
      lead: { select: { id: true, email: true, name: true, phone: true, optedOutOfFollowUp: true, estimatedValue: true } },
      listing: { select: { title: true } },
      visitRequest: { select: { visitSource: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  for (const v of visits) {
    if (v.lead.optedOutOfFollowUp) {
      skipped++;
      continue;
    }
    const hints = parseHints(v.engagementHints);
    if (v.lastReminderAt) {
      const gap = differenceInMinutes(now, v.lastReminderAt);
      if (gap < NOSHOW_CONFIG.minMinutesBetweenReminders) {
        skipped++;
        continue;
      }
    }
    if (v.reminderCount >= NOSHOW_CONFIG.maxRemindersPerVisit) {
      skipped++;
      continue;
    }

    const hStart = differenceInHours(v.startDateTime, now);
    const mStart = differenceInMinutes(v.startDateTime, now);
    const whenLabel = formatInTimeZone(v.startDateTime, DEFAULT_VISIT_TIME_ZONE, "h:mm a");
    const title = v.listing?.title ?? "Property";

    let nextKind: ReminderKind | null = null;
    if (!hints.kindsSent.includes("h24") && hStart <= 24 && hStart >= 20) {
      nextKind = "h24";
    } else if (!hints.kindsSent.includes("h3") && mStart <= 3 * 60 + 20 && mStart >= 2 * 60) {
      nextKind = "h3";
    } else if (!hints.kindsSent.includes("m30")) {
      const high =
        (v.lead.estimatedValue ?? 0) >= NOSHOW_CONFIG.highValueLeadMin && mStart <= 40 && mStart >= 15;
      if (high) {
        nextKind = "m30";
      }
    }
    if (!nextKind) {
      skipped++;
      continue;
    }

    const copy = shortLine(nextKind, whenLabel, title);
    if (v.lead.email && !v.lead.email.includes("@phone-only.invalid")) {
      void sendTransactionalEmail({
        to: v.lead.email,
        subject: copy.subject,
        html: copy.html,
        template: `lecipm_noshow_${nextKind}`,
      });
    }
    if (isTwilioSmsConfigured() && v.lead.phone?.trim().startsWith("+") && !v.lead.optedOutOfFollowUp) {
      void sendTwilioSms({ toE164: v.lead.phone.trim(), body: copy.sms });
    }
    const next: Engagement = { kindsSent: [...hints.kindsSent, nextKind] };
    await prisma.lecipmVisit.update({
      where: { id: v.id },
      data: {
        lastReminderAt: now,
        lastReminderKind: nextKind,
        reminderCount: { increment: 1 },
        engagementHints: next as object,
        workflowState: "REMINDER_SENT",
      },
    });
    void recordLecipmNoShowEvent(v.leadId, "REMINDER_SENT", { visitId: v.id, kind: nextKind });
    void refreshVisitRiskScore(v.id);
    sent++;
  }
  return { sent, skipped };
}
