import { prisma } from "@/lib/db";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { buildAiSalesFollowUpValue } from "@/modules/ai-sales-agent/ai-sales-message.service";
import type { AiSalesMode } from "@/modules/ai-sales-agent/ai-sales.types";
import { escalateLeadToBroker } from "@/modules/ai-sales-agent/ai-sales-escalation.service";
import { rescheduleLecipmVisit } from "@/modules/no-show-prevention/no-show-reschedule.service";
import { resolveCentrisBrokerRouting } from "@/modules/centris-conversion/centris-broker-routing.service";

import { logBrokerAssistantExecution } from "./assistant-log.service";
import {
  assistantExecutionEnabled,
  getBrokerAssistantSafetyMode,
  requiresUserConfirmationForExecution,
} from "./assistant-safety";
import type { AssistantActionType } from "./assistant.types";

const SALES_MODE: AiSalesMode = "SAFE_AUTOPILOT";

async function brokerOwnsLead(brokerUserId: string, leadId: string): Promise<boolean> {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      OR: [
        { introducedByBrokerId: brokerUserId },
        { fsboListing: { ownerId: brokerUserId } },
        { listing: { ownerId: brokerUserId } },
      ],
    },
    select: { id: true },
  });
  return Boolean(lead);
}

async function brokerOwnsDeal(brokerUserId: string, dealId: string): Promise<boolean> {
  const d = await prisma.deal.findFirst({
    where: { id: dealId, brokerId: brokerUserId },
    select: { id: true },
  });
  return Boolean(d);
}

export type ExecuteAssistantActionInput = {
  brokerUserId: string;
  brokerRole: string;
  actionType: AssistantActionType;
  actionPayload: Record<string, unknown>;
  /** Required when `requiresUserConfirmationForExecution()` is true (always in this codebase). */
  confirmed?: boolean;
};

export type ExecuteAssistantActionResult =
  | { success: true; message: string; result: Record<string, unknown> }
  | { success: false; message: string; code?: string };

