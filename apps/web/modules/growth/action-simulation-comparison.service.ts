/**
 * Compare two planned actions using the same conservative rubric — no forced winner.
 */

import { buildSimulationBaseline } from "@/modules/growth/action-simulation-baseline.service";
import { simulateActionOutcomeWithBaseline } from "@/modules/growth/action-simulation.service";
import { logSimulationCompare } from "@/modules/growth/action-simulation-monitoring.service";
import type {
  ActionSimulationContext,
  SimulationComparison,
  SimulationConfidence,
  SimulationOutcome,
  SimulationOverall,
  SimulationActionInput,
} from "@/modules/growth/action-simulation.types";

const rankOverall: Record<SimulationOverall, number> = {
  favorable: 4,
  mixed: 3,
  weak: 2,
  insufficient_data: 1,
};

const rankConf: Record<SimulationConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function scoreOutcome(o: SimulationOutcome): number {
  return rankOverall[o.overallRecommendation] * 100 + rankConf[o.overallConfidence];
}

/** If scores within this band on the 0–500-ish scale, declare no winner. */
const TIE_EPS = 45;

export async function compareSimulatedActions(
  actionA: SimulationActionInput,
  actionB: SimulationActionInput,
  context?: ActionSimulationContext,
): Promise<SimulationComparison> {
  const wd = Math.min(
    45,
    Math.max(
      7,
      Math.round((actionA.windowDays + actionB.windowDays) / 2),
    ),
  );
  const ctx: ActionSimulationContext = context ?? { windowDays: wd };

  const baseline = await buildSimulationBaseline(ctx);
  const oa = simulateActionOutcomeWithBaseline(actionA, baseline);
  const ob = simulateActionOutcomeWithBaseline(actionB, baseline);

  const sa = scoreOutcome(oa);
  const sb = scoreOutcome(ob);

  let winner: SimulationComparison["winner"];
  let rationale: string;
  let confidence: SimulationConfidence;

  const bothInsufficient =
    oa.overallRecommendation === "insufficient_data" && ob.overallRecommendation === "insufficient_data";

  if (bothInsufficient) {
    winner = "insufficient_data";
    rationale = "Both simulations lack grounding evidence — expand telemetry or widen the baseline window.";
    confidence = "low";
  } else if (Math.abs(sa - sb) <= TIE_EPS) {
    winner = "none";
    rationale =
      "Signals are directionally similar — neither scenario clearly dominates on modeled upside vs uncertainty.";
    confidence = minConf(oa.overallConfidence, ob.overallConfidence);
  } else if (sa > sb) {
    winner = "actionA";
    rationale = `Action A scores higher on modeled upside vs uncertainty (${oa.overallRecommendation} / ${oa.overallConfidence} vs ${ob.overallRecommendation} / ${ob.overallConfidence}).`;
    confidence = minConf(oa.overallConfidence, ob.overallConfidence);
  } else {
    winner = "actionB";
    rationale = `Action B scores higher on modeled upside vs uncertainty (${ob.overallRecommendation} / ${ob.overallConfidence} vs ${oa.overallRecommendation} / ${oa.overallConfidence}).`;
    confidence = minConf(oa.overallConfidence, ob.overallConfidence);
  }

  void logSimulationCompare(winner, confidence);

  return {
    actionA,
    actionB,
    winner,
    rationale,
    confidence,
  };
}

function minConf(a: SimulationConfidence, b: SimulationConfidence): SimulationConfidence {
  const o = { low: 0, medium: 1, high: 2 };
  return o[a] <= o[b] ? a : b;
}
