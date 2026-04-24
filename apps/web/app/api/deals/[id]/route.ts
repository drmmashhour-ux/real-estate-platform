import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recordDealCrmStageChange } from "@/lib/ai/automation-triggers";
import { hintCrmStageFromDealStatus } from "@/lib/ai/lifecycle/deal-actions";
import { notifyDealClosedCelebrationIfNeeded } from "@/lib/listing-lifecycle/notify-deal-closed-celebration";
import { evaluateDealRisk } from "@/modules/risk-engine/risk-prevention.service";
import { recordCloseProbabilityOutcome } from "@/modules/deal/close-probability-learning.service";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import {
  DealConflictConsentBlockedError,
  assertDealConflictConsentAllowsProgress,
  conflictDisclosureEnforced,
  refreshDealConflictComplianceState,
} from "@/lib/compliance/conflict-deal-compliance.service";

import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withDomainProtection({
    domain: "BROKERAGE",
    action: "MANAGE_PIPELINE",
    entityId: id,
    handler: async (userId) => {
      let deal = await prisma.deal.findFirst({
        where: {
          id,
          OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
        },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
          broker: { select: { id: true, name: true, email: true } },
          milestones: true,
          documents: true,
          payments: true,
        },
      });
      if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (conflictDisclosureEnforced()) {
        await refreshDealConflictComplianceState(id);
        const refreshed = await prisma.deal.findFirst({
          where: {
            id,
            OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
          },
          include: {
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
            broker: { select: { id: true, name: true, email: true } },
            milestones: true,
            documents: true,
            payments: true,
          },
        });
        if (refreshed) deal = refreshed;
      }

      return NextResponse.json(deal);
    }
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withDomainProtection({
    domain: "BROKERAGE",
    action: "NEGOTIATE_DEAL",
    entityId: id,
    handler: async (userId) => {
      const deal = await prisma.deal.findFirst({
        where: {
          id,
          OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
        },
      });
      if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const canUpdate = user?.role === "BROKER" || user?.role === "ADMIN" || userId === deal.brokerId;
      if (!canUpdate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      const status = typeof body.status === "string" ? body.status : undefined;
      const crmStageRaw = typeof body.crmStage === "string" ? body.crmStage : undefined;
      const playbookAssignmentIdRaw =
        typeof body.playbookAssignmentId === "string" ? body.playbookAssignmentId.trim() : "";
      const playbookAssignmentId = playbookAssignmentIdRaw || null;
      const CRM_STAGES = new Set([
        "new",
        "contacted",
        "visit_scheduled",
        "offer_made",
        "negotiation",
        "accepted",
        "closed",
        "lost",
      ]);

      const data: Record<string, unknown> = {};
      if (status && ["initiated", "offer_submitted", "accepted", "inspection", "financing", "closing_scheduled", "closed", "cancelled"].includes(status)) {
        data.status = status;
        const hint = hintCrmStageFromDealStatus(status);
        if (hint && !crmStageRaw) {
          data.crmStage = hint;
        }
      }
      if (crmStageRaw && CRM_STAGES.has(crmStageRaw)) {
        data.crmStage = crmStageRaw;
      }

      if (Object.keys(data).length === 0) {
        return NextResponse.json(deal);
      }

      if (typeof data.status === "string" && data.status !== deal.status && data.status !== "cancelled") {
        try {
          await assertDealConflictConsentAllowsProgress(id);
        } catch (e) {
          if (e instanceof DealConflictConsentBlockedError) {
            return NextResponse.json(
              { error: e.message, code: "CONFLICT_DISCLOSURE_REQUIRED" },
              { status: 409 },
            );
          }
          throw e;
        }
      }

      const prevCrm = deal.crmStage ?? null;
      const prevStatus = deal.status;
      const updated = await prisma.deal.update({
        where: { id },
        data,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
          broker: { select: { id: true, name: true, email: true } },
          milestones: true,
          documents: true,
          payments: true,
        },
      });

      if (updated.status === "closed" && prevStatus !== "closed") {
        void import("@/modules/crm/services/broker-crm-outcome.service").then((m) =>
          m.syncBrokerCrmDealTerminalPlaybookMemory(id).catch(() => {}),
        );
        void notifyDealClosedCelebrationIfNeeded(id).catch(() => {});
        void recordCloseProbabilityOutcome(id, true).catch(() => {});
        // void recordNegotiationStrategyOutcome(id, true).catch(() => {});
        
        void recordEvolutionOutcome({
          domain: "DEAL",
          metricType: "CONVERSION",
          strategyKey: "deal_execution",
          entityId: id,
          entityType: "Deal",
          actualJson: { result: "CLOSED", status: updated.status, crmStage: updated.crmStage },
          reinforceStrategy: true,
          idempotent: true,
        }).catch(() => {});
        void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
          try {
            m.playbookLearningBridge.afterDealClosingComplete({
              dealId: id,
              playbookAssignmentId,
            });
          } catch {
            /* */
          }
        });
      }
      if (updated.status === "cancelled" && prevStatus !== "cancelled") {
        void import("@/modules/crm/services/broker-crm-outcome.service").then((m) =>
          m.syncBrokerCrmDealTerminalPlaybookMemory(id).catch(() => {}),
        );
        void recordCloseProbabilityOutcome(id, false).catch(() => {});

        void recordEvolutionOutcome({
          domain: "DEAL",
          metricType: "CONVERSION",
          strategyKey: "deal_execution",
          entityId: id,
          entityType: "Deal",
          actualJson: { result: "LOST", status: updated.status, crmStage: updated.crmStage },
          reinforceStrategy: true,
          idempotent: true,
        }).catch(() => {});
        void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
          try {
            m.playbookLearningBridge.afterDealClosedLost({
              dealId: id,
              playbookAssignmentId,
              reason: "cancelled",
            });
          } catch {
            /* */
          }
        });
      }

      const newCrm = updated.crmStage ?? null;
      if (newCrm === "lost" && prevCrm !== "lost" && updated.status !== "closed") {
        void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
          try {
            m.playbookLearningBridge.afterDealClosedLost({
              dealId: id,
              playbookAssignmentId,
              reason: "crm_lost",
            });
          } catch {
            /* */
          }
        });
      }

      if (newCrm !== prevCrm && userId) {
        await prisma.crmInteraction
          .create({
            data: {
              dealId: id,
              brokerId: userId,
              type: "stage_change",
              body: `Deal CRM stage: ${prevCrm ?? "unset"} → ${newCrm ?? "unset"}. Legal status: ${updated.status}`,
              metadata: { status: updated.status },
            },
          })
          .catch(() => {});
        await recordDealCrmStageChange({
          brokerId: updated.brokerId,
          dealId: id,
          fromStage: prevCrm,
          toStage: newCrm ?? updated.status,
        }).catch(() => {});
        const dealBrokerId = updated.brokerId;
        if (dealBrokerId) {
          void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) =>
            m
              .recordMarketplaceDealCrmStageSignal(dealBrokerId, {
                dealId: id,
                fromStage: prevCrm,
                toStage: newCrm,
              })
              .catch(() => {}),
          );
        }
      }

      void evaluateDealRisk(id, { triggerPrevention: true }).catch(() => {});

      return NextResponse.json(updated);
    }
  });
}
