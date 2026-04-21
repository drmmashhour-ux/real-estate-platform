import type { GreenImprovement } from "./green.types";
import { esgUpgradeLog } from "./green-logger";

export type UpgradeAdvisorStep = {
  order: number;
  title: string;
  detail: string;
};

/**
 * Turns raw improvements into a sequenced retrofit narrative (envelope → mechanicals → renewables).
 */
export function buildUpgradeAdvisorSteps(improvements: GreenImprovement[]): UpgradeAdvisorStep[] {
  const priority = [...improvements].sort((a, b) => {
    const w = (i: GreenImprovement) => (i.impact === "HIGH" ? 3 : i.impact === "MEDIUM" ? 2 : 1);
    return w(b) - w(a) || b.expectedGainPoints - a.expectedGainPoints;
  });

  const steps: UpgradeAdvisorStep[] = priority.map((imp, idx) => ({
    order: idx + 1,
    title: imp.action,
    detail: `${imp.impact} impact · ~+${imp.expectedGainPoints} pts internal score · ${imp.estimatedCostLabel}`,
  }));

  esgUpgradeLog.info("advisor_steps_built", { count: steps.length });
  return steps;
}
