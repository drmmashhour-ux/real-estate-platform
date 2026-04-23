import { prisma } from "@/lib/db";

import { listDomainMatrix } from "./autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";
import { getEffectiveDomainMode } from "./autopilot-domain-mode.service";

export type DomainModeRecommendation = {
  domain: LecipmAutopilotDomainId;
  currentMode: FullAutopilotMode;
  recommendedMode: FullAutopilotMode;
  changeUrgency: "low" | "medium" | "high";
  explanation: string;
};

/**
 * Heuristic recommender from recent execution mix (data quality / failure / load).
 */
export async function recommendDomainModes(takePerDomain = 200): Promise<DomainModeRecommendation[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const matrix = listDomainMatrix();
  const out: DomainModeRecommendation[] = [];

  for (const m of matrix) {
    const current = await getEffectiveDomainMode(m.domain);
    const recent = await prisma.lecipmFullAutopilotExecution.findMany({
      where: { domain: m.domain, createdAt: { gte: since } },
      take: takePerDomain,
      orderBy: { createdAt: "desc" },
    });

    const n = recent.length;
    const failed = recent.filter((r) => r.decisionOutcome === "BLOCK").length;
    const auto = recent.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").length;
    const failRate = n === 0 ? 0 : failed / n;
    const queueLoad = recent.filter((r) => r.decisionOutcome === "REQUIRE_APPROVAL").length;

    let recommended: FullAutopilotMode = current;
    let urgency: DomainModeRecommendation["changeUrgency"] = "low";
    let explain = "Within normal parameters for the last 7 days.";

    if (m.riskLevel === "CRITICAL" && current !== "OFF" && current !== "FULL_AUTOPILOT_APPROVAL") {
      recommended = "FULL_AUTOPILOT_APPROVAL";
      urgency = "high";
      explain = "Critical domain — default to approval-gated mode unless policy states otherwise.";
    } else if (failRate > 0.35 && n >= 5) {
      recommended = "ASSIST";
      urgency = "high";
      explain = "High block rate — reduce automatic surface area until root cause is reviewed.";
    } else if (queueLoad > 20) {
      recommended = current === "ASSIST" ? "FULL_AUTOPILOT_APPROVAL" : "ASSIST";
      urgency = "medium";
      explain = "Approval queue pressure — consider shifting mode or hiring more review capacity.";
    } else if (n < 3) {
      recommended = "ASSIST";
      urgency = "low";
      explain = "Low sample of recent events — stay assist-first until data quality improves.";
    }

    if (recommended === current) {
      explain = "No change needed based on 7d mix.";
    }

    out.push({
      domain: m.domain,
      currentMode: current,
      recommendedMode: recommended,
      changeUrgency: urgency,
      explanation: explain,
    });
  }

  return out;
}
