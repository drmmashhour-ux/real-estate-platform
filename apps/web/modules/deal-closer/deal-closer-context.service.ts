import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildMemorySnapshot } from "@/modules/messaging/crm-memory/memory.engine";
import { runConversationAiEngine } from "@/modules/messaging/analysis/conversation-ai.engine";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";
import type { DealCloserContext } from "@/modules/deal-closer/deal-closer.types";
import { MessageType } from "@prisma/client";

type BuildParams = {
  dealId: string;
  brokerId: string;
};

/**
 * Gathers safe, best-effort context from deal + optional messaging thread. Never throws to callers.
 */
export async function buildDealCloserContext(params: BuildParams): Promise<DealCloserContext> {
  const base: DealCloserContext = {
    dealId: params.dealId,
    brokerId: params.brokerId,
    engagementScore: null,
    dealProbability: null,
    financingReadiness: "unknown",
    urgencyLevel: "medium",
    visitScheduled: false,
    offerDiscussed: false,
    silenceGapDays: null,
  };
  try {
    const deal = await prisma.deal.findFirst({
      where: { id: params.dealId, brokerId: params.brokerId },
      include: {
        lead: {
          select: {
            id: true,
            platformConversationId: true,
            aiTier: true,
            status: true,
          },
        },
      },
    });
    if (!deal) return { ...base, clientId: null, leadId: null, dealStatus: null };

    const clientId = deal.buyerId;
    const leadId = deal.leadId ?? null;
    const conversationId = deal.lead?.platformConversationId ?? null;
    const statusLower = (deal.status ?? "").toLowerCase();
    const offerDiscussed = /offer|submitted|accepted|negot|financ/i.test(deal.status);
    const visitScheduled = /visit|inspection|closing/i.test(statusLower) || /visit|inspection|showing/i.test(deal.crmStage ?? "");

    let engagementScore: number | null = null;
    let dealProbability: number | null = null;
    let dealStage: string | null = deal.crmStage ?? null;
    let objections: unknown = { objections: [] as { type: string; severity: string; confidence: number }[] };
    let conversationInsights: unknown = null;

    if (conversationId) {
      const rows = await prisma.message.findMany({
        where: { conversationId, deletedAt: null, messageType: { not: MessageType.SYSTEM } },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { body: true, senderId: true, createdAt: true, messageType: true },
      });
      const last = rows[rows.length - 1];
      if (last) {
        const days = (Date.now() - last.createdAt.getTime()) / 86_400_000;
        base.silenceGapDays = Math.max(0, Math.floor(days));
      } else {
        base.silenceGapDays = null;
      }
      const texts = rows.map((r) => r.body).filter(Boolean);
      const memory = await buildMemorySnapshot({ clientId, brokerId: params.brokerId, messageTexts: texts });
      const lastAt = last?.createdAt.toISOString() ?? new Date().toISOString();
      const ac: AssistantConversationShape = {
        id: conversationId,
        type: "DIRECT",
        lastActivityAt: lastAt,
        lastMessageFromViewer: last ? last.senderId === params.brokerId : undefined,
      };
      const engineMessages = rows.map((r) => ({
        body: r.messageType === "VOICE" ? "" : r.body,
        senderId: r.senderId,
        createdAt: r.createdAt.toISOString(),
      }));
      const ai = runConversationAiEngine({
        conversation: ac,
        memory,
        messages: engineMessages,
        viewerId: params.brokerId,
        counterpartyId: clientId,
      });
      engagementScore = ai.dealPrediction.engagementScore;
      dealProbability = ai.dealPrediction.dealProbability;
      dealStage = ai.dealStage.stage;
      objections = ai.objections;
      conversationInsights = ai.conversationInsights;
    }

    const pref = await prisma.clientMemory.findUnique({
      where: { clientId_brokerId: { clientId, brokerId: params.brokerId } },
      select: { preferences: true },
    });
    const prefs = pref?.preferences && typeof pref.preferences === "object" ? (pref.preferences as Record<string, unknown>) : {};
    const heur = (prefs.assistantHeuristics as Record<string, unknown> | undefined) ?? {};
    const fr = heur.financingReadinessHint;
    const financingReadiness: DealCloserContext["financingReadiness"] =
      fr === "likely" ? "strong" : fr === "uncertain" ? "weak" : "unknown";
    const ul = heur.urgencyLevel;
    const urgencyLevel: DealCloserContext["urgencyLevel"] =
      ul === "high" || ul === "medium" || ul === "low" ? ul : "medium";

    return {
      ...base,
      dealId: params.dealId,
      conversationId,
      leadId,
      clientId,
      brokerId: params.brokerId,
      dealStage: dealStage ?? null,
      dealStatus: deal.status,
      crmStage: deal.crmStage,
      conversationInsights,
      objections,
      clientMemory: { profileKeys: Object.keys(prefs) },
      engagementScore,
      dealProbability,
      financingReadiness,
      urgencyLevel,
      visitScheduled: visitScheduled || false,
      offerDiscussed,
    };
  } catch {
    return base;
  }
}
