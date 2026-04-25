/**
 * Heuristic “pressure” feedback for InvestorGrillLive. Training only — not diligence-grade.
 */

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

function hedgePenalty(answer: string): number {
  const t = answer.toLowerCase();
  const hedges = [
    "i think",
    "maybe",
    "hopefully",
    "not sure",
    "kind of",
    "sort of",
    "might be",
    "could be",
    "i guess",
    "probably",
  ];
  let c = 0;
  for (const h of hedges) {
    if (t.includes(h)) c++;
  }
  return Math.min(4, c);
}

function logicBoost(answer: string): number {
  const t = answer.toLowerCase();
  let s = 0;
  if (t.includes("because") || t.includes("therefore") || t.includes("so ")) s += 1;
  if (/\d/.test(t)) s += 1;
  if (t.includes("if ") && t.includes("then")) s += 1;
  if (t.includes("we ") && t.includes("not ")) s += 0.5;
  return Math.min(3, s);
}

export type GrillFeedbackResult = {
  score: number;
  dimensions: {
    clarity: number;
    confidence: number;
    conciseness: number;
    logic: number;
    conviction: number;
  };
  strongPoints: string[];
  weakPoints: string[];
  improvedAnswer: string;
  confidenceLevel: "low" | "medium" | "high";
};

/**
 * @param keyPoints - from the current grill question
 * @param modelAnswer - strong reference answer from bank
 * @param timedOut - if true, cap scores and add note
 */
export function evaluateGrillAnswer(
  answer: string,
  keyPoints: string[],
  modelAnswer: string,
  options?: { timedOut?: boolean },
): GrillFeedbackResult {
  const timedOut = options?.timedOut ?? false;
  const trimmed = answer.trim();
  const aw = wordSet(trimmed);
  const wc = wordCount(trimmed);
  const sc = sentenceCount(trimmed);

  const coverages = keyPoints.map((kp) => {
    const tokens = norm(kp)
      .split(" ")
      .filter((w) => w.length > 2);
    if (tokens.length === 0) return 1;
    let hit = 0;
    for (const t of tokens) {
      if (aw.has(t)) hit++;
    }
    return hit / tokens.length;
  });
  const avgCover = coverages.length
    ? coverages.reduce((a, b) => a + b, 0) / coverages.length
    : 0.4;

  let clarity = 5;
  if (wc < 8) clarity -= 2;
  if (sc === 1 && wc > 80) clarity -= 1;
  if (sc >= 2 && sc <= 5 && wc >= 25 && wc <= 120) clarity += 2;
  if (wc > 200) clarity -= 2;
  clarity = Math.min(10, Math.max(0, Math.round(clarity + avgCover * 3)));

  let confidence = 7;
  confidence -= hedgePenalty(trimmed);
  if (trimmed.length < 15) confidence -= 2;
  if (/^\s*$/i.test(trimmed)) confidence = 0;
  confidence = Math.min(10, Math.max(0, Math.round(confidence)));

  let conciseness = 6;
  if (wc >= 25 && wc <= 100) conciseness += 3;
  if (wc < 15) conciseness -= 2;
  if (wc > 180) conciseness -= 3;
  conciseness = Math.min(10, Math.max(0, conciseness));

  let logic = 5;
  logic += Math.round(logicBoost(trimmed));
  logic += Math.min(2, Math.round(avgCover * 2));
  logic = Math.min(10, Math.max(0, logic));

  let conviction = 6;
  conviction -= Math.min(3, Math.round(hedgePenalty(trimmed) * 0.8));
  if (trimmed.length > 40 && (trimmed.includes("!") || /definitely|will|must|we will/i.test(trimmed)))
    conviction += 1;
  conviction = Math.min(10, Math.max(0, Math.round(conviction)));

  if (timedOut) {
    clarity = Math.max(0, clarity - 2);
    confidence = Math.max(0, confidence - 2);
    logic = Math.max(0, logic - 1);
  }

  const dimensions = {
    clarity,
    confidence,
    conciseness,
    logic,
    conviction,
  };
  const raw = Object.values(dimensions).reduce((a, b) => a + b, 0) / 5;
  const score = Math.round(raw * 10) / 10;

  const weakPoints: string[] = [];
  if (clarity < 6) weakPoints.push("Tighten structure: 2–3 short sentences, one main claim.");
  if (confidence < 6) weakPoints.push("Reduce hedging; state a testable claim you can back up.");
  if (conciseness < 6) weakPoints.push("Balance detail vs length—investor time is not infinite.");
  if (logic < 6) weakPoints.push("Add causal links (because/therefore) and one concrete fact.");
  if (conviction < 6) weakPoints.push("Sound like you own the plan—then prove it, don’t perform it.");
  keyPoints.forEach((kp, i) => {
    if ((coverages[i] ?? 0) < 0.3) weakPoints.push(`Weave in: “${kp.slice(0, 80)}${kp.length > 80 ? "…" : ""}”`);
  });
  if (timedOut) weakPoints.push("Time ran out—practice ending with a crisp punchline under pressure.");

  const strongPoints: string[] = [];
  if (clarity >= 7) strongPoints.push("Clear structure and readable on first listen.");
  if (logic >= 7) strongPoints.push("Logical thread is visible (claim → support).");
  if (confidence >= 7 && conviction >= 7) strongPoints.push("Confident, founder-grade tone without rambling.");
  if (strongPoints.length === 0) strongPoints.push("You stayed in the ring—tighten the next answer.");

  const improvedAnswer =
    modelAnswer && modelAnswer.length > 20
      ? modelAnswer
      : trimmed
        ? `${trimmed} — add one hard fact and cut one hedging phrase.`
        : "State your claim in one line, add one supporting fact, and end with the consequence.";

  let confidenceLevel: "low" | "medium" | "high" = "medium";
  if (score < 5) confidenceLevel = "low";
  if (score >= 7.5) confidenceLevel = "high";

  return {
    score,
    dimensions,
    strongPoints: strongPoints.slice(0, 4),
    weakPoints: weakPoints.slice(0, 6),
    improvedAnswer,
    confidenceLevel,
  };
}
