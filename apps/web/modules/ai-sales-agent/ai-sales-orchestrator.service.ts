import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

import { recordAiSalesEvent } from "./ai-sales-log.service";
import {
  getAiSalesAgentConfig,
  modeAllowsOutboundEmail,
  modeAllowsSms,
} from "./ai-sales-config.service";
import { escalateLeadToBroker, shouldEscalateToBroker } from "./ai-sales-escalation.service";
import { qualifySalesLead } from "./ai-sales-qualification.service";
import { scheduleAiSalesNurtureSequence, sendInstantAiSalesEmail } from "./ai-sales-sequence.service";
import type { AiSalesMode, AiSalesTrigger } from "./ai-sales.types";

function hasValidLeadEmail(email: string | null | undefined): boolean {
  const e = email?.trim() ?? "";
  return Boolean(e && !e.includes("@phone-only.invalid") && !e.includes("@lecipm.local"));
}

/**
 * Single entry for triggers: capture, broker intake, info request, cron follow-up tick.
 * Never impersonates a broker — logs every branch for audit.
 */
export async function triggerAiSalesAgent(params: {
  leadId: string;
  trigger: AiSalesTrigger;
  consentMarketing: boolean;
  /** Law 25 — required for Centris portal capture; broker manual may attest separately. */
  consentPrivacy?: boolean;
  listingTitle?: string | null;
}): Promise<void> {
  if (!engineFlags.aiSalesAgentV1) return;

  const cfg = await getAiSalesAgentConfig();
  if (cfg.mode === "OFF") return;

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: {
      email: true,
      message: true,
      optedOutOfFollowUp: true,
      distributionChannel: true,
    },
  });

  if (!lead) return;

  await recordAiSalesEvent(params.leadId, "AI_SALES_TRIGGERED", {
    assistant: "lecipm",
    mode: cfg.mode,
    trigger: params.trigger,
    explain: "orchestrator_entry",
    metadata: {
      consentMarketing: params.consentMarketing,
      consentPrivacy: params.consentPrivacy ?? null,
      channel: lead.distributionChannel,
    },
  });

  const qualification = await qualifySalesLead(params.leadId);

  const visitRequested = /\b(visit|showing|visite|schedule|book|voir)\b/i.test(lead.message);
  const complexQuestion =
    (lead.message?.length ?? 0) > 400 || /\b(law|legal|notary|tax|zoning|permis)\b/i.test(lead.message);

  const escReason = shouldEscalateToBroker({
    qualification,
    visitRequested,
    complexQuestion,
  });

  if (escReason && cfg.mode !== "ASSIST") {
    await escalateLeadToBroker({
      leadId: params.leadId,
      reason: escReason,
      summary: qualification.summary,
      mode: cfg.mode,
    });
  }

  if (cfg.mode === "ASSIST") {
    await recordAiSalesEvent(params.leadId, "AI_SALES_LEARNING_UPDATE", {
      assistant: "lecipm",
      mode: cfg.mode,
      explain: "assist_mode_no_auto_send",
      metadata: { tier: qualification.tier },
    });
    return;
  }

  const privacyOk = params.consentPrivacy !== false;

  if (modeAllowsOutboundEmail(cfg.mode) && privacyOk && hasValidLeadEmail(lead.email)) {
    await sendInstantAiSalesEmail({
      toEmail: lead.email,
      leadId: params.leadId,
      listingTitle: params.listingTitle,
      trigger: params.trigger,
      mode: cfg.mode,
    });
  }

  if (params.consentMarketing && !lead.optedOutOfFollowUp) {
    await scheduleAiSalesNurtureSequence({
      leadId: params.leadId,
      consentMarketing: true,
      mode: cfg.mode,
    });
  }

  await maybeQueueSmsStub(params.leadId, cfg.mode);
}

/** Future: Twilio / WhatsApp — requires `LeadContactConsent` + FULL_AUTOPILOT. */
async function maybeQueueSmsStub(leadId: string, mode: AiSalesMode): Promise<void> {
  if (!modeAllowsSms(mode)) return;

  const consent = await prisma.leadContactConsent.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  if (!consent?.consentSmsWhatsapp) {
    await recordAiSalesEvent(leadId, "AI_SALES_LEARNING_UPDATE", {
      assistant: "lecipm",
      mode,
      explain: "sms_skipped_no_tcpa_consent",
    });
    return;
  }

  await recordAiSalesEvent(leadId, "AI_SALES_LEARNING_UPDATE", {
    assistant: "lecipm",
    mode,
    explain: "sms_channel_reserved",
    metadata: { note: "wire Twilio when approved" },
  });
}
