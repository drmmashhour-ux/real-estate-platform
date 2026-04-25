/**
 * STEP 9 — Deal intelligence: `evaluateDealProgress` for risk/stagnation/suggestions (non-legal).
 * Writes observability to playbook-memory; no execution. Never throws.
 */

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
  /** Alias: risk themes (non-legal). */
  risk: string[];
  /** Explicit risk flags for dashboards (subset of bottlenecks when actionable). */
  riskFlags: string[];
  /** Human-readable delay signal when the deal is aging in early stages. */
  delay: string | null;
  /** Stagnation / aging warnings (non-legal). */
  stagnationWarnings: string[];
  /** Alias of suggestedActions for CRM copy. */
  suggestion: string[];
};

/** Minimal deal row for `evaluateDealProgress(deal)` without an extra DB round-trip. */
export type DealProgressDealInput = {
  id: string;
  status: string;
  crmStage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  brokerId?: string | null;
};

function buildInsightFromDeal(deal: DealProgressDealInput): DealProgressInsight {
  const crmStage = deal.crmStage ?? null;
  const bottlenecks: string[] = [];
  const suggestedActions: string[] = [];
  const ageDays = (Date.now() - deal.createdAt.getTime()) / 86_400_000;

  let delay: string | null = null;
  if (["initiated", "offer_submitted"].includes(deal.status) && ageDays > 14) {
    bottlenecks.push("Deal has been in an early stage for more than two weeks without closing.");
    suggestedActions.push("Schedule a broker check-in and confirm counterparty next steps in writing.");
    delay = `~${Math.floor(ageDays)} days in early stage — confirm next milestones.`;
  }
  if (deal.status !== "closed" && deal.status !== "cancelled") {
    if (!crmStage || crmStage === "negotiation") {
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
  } else if (deal.status === "initiated" || crmStage === "negotiation") {
    progressScore = 0.45;
  }

  const riskFlags = bottlenecks.filter((b) => !b.startsWith("No automatic bottlenecks"));
  const stagnationWarnings = [
    ...(delay ? [delay] : []),
    ...bottlenecks.filter((b) => /early stage|two weeks|quiet/i.test(b)),
  ];
  const uniqueStagnation = [...new Set(stagnationWarnings)];

  return {
    dealId: deal.id,
    status: deal.status,
    crmStage,
    progressScore,
    bottlenecks,
    suggestedActions,
    risk: bottlenecks,
    riskFlags,
    delay,
    stagnationWarnings: uniqueStagnation,
    suggestion: suggestedActions,
  };
}

function scheduleProgressMemoryWrite(deal: DealProgressDealInput, insight: DealProgressInsight): void {
  const ctx: PlaybookComparableContext = {
    domain: "DEALS",
    entityType: "deal",
    entityId: deal.id,
    segment: { source: "crm_deal_intelligence" },
    signals: { status: deal.status, crmStage: insight.crmStage, progressScore: insight.progressScore },
  };
  void playbookMemoryWriteService
    .recordDecision({
      source: "SYSTEM",
      triggerEvent: "crm.deal.progress_evaluated",
      actionType: "crm_deal_progress_insight",
      dealId: deal.id,
      brokerId: deal.brokerId ?? undefined,
      context: ctx,
      actionPayload: {
        progressScore: insight.progressScore,
        bottlenecks: insight.bottlenecks,
        suggestedActions: insight.suggestedActions.slice(0, 6),
      },
      idempotencyKey: `crm_deal_progress_insight:${deal.id}`,
    })
    .catch((e) => {
      playbookLog.warn("deal progress memory skipped", {
        message: e instanceof Error ? e.message : String(e),
      });
    });
}

/**
 * Rule-based deal pipeline insight. Pass a `deal` snapshot to skip DB fetch.
 * No financial/legal execution. Never throws.
 */
export async function evaluateDealProgress(dealOrId: string | DealProgressDealInput): Promise<DealProgressInsight | null> {
  try {
    if (typeof dealOrId === "object" && dealOrId !== null && "id" in dealOrId) {
      const d = dealOrId;
      if (!d.id?.trim()) {
        return null;
      }
      if (!(d.createdAt instanceof Date) || !(d.updatedAt instanceof Date)) {
        return evaluateDealProgress(d.id);
      }
      const insight = buildInsightFromDeal(d);
      scheduleProgressMemoryWrite(d, insight);
      return insight;
    }

    const dealId = dealOrId.trim();
    if (!dealId) {
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
      },
    });
    if (!deal) {
      return null;
    }
    const snapshot: DealProgressDealInput = {
      id: deal.id,
      status: deal.status,
      crmStage: deal.crmStage,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      brokerId: deal.brokerId,
    };
    const insight = buildInsightFromDeal(snapshot);
    scheduleProgressMemoryWrite(snapshot, insight);
    return insight;
  } catch (e) {
    playbookLog.warn("evaluateDealProgress", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
