import { CeoAggregationService } from "./ceo-aggregation.service";
import { CeoPerformanceEngine } from "./engines/ceo-performance.engine";
import { CeoGrowthEngine } from "./engines/ceo-growth.engine";
import { CeoRiskEngine } from "./engines/ceo-risk.engine";
import { CeoOpportunityEngine } from "./engines/ceo-opportunity.engine";
import { CeoStrategyEngine } from "./engines/ceo-strategy.engine";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export class CeoCommandService {
  /**
   * Generates a complete strategic snapshot for the CEO.
   */
  static async generateStrategicSnapshot(period: "DAILY" | "WEEKLY" | "MONTHLY" = "WEEKLY") {
    console.log(`[ceo-ai] Generating ${period} strategic snapshot...`);

    // 1. Data Aggregation
    const rawData = await CeoAggregationService.aggregatePlatformData();
    console.log("[ceo-ai] Data aggregation complete.");

    // 2. Engines Analysis
    const performance = CeoPerformanceEngine.analyze(rawData);
    const growth = CeoGrowthEngine.analyze(rawData);
    const risk = CeoRiskEngine.analyze(rawData);
    const opportunity = CeoOpportunityEngine.analyze(rawData);

    // 3. Strategy Synthesis
    const recommendations = CeoStrategyEngine.generateRecommendations({
      performance,
      growth,
      risk,
      opportunity
    });

    // 4. Persistence
    const allInsights = [
      ...performance.insights,
      ...growth.insights,
      ...risk.insights,
      ...opportunity.insights
    ];

    // Create Snapshot
    const snapshot = await prisma.ceoSnapshot.create({
      data: {
        period,
        summaryJson: {
          performanceScore: performance.performanceScore,
          growthIndex: growth.growthIndex,
          riskLevel: risk.riskLevel,
          insightCount: allInsights.length
        } as any,
        performanceJson: performance as any,
        growthJson: growth as any,
        riskJson: risk as any,
        opportunitiesJson: opportunity as any,
        recommendationsJson: recommendations as any,
      }
    });

    // Create Insights
    for (const insight of allInsights) {
      await prisma.ceoInsight.create({
        data: {
          category: insight.category,
          title: insight.title,
          description: insight.description,
          impactScore: insight.impactScore,
          confidenceScore: insight.confidenceScore,
          supportingDataJson: insight.supportingDataJson as any,
        }
      });
    }

    // Create Recommendation Records
    for (const rec of recommendations) {
      await prisma.ceoDecisionRecommendation.create({
        data: {
          type: rec.type,
          targetType: rec.targetType,
          rationaleJson: rec.rationaleJson as any,
          expectedImpactJson: rec.expectedImpactJson as any,
          priorityScore: rec.priorityScore,
        }
      });
    }

    await logActivity({ action: "ceo_snapshot_generated", metadata: { snapshotId: snapshot.id, period } });
    console.log(`[ceo-ai] Snapshot ${snapshot.id} generated successfully.`);

    return snapshot;
  }
}
