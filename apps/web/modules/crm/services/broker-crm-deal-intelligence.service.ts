import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";

export type DealProgressInsight = {
  dealId: string;
  status: string;
  crmStage: string | null;
  /** 0–1 rough progress heuristic (suggestions only). */
  progressScore: number;
  bottlenecks: string[];
  suggestedActions: string[];
};

/**
 * Rule-based deal pipeline insight. No financial/legal execution. Never throws.
 */
export async function evaluateDealProgress(dealId: string): Promise<DealProgressInsight | null> {
  try {
    if (!dealId?.trim()) {
      return null;
    }
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        status: true,
        crmStage: true,
        updatedAt: true,
        createdAt: true,
        brokerId: true,
        priceCents: true,
        executionMetadata: true,
      },
    });
    if (!deal) {
      return null;
    }

    const bottlenecks: string[] = [];
    const suggestedActions: string[] = [];
    const ageDays = (Date.now() - deal.createdAt.getTime()) / 86_400_000;

    if (["initiated", "offer_submitted"].includes(deal.status) && ageDays > 14) {
      bottlenecks.push("Deal has been in an early stage for more than two weeks without closing.");
      suggestedActions.push("Schedule a broker check-in and confirm counterparty next steps in writing.");
    }
    if (deal.status !== "closed" && deal.status !== "cancelled") {
      if (!deal.crmStage || deal.crmStage === "negotiation") {
        suggestedActions.push("Align the CRM stage with the latest offer/inspection state.");
      }
    }
    if (bottlenecks.length === 0) {
      bottlenecks.push("No automatic bottlenecks flagged — keep milestones current.");
    }

    let progressScore = 0.3;
    if (deal.status === "closed") {
      progressScore = 1;
    } else if (["inspection", "financing", "closing_scheduled", "offer_submitted", "accepted"].includes(deal.status)) {
      progressScore = 0.75;
    } else if (deal.status === "initiated" || deal.crmStage === "negotiation") {
      progressScore = 0.45;
    }

    const ctx: PlaybookComparableContext = {
      domain: "DEALS",
      entityType: "deal",
      entityId: dealId,
      segment: { source: "crm_deal_intelligence" },
      signals: { status: deal.status, crmStage: deal.crmStage, progressScore },
    };
    void playbookMemoryWriteService
      .recordDecision({
        source: "SYSTEM",
        triggerEvent: "crm.deal.progress_evaluated",
        actionType: "crm_deal_progress_insight",
        dealId,
        brokerId: deal.brokerId ?? undefined,
        context: ctx,
        actionPayload: { progressScore, bottlenecks, suggestedActions: suggestedActions.slice(0, 6) },
        idempotencyKey: `crm_deal_progress_insight:${dealId}`,
      })
      .catch((e) => {
        playbookLog.warn("deal progress memory skipped", {
          message: e instanceof Error ? e.message : String(e),
        });
      });

    return {
      dealId,
      status: deal.status,
      crmStage: deal.crmStage,
      progressScore,
      bottlenecks,
      suggestedActions,
    };
  } catch (e) {
    playbookLog.warn("evaluateDealProgress", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
