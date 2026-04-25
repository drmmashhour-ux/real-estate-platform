/**
 * Heuristic answer evaluation for practice. Not a substitute for a real investment memo or legal review.
 */

export type AnswerFeedback = {
  clarityScore: number;
  completenessScore: number;
  /** 0–10 average of clarity and completeness, rounded to 1 decimal */
  overallScore: number;
  confidenceTips: string[];
  missingPoints: string[];
  improvedAnswerSample: string;
  whatToAdd: string[];
  whatToRemove: string[];
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2));
}

/**
 * Rough coverage: share of "meaningful" tokens from a key point that appear in the answer.
 */
function coverageForKeyPoint(answerWords: Set<string>, keyPoint: string): number {
  const tokens = norm(keyPoint)
    .split(" ")
    .filter((w) => w.length > 2);
  if (tokens.length === 0) return 1;
  let hit = 0;
  for (const t of tokens) {
    if (answerWords.has(t)) hit++;
  }
  return hit / tokens.length;
}

function sentenceCount(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/[.!?]+/).filter((x) => x.trim().length > 0).length || 1;
}

function wordCount(s: string): number {
  return norm(s)
    .split(" ")
    .filter(Boolean).length;
}

/**
 * @param keyPoints - from the question bank
 * @param modelAnswer - optional: used as improved sample
 */
export function evaluateAnswer(
  answer: string,
  keyPoints: string[],
  modelAnswer?: string,
): AnswerFeedback {
  const trimmed = answer.trim();
  const aw = wordSet(trimmed);
  const wc = wordCount(trimmed);
  const sc = sentenceCount(trimmed);

  const coverages = keyPoints.map((kp) => coverageForKeyPoint(aw, kp));
  const avgCover =
    coverages.length > 0 ? coverages.reduce((a, b) => a + b, 0) / coverages.length : 0;
  const completenessScore = Math.round(Math.min(10, Math.max(0, avgCover * 10 + (wc < 8 ? -1 : 0))));

  let clarity = 5;
  if (wc < 10) clarity -= 2;
  if (wc < 25 && wc >= 10) clarity -= 1;
  if (sc === 1 && wc > 20) clarity -= 1;
  if (sc >= 2 && sc <= 5 && wc >= 30) clarity += 2;
  if (wc > 200) clarity -= 2;
  if (wc >= 40 && sc >= 2) clarity += 1;
  clarity = Math.min(10, Math.max(0, Math.round(clarity)));

  const missingPoints: string[] = [];
  keyPoints.forEach((kp, i) => {
    if ((coverages[i] ?? 0) < 0.35) missingPoints.push(kp);
  });

  const overallRaw = (clarity + completenessScore) / 2;
  const overallScore = Math.round(overallRaw * 10) / 10;

  const whatToAdd: string[] = [];
  const whatToRemove: string[] = [];
  if (missingPoints.length) {
    whatToAdd.push(
      `Tie in ideas related to: ${missingPoints.slice(0, 3).join(" · ")}${missingPoints.length > 3 ? " …" : ""}`,
    );
  }
  if (wc < 25) whatToAdd.push("Add 1–2 concrete specifics (segment, region, or metric you can defend).");
  if (sc < 2) whatToAdd.push("Break into 2–3 short sentences: claim → evidence → so what.");
  if (trimmed.toLowerCase().includes("tbd") || trimmed.toLowerCase().includes("huge market")) {
    whatToRemove.push("Replace vague superlatives or placeholders; investors anchor on defensibility.");
  }
  if (wc > 180) {
    whatToRemove.push("Tighten: cut side stories; keep one thread from problem to proof.");
  }
  if (!whatToAdd.length) whatToAdd.push("Strengthen with one number or a named next milestone, if true.");
  if (!whatToRemove.length) whatToRemove.push("Nothing major—re-read for one redundant sentence.");

  const confidenceTips: string[] = [];
  if (overallScore < 5) {
    confidenceTips.push("Lead with the thesis in one line, then one proof point.");
    confidenceTips.push("Say what is NOT true (limits) — it increases trust in diligence.");
  } else if (overallScore < 7.5) {
    confidenceTips.push("Name the buyer and the sequence: land → expand within Québec, then what.");
    confidenceTips.push("If asked legal, be crisp: software is assistive; pros hold responsibility.");
  } else {
    confidenceTips.push("Bridge to 'why you / why now' in one line before Q&A drifts.");
    confidenceTips.push("End with a forward milestone (30/60/90) tied to a metric you track.");
  }

  const improvedAnswerSample = modelAnswer?.trim() || "";

  return {
    clarityScore: clarity,
    completenessScore,
    overallScore,
    confidenceTips,
    missingPoints,
    improvedAnswerSample,
    whatToAdd,
    whatToRemove,
  };
}
