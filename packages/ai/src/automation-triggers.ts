/**
 * Records automation intents (emails / alerts). Delivery wiring is platform-specific (email worker, etc.).
 */

import { prisma } from "@/lib/db";
import { tierFromScore } from "./lead-tier";
import type { Prisma } from "@prisma/client";

export async function recordHotLeadAlert(params: {
  brokerId: string;
  leadId: string;
  mergedScore: number;
}): Promise<void> {
  const tier = tierFromScore(params.mergedScore);
  if (tier !== "hot") return;
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId,
      eventKey: "hot_lead_alert",
      payload: { leadId: params.leadId, mergedScore: params.mergedScore, tier },
    },
  });
}

export async function recordPriceDropIntent(params: {
  userId: string;
  listingId: string;
  oldCents: number;
  newCents: number;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      userId: params.userId,
      eventKey: "price_drop",
      payload: {
        listingId: params.listingId,
        oldCents: params.oldCents,
        newCents: params.newCents,
      },
    },
  });
}

/** Client AI chat asked for human / broker (hot handoff, legal, or complex topic). */
export async function recordClientChatHandoff(params: {
  brokerId?: string | null;
  leadId?: string | null;
  reason:
    | "hot_lead_handoff"
    | "legal_or_financial"
    | "complex_transaction"
    | "viewing_request"
    | "offer_intent"
    | "callback_request"
    | "discriminatory"
    | "regulated_financing";
  tier?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId ?? undefined,
      eventKey: "client_chat_handoff",
      payload: {
        reason: params.reason,
        leadId: params.leadId,
        tier: params.tier,
        ...params.payload,
      },
    },
  });
}

/** Escalation before full contact captured (notify team to watch inbox / follow up). */
export async function recordClientChatEscalation(params: {
  brokerId?: string | null;
  reason: string;
  lastMessage: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  // Ensure Prisma JSON field receives a JSON-safe value (no functions/undefined/Date).
  const safeContext: Prisma.InputJsonValue | undefined = params.context
    ? (() => {
        try {
          return JSON.parse(JSON.stringify(params.context)) as Prisma.InputJsonValue;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId ?? undefined,
      eventKey: "client_chat_escalation",
      payload: {
        reason: params.reason,
        lastMessage: params.lastMessage.slice(0, 2000),
        context: safeContext,
      },
    },
  });
}

export async function recordWarmFollowUpIntent(params: {
  brokerId?: string | null;
  leadId: string;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId ?? undefined,
      eventKey: "warm_lead_follow_up",
      payload: { leadId: params.leadId },
    },
  });
}

export async function recordColdNurtureIntent(params: {
  brokerId?: string | null;
  leadId: string;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId ?? undefined,
      eventKey: "cold_lead_nurture",
      payload: { leadId: params.leadId },
    },
  });
}

export async function recordDealCrmStageChange(params: {
  brokerId?: string | null;
  dealId: string;
  fromStage: string | null;
  toStage: string;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId ?? undefined,
      eventKey: "deal_crm_stage_change",
      payload: params,
    },
  });
}

export async function recordRetentionReminder(params: {
  brokerId: string;
  leadId: string;
  templateKey: string;
  scheduledFor: string;
}): Promise<void> {
  await prisma.aiAutomationEvent.create({
    data: {
      brokerId: params.brokerId,
      eventKey: "retention_touch_due",
      payload: params,
    },
  });
}
