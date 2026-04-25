import { negSimLog } from "./negotiation-simulator-logger";
import type {
  NegotiationApproach,
  NegotiationApproachKey,
  NegotiationScenario,
  NegotiationSimulatorContext,
} from "./negotiation-simulator.types";

const APPROACHES: NegotiationApproach[] = [
  {
    key: "soft_follow_up",
    title: "Soft follow-up",
    description: "Gentle check-in without pressure; good when rapport matters more than speed.",
  },
  {
    key: "firm_follow_up",
    title: "Firm follow-up",
    description: "Clear, direct nudge on the next step; can feel strong if blockers or readiness are weak.",
  },
  {
    key: "value_reinforcement",
    title: "Value reinforcement",
    description: "Lead with why this option fits; supports when price or fit is uncertain.",
  },
  {
    key: "objection_first",
    title: "Objection-first",
    description: "Name or invite concerns before moving forward; can defuse if medium readiness and clear frictions exist.",
  },
  {
    key: "timing_pause",
    title: "Timing pause",
    description: "Slower cadence, nurture tone; can reduce pushback or increase stall if competition is high.",
  },
  {
    key: "visit_push",
    title: "Visit push",
    description: "Prioritize a viewing or in-person next step; fits when visit is not yet completed.",
  },
  {
    key: "offer_discussion_now",
    title: "Offer discussion now",
    description: "Frame an explicit, low-pressure offer discussion; best when readiness and financing support it.",
  },
];

export const NEGOTIATION_APPROACH_CATALOG: readonly NegotiationApproach[] = APPROACHES;

function readinessAvg(ctx: NegotiationSimulatorContext): number {
  const a = ctx.offerReadinessScore;
  const b = ctx.closingReadinessScore;
  if (typeof a === "number" && typeof b === "number") return Math.max(0, Math.min(1, (a + b) / 2));
  if (typeof a === "number") return Math.max(0, Math.min(1, a));
  if (typeof b === "number") return Math.max(0, Math.min(1, b));
  return 0.45;
}

function blockerHeaviness(ctx: NegotiationSimulatorContext): "low" | "medium" | "high" {
  const b = ctx.blockers;
  const n = Array.isArray(b) ? b.length : 0;
  if (n >= 3) return "high";
  if (n >= 1) return "medium";
  return "low";
}

