import { CeoDataAggregatorService } from "./ceo-data-aggregator.service";
import { CeoInsightEngine } from "./ceo-insight.engine";
import { CeoDecisionEngine } from "./ceo-decision.engine";
import { CeoRoutingService } from "./ceo-routing.service";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";
import { CeoMemoryContextService } from "./ceo-memory-context.service";

export class CeoScheduler {
  private static COOLDOWN_MINUTES = 60; // 1 hour cooldown between strategic cycles

  static async runCycle() {
    console.log("[ceo] Starting strategic intelligence cycle...");

    try {
      // 1. Cooldown — last successful context build (memory is only written after a successful route).
      const lastRun = await prisma.activityLog.findFirst({
        where: { action: "ceo_context_built" },
        orderBy: { createdAt: "desc" },
      });

      if (lastRun) {
        const diff = (new Date().getTime() - lastRun.createdAt.getTime()) / (1000 * 60);
        if (diff < this.COOLDOWN_MINUTES) {
          console.log(`[ceo] Cycle skipped. Cooldown active (${Math.round(this.COOLDOWN_MINUTES - diff)}m remaining).`);
          return;
        }
      }

      // 2. Build Context
      const context = await CeoDataAggregatorService.buildCeoContext();
      const fingerprint = CeoMemoryContextService.buildCeoContextFingerprint(context);
      await logActivity({ action: "ceo_context_built", metadata: { timestamp: context.timestamp, fingerprint } });
      console.log("[ceo] Context built successfully.");

      // 3. Generate Insights
      const insights = CeoInsightEngine.generateCeoInsights(context);
      await logActivity({ action: "ceo_insights_generated", metadata: { count: insights.length } });
      console.log(`[ceo] Generated ${insights.length} insights.`);

      if (insights.length === 0) {
        console.log("[ceo] No significant insights detected. Cycle complete.");
        return;
      }

      // 4. Generate Decisions
      const decisions = await CeoDecisionEngine.generateCeoDecisions(insights, context);
      await logActivity({ action: "ceo_decisions_generated", metadata: { count: decisions.length } });
      console.log(`[ceo] Generated ${decisions.length} strategic decisions.`);

      if (decisions.length === 0) {
        console.log("[ceo] No high-confidence decisions generated. Cycle complete.");
        return;
      }

      // 5–6. Route to systems; memory is recorded only after a successful route.
      await CeoRoutingService.routeCeoDecisions(decisions, context, fingerprint);
      await logActivity({ action: "ceo_decisions_routed", metadata: { count: decisions.length } });

      console.log("[ceo] Strategic intelligence cycle completed successfully.");
    } catch (error) {
      console.error("[ceo] Cycle failed:", error);
    }
  }
}
