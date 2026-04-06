import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { personalizeTemplate, type ReplyContext } from "@/src/modules/messaging/aiReplyEngine";
import { reactivateStaleLead } from "@/src/modules/crm/staleLeadEngine";
import {
  assertContentPassesAutoCloseSafetyRules,
  AUTO_CLOSE_INACTIVITY_TEMPLATE,
  type SafeAutoCloseAction,
} from "./autoCloseRules";

export type AutoCloseEnv = {
  enabled: boolean;
  safeMode: boolean;
  /** Both env flags must allow; DB pause checked separately. */
  envAllowsExecution: boolean;
};

export function readAutoCloseEnv(): AutoCloseEnv {
  const enabled = process.env.AI_AUTOCLOSE_ENABLED === "1";
  const safeMode = process.env.AI_AUTOCLOSE_SAFE_MODE === "1";
  return {
    enabled,
    safeMode,
    envAllowsExecution: enabled && safeMode,
  };
}

export async function getAutoCloseSettings(): Promise<{ id: string; paused: boolean }> {
  const row = await prisma.autoCloseSettings.findUnique({ where: { id: "global" } });
  if (row) return row;
  return prisma.autoCloseSettings.create({
    data: { id: "global", paused: false },
  });
}

export async function setAutoClosePaused(paused: boolean): Promise<void> {
  await prisma.autoCloseSettings.upsert({
    where: { id: "global" },
    create: { id: "global", paused },
    update: { paused },
  });
}

async function logAudit(
  action: SafeAutoCloseAction,
  targetType: string,
  targetId: string,
  safeMode: boolean,
  detail?: Record<string, unknown>
): Promise<void> {
  await prisma.autoCloseAuditEvent.create({
    data: {
      actionType: action,
      targetType,
      targetId,
      safeMode,
      detail: detail === undefined ? undefined : (detail as Prisma.InputJsonValue),
    },
  });
}

function replyContextFromUser(
  u: { name: string | null; email: string } | null,
  ctx: { city?: string; listing_title?: string } | null
): ReplyContext {
  const name = u?.name?.trim() || u?.email?.split("@")[0] || "there";
  return {
    name,
    city: ctx?.city ?? "your area",
    listing_title: ctx?.listing_title ?? "this listing",
  };
}

type ContextJson = { city?: string; listing_title?: string };

export type AutoCloseHourlyResult = {
  skippedReason?: string;
  inactivityNudges: number;
  leadReactivations: number;
  bookingReminders: number;
  errors: string[];
};

/**
 * Hourly safe pass: high-intent unanswered threads, stale CRM leads, abandoned checkout-style bookings (ops signal only).
 */
