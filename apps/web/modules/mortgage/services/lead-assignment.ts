import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { RevenueTier } from "@/lib/ai/lead-score";
import { mortgageCreditCostForTier } from "@/lib/ai/lead-score";
import { mortgageDistributionScore } from "@/modules/mortgage/services/distribution-score";
import {
  ensureExpertBillingRow,
  incrementExpertMonthlyLeadAssignment,
  mortgageExpertHasMonthlyCapacity,
  mortgageExpertMonthlyCap,
  mortgageMonthlyUsedAfterRollover,
  mortgageBillingUtcMonthKey,
} from "@/modules/mortgage/services/billing-usage";
import { mortgagePlanTierRank } from "@/modules/mortgage/services/subscription-plans";
import { sendDashboardNotification } from "@/lib/notifications";

export type MortgageLeadAssignResult =
  | { type: "expert"; expertId: string }
  | { type: "marketplace" };

export type AssignMortgageLeadOptions = {
  /** When HIGH, only premium subscription experts are auto-assigned. */
  revenueTier?: RevenueTier;
};

async function atomicClaimExpertSlot(
  tx: Prisma.TransactionClient,
  expertId: string,
  cap: number,
  creditCost: number
): Promise<boolean> {
  const cost = Math.max(0, Math.min(20, creditCost));
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    UPDATE "mortgage_experts" AS me
    SET "current_leads_today" = me."current_leads_today" + 1
    WHERE me."id" = ${expertId}
      AND me."is_active" = true
      AND me."accepted_terms" = true
      AND me."is_available" = true
      AND me."current_leads_today" < ${cap}
      AND (
        NOT EXISTS (SELECT 1 FROM "expert_credits" ec WHERE ec."expert_id" = me."id")
        OR EXISTS (
          SELECT 1 FROM "expert_credits" ec
          WHERE ec."expert_id" = me."id" AND ec."credits" >= ${cost}
        )
      )
    RETURNING me."id"
  `;
  return rows.length > 0;
}

async function revertDailySlotClaim(tx: Prisma.TransactionClient, expertId: string) {
  await tx.$executeRaw`
    UPDATE "mortgage_experts" SET "current_leads_today" = GREATEST("current_leads_today" - 1, 0)
    WHERE "id" = ${expertId}
  `;
}

async function maybeDecrementLeadCredits(tx: Prisma.TransactionClient, expertId: string, cost: number) {
  const c = Math.max(0, Math.min(20, cost));
  if (c <= 0) return;
  const before = await tx.expertCredits.findUnique({ where: { expertId } });
  if (!before) return;
  await tx.$executeRaw`
    UPDATE "expert_credits"
    SET "credits" = "credits" - ${c}
    WHERE "expert_id" = ${expertId} AND "credits" >= ${c}
  `;
  const after = await tx.expertCredits.findUnique({ where: { expertId } });
  if (after && after.credits === 0) {
    void sendDashboardNotification({
      mortgageExpertId: expertId,
      kind: "credits_exhausted",
      title: "Lead credits exhausted",
      body: "You have 0 pay-per-lead credits. Purchase more credits or upgrade your plan — new leads are paused until credits are restored.",
    });
  }
}

/**
 * Smart distribution: availability, daily cap, monthly cap, credits, plan priority, ranking score, load, random tie-break.
 * Falls back to marketplace when no slot can be claimed.
 */
export async function assignMortgageExpertForNewLead(
  opts: AssignMortgageLeadOptions = {}
): Promise<MortgageLeadAssignResult> {
  const revenueTier: RevenueTier = opts.revenueTier ?? "MEDIUM";
  const creditCost = mortgageCreditCostForTier(revenueTier);
  const monthKey = mortgageBillingUtcMonthKey();
  return prisma.$transaction(
    async (tx) => {
      const experts = await tx.mortgageExpert.findMany({
        where: {
          isActive: true,
          acceptedTerms: true,
          isAvailable: true,
          expertVerificationStatus: "verified",
        },
        include: { expertSubscription: true, expertCredits: true, expertBilling: true },
      });

      for (const e of experts) {
        await ensureExpertBillingRow(tx, e.id);
      }

      type Cand = {
        id: string;
        cap: number;
        score: number;
        leadsToday: number;
        tierRank: number;
        planName: string;
      };
      const candidates: Cand[] = [];

      for (const e of experts) {
        const sub = e.expertSubscription;
        const cap = sub?.isActive ? sub.maxLeadsPerDay : e.maxLeadsPerDay;
        const priorityWeight = sub?.isActive ? sub.priorityWeight : 0;
        const planName = sub?.isActive ? sub.plan : "basic";

        const pn = planName.toLowerCase().trim();
        if (revenueTier === "HIGH" && pn !== "premium" && pn !== "ambassador") continue;

        if (e.expertCredits) {
          if (e.expertCredits.credits < creditCost) continue;
        }

        if (e.currentLeadsToday >= cap) continue;

        const billing = await tx.expertBilling.findUnique({ where: { expertId: e.id } });
        if (!mortgageExpertHasMonthlyCapacity(e, billing, monthKey)) continue;

        const score = mortgageDistributionScore({
          rating: e.rating,
          adminRatingBoost: e.adminRatingBoost,
          totalDeals: e.totalDeals,
          priorityWeight,
          reviewCount: e.reviewCount,
        });
        candidates.push({
          id: e.id,
          cap,
          score,
          leadsToday: e.currentLeadsToday,
          tierRank: mortgagePlanTierRank(planName),
          planName,
        });
      }

      candidates.sort((a, b) => {
        if (b.tierRank !== a.tierRank) return b.tierRank - a.tierRank;
        if (b.score !== a.score) return b.score - a.score;
        if (a.leadsToday !== b.leadsToday) return a.leadsToday - b.leadsToday;
        return Math.random() - 0.5;
      });

      for (const c of candidates) {
        const expertRow = experts.find((x) => x.id === c.id);
        if (!expertRow) continue;
        const monthCap = mortgageExpertMonthlyCap(expertRow);
        const billing = await tx.expertBilling.findUnique({ where: { expertId: c.id } });
        const { used } = mortgageMonthlyUsedAfterRollover(billing, monthKey);
        if (monthCap >= 0 && used >= monthCap) continue;

        const ok = await atomicClaimExpertSlot(tx, c.id, c.cap, creditCost);
        if (!ok) continue;

        const inc = await incrementExpertMonthlyLeadAssignment(tx, c.id, monthCap);
        if (!inc) {
          await revertDailySlotClaim(tx, c.id);
          continue;
        }

        await maybeDecrementLeadCredits(tx, c.id, creditCost);
        return { type: "expert", expertId: c.id };
      }

      return { type: "marketplace" };
    },
    { isolationLevel: "Serializable", maxWait: 5000, timeout: 15_000 }
  );
}

/** Effective daily cap (subscription overrides profile default when active). */
export function mortgageExpertDailyCap(e: {
  maxLeadsPerDay: number;
  expertSubscription: { isActive: boolean; maxLeadsPerDay: number } | null;
}): number {
  const sub = e.expertSubscription;
  return sub?.isActive ? sub.maxLeadsPerDay : e.maxLeadsPerDay;
}

/** Claim one lead slot for an expert (e.g. marketplace claim). Returns false if cap/credits/monthly block. */
export async function tryAssignSlotAndDecrementCredits(
  tx: Prisma.TransactionClient,
  expertId: string,
  cap: number,
  monthCap: number,
  creditCost = 1
): Promise<boolean> {
  const cost = Math.max(0, Math.min(20, creditCost));
  await ensureExpertBillingRow(tx, expertId);
  const ok = await atomicClaimExpertSlot(tx, expertId, cap, cost);
  if (!ok) return false;
  const inc = await incrementExpertMonthlyLeadAssignment(tx, expertId, monthCap);
  if (!inc) {
    await revertDailySlotClaim(tx, expertId);
    return false;
  }
  await maybeDecrementLeadCredits(tx, expertId, cost);
  return true;
}

/** @deprecated Use assignMortgageExpertForNewLead — kept for legacy imports. */
export async function pickAssignableMortgageExpertId(): Promise<string | null> {
  const r = await assignMortgageExpertForNewLead();
  return r.type === "expert" ? r.expertId : null;
}
