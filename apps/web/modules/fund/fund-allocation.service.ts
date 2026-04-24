import { prisma } from "@/lib/db";
import { InvestmentFundStatus, InvestmentFundMode, Prisma } from "@prisma/client";
import { logActivity } from "@/lib/audit/activity-log";
import { allocateBudgetAcrossCandidates } from "@/modules/capital-allocator/capital-budget-engine.service";
import type { ListingAllocationMetrics, AllocationCandidate } from "@/modules/capital-allocator/capital-allocator.types";

/**
 * PHASE 3: ALLOCATION ENGINE INTEGRATION
 * Automatically allocates fund capital to eligible AMF deals.
 */
export class FundAllocationService {
  /**
   * Runs the autonomous allocation for a specific fund.
   */
  static async runFundAllocation(fundId: string, actorUserId: string = "system") {
    // 1. Guard: prevent duplicate allocation run within short window (5 mins)
    const recentAllocation = await prisma.fundAllocation.findFirst({
      where: {
        fundId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });
    if (recentAllocation) {
      throw new Error("Allocation run already performed recently. Please wait.");
    }

    // 2. Load fund
    const fund = await prisma.investmentFund.findUnique({
      where: { id: fundId },
    });

    if (!fund || fund.status !== InvestmentFundStatus.ACTIVE) {
      throw new Error("Fund not found or not active.");
    }

    const availableBudget = fund.availableCapital.toNumber();
    if (availableBudget <= 0) {
      throw new Error("No available capital to allocate.");
    }

    // 3. Fetch eligible deals (exclude AVOID - status-based for now)
    const eligibleDeals = await prisma.amfCapitalDeal.findMany({
      where: {
        status: { notIn: ["PAUSED", "CLOSED", "AVOID"] },
      },
      include: {
        listing: {
          select: { title: true }
        }
      },
      take: 20,
    });

    if (eligibleDeals.length === 0) {
      throw new Error("No eligible deals found for allocation.");
    }

    // 4. Map deals to candidates for the allocation engine
    // Since we don't have historical performance for new deals, we use basic heuristics
    const candidates: AllocationCandidate[] = eligibleDeals.map((deal) => ({
      listingId: deal.id,
      listingTitle: deal.title || deal.listing?.title || "Untitled Deal",
      allocationType: "growth",
      priorityScore: 0.5, // Default medium priority
      expectedImpactScore: 0.7, // Default target
      confidenceScore: 0.6,
      recommendedAmount: availableBudget * 0.4, // Max 40% per deal
      rationale: ["Automated fund allocation based on eligibility rules."],
      metrics: {
        listingId: deal.id,
        listingTitle: deal.title,
        grossRevenue: 0,
        occupancyRate: 0,
        adr: 0,
        revpar: 0,
        bookingCount: 0,
        recommendation: null,
        recommendationScore: null,
        recommendationConfidence: null,
        upliftScore: null,
        pricingActionSuccess: null,
        operatingCostMonthly: null,
        improvementBudgetNeed: null,
        marketingBudgetNeed: null,
        operationalRiskScore: null,
        manualCapitalLock: false,
      }
    }));

    // 5. Run allocation
    const result = allocateBudgetAcrossCandidates({
      totalBudget: availableBudget,
      reservePct: 0.1, // 10% reserve
      candidates,
    });

    const actorId = actorUserId === "system" ? null : actorUserId;

    // 6. Store allocations and update fund capital in a transaction
    return await prisma.$transaction(async (tx) => {
      let totalAllocated = new Prisma.Decimal(0);

      for (const item of result.items) {
        if (item.allocatedAmount <= 0) continue;

        const allocatedDecimal = new Prisma.Decimal(item.allocatedAmount);
        totalAllocated = totalAllocated.plus(allocatedDecimal);

        await tx.fundAllocation.create({
          data: {
            fundId,
            dealId: item.listingId,
            allocatedAmount: allocatedDecimal,
            allocationPercent: item.allocatedAmount / availableBudget,
            rationaleJson: {
              reasoning: item.rationale.join(" "),
              confidence: item.confidenceScore,
              allocationType: item.allocationType,
              disclaimer: "FUND-ALLOCATION-DISCLAIMER: Autonomous capital allocation is for simulation and does not guarantee financial performance.",
            } as any,
          },
        });
      }

      // Update fund capital fields
      const updatedFund = await tx.investmentFund.update({
        where: { id: fundId },
        data: {
          allocatedCapital: { increment: totalAllocated },
          availableCapital: { decrement: totalAllocated },
        },
      });

      // 7. Log Activity
      await logActivity({
        userId: actorId,
        action: "fund_allocation_executed",
        entityType: "InvestmentFund",
        entityId: fundId,
        metadata: {
          allocatedAmount: totalAllocated.toNumber(),
          availableRemaining: updatedFund.availableCapital.toNumber(),
          dealCount: result.items.filter(i => i.allocatedAmount > 0).length,
        },
      });

      return updatedFund;
    });
  }
}