export async function runAutoCloseHourlyPass(options?: {
  limitInactivity?: number;
  limitLeads?: number;
  limitBookings?: number;
}): Promise<AutoCloseHourlyResult> {
  const env = readAutoCloseEnv();
  const result: AutoCloseHourlyResult = { inactivityNudges: 0, leadReactivations: 0, bookingReminders: 0, errors: [] };

  if (!env.envAllowsExecution) {
    result.skippedReason = "env_disabled_or_unsafe";
    return result;
  }

  const settings = await getAutoCloseSettings();
  if (settings.paused) {
    result.skippedReason = "paused_by_admin";
    return result;
  }

  const staleHours = Math.max(12, Number(process.env.AI_AUTOCLOSE_STALE_USER_HOURS ?? 36));
  const staleCutoff = new Date(Date.now() - staleHours * 3600 * 1000);
  const dedupeInactivityMs = Math.max(24, Number(process.env.AI_AUTOCLOSE_INACTIVITY_DEDUPE_HOURS ?? 72)) * 3600 * 1000;
  const dedupeLeadMs = 24 * 3600 * 1000;
  const dedupeBookingMs = 72 * 3600 * 1000;

  const limitI = Math.min(25, options?.limitInactivity ?? 10);
  const limitL = Math.min(40, options?.limitLeads ?? 12);
  const limitB = Math.min(40, options?.limitBookings ?? 15);

  // --- inactivity_nudge: high-intent Growth AI thread, last speaker is user, stale ---
  const convCandidates = await prisma.growthAiConversation.findMany({
    where: {
      status: "open",
      humanTakeoverAt: null,
      highIntent: true,
      userId: { not: null },
      lastUserMessageAt: { lte: staleCutoff },
    },
    take: limitI * 3,
    orderBy: { lastUserMessageAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  for (const c of convCandidates) {
    if (result.inactivityNudges >= limitI) break;

    const pendingHandoff = await prisma.growthAiConversationHandoff.count({
      where: { conversationId: c.id, status: "pending" },
    });
    if (pendingHandoff > 0) continue;

    const lastMsg = await prisma.growthAiConversationMessage.findFirst({
      where: { conversationId: c.id },
      orderBy: { createdAt: "desc" },
    });
    if (!lastMsg || lastMsg.senderType !== "user") continue;

    const recentSame = await prisma.autoCloseAuditEvent.findFirst({
      where: {
        targetType: "growth_ai_conversation",
        targetId: c.id,
        actionType: "inactivity_nudge",
        revertedAt: null,
        createdAt: { gte: new Date(Date.now() - dedupeInactivityMs) },
      },
    });
    if (recentSame) continue;

    const recentTpl = await prisma.growthAiConversationMessage.findFirst({
      where: {
        conversationId: c.id,
        templateKey: "auto_close_inactivity_nudge",
        createdAt: { gte: new Date(Date.now() - dedupeInactivityMs) },
      },
    });
    if (recentTpl) continue;

    const ctxJson = (c.contextJson as ContextJson | null) ?? {};
    const replyCtx = replyContextFromUser(c.user, ctxJson);
    const text = personalizeTemplate(AUTO_CLOSE_INACTIVITY_TEMPLATE, replyCtx);
    const safety = assertContentPassesAutoCloseSafetyRules(text);
    if (!safety.ok) {
      result.errors.push(`inactivity_safety:${c.id}:${safety.reason}`);
      continue;
    }

    const nudgeAt = new Date();
    try {
      await prisma.$transaction([
        prisma.growthAiConversationMessage.create({
          data: {
            conversationId: c.id,
            senderType: "ai",
            messageText: text,
            templateKey: "auto_close_inactivity_nudge",
            ctaType: "soft_checkin",
            isNudge: true,
          },
        }),
        prisma.growthAiConversation.update({
          where: { id: c.id },
          data: {
            lastAutomatedAt: nudgeAt,
            lastAiMessageAt: nudgeAt,
          },
        }),
      ]);
      await logAudit("inactivity_nudge", "growth_ai_conversation", c.id, true, {
        staleHours,
        templateKey: "auto_close_inactivity_nudge",
      });
      result.inactivityNudges++;
      logInfo("[auto-close] inactivity_nudge", { conversationId: c.id });
    } catch (e) {
      result.errors.push(`inactivity_tx:${c.id}:${e instanceof Error ? e.message : "err"}`);
    }
  }

  // --- follow_up_message: CRM lead reactivation (metadata / queue only; no outbound SMS here) ---
  const staleLeads = await prisma.lead.findMany({
    where: {
      intentScore: { gte: Math.max(50, Number(process.env.AI_AUTOCLOSE_LEAD_INTENT_MIN ?? 55)) },
      executionStage: { notIn: ["lost", "closed"] },
      OR: [{ lastActivityAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } }, { lastActivityAt: null }],
    },
    select: { id: true },
    take: limitL * 2,
    orderBy: { updatedAt: "asc" },
  });

  for (const lead of staleLeads) {
    if (result.leadReactivations >= limitL) break;

    const recent = await prisma.autoCloseAuditEvent.findFirst({
      where: {
        targetType: "lead",
        targetId: lead.id,
        actionType: "follow_up_message",
        revertedAt: null,
        createdAt: { gte: new Date(Date.now() - dedupeLeadMs) },
      },
    });
    if (recent) continue;

    try {
      await reactivateStaleLead(lead.id);
      await logAudit("follow_up_message", "lead", lead.id, true, { kind: "reactivate_stale_lead" });
      result.leadReactivations++;
    } catch (e) {
      result.errors.push(`lead:${lead.id}:${e instanceof Error ? e.message : "err"}`);
    }
  }

  // --- booking_reminder: PENDING BNHub booking — internal CRM signal for operators (no guest auto-message) ---
  const nowMs = Date.now();
  const pendingCutoff = new Date(nowMs - 12 * 3600 * 1000);
  const pendingNotAncient = new Date(nowMs - 14 * 24 * 3600 * 1000);
  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: pendingCutoff, gte: pendingNotAncient },
    },
    select: { id: true, guestId: true, listingId: true, createdAt: true, status: true },
    take: limitB * 2,
    orderBy: { createdAt: "asc" },
  });

  for (const b of bookings) {
    if (result.bookingReminders >= limitB) break;
    if (!bookingCandidateForReminder({ status: b.status, createdAt: b.createdAt, nowMs })) continue;

    const recent = await prisma.internalCrmEvent.findFirst({
      where: {
        eventType: "auto_close_booking_reminder",
        bookingId: b.id,
        createdAt: { gte: new Date(Date.now() - dedupeBookingMs) },
      },
    });
    if (recent) continue;

    try {
      await prisma.internalCrmEvent.create({
        data: {
          eventType: "auto_close_booking_reminder",
          channel: "bnhub",
          userId: b.guestId,
          bookingId: b.id,
          shortTermListingId: b.listingId,
          metadata: { source: "auto_close_engine", safeMode: true },
        },
      });
      await logAudit("booking_reminder", "booking", b.id, true, { channel: "internal_crm_only" });
      result.bookingReminders++;
    } catch (e) {
      result.errors.push(`booking:${b.id}:${e instanceof Error ? e.message : "err"}`);
    }
  }

  return result;
}

/** Test helpers: pure checks */
export function isUnansweredUserLastMessage(senderType: string | undefined | null): boolean {
  return senderType === "user";
}

export function isStaleTimestamp(ts: Date | null, staleMs: number): boolean {
  if (!ts) return false;
  return Date.now() - ts.getTime() >= staleMs;
}

/** PENDING booking between 12h and 14d old — eligible for internal ops reminder (no guest message). */
export function bookingCandidateForReminder(params: {
  status: string;
  createdAt: Date;
  nowMs: number;
}): boolean {
  if (params.status !== "PENDING") return false;
  const age = params.nowMs - params.createdAt.getTime();
  const minAge = 12 * 3600 * 1000;
  const maxAge = 14 * 24 * 3600 * 1000;
  return age >= minAge && age <= maxAge;
}
