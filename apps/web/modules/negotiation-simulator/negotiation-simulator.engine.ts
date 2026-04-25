import { selectBestNegotiationApproaches } from "./approach-selector.engine";
import { computeMomentumRisk } from "./momentum-risk.engine";
import { negSimLog } from "./negotiation-simulator-logger";
import type { NegotiationSimulatorContext, NegotiationSimulatorOutput } from "./negotiation-simulator.types";
import { forecastObjectionPath } from "./objection-path.engine";
import { simulateAllApproaches } from "./approach-simulation.engine";

/**
 * One-shot negotiation simulation: scenarios + coaching, not predictions or auto actions.
 */
export function runNegotiationSimulator(
  context: NegotiationSimulatorContext
): NegotiationSimulatorOutput {
  const momentumRisk = computeMomentumRisk(context);
  negSimLog.momentumRisk({ level: momentumRisk.level, dealId: context.dealId });
  const objectionForecast = forecastObjectionPath(context);
  negSimLog.objectionPath({ n: objectionForecast.likelyObjections.length, dealId: context.dealId });
  const scenarios = simulateAllApproaches(context);
  const { safestApproach, highestUpsideApproach } = selectBestNegotiationApproaches(
    scenarios,
    momentumRisk,
    context
  );
  const coachNotes = buildCoachNotes(
    context,
    scenarios,
    momentumRisk,
    safestApproach,
    highestUpsideApproach
  );
  const out: NegotiationSimulatorOutput = {
    scenarios,
    safestApproach,
    highestUpsideApproach,
    momentumRisk,
    objectionForecast,
    coachNotes,
  };
  negSimLog.run({ dealId: context.dealId, nScenarios: scenarios.length, safestApproach, highestUpsideApproach });
  return out;
}

function buildCoachNotes(
  _ctx: NegotiationSimulatorContext,
  scenarios: NegotiationSimulatorOutput["scenarios"],
  momentum: NegotiationSimulatorOutput["momentumRisk"],
  safest: string | null,
  upside: string | null
): string[] {
  const n: string[] = [];
  const firm = scenarios.find((s) => s.approachKey === "firm_follow_up");
  const objf = scenarios.find((s) => s.approachKey === "objection_first");
  const offerD = scenarios.find((s) => s.approachKey === "offer_discussion_now");

  if (offerD?.expectedOutcome === "pushback_risk" && (objf || firm)) {
    n.push("A direct offer discussion push in this read looks early for some clients; objection-first may be a lower-friction first move — scenario only.");
  }
  if (momentum.level === "high" && scenarios.find((s) => s.approachKey === "timing_pause" && s.expectedOutcome === "stall_risk")) {
    n.push("Waiting may increase momentum loss when competition or comparison risk is in play; a pause can still be valid for relationship reasons — you weigh the tradeoff.");
  }
  if (upside && upside === "value_reinforcement") {
    n.push("Value reinforcement followed by offer discussion appears strongest in some similar scenarios — you still lead; not a claim about this client.");
  }
  if (saferHint(safest) && !n.length) {
    n.push("Compare scenarios below; the labeled safest and highest-upside are heuristics, not assurances. Adapt to what you know about the client.");
  } else if (!n.length) {
    n.push("This output is a coaching map: use scenarios to rehearse possible paths and your framing — not a forecast of a done deal.");
  }
  n.push("These are scenario-based ideas for discussion with your client, not financial or legal advice, and not automatic actions.");
  return n.slice(0, 5);
}

function saferHint(s: string | null): boolean {
  return s === "objection_first" || s === "soft_follow_up" || s === "value_reinforcement";
}
