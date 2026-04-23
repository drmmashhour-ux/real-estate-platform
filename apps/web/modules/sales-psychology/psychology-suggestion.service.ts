import type {
  ClientPsychologicalState,
  DecisionStage,
  PostCallPsychologyAnalysis,
  PsychologySuggestionBundle,
} from "./psychology.types";
import { detectClientPsychology } from "./psychology-detection.service";
import { getPsychologyStrategy, type StrategyKey } from "./psychology-strategy.service";

const INDICATORS: Record<ClientPsychologicalState, string> = {
  skeptical: "🟡 skeptical",
  defensive: "🔴 defensive",
  curious: "🔵 curious",
  interested: "🟢 interested",
  dominant: "🟣 dominant",
  disengaged: "⚪ disengaged",
};

const EXAMPLES: Record<StrategyKey, string> = {
  reduce_claims_proof_questions:
    "Totally fair — instead of claiming results, I can show you exactly how one lead arrives in your CRM in under two minutes.",
  agree_decompress_reframe:
    "I hear you — if now’s noisy, pick any two times this week and I’ll keep it to five minutes.",
  teach_then_bridge:
    "Quick picture: inbound intent is tagged and routed — want to see that flow on a sample deal?",
  tighten_next_step:
    "Great — I’ll send two slots; reply with the one that fits and I’ll include your ops contact.",
  concise_control_offer:
    "Bottom line: fewer cold touches, clearer handoffs — your call if we spend five minutes on it today.",
  re_engage_choice:
    "Two paths: I send a one-pager you skim tonight, or we do a tight walkthrough tomorrow — which fits?",
};

const AVOID: Record<StrategyKey, string[]> = {
  reduce_claims_proof_questions: ["Guaranteed pipeline lift", "Everyone loves it", "Trust me on this"],
  agree_decompress_reframe: ["You’re wrong", "Just hear me out", "This will change your life"],
  teach_then_bridge: ["Our AI is revolutionary", "You wouldn’t understand yet"],
  tighten_next_step: ["Whenever you’re free", "No rush", "Maybe someday"],
  concise_control_offer: ["Let me explain the whole history", "There are fourteen features…"],
  re_engage_choice: ["Are you even listening?", "You need this"],
};

const STYLE: Record<StrategyKey, string> = {
  reduce_claims_proof_questions: "Measured, proof-first, one clarifying question.",
  agree_decompress_reframe: "Warm alignment, slower tempo, smaller ask.",
  teach_then_bridge: "Concrete mechanism, tie to their workflow.",
  tighten_next_step: "Specific times, roles, artifact.",
  concise_control_offer: "Ultra-brief headline + explicit opt-out.",
  re_engage_choice: "Binary choice; invite ownership.",
};

/**
 * Structured persuasion bundle — transparent and respectful; reps choose what to say.
 */
export function buildPsychologySuggestion(
  lastClientUtterance: string,
  recentTranscript?: string,
): PsychologySuggestionBundle {
  const detection = detectClientPsychology(lastClientUtterance, recentTranscript);
  const { key, strategy } = getPsychologyStrategy(detection.primaryState, detection.stage);

  return {
    detection,
    strategyKey: key,
    strategy,
    responseStyle: STYLE[key],
    exampleSentence: EXAMPLES[key],
    avoidPhrases: AVOID[key],
    indicator: INDICATORS[detection.primaryState],
  };
}

export function analyzePostCallPsychology(fullTranscript: string): PostCallPsychologyAnalysis {
  const chunks = fullTranscript
    .split(/\n+/)
    .map((l) => l.replace(/^\[[^\]]+\]\s*/, "").trim())
    .filter(Boolean);

  const states = chunks.map((c) => detectClientPsychology(c).primaryState);
  const dominantState = modeOf(states) ?? "skeptical";

  const stages = chunks.map((c) => detectClientPsychology(c).stage);
  const dominantStage = modeOf(stages) ?? "exploring";

  const mistakesObserved: string[] = [];
  const lower = fullTranscript.toLowerCase();
  if (/\b(guarantee|promise you|always works)\b/i.test(lower)) {
    mistakesObserved.push("Absolute claims without proof anchors.");
  }
  if (/\b(you need to|you must|you should)\b/i.test(lower)) {
    mistakesObserved.push("High-pressure imperatives — increases resistance.");
  }
  if (fullTranscript.split(/\?/).length < 2) {
    mistakesObserved.push("Few discovery questions — risk misaligned pitch.");
  }

  const missedOpportunities: string[] = [];
  if (dominantStage === "ready_to_decide" && !/\b(book|calendar|invite)\b/i.test(lower)) {
    missedOpportunities.push("Readiness signal without a concrete calendar ask.");
  }
  if (dominantState === "interested" && !/\b(minutes|tomorrow|today)\b/i.test(lower)) {
    missedOpportunities.push("Interest without anchoring time.");
  }

  const betterApproach = [
    `Lead with proof when ${dominantState} tone shows up.`,
    `Match stage ${dominantStage.replace(/_/g, " ")} with a single next step.`,
    "Prefer questions over assertions until pain is explicit.",
  ];

  return {
    dominantState,
    dominantStage,
    mistakesObserved,
    missedOpportunities,
    betterApproach,
  };
}

function modeOf<T extends string>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const freq = new Map<T, number>();
  for (const x of arr) freq.set(x, (freq.get(x) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
