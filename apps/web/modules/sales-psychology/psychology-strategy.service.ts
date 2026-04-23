import type { ClientPsychologicalState, DecisionStage, PsychologyStrategy } from "./psychology.types";

export type StrategyKey =
  | "reduce_claims_proof_questions"
  | "agree_decompress_reframe"
  | "teach_then_bridge"
  | "tighten_next_step"
  | "concise_control_offer"
  | "re_engage_choice";

const STRATEGIES: Record<StrategyKey, PsychologyStrategy> = {
  reduce_claims_proof_questions: {
    title: "Reduce friction — proof + questions",
    bullets: ["Trade claims for observable facts", "Ask one precise question", "Offer a reversible next step"],
  },
  agree_decompress_reframe: {
    title: "Align — lower pressure — reframe",
    bullets: ["Acknowledge their concern in one line", "Slow the pace", "Move to a smaller ask (email / 5 minutes)"],
  },
  teach_then_bridge: {
    title: "Answer briefly — bridge to fit",
    bullets: ["Teach one mechanism", "Tie to their workflow", "Invite them to validate with a demo"],
  },
  tighten_next_step: {
    title: "Convert interest into motion",
    bullets: ["Name the smallest verifiable win", "Propose two times", "Confirm who joins"],
  },
  concise_control_offer: {
    title: "Headline value — offer control",
    bullets: ["Lead with outcome", "Keep under 20 seconds", "Offer an opt-out (“your call”) without stalling"],
  },
  re_engage_choice: {
    title: "Spark ownership",
    bullets: ["Offer a fork (A/B)", "Ask permission for one detail", "Avoid chasing — invite them to choose"],
  },
};

export function strategyKeyForState(state: ClientPsychologicalState): StrategyKey {
  switch (state) {
    case "skeptical":
      return "reduce_claims_proof_questions";
    case "defensive":
      return "agree_decompress_reframe";
    case "curious":
      return "teach_then_bridge";
    case "interested":
      return "tighten_next_step";
    case "dominant":
      return "concise_control_offer";
    case "disengaged":
      return "re_engage_choice";
    default:
      return "reduce_claims_proof_questions";
  }
}

/** Adjust emphasis when buyer stage conflicts with posture (e.g., skeptical but ready). */
export function refineStrategyForStage(key: StrategyKey, stage: DecisionStage): PsychologyStrategy {
  const base = STRATEGIES[key];
  if (stage === "rejecting") {
    return {
      title: `${base.title} · respect exit`,
      bullets: [...base.bullets, "Offer to leave a one-pager — no chase"],
    };
  }
  if (stage === "ready_to_decide" && key !== "tighten_next_step") {
    return {
      title: `${base.title} · lock next step`,
      bullets: [...base.bullets, "Convert to calendar or concrete artifact"],
    };
  }
  return base;
}

export function getPsychologyStrategy(state: ClientPsychologicalState, stage: DecisionStage): {
  key: StrategyKey;
  strategy: PsychologyStrategy;
} {
  const key = strategyKeyForState(state);
  return { key, strategy: refineStrategyForStage(key, stage) };
}