export async function executeAssistantAction(input: ExecuteAssistantActionInput): Promise<ExecuteAssistantActionResult> {
  const mode = getBrokerAssistantSafetyMode();
  if (!assistantExecutionEnabled(mode)) {
    return { success: false, message: "Execution disabled for current assistant mode.", code: "MODE" };
  }
  if (requiresUserConfirmationForExecution() && input.confirmed !== true) {
    return { success: false, message: "Confirmation required before execution.", code: "CONFIRM" };
  }

  const leadId = typeof input.actionPayload.leadId === "string" ? input.actionPayload.leadId : undefined;
  const dealId = typeof input.actionPayload.dealId === "string" ? input.actionPayload.dealId : undefined;

  switch (input.actionType) {
    case "SEND_FOLLOWUP": {
      if (!leadId) return { success: false, message: "leadId required in payload." };
      if (!(await brokerOwnsLead(input.brokerUserId, leadId))) {
        return { success: false, message: "Forbidden for this lead.", code: "FORBIDDEN" };
      }
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          email: true,
          name: true,
          optedOutOfFollowUp: true,
          listing: { select: { title: true } },
          fsboListing: { select: { title: true } },
        },
      });
      if (!lead || lead.optedOutOfFollowUp) {
        return { success: false, message: "Lead unavailable or opted out of follow-up." };
      }
      const title = lead.listing?.title ?? lead.fsboListing?.title ?? null;
      const built = buildAiSalesFollowUpValue({ leadId, listingTitle: title, mode: SALES_MODE });
      if (!lead.email || lead.email.includes("@phone-only.invalid")) {
        await logBrokerAssistantExecution({
          leadId,
          dealId: null,
          brokerUserId: input.brokerUserId,
          actionType: input.actionType,
          success: false,
          resultSummary: "no_email",
          payload: input.actionPayload,
        });
        return { success: false, message: "Lead has no sendable email on file." };
      }
      await sendTransactionalEmail({
        to: lead.email,
        subject: built.subject,
        html: built.html,
        template: "broker_assistant_followup",
      });
      await logBrokerAssistantExecution({
        leadId,
        dealId: null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: "email_sent",
        payload: input.actionPayload,
      });
      return { success: true, message: "Follow-up email sent.", result: { channel: "email" } };
    }

    case "SCHEDULE_VISIT": {
      if (!leadId) return { success: false, message: "leadId required." };
      if (!(await brokerOwnsLead(input.brokerUserId, leadId))) {
        return { success: false, message: "Forbidden for this lead.", code: "FORBIDDEN" };
      }
      const origin = getPublicAppUrl();
      const deepLink = `${origin}/dashboard/leads/${leadId}?assistant=schedule_visit`;
      await logBrokerAssistantExecution({
        leadId,
        dealId: null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: "deep_link",
        payload: { ...input.actionPayload, deepLink },
      });
      return { success: true, message: "Open scheduling from the link.", result: { deepLink } };
    }

    case "RESCHEDULE_VISIT": {
      const visitId = typeof input.actionPayload.visitId === "string" ? input.actionPayload.visitId : "";
      const start = typeof input.actionPayload.start === "string" ? new Date(input.actionPayload.start) : null;
      const end = typeof input.actionPayload.end === "string" ? new Date(input.actionPayload.end) : null;
      if (!visitId || !start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { success: false, message: "visitId, start, end (ISO) required for reschedule." };
      }
      const v = await prisma.lecipmVisit.findUnique({
        where: { id: visitId },
        select: { leadId: true, brokerUserId: true },
      });
      if (!v || v.brokerUserId !== input.brokerUserId) {
        return { success: false, message: "Visit not found or not yours.", code: "FORBIDDEN" };
      }
      if (!(await brokerOwnsLead(input.brokerUserId, v.leadId))) {
        return { success: false, message: "Forbidden.", code: "FORBIDDEN" };
      }
      const out = await rescheduleLecipmVisit({
        visitId,
        start,
        end,
        userConfirmed: true,
        source: "DIRECT",
        actorUserId: input.brokerUserId,
      });
      if (!out.ok) {
        await logBrokerAssistantExecution({
          leadId: v.leadId,
          dealId: null,
          brokerUserId: input.brokerUserId,
          actionType: input.actionType,
          success: false,
          resultSummary: out.error ?? "failed",
          payload: input.actionPayload,
        });
        return { success: false, message: out.error ?? "Reschedule failed." };
      }
      await logBrokerAssistantExecution({
        leadId: v.leadId,
        dealId: null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: "rescheduled",
        payload: { ...input.actionPayload, newVisitId: out.visitId },
      });
      return { success: true, message: "Visit rescheduled.", result: { visitId: out.visitId } };
    }

    case "ESCALATE_TO_ADMIN": {
      if (leadId && !(await brokerOwnsLead(input.brokerUserId, leadId))) {
        return { success: false, message: "Forbidden for this lead.", code: "FORBIDDEN" };
      }
      if (dealId && !(await brokerOwnsDeal(input.brokerUserId, dealId))) {
        return { success: false, message: "Forbidden for this deal.", code: "FORBIDDEN" };
      }
      const summary =
        typeof input.actionPayload.summary === "string"
          ? input.actionPayload.summary
          : "Broker requested ops review from assistant.";
      const ops = process.env.LECIPM_OPS_EMAIL?.trim();
      if (ops) {
        await sendTransactionalEmail({
          to: ops,
          subject: "[LECIPM] Broker assistant escalation",
          html: `<p>${summary}</p><p>Lead: ${leadId ?? "n/a"} · Deal: ${dealId ?? "n/a"} · Actor: ${input.brokerUserId}</p>`,
          template: "broker_assistant_escalate_ops",
        });
      }
      await logBrokerAssistantExecution({
        leadId: leadId ?? null,
        dealId: dealId ?? null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: ops ? "ops_email+broker_escalation" : "broker_escalation_only",
        payload: input.actionPayload,
      });
      return { success: true, message: "Escalation recorded.", result: { opsNotified: Boolean(ops) } };
    }

    case "ASSIGN_BROKER": {
      if (input.brokerRole !== "ADMIN") {
        return { success: false, message: "Admin only.", code: "FORBIDDEN" };
      }
      const target = typeof input.actionPayload.targetBrokerId === "string" ? input.actionPayload.targetBrokerId : "";
      if (!leadId || !target) {
        return { success: false, message: "leadId and targetBrokerId required." };
      }
      await prisma.lead.update({
        where: { id: leadId },
        data: { introducedByBrokerId: target },
      });
      await logBrokerAssistantExecution({
        leadId,
        dealId: null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: "assigned",
        payload: input.actionPayload,
      });
      return { success: true, message: "Lead assignment updated.", result: {} };
    }

    case "SEND_SIMILAR_LISTINGS": {
      if (!leadId) return { success: false, message: "leadId required." };
      if (!(await brokerOwnsLead(input.brokerUserId, leadId))) {
        return { success: false, message: "Forbidden.", code: "FORBIDDEN" };
      }
      const routing = await resolveCentrisBrokerRouting(leadId);
      const origin = getPublicAppUrl();
      const deepLink = `${origin}/browse?assistant=similar&leadId=${encodeURIComponent(leadId)}`;
      await logBrokerAssistantExecution({
        leadId,
        dealId: null,
        brokerUserId: input.brokerUserId,
        actionType: input.actionType,
        success: true,
        resultSummary: "link",
        payload: { ...input.actionPayload, routingReason: routing.routingReason, deepLink },
      });
      return { success: true, message: "Use this link to pick similar listings.", result: { deepLink } };
    }

    case "REQUEST_OFFER_UPDATE": {
      if (!dealId) return { success: false, message: "dealId required." };
      if (!(await brokerOwnsDeal(input.brokerUserId, dealId))) {
        return { success: false, message: "Forbidden for this deal.", code: "FORBIDDEN" };
      }
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { leadId: true, status: true },
      });
      if (deal?.leadId) {
        await logBrokerAssistantExecution({
          leadId: deal.leadId,
          dealId,
          brokerUserId: input.brokerUserId,
          actionType: input.actionType,
          success: true,
          resultSummary: "timeline_note",
          payload: { ...input.actionPayload, dealStatus: deal.status },
        });
      } else {
        await logBrokerAssistantExecution({
          leadId: null,
          dealId,
          brokerUserId: input.brokerUserId,
          actionType: input.actionType,
          success: true,
          resultSummary: "deal_only_log",
          payload: input.actionPayload,
        });
      }
      return {
        success: true,
        message: "Offer update request logged — follow up with parties.",
        result: { dealId },
      };
    }

    default:
      return { success: false, message: "Unknown action type.", code: "UNKNOWN" };
  }
}
