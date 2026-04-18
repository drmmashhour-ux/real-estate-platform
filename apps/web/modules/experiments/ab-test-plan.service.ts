import { abTestingFlags } from "@/config/feature-flags";
import { analyzeLandingFeedbackLoop } from "@/modules/ads/landing-feedback-loop.service";
import { getAdsPerformanceSummary } from "@/modules/ads/ads-performance.service";
import { runAdsAutomationLoop } from "@/modules/ads/ads-automation-loop.service";

export type ProposedAbTest = {
  title: string;
  objective: string;
  control: string;
  challenger: string;
  targetAudience: string;
  successMetric: string;
  durationDays: number;
  rationale: string;
};

export type NextAbTestPlan = {
  proposedTests: ProposedAbTest[];
  sources: string[];
};

/**
 * Suggests follow-on tests from growth metrics — requires FEATURE_AB_TESTING_AUTONOMOUS_V1 for auto suggestions.
 */
export async function buildNextAbTestPlan(): Promise<NextAbTestPlan> {
  const sources: string[] = [];
  const proposedTests: ProposedAbTest[] = [];

  if (!abTestingFlags.abTestingAutonomousV1) {
    return {
      proposedTests: [],
      sources: ["FEATURE_AB_TESTING_AUTONOMOUS_V1 is off — enable for autonomous suggestions."],
    };
  }

  const perf = await getAdsPerformanceSummary(14, { estimatedSpend: 0 });
  sources.push("growth_events aggregate (14d)");

  const landing = analyzeLandingFeedbackLoop({
    impressions: perf.impressions,
    clicks: perf.clicks,
    leads: perf.leads,
    bookingsCompleted: perf.bookingsCompleted,
  });
  for (const l of landing) {
    if (l.kind === "cta_headline") {
      proposedTests.push({
        title: "Hero headline vs proof-first headline",
        objective: "Increase landing_view → cta_click",
        control: "Current hero (production)",
        challenger: "Proof-first headline variant",
        targetAudience: "Paid landing traffic",
        successMetric: "CTR proxy (cta_click / landing_view)",
        durationDays: 14,
        rationale: l.message,
      });
    }
    if (l.kind === "form_friction") {
      proposedTests.push({
        title: "Short lead form vs full form",
        objective: "Improve click → lead_capture",
        control: "Current form fields",
        challenger: "Minimal email + intent",
        targetAudience: "All LP visitors with assignment cookie",
        successMetric: "Lead rate (leads / clicks)",
        durationDays: 21,
        rationale: l.message,
      });
    }
  }

  try {
    const loop = await runAdsAutomationLoop({ rangeDays: 14 });
    sources.push("ads_automation_loop");
    if (loop.winners.length > 0) {
      proposedTests.push({
        title: `Scale creative angle · ${loop.winners[0]!.campaignKey}`,
        objective: "Validate headline pack from automation loop",
        control: "Baseline ad copy",
        challenger: "Variant pack from loop.newVariants[0]",
        targetAudience: "Same UTM campaign",
        successMetric: loop.optimizations.recommendation.includes("scale") ? "CPL / CTR" : "CTR",
        durationDays: 10,
        rationale: loop.summary,
      });
    }
  } catch {
    sources.push("ads_automation_loop_skipped");
  }

  return { proposedTests, sources };
}
