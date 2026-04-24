import { buildCeoContext } from "./ceo-data-aggregator.service";
import { generateCeoInsights } from "./ceo-insight.engine";
import { generateCeoDecisions } from "./ceo-decision.engine";
import { routeCeoDecisions } from "./ceo-routing.service";
import { prisma } from "@/lib/db";

/**
 * PHASE 6: SCHEDULER
 * Orchestrates the full CEO cycle: context -> insights -> decisions -> route.
 */
export async function runCeoCycle() {
  console.log("[ceo] Starting strategic cycle...");

  // 1. Build context
  const context = await buildCeoContext();
  console.log("[ceo] context_built");

  // 2. Generate insights
  const insights = generateCeoInsights(context);
  console.log(`[ceo] insights_generated: ${insights.length}`);
  
  // Persist insights for dashboard
  for (const insight of insights) {
    await prisma.ceoInsight.create({
      data: {
        type: insight.type,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
      }
    });
  }

  // 3. Generate decisions
  const decisions = generateCeoDecisions(insights, context);
  console.log(`[ceo] decisions_generated: ${decisions.length}`);

  // 4. Route decisions
  const routedIds = await routeCeoDecisions(decisions);
  console.log(`[ceo] decisions_routed: ${routedIds.length}`);

  // 5. Create strategy snapshot
  await prisma.ceoStrategySnapshot.create({
    data: {
      summaryJson: {
        insightsCount: insights.length,
        decisionsCount: decisions.length,
        routedCount: routedIds.length,
      } as any,
      keyMetricsJson: context as any,
    }
  });

  console.log("[ceo] Strategic cycle complete.");
  return {
    insights: insights.length,
    decisions: decisions.length,
    routed: routedIds.length,
  };
}
