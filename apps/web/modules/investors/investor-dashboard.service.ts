/**
 * Composes investor dashboard payload from metrics + deterministic narrative + section layout.
 */

import { gatherInvestorDashboardSignals } from "@/modules/investors/investor-metrics.service";
import { buildInvestorNarrative } from "@/modules/investors/investor-narrative.service";
import type { InvestorDashboard, InvestorSection } from "@/modules/investors/investor-dashboard.types";
import { logInvestorDashboardBuilt } from "@/modules/investors/investor-dashboard-monitoring.service";

function formatMetricsSection(metrics: InvestorDashboard["metrics"]): string {
  return metrics.map((m) => `• ${m.label}: ${m.value}${m.change ? ` (${m.change})` : ""} [${m.confidence}]`).join("\n");
}

export async function buildInvestorDashboard(windowDays = 14): Promise<InvestorDashboard> {
  const generatedAt = new Date().toISOString();

  const { metrics, warnings, missingDataAreas, narrativeInput } = await gatherInvestorDashboardSignals(windowDays);
  const narrative = buildInvestorNarrative(narrativeInput);

  const sections: InvestorSection[] = [
    {
      title: "Key metrics",
      type: "metrics",
      content: formatMetricsSection(metrics),
    },
    {
      title: "Growth narrative",
      type: "narrative",
      content: `${narrative.headline}\n\n${narrative.summary}\n\n${narrative.growthStory.join("\n")}`,
    },
    {
      title: "Execution proof",
      type: "insights",
      content: narrative.executionProof.join("\n"),
    },
    {
      title: "Expansion strategy",
      type: "insights",
      content: narrative.expansionStory.join("\n"),
    },
    {
      title: "Risks & warnings",
      type: "risks",
      content: [...narrative.risks, ...warnings].join("\n"),
    },
    {
      title: "Outlook",
      type: "narrative",
      content: narrative.outlook.join("\n"),
    },
  ];

  void logInvestorDashboardBuilt({
    metricCount: metrics.length,
    sparseBundle: narrativeInput.sparseBundle,
    missingAreas: missingDataAreas.length,
  });

  return {
    metrics,
    sections,
    narrative,
    generatedAt,
    meta: {
      warnings,
      missingDataAreas,
      sparseBundle: narrativeInput.sparseBundle,
    },
  };
}
