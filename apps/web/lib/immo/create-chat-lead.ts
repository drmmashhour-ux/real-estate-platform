import { prisma } from "@/lib/db";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { tierFromScore } from "@/lib/ai/lead-tier";
import {
  conversionProbabilityForTier,
  scoreLeadRevenueTier,
  mortgageCreditCostForTier,
} from "@/lib/ai/lead-score";
import { assignMortgageExpertForNewLead } from "@/modules/mortgage/services/expert-service";
import { notifyMortgageExpertNewLead } from "@/modules/mortgage/services/notify-expert-lead";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { runClosingAutomationById } from "@/lib/automation/closing-engine";
import { computeDynamicLeadPriceCents } from "@/lib/revenue/dynamic-pricing";
import type { CrmConversationMetadata } from "./crm-metadata";
import { mergeMetadata } from "./crm-metadata";
import { refreshLeadExecutionLayer } from "@/src/modules/crm/leadExecutionRefresh";

const MORTGAGE_SERVICE_COMMISSION = 0.3;

export type CreateChatLeadInput = {
  conversationId: string;
  transcriptSummary: string;
  intent: CrmConversationMetadata["intent"];
  userId: string | null;
  capture: NonNullable<CrmConversationMetadata["capture"]>;
};

/**
 * Create CRM lead from Immo chat, assign mortgage expert when possible, link conversation.
 */
export async function createLeadFromImmoChat(input: CreateChatLeadInput): Promise<{
  leadId: string;
  expertId: string | null;
  marketplace: boolean;
}> {
  const placeholderId = `chat-${input.conversationId.replace(/[^a-z0-9-]/gi, "").slice(0, 36)}`;
  const name =
    input.capture.name?.trim() ||
    (input.userId ? "Registered user (chat)" : "Website chat visitor");
  const emailRaw =
    input.capture.email?.trim().toLowerCase() ||
    `${placeholderId.replace(/[^a-z0-9-]/gi, "")}@chat.pending.lecipm`;
  const email =
    emailRaw.length > 3 && emailRaw.includes("@")
      ? emailRaw.slice(0, 320)
      : `${placeholderId}@chat.pending.lecipm`.slice(0, 320);
  const phone = (input.capture.phone?.trim() || "—").slice(0, 40);

  const revenueTier = scoreLeadRevenueTier({
    urgency: input.intent === "mortgage" ? "mortgage chat" : input.transcriptSummary.slice(0, 200),
  });

  const assignment = await assignMortgageExpertForNewLead({ revenueTier });
  const expertId = assignment.type === "expert" ? assignment.expertId : null;
  const inMarketplace = assignment.type === "marketplace";

  const message = [
    "IMMO AI CHAT LEAD",
    `Intent: ${input.intent ?? "general"}`,
    "---",
    input.transcriptSummary.slice(0, 6000),
  ].join("\n");

  const { score, temperature, explanation } = scoreLead({ name, email, phone, message });
  const tier = tierFromScore(score);
  const conversionProbability = conversionProbabilityForTier(revenueTier);
  const mortgageCreditCost = mortgageCreditCostForTier(revenueTier);
  const dynamicLeadPriceCents = computeDynamicLeadPriceCents(revenueTier, undefined);

  const existing = await prisma.crmConversation.findUnique({
    where: { id: input.conversationId },
    select: { metadata: true },
  });
  const mergedMeta = mergeMetadata(existing?.metadata, {
    intent: input.intent,
    capture: input.capture,
    leadCreatedAt: new Date().toISOString(),
  });

  const lead = await prisma.lead.create({
    data: {
      name: name.slice(0, 200),
      email,
      phone,
      message,
      status: "new",
      pipelineStatus: "new",
      pipelineStage: "new",
      score,
      leadSource: "ai_chat",
      leadType: input.intent === "mortgage" ? "mortgage" : null,
      assignedExpertId: expertId ?? undefined,
      mortgageMarketplaceStatus: inMarketplace ? "open" : null,
      aiExplanation: {
        form: { score, temperature, explanation },
        leadKind: "immo_chat",
        intent: input.intent,
        revenueTier,
        mortgageCreditCost,
      } as object,
      aiTier: tier,
      highIntent: revenueTier === "HIGH" || score >= 72,
      userId: input.userId ?? undefined,
      conversionProbability,
      valueSource: "ai_chat",
      revenueTier,
      mortgageCreditCost,
      dynamicLeadPriceCents,
      serviceCommissionRate: MORTGAGE_SERVICE_COMMISSION,
      mortgageAssignedAt: expertId ? new Date() : null,
    },
  });

  await prisma.crmConversation.update({
    where: { id: input.conversationId },
    data: {
      leadId: lead.id,
      expertId: expertId ?? undefined,
      metadata: mergedMeta as object,
    },
  });

  await appendLeadTimelineEvent(lead.id, "immo_chat_lead_created", {
    conversationId: input.conversationId,
    intent: input.intent,
    expertId,
    marketplace: inMarketplace,
  }).catch(() => {});

  if (expertId) {
    void notifyMortgageExpertNewLead({
      expertId,
      leadId: lead.id,
      clientName: name,
      clientEmail: email,
    });
  }

  void runClosingAutomationById(lead.id).catch(() => {});
  void refreshLeadExecutionLayer(lead.id).catch(() => {});

  return { leadId: lead.id, expertId, marketplace: inMarketplace };
}