function simulateOne(
  ctx: NegotiationSimulatorContext,
  key: NegotiationApproachKey
): NegotiationScenario {
  const r = readinessAvg(ctx);
  const bh = blockerHeaviness(ctx);
  const fin = ctx.financingReadiness ?? "unknown";
  const comp = ctx.competitiveRisk ?? "low";
  const visitDone = ctx.visitCompleted === true;
  const weak = r < 0.4;

  const rationale: string[] = [];
  const objectionPath: string[] = [];
  let expected: NegotiationScenario["expectedOutcome"] = "neutral_progress";
  let confidence = 0.5;
  let next = "Align on one concrete next action and confirm the client is comfortable with the pace.";

  if (key === "firm_follow_up") {
    if (weak && (bh === "high" || bh === "medium")) {
      expected = "pushback_risk";
      confidence = 0.6;
      rationale.push("Firm follow-up with weak combined readiness and meaningful blockers may feel rushed.");
      objectionPath.push("Timing, trust, or fit concerns may surface.");
      next = "If you follow up, pair firmness with one clear question to reduce perceived pressure.";
    } else if (r >= 0.55 && comp !== "high") {
      expected = "positive_progress";
      confidence = 0.55;
      rationale.push("With adequate readiness, a direct follow-up on the next step can unlock movement.");
    } else {
      expected = "neutral_progress";
      confidence = 0.5;
      rationale.push("Mixed signals; a firm nudge is scenario-dependent.");
    }
  } else if (key === "objection_first") {
    if (r >= 0.35 && bh !== "low") {
      expected = "positive_progress";
      confidence = 0.58;
      rationale.push("Medium readiness with visible frictions: inviting concerns first can improve alignment (scenario-based, not a guarantee).");
      objectionPath.push("Known themes may be aired earlier, which you can then address in order of importance.");
    } else if (weak) {
      expected = "stall_risk";
      confidence = 0.5;
      rationale.push("Objection-first with very low readiness may lack enough hook for a forward step.");
    } else {
      expected = "neutral_progress";
      confidence = 0.52;
      rationale.push("Objection-first can be steady when blockers are unclearly articulated.");
    }
  } else if (key === "timing_pause") {
    if (comp === "high") {
      expected = "stall_risk";
      confidence = 0.56;
      rationale.push("A pause in cadence with high competition or comparison risk may reduce relative momentum.");
    } else {
      expected = "neutral_progress";
      confidence = 0.5;
      rationale.push("A slower cadence can feel respectful when the client is overwhelmed, but watch for drift.");
    }
  } else if (key === "visit_push") {
    if (!visitDone) {
      expected = "positive_progress";
      confidence = 0.55;
      rationale.push("Without a visit (or clear substitute), a concrete viewing step often clarifies property fit in many scenarios.");
      next = "Propose specific times or a short on-site or virtual option if you use one.";
    } else {
      expected = "neutral_progress";
      confidence = 0.45;
      rationale.push("Visit already in place; a pure visit-push may be redundant; pivot to the next unmet need.");
    }
  } else if (key === "offer_discussion_now") {
    if (r >= 0.6 && visitDone && (fin === "strong" || fin === "medium")) {
      expected = "positive_progress";
      confidence = 0.6;
      rationale.push("In this simulated read, readiness is relatively strong, visit is done, and financing is not weak — an offer *discussion* (not a commitment) can fit.");
    } else if (weak || fin === "weak") {
      expected = "pushback_risk";
      confidence = 0.58;
      rationale.push("Offer discussion with weak readiness or weak financing in the data may trigger resistance; value or objection paths may be safer to explore first.");
    } else {
      expected = "neutral_progress";
      confidence = 0.5;
      rationale.push("Conditions are mixed; a light offer framing may work if tied to the client’s stated next concern.");
    }
  } else if (key === "value_reinforcement") {
    if (ctx.priceSensitivity === "high" || !visitDone) {
      expected = "positive_progress";
      confidence = 0.55;
      rationale.push("Reinforcing fit and value is often a sensible next move when price sensitivity is high or property fit is unconfirmed.");
      objectionPath.push("Price, comparables, or scope questions may still appear — be ready to re-anchor on fit.");
    } else {
      expected = "neutral_progress";
      confidence = 0.48;
      rationale.push("Value reinforcement remains useful but may be duplicative if fit is already well established in your notes.");
    }
  } else {
    // soft_follow_up
    if (r < 0.3 && (ctx.engagementScore ?? 0.5) < 0.4) {
      expected = "stall_risk";
      confidence = 0.48;
      rationale.push("A very soft touch with low engagement may not create forward motion in some scenarios.");
    } else {
      expected = "neutral_progress";
      confidence = 0.5;
      rationale.push("A soft follow-up limits friction and preserves relationship; progress may be incremental.");
    }
  }

  if (rationale.length < 1) {
    rationale.push("Heuristic only — this scenario is a coaching lens, not an outcome guarantee.");
  }
  confidence = Math.max(0.2, Math.min(0.85, confidence));
  const s = {
    approachKey: key,
    expectedOutcome: expected,
    confidence: Math.round(confidence * 100) / 100,
    rationale: rationale.slice(0, 5),
    likelyNextStep: next,
    likelyObjectionPath: objectionPath,
  } satisfies NegotiationScenario;
  negSimLog.approachSim({ approach: key, expected, confidence: s.confidence });
  return s;
}

const KEYS: NegotiationApproachKey[] = [
  "soft_follow_up",
  "firm_follow_up",
  "value_reinforcement",
  "objection_first",
  "timing_pause",
  "visit_push",
  "offer_discussion_now",
];

export function simulateNegotiationApproach(
  context: NegotiationSimulatorContext,
  approach: NegotiationApproachKey
): NegotiationScenario {
  return simulateOne(context, approach);
}

/**
 * Produces one scenario per supported key — deterministic, explainable.
 */
export function simulateAllApproaches(
  context: NegotiationSimulatorContext
): NegotiationScenario[] {
  return KEYS.map((k) => simulateOne(context, k));
}
