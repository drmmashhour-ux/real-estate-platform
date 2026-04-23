import type {
  ClientPsychologicalState,
  DecisionStage,
  PsychologyDetectionResult,
  PsychologySignals,
} from "./psychology.types";

const SKEPTICAL = /\b(prove|really|another|who else|how do i know|scam|sketchy|not buying|show me)\b/i;
const DEFENSIVE = /\b(not interested|stop|leave me|don't call|no thanks|you'?re wasting|back off)\b/i;
const CURIOUS = /\b(how does|what happens if|could you explain|tell me more|interesting|walk me through)\b/i;
const INTERESTED = /\b(let'?s book|calendar|demo|works for me|send (the )?invite|yes|schedule|tomorrow)\b/i;
const DOMINANT = /\b(bottom line|you have sixty seconds|my time|concise|skip the|numbers first|headline)\b/i;
const DISENGAGED = /\b(i don'?t care|whatever|sure whatever|fine\.|uh huh|maybe later|some other time)\b/i;

const STAGE_UNAWARE = /\b(what is this|never heard|who are you|why are you calling)\b/i;
const STAGE_EXPLORING = /\b(tell me more|how does it work|what does it do|options|features)\b/i;
const STAGE_COMPARING = /\b(compared to|versus|already use|what'?s different|price|cost|cheaper)\b/i;
const STAGE_READY = /\b(book|schedule|invite|demo|today|tomorrow|send)\b/i;
const STAGE_REJECTING = /\b(no|never|remove|stop calling|not a fit)\b/i;

function scoreStates(text: string): Record<ClientPsychologicalState, number> {
  const t = text.toLowerCase();
  const scores: Record<ClientPsychologicalState, number> = {
    skeptical: 0,
    defensive: 0,
    curious: 0,
    interested: 0,
    dominant: 0,
    disengaged: 0,
  };

  if (SKEPTICAL.test(t)) scores.skeptical += 35;
  if (DEFENSIVE.test(t)) scores.defensive += 45;
  if (CURIOUS.test(t)) scores.curious += 32;
  if (INTERESTED.test(t)) scores.interested += 40;
  if (DOMINANT.test(t)) scores.dominant += 38;
  if (DISENGAGED.test(t)) scores.disengaged += 36;

  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount > 0 && wordCount < 6 && !INTERESTED.test(t)) scores.disengaged += 15;
  if (/\?/.test(t)) scores.curious += 12;
  if (/!{2,}/.test(t)) scores.defensive += 12;

  return scores;
}

function primaryStateFromScores(scores: Record<ClientPsychologicalState, number>): ClientPsychologicalState {
  let best: ClientPsychologicalState = "skeptical";
  let max = -1;
  for (const [k, v] of Object.entries(scores) as [ClientPsychologicalState, number][]) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  if (max <= 8) return "skeptical";
  return best;
}

export function detectDecisionStage(text: string): DecisionStage {
  const t = text.toLowerCase();
  if (STAGE_REJECTING.test(t)) return "rejecting";
  if (STAGE_READY.test(t)) return "ready_to_decide";
  if (STAGE_COMPARING.test(t)) return "comparing";
  if (STAGE_EXPLORING.test(t)) return "exploring";
  if (STAGE_UNAWARE.test(t)) return "unaware";
  return "exploring";
}

function mergeTranscriptSignals(lines: string[]): PsychologySignals {
  const agg: PsychologySignals = {};
  for (const line of lines) {
    const s = scoreStates(line);
    for (const [k, v] of Object.entries(s)) {
      if (v <= 0) continue;
      const key = k as ClientPsychologicalState;
      agg[key] = (agg[key] ?? 0) + v;
    }
  }
  return agg;
}

/**
 * Infer psychological posture from latest client utterance(s). Keyword + flow heuristics — not clinical evaluation.
 */
export function detectClientPsychology(lastClientUtterance: string, recentTranscript?: string): PsychologyDetectionResult {
  const primaryText = lastClientUtterance.trim();
  const lines = recentTranscript
    ? recentTranscript.split("\n").map((l) => l.replace(/^\[[^\]]+\]\s*/, "").trim()).filter(Boolean).slice(-6)
    : [primaryText];

  const scores = scoreStates(primaryText);
  const flowBoost = mergeTranscriptSignals(lines.length ? lines : [primaryText]);

  const merged: Record<ClientPsychologicalState, number> = {
    skeptical: scores.skeptical,
    defensive: scores.defensive,
    curious: scores.curious,
    interested: scores.interested,
    dominant: scores.dominant,
    disengaged: scores.disengaged,
  };
  for (const [k, v] of Object.entries(flowBoost)) {
    const key = k as ClientPsychologicalState;
    if (typeof v !== "number") continue;
    merged[key] = (merged[key] ?? 0) + v * 0.35;
  }

  const primaryState = primaryStateFromScores(merged);
  let secondaryState: ClientPsychologicalState | undefined;
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]) as [ClientPsychologicalState, number][];
  if (sorted[1] && sorted[1][1] > 18 && sorted[1][0] !== primaryState) secondaryState = sorted[1][0];

  const maxScore = Math.max(...Object.values(merged));
  const confidence = Math.min(95, Math.round(42 + maxScore));

  const rationale: string[] = [];
  if (scores.defensive > 25) rationale.push("Defensive cues in wording.");
  if (scores.interested > 25) rationale.push("Commitment language detected.");
  if (scores.dominant > 25) rationale.push("Demand for brevity / control.");
  if (scores.disengaged > 20) rationale.push("Low engagement / short replies.");
  if (rationale.length === 0) rationale.push("General exploration / caution tone.");

  const stage = detectDecisionStage(primaryText);

  const signals: PsychologySignals = {};
  for (const [k, v] of Object.entries(merged)) {
    if (v > 5) signals[k as ClientPsychologicalState] = Math.round(v);
  }

  return {
    primaryState,
    secondaryState,
    confidence,
    signals,
    stage,
    rationale,
  };
}
