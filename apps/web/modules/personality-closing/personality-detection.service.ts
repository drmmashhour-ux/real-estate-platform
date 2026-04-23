import type { ClientPersonalityType, PersonalityDetectionResult } from "./personality.types";

const DRIVER = /\b(bottom line|make it quick|sixty seconds|headline|results|roi today|skip the|just tell me|what do i get)\b/i;
const ANALYTICAL = /\b(assumption|methodology|data|metric|spreadsheet|cohort|sample size|prove|detail|break down|specifically|how do you measure)\b/i;
const EXPRESSIVE = /\b(excited|love|amazing|vision|big picture|feel|story|game-?changer|transform|dream)\b/i;
const AMIABLE = /\b(team|comfortable|worried|appreciate|relationship|trust|take care|no rush|together|thanks)\b/i;

function scorePersonalities(text: string): Record<ClientPersonalityType, number> {
  const t = text.toLowerCase();
  const scores: Record<ClientPersonalityType, number> = {
    DRIVER: 0,
    ANALYTICAL: 0,
    EXPRESSIVE: 0,
    AMIABLE: 0,
  };

  if (DRIVER.test(t)) scores.DRIVER += 38;
  if (ANALYTICAL.test(t)) scores.ANALYTICAL += 38;
  if (EXPRESSIVE.test(t)) scores.EXPRESSIVE += 38;
  if (AMIABLE.test(t)) scores.AMIABLE += 36;

  const words = t.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount > 0 && wordCount <= 9 && /\b(ok|fine|go|yes|no)\b/i.test(t)) scores.DRIVER += 14;
  if ((t.match(/\?/g) ?? []).length >= 2) scores.ANALYTICAL += 16;
  if (/!/.test(t)) scores.EXPRESSIVE += 12;
  if (/\b(we|our team|feel good)\b/i.test(t)) scores.AMIABLE += 12;

  return scores;
}

function primaryFromScores(scores: Record<ClientPersonalityType, number>): ClientPersonalityType {
  let best: ClientPersonalityType = "ANALYTICAL";
  let max = -1;
  for (const [k, v] of Object.entries(scores) as [ClientPersonalityType, number][]) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  if (max <= 10) return "AMIABLE";
  return best;
}

/**
 * Infer preferred communication style from wording, question density, and tone markers — heuristic only.
 */
export function detectClientPersonality(lastUtterance: string, recentTranscript?: string): PersonalityDetectionResult {
  const primaryText = lastUtterance.trim();
  const tail = recentTranscript
    ? recentTranscript.split("\n").map((l) => l.replace(/^\[[^\]]+\]\s*/, "").trim()).filter(Boolean).slice(-5)
    : [];

  const primaryScores = scorePersonalities(primaryText);
  const merged: Record<ClientPersonalityType, number> = { ...primaryScores };
  for (const line of tail) {
    const s = scorePersonalities(line);
    for (const k of Object.keys(s) as ClientPersonalityType[]) {
      merged[k] += s[k] * 0.25;
    }
  }

  const primary = primaryFromScores(merged);
  const maxScore = Math.max(...Object.values(merged));
  const confidence = Math.min(94, Math.round(36 + maxScore));

  const rationale: string[] = [];
  if (primaryScores.DRIVER > 25) rationale.push("Direct / pace cues.");
  if (primaryScores.ANALYTICAL > 25) rationale.push("Precision and measurement language.");
  if (primaryScores.EXPRESSIVE > 25) rationale.push("Emotional or vision framing.");
  if (primaryScores.AMIABLE > 25) rationale.push("Relationship / safety wording.");
  if (rationale.length === 0) rationale.push("Soft signal — defaulting to supportive pacing.");

  return { primary, confidence, rationale };
}
