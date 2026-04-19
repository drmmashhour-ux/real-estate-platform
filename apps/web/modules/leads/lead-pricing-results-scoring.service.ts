/**
 * Conservative, non-causal outcome banding for lead pricing observations.
 * Wording avoids "price caused X" — only temporal co-occurrence of signals.
 */

import type { LeadPricingBaselineSnapshot } from "@/modules/leads/lead-pricing-results.types";
import type { LeadPricingOutcomeBand, LeadPricingSampleStatus } from "@/modules/leads/lead-pricing-results.types";

export const MIN_DAYS_FOR_OUTCOME = 3;
const ENGAGEMENT_NEUTRAL = 4;
const PROGRESS_MIN_FOR_POSITIVE = 1;

export type CurrentLeadSignals = {
  pipelineStatus: string | null;
  pipelineStage: string | null;
  lecipmCrmStage: string | null;
  contactUnlocked: boolean;
  engagementScore: number;
  progressIndex: number;
};

export function scoreLeadPricingOutcome(input: {
  baseline: LeadPricingBaselineSnapshot;
  current: CurrentLeadSignals;
  daysElapsed: number;
}): {
  outcomeBand: LeadPricingOutcomeBand;
  sampleStatus: LeadPricingSampleStatus;
  explanation: string;
  warnings: string[];
  leadProgressDelta: number;
  unlockDelta: 0 | 1;
  conversionDelta: number;
} {
  const warnings: string[] = [];
  const { baseline, current, daysElapsed } = input;

  if (daysElapsed < MIN_DAYS_FOR_OUTCOME) {
    return {
      outcomeBand: "insufficient_data",
      sampleStatus: "insufficient",
      explanation: `Only ${daysElapsed} day(s) elapsed since the advisory snapshot — wait at least ${MIN_DAYS_FOR_OUTCOME} days before reading weak signals. This is not proof the pricing view had an effect.`,
      warnings: [
        "Short window — internal-only; do not use for public or financial claims.",
      ],
      leadProgressDelta: current.progressIndex - baseline.progressIndex,
      unlockDelta: current.contactUnlocked && !baseline.contactUnlocked ? 1 : 0,
      conversionDelta: 0,
    };
  }

  const leadProgressDelta = current.progressIndex - baseline.progressIndex;
  const unlockDelta: 0 | 1 = current.contactUnlocked && !baseline.contactUnlocked ? 1 : 0;
  const engagementDelta = current.engagementScore - baseline.engagementScore;
  const lost = isLostLike(current.pipelineStatus) || isLostLike(current.lecipmCrmStage);

  if (lost) {
    return {
      outcomeBand: "negative",
      sampleStatus: "sufficient",
      explanation:
        "Subsequent pipeline state includes a lost/closed-lost style stage after the advisory snapshot. This is a negative operational readout, not a claim that pricing advice caused the loss.",
      warnings: [
        "Single lead context — may reflect many non-pricing factors.",
        "Advisory pricing is not a control variable in this readout.",
      ],
      leadProgressDelta,
      unlockDelta,
      conversionDelta: 0,
    };
  }

  const strongProgress = leadProgressDelta >= PROGRESS_MIN_FOR_POSITIVE;
  const strongUnlock = unlockDelta === 1;
  const softEngagement = engagementDelta >= ENGAGEMENT_NEUTRAL;

  if (strongProgress && (strongUnlock || softEngagement)) {
    return {
      outcomeBand: "positive",
      sampleStatus: "sufficient",
      explanation:
        "Subsequent lead progression and at least one supporting signal (unlock or engagement) moved in a favorable direction after the advisory pricing view. This is association, not proven impact.",
      warnings: [
        "One lead — do not generalize to platform performance.",
        "Revenue and conversion are not implied; no payment data is used here.",
      ],
      leadProgressDelta,
      unlockDelta,
      conversionDelta: 0,
    };
  }

  if (strongProgress || strongUnlock) {
    return {
      outcomeBand: "neutral",
      sampleStatus: "sparse",
      explanation:
        "Some forward movement (pipeline and/or unlock) after the snapshot, but not enough aligned signals to call a clear positive on a single lead.",
      warnings: ["Sparse or mixed signal set — treat as weak evidence only."],
      leadProgressDelta,
      unlockDelta,
      conversionDelta: 0,
    };
  }

  if (leadProgressDelta < 0) {
    return {
      outcomeBand: "negative",
      sampleStatus: "sufficient",
      explanation:
        "Pipeline/ progress index did not advance relative to the snapshot; no improvement in unlock in the same window. This is a negative read on forward motion, not a proof of harm from pricing views.",
      warnings: ["Internal snapshot only; other CRM work may dominate."],
      leadProgressDelta,
      unlockDelta,
      conversionDelta: 0,
    };
  }

  return {
    outcomeBand: "neutral",
    sampleStatus: "sparse",
    explanation:
      "Small or flat changes in available internal signals after the advisory view. Not enough to assert useful or harmful outcomes for this lead alone.",
    warnings: [
      "Default to neutral when changes are within the conservative band.",
    ],
    leadProgressDelta,
    unlockDelta,
    conversionDelta: 0,
  };
}

function isLostLike(s: string | null | undefined): boolean {
  if (!s) return false;
  const t = s.toLowerCase();
  return t.includes("lost") || /\blost\b/.test(t);
}

/**
 * Map common pipeline labels to a monotonic index (0 = early, higher = later; -1 = lost).
 * Deterministic, best-effort for ops readouts.
 */
export function leadProgressIndex(lead: {
  pipelineStatus: string | null;
  pipelineStage: string | null;
  lecipmCrmStage: string | null;
}): number {
  const s = (lead.lecipmCrmStage || lead.pipelineStatus || lead.pipelineStage || "")
    .toLowerCase();
  if (s.includes("lost") || s.includes("lose")) return -1;
  if (s.includes("won") || s.includes("closed_won") || s === "closed") return 5;
  if (s.includes("negotiation") || s.includes("closing")) return 4;
  if (s.includes("meeting") || s.includes("visit") || s.includes("qualified")) return 3;
  if (s.includes("contacted") || s.includes("contact")) return 2;
  if (s.includes("new") || s === "" || s === "new_lead") return 1;
  return 2;
}
