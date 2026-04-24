import { prisma } from "@/lib/db";
import { CapitalAllocatorEngine } from "./capital-allocator.engine";
import { 
  CapitalAllocationInput, 
  CapitalAllocationPlan, 
  AllocationStrategyMode,
  AllocationConstraints,
  DealAllocationInput
} from "./capital-allocator.types";
import { logActivity } from "@/lib/audit/activity-log";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";

/**
 * PHASE 5 & 8: CAPITAL ALLOCATOR SERVICE
 * High-level service to fetch data, run the allocation engine, and log results.
 */
export class CapitalAllocatorService {
  /**
   * Fetches active deals and generates a capital allocation recommendation.
   */
  static async getRecommendedAllocation(params: {
    totalCapital: number;
    strategyMode?: AllocationStrategyMode;
    userId?: string;
  }): Promise<CapitalAllocationPlan> {
    const { totalCapital, strategyMode = "BALANCED", userId = "system" } = params;

    // 1. Fetch Deals from AMF Capital Deals
    const activeDeals = await prisma.amfCapitalDeal.findMany({
      where: {
        status: { notIn: ["PAUSED", "CLOSED", "AVOID", "REJECTED"] },
      },
      include: {
        listing: {
          select: {
            title: true,
            complianceScore: true,
            esgProfile: {
              select: {
                compositeScore: true,
              }
            }
          }
        },
        investmentPacket: {
          select: {
            underwritingRecommendation: true,
            esgScore: true,
          }
        }
      }
    });

    // 2. Map to Allocation Input Types
    const mappedDeals: DealAllocationInput[] = activeDeals.map(d => ({
      dealId: d.id,
      title: d.title || d.listing?.title || "Untitled Deal",
      underwritingScore: d.investmentPacket?.underwritingRecommendation ? 0.8 : 0.5, // Heuristic if packet exists
      esgScore: d.investmentPacket?.esgScore || (d.listing?.esgProfile?.compositeScore ? (d.listing.esgProfile.compositeScore / 100) : 0.5),
      riskLevel: (d.status === "DILIGENCE" ? "MEDIUM" : "LOW") as any, // Heuristic
      financingAvailability: 0.7, // Default heuristic
      complianceScore: d.listing?.complianceScore ? (d.listing.complianceScore / 100) : 0.8,
      dealStage: d.status,
      region: "Québec", // Default region
      status: d.status,
    }));

    // 3. Define Constraints
    const constraints: AllocationConstraints = {
      maxPerDealPercent: 0.3, // 30% max per deal
      maxPerRegionPercent: 0.5, // 50% max per region
      maxRiskExposure: strategyMode === "CONSERVATIVE" ? "LOW" : "HIGH",
      minDiversificationCount: 3,
    };

    // 4. Run Engine
    const plan = CapitalAllocatorEngine.generateCapitalAllocation({
      deals: mappedDeals,
      totalCapitalAvailable: totalCapital,
      strategyMode,
      constraints,
    });

    // 5. Log Activity [PHASE 10]
    await logActivity({
      userId: userId === "system" ? null : userId,
      action: "allocation_generated",
      entityType: "CapitalAllocation",
      entityId: "plan_" + Date.now(),
      metadata: {
        strategyMode,
        totalCapital,
        allocatedCapital: plan.allocatedCapital,
        dealCount: plan.allocations.length,
        diversificationScore: plan.diversificationScore,
        riskScore: plan.riskScore,
      },
    });

    // 6. Record for Evolution [PHASE 5]
    await recordEvolutionOutcome({
      domain: "CAPITAL",
      strategyKey: "allocation_strategy",
      metricType: "STRATEGY",
      entityType: "AllocationPlan",
      actualJson: {
        strategyMode,
        dealCount: plan.allocations.length,
        allocatedRatio: plan.allocatedCapital / totalCapital,
      },
      reinforceStrategy: true,
    });

    return plan;
  }
}
