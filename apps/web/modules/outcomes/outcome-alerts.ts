import type { LecipmOutcomesSummary, OutcomeSystemAlert } from "./outcome.types";

export type { OutcomeSystemAlert };

const PRED_ACC_LOW = 0.55;
const CONV_DROP = 0.12;
const DISPUTE_HIGH = 0.18;
const NOSHOW_HIGH = 0.25;

type PriorSlice = {
  conversionRate: number | null;
  predictionAccuracy: number | null;
  disputeRate: number | null;
  noShowRate: number | null;
};

/** Heuristic alert rules — compares current window to optional prior window (same length). */
export function outcomeAlertsFromSummary(
  current: LecipmOutcomesSummary,
  prior: PriorSlice | null,
): OutcomeSystemAlert[] {
  const out: OutcomeSystemAlert[] = [];
  if (current.sampleSize < 5) {
    return out;
  }
  if (current.predictionAccuracy != null && current.predictionAccuracy < PRED_ACC_LOW) {
    out.push({
      id: "outcome:pred_acc_low",
      kind: "prediction_accuracy",
      title: "Prediction accuracy soft",
      severity: current.predictionAccuracy < 0.4 ? "urgent" : "attention",
      detail: `Model match rate is ${(current.predictionAccuracy * 100).toFixed(0)}% over the last ${current.windowDays}d — review deal intelligence, trust priors, and scenario baselines.`,
    });
  }
  if (
    prior?.conversionRate != null &&
    current.conversionRate != null &&
    current.conversionRate < prior.conversionRate - CONV_DROP
  ) {
    out.push({
      id: "outcome:conv_drop",
      kind: "conversion",
      title: "Conversion step-down",
      severity: "urgent",
      detail: `Lead conversion fell from ${(prior.conversionRate * 100).toFixed(0)}% to ${(current.conversionRate * 100).toFixed(0)}% — check pipeline hygiene and follow-up SLAs.`,
    });
  }
  if (current.disputeRate != null && current.disputeRate > DISPUTE_HIGH) {
    out.push({
      id: "outcome:dispute_spike",
      kind: "dispute",
      severity: "urgent",
      title: "Dispute share elevated",
      detail: `Dispute-tagged outcomes are ${(current.disputeRate * 100).toFixed(0)}% of relevant signals — route trust desk and pre-dispute playbooks.`,
    });
  }
  if (current.noShowRate != null && current.noShowRate > NOSHOW_HIGH) {
    out.push({
      id: "outcome:noshow",
      kind: "noshow",
      severity: "attention",
      title: "No-show rate up",
      detail: `No-shows are ${(current.noShowRate * 100).toFixed(0)}% of booking outcomes in-window — confirm calendar holds and noshow nudges.`,
    });
  }
  return out;
}
