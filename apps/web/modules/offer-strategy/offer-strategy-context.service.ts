import { prisma } from "@repo/db";
import { buildDealCloserContext } from "@/modules/deal-closer/deal-closer-context.service";
import { computeDealClosingReadiness } from "@/modules/deal-closer/closing-readiness.engine";
import type { OfferStrategyContext } from "@/modules/offer-strategy/offer-strategy.types";
import { MessageType } from "@prisma/client";

type Params = { dealId: string; brokerId: string };

/**
 * Builds offer-strategy input from deal + messaging + CRM heuristics. Never throws.
 */
export async function buildOfferStrategyContext(params: Params): Promise<OfferStrategyContext> {
  const base: OfferStrategyContext = { dealId: params.dealId, brokerId: params.brokerId };
  try {
    const dcc = await buildDealCloserContext({ dealId: params.dealId, brokerId: params.brokerId });
    const closing = computeDealClosingReadiness(dcc);
    const deal = await prisma.deal.findFirst({
      where: { id: params.dealId, brokerId: params.brokerId },
      include: { lead: { select: { id: true, platformConversationId: true } }, milestones: true },
    });
    if (!deal) {
      return {
        ...base,
        closingReadinessScore: closing.score,
        clientId: dcc.clientId ?? undefined,
        leadId: dcc.leadId,
        dealProbability: dcc.dealProbability,
        objections: dcc.objections,
        engagementScore: dcc.engagementScore,
        financingReadiness: dcc.financingReadiness ?? "unknown",
        urgencyLevel: dcc.urgencyLevel ?? "medium",
        offerDiscussed: dcc.offerDiscussed,
        visitScheduled: dcc.visitScheduled,
        silenceGapDays: dcc.silenceGapDays,
        conversationId: dcc.conversationId,
      };
    }

    const visitCompleted =
      deal.milestones.some(
        (m) => m.status === "completed" && /visit|showing|tour|walk/i.test(m.name) && !/not/i.test(m.name)
      ) || /inspection|offer_submitted|accepted|financing|closing|closed/.test(deal.status);

    let blob = "";
    if (deal.lead?.platformConversationId) {
      const msgs = await prisma.message.findMany({
        where: { conversationId: deal.lead.platformConversationId, deletedAt: null, messageType: { not: MessageType.SYSTEM } },
        orderBy: { createdAt: "desc" },
        take: 80,
        select: { body: true },
      });
      blob = msgs
        .map((m) => m.body)
        .join(" ")
        .toLowerCase();
    }

    const comp = {
      mentionedOtherProperties: /\b(other|another)\s+(listing|place|property|condo|house|unit)\b/i.test(blob),
      mentionedOtherOffers: /\b(other|multiple|competing)\s+offer|bidd|bully|blind offer\b/i.test(blob),
      delayedDecision:
        /\b(think|hesitat|not sure|later|need time)\b/i.test(blob) && (dcc.engagementScore ?? 0) > 50,
    };

    const hasPriceObj = (() => {
      const o = dcc.objections;
      if (o && typeof o === "object" && "objections" in o) {
        const arr = (o as { objections?: { type?: string; severity?: string }[] }).objections;
        if (Array.isArray(arr)) return arr.some((x) => x.type === "price" && (x.severity === "high" || x.severity === "medium"));
      }
      return false;
    })();
    const priceSensitivity: OfferStrategyContext["priceSensitivity"] = hasPriceObj ? "high" : "unknown";

    const hasTrust = (() => {
      const o = dcc.objections;
      if (o && typeof o === "object" && "objections" in o) {
        const arr = (o as { objections?: { type?: string }[] }).objections;
        if (Array.isArray(arr)) return arr.some((x) => x.type === "trust");
      }
      return false;
    })();
    const trustLevel: OfferStrategyContext["trustLevel"] = hasTrust ? "low" : "unknown";

    return {
      dealId: params.dealId,
      leadId: dcc.leadId,
      conversationId: dcc.conversationId,
      brokerId: dcc.brokerId,
      clientId: dcc.clientId,
      closingReadinessScore: closing.score,
      dealProbability: dcc.dealProbability,
      visitCompleted,
      visitScheduled: dcc.visitScheduled,
      offerDiscussed: dcc.offerDiscussed,
      financingReadiness: dcc.financingReadiness ?? "unknown",
      urgencyLevel: dcc.urgencyLevel ?? "medium",
      objections: dcc.objections,
      clientMemory: dcc.clientMemory,
      silenceGapDays: dcc.silenceGapDays,
      engagementScore: dcc.engagementScore,
      competitiveSignals: comp,
      priceSensitivity,
      trustLevel,
      hesitationOrComparisonHint: /\b(compare|versus|or that|another one|on the fence)\b/i.test(blob),
      dealStatus: dcc.dealStatus ?? null,
    };
  } catch {
    return base;
  }
}
