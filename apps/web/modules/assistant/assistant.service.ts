import { prisma } from "@/lib/db";

import { buildAssistantSuggestions, daysBetween, hoursBetween } from "./assistant.engine";
import { assistantSuggestionsEnabled, getBrokerAssistantSafetyMode } from "./assistant-safety";
import type {
  AssistantDealContext,
  AssistantEngineInput,
  AssistantLeadContext,
  AssistantSuggestion,
} from "./assistant.types";

function logAssistant(scope: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[assistant] ${scope}`, meta);
  else console.log(`[assistant] ${scope}`);
}

const STALE_LEAD_DAYS = 7;

/**
 * Builds real-time coaching suggestions from deal/lead rows and broker activity heuristics.
 * Never sends messages — returns text for display only.
 */
export async function getBrokerAssistantSuggestions(params: {
  brokerUserId: string;
  dealId?: string | null;
  leadId?: string | null;
}): Promise<{ suggestions: AssistantSuggestion[]; disclaimer: string }> {
  const mode = getBrokerAssistantSafetyMode();
  if (!assistantSuggestionsEnabled(mode)) {
    return {
      suggestions: [],
      disclaimer: "Broker assistant is off for this environment.",
      assistantMode: mode,
    };
  }

  const disclaimer =
    mode === "ASSIST"
      ? "Assist mode — suggestions only; use CRM tools manually. Execution from the assistant panel is disabled."
      : "Actionable when you confirm — nothing sends without your explicit confirmation. All runs are logged.";

  try {
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - STALE_LEAD_DAYS * 86_400_000);

    let dealCtx: AssistantDealContext | null = null;
    let leadCtx: AssistantLeadContext | null = null;

    if (params.dealId) {
      const d = await prisma.deal.findFirst({
        where: { id: params.dealId, brokerId: params.brokerUserId },
        select: { id: true, status: true, updatedAt: true, priceCents: true },
      });
      if (d) {
        dealCtx = {
          id: d.id,
          status: d.status,
          updatedAt: d.updatedAt,
          daysSinceTouch: daysBetween(d.updatedAt, now),
          priceCents: d.priceCents,
        };
      }
    }

    if (params.leadId) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: params.leadId,
          OR: [
            { introducedByBrokerId: params.brokerUserId },
            { fsboListing: { ownerId: params.brokerUserId } },
            { listing: { ownerId: params.brokerUserId } },
          ],
        },
        select: {
          id: true,
          status: true,
          pipelineStatus: true,
          score: true,
          updatedAt: true,
          highIntent: true,
        },
      });
      if (lead) {
        leadCtx = {
          id: lead.id,
          status: lead.status,
          pipelineStatus: lead.pipelineStatus,
          score: lead.score,
          updatedAt: lead.updatedAt,
          daysSinceTouch: daysBetween(lead.updatedAt, now),
          highIntent: lead.highIntent,
        };
      }
    }

    const staleLeadCount = await prisma.lead.count({
      where: {
        updatedAt: { lt: staleCutoff },
        OR: [
          { introducedByBrokerId: params.brokerUserId },
          { fsboListing: { ownerId: params.brokerUserId } },
          { listing: { ownerId: params.brokerUserId } },
        ],
      },
    });

    const latestLeadTouch = await prisma.lead.findFirst({
      where: {
        OR: [
          { introducedByBrokerId: params.brokerUserId },
          { fsboListing: { ownerId: params.brokerUserId } },
          { listing: { ownerId: params.brokerUserId } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    const latestDealTouch = await prisma.deal.findFirst({
      where: { brokerId: params.brokerUserId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    const candidates = [latestLeadTouch?.updatedAt, latestDealTouch?.updatedAt].filter(
      (x): x is Date => x != null,
    );
    const lastBrokerTouch =
      candidates.length > 0
        ? candidates.reduce((a, b) => (a > b ? a : b))
        : null;

    let hoursSinceLastBrokerAction: number | null = null;
    if (dealCtx) {
      hoursSinceLastBrokerAction = hoursBetween(dealCtx.updatedAt, now);
    } else if (leadCtx) {
      hoursSinceLastBrokerAction = hoursBetween(leadCtx.updatedAt, now);
    } else if (lastBrokerTouch) {
      hoursSinceLastBrokerAction = hoursBetween(lastBrokerTouch, now);
    }

    const engineInput: AssistantEngineInput = {
      deal: dealCtx,
      lead: leadCtx,
      hoursSinceLastBrokerAction,
      staleLeadCount,
      contextLeadId: params.leadId ?? null,
      contextDealId: params.dealId ?? null,
    };

    let suggestions = buildAssistantSuggestions(engineInput);
    if (mode === "ASSIST") {
      suggestions = stripExecutableActions(suggestions);
    }
    logAssistant("suggestions_built", {
      brokerId: params.brokerUserId,
      count: suggestions.length,
      hasDeal: Boolean(dealCtx),
      hasLead: Boolean(leadCtx),
    });

    return { suggestions, disclaimer, assistantMode: mode };
  } catch (e) {
    logAssistant("suggestions_error", { err: e instanceof Error ? e.message : "unknown" });
    return {
      suggestions: buildAssistantSuggestions({
        deal: null,
        lead: null,
        hoursSinceLastBrokerAction: null,
        staleLeadCount: 0,
        contextLeadId: params.leadId ?? null,
        contextDealId: params.dealId ?? null,
      }),
      disclaimer,
      assistantMode: getBrokerAssistantSafetyMode(),
    };
  }
}
