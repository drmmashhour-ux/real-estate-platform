import type { LecipmTrustOperationalBand } from "@prisma/client";

import type { TrustFactorContribution } from "./trust-score.types";

export type ExplainabilityInput = {
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  contributions: TrustFactorContribution[];
  warnings: string[];
  thinDataNotes: string[];
  /** When recomputing against a prior snapshot. */
  priorScore?: number | null;
  priorTopNegativeFactorIds?: string[];
};

const BAND_COPY: Record<LecipmTrustOperationalBand, string> = {
  HIGH_TRUST:
    "Operational signals cluster in a strong band — documentation, predictable behavior, and lower observed friction.",
  GOOD: "Operational signals are broadly healthy with room for incremental improvements in responsiveness and clarity.",
  WATCH:
    "Several operational signals warrant closer monitoring — not a determination of fault; visibility and follow-up help.",
  ELEVATED_RISK:
    "Multiple operational stress signals align — prioritize lightweight verification and coaching-style interventions.",
  CRITICAL_REVIEW:
    "Signals justify a structured operational review — outcomes remain policy-gated; not a legal or moral judgment.",
};

function improvementHints(neg: TrustFactorContribution[]): string[] {
  const hints: string[] = [];
  for (const c of neg.slice(0, 4)) {
    const id = c.factorId.toLowerCase();
    if (id.includes("document") || id.includes("compliance") || id.includes("verification")) {
      hints.push("Complete outstanding documentation and verification checkpoints when available.");
    } else if (id.includes("response") || id.includes("responsiveness") || id.includes("follow")) {
      hints.push("Tighten acknowledgement and follow-up cadence on open threads.");
    } else if (id.includes("no_show") || id.includes("noshow") || id.includes("booking")) {
      hints.push("Use explicit visit confirmation and reschedule hygiene to reduce missed commitments.");
    } else if (id.includes("dispute") || id.includes("friction") || id.includes("prediction")) {
      hints.push("Review recent friction patterns with coaching tools — escalation paths stay human-reviewed.");
    } else if (id.includes("insurance") || id.includes("coverage")) {
      hints.push("Confirm coverage and registration signals are current where the product collects them.");
    } else if (id.includes("listing") || id.includes("quality")) {
      hints.push("Improve listing clarity: photos, factsheets, and disclosure completeness.");
    }
  }
  return [...new Set(hints)].slice(0, 6);
}

/**
 * Narrative explainability — advisory language, no fault attribution.
 */
export function buildOperationalTrustExplainability(input: ExplainabilityInput): {
  topPositive: string[];
  topNegative: string[];
  bandReason: string;
  improvements: string[];
  declineNote?: string;
} {
  const pos = input.contributions.filter((c) => c.contribution > 0.5).sort((a, b) => b.contribution - a.contribution);
  const neg = input.contributions.filter((c) => c.contribution < -0.5).sort((a, b) => a.contribution - b.contribution);

  const topPositive = pos.slice(0, 5).map((c) => `${c.label} (+${c.contribution.toFixed(1)} pts, weight ×${c.weight.toFixed(2)})`);
  const topNegative = neg.slice(0, 5).map((c) => `${c.label} (${c.contribution.toFixed(1)} pts, weight ×${c.weight.toFixed(2)})`);

  let bandReason = BAND_COPY[input.trustBand];
  if (input.thinDataNotes.length) {
    bandReason += ` Limited input data: ${input.thinDataNotes.slice(0, 2).join(" ")}`;
  }

  const improvements = [...improvementHints(neg), ...input.warnings.map((w) => `Address warning: ${w}`)].slice(0, 8);

  let declineNote: string | undefined;
  if (input.priorScore != null && input.trustScore < input.priorScore - 4) {
    declineNote = `Score moved from ${input.priorScore} to ${input.trustScore} — primarily driven by operational friction signals, not a determination of misconduct.`;
    const newNeg = neg.find((c) => input.priorTopNegativeFactorIds && !input.priorTopNegativeFactorIds.includes(c.factorId));
    if (newNeg) {
      declineNote += ` Recent drag: ${newNeg.label}.`;
    }
  }

  return {
    topPositive,
    topNegative,
    bandReason,
    improvements,
    declineNote,
  };
}
