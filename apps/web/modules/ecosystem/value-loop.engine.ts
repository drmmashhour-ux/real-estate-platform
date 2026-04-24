/**
 * Value loop model: voluntary participation deepens data richness, which can improve assistive quality,
 * which can improve outcomes — only when governance, consent, and product quality keep pace.
 */

export type ValueLoopStageId =
  | "users"
  | "data"
  | "intelligence"
  | "results"
  | "retention";

export type ValueLoopStage = {
  id: ValueLoopStageId;
  title: string;
  description: string;
};

export const VALUE_LOOP_STAGES: ValueLoopStage[] = [
  {
    id: "users",
    title: "More engaged users",
    description:
      "Teams adopt workflows because tasks get easier — not because switching away is blocked.",
  },
  {
    id: "data",
    title: "More structured, consented data",
    description:
      "Higher-quality events and labels when privacy defaults and export rights stay respected.",
  },
  {
    id: "intelligence",
    title: "Better assistive signals",
    description:
      "Models and heuristics can highlight patterns — always subordinate to human review where required.",
  },
  {
    id: "results",
    title: "Better measurable outcomes",
    description:
      "Faster response times, cleaner pipelines, fewer dropped handoffs (metrics you define).",
  },
  {
    id: "retention",
    title: "Organic return usage",
    description:
      "Users come back because value compounds — not from artificial lock-in.",
  },
];

export type ValueLoopHealthInput = {
  /** 0–1 share of monthly active accounts using ≥2 layers (your definition). */
  crossLayerAdoptionRate: number;
  /** 0–1 share of assistive suggestions acted on or constructively edited. */
  assistiveUtilizationRate: number;
  /** 0–1 normalized outcome trend (e.g. lead-to-tour conversion stability). */
  outcomeQualityIndex: number;
  /** 0–1 self-reported or proxy satisfaction. */
  satisfactionIndex: number;
};

export type ValueLoopHealth = {
  /** 0–100 composite */
  loopStrength: number;
  stages: ValueLoopStage[];
  diagnosis: string[];
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Assess whether the *conditions* for a healthy loop are present — not a forecast of viral growth.
 */
export function assessValueLoopHealth(input: ValueLoopHealthInput): ValueLoopHealth {
  const cross = clamp01(input.crossLayerAdoptionRate);
  const util = clamp01(input.assistiveUtilizationRate);
  const out = clamp01(input.outcomeQualityIndex);
  const sat = clamp01(input.satisfactionIndex);

  const loopStrength = Math.round(100 * (0.3 * cross + 0.25 * util + 0.25 * out + 0.2 * sat));

  const diagnosis: string[] = [];
  diagnosis.push(
    `Cross-layer adoption (voluntary breadth): ${(cross * 100).toFixed(1)}% — breadth signals complementary value, not dependency by coercion.`
  );
  diagnosis.push(
    `Assistive utilization: ${(util * 100).toFixed(1)}% — high utilization should pair with transparent controls and easy override.`
  );
  diagnosis.push(
    `Outcome quality index: ${(out * 100).toFixed(1)}% — tie this to metrics users already track to avoid vanity loops.`
  );
  diagnosis.push(
    `Satisfaction / trust proxy: ${(sat * 100).toFixed(1)}% — pair with churn and support load for balance.`
  );

  if (loopStrength < 45) {
    diagnosis.push("Loop reads early: deepen core value and measurement before pushing breadth.");
  } else if (loopStrength < 70) {
    diagnosis.push("Loop is forming: reinforce data quality, consent UX, and explainability in intelligence.");
  } else {
    diagnosis.push("Loop looks healthy on paper: still audit for over-automation, bias, and partner fairness.");
  }

  return {
    loopStrength,
    stages: VALUE_LOOP_STAGES,
    diagnosis,
  };
}
