import { prisma } from "@/lib/db";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

/**
 * Rank leads by existing CRM score + recency. **Does not send messages** or change assignment.
 * When `brokerUserId` is omitted (admin preview), recent high-score leads platform-wide are listed.
 */
export async function rankBrokerLeadsForBroker(
  brokerUserId: string | undefined,
  opts?: { limit?: number }
): Promise<AiAssistResult<{ items: AiRecommendationItem[] }>> {
  try {
    const limit = Math.min(opts?.limit ?? 40, 100);

    const leads = await prisma.lead.findMany({
      where: brokerUserId
        ? {
            introducedByBrokerId: brokerUserId,
          }
        : {},
      select: {
        id: true,
        name: true,
        score: true,
        pipelineStatus: true,
        createdAt: true,
        aiTier: true,
        listingCode: true,
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const items: AiRecommendationItem[] = leads.map((l, idx) => ({
      id: `lead:${l.id}`,
      hub: "lecipm_crm",
      actionClass: "recommendation",
      title: `#${idx + 1} — ${l.name}`,
      body: `Score ${l.score}; pipeline ${l.pipelineStatus}; tier ${l.aiTier ?? "n/a"}. Review before outreach — automated sending is off in v1.`,
      reasonCodes: [
        { code: "LEAD_RANKING", message: "Sorted by score desc, then recency" },
        { code: "NO_AUTO_SEND", message: "Outbound requires human action" },
      ],
      refs: { leadId: l.id },
    }));

    return { ok: true, value: { items } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "lead rank failed",
      code: "BROKER_LEADS",
    };
  }
}
