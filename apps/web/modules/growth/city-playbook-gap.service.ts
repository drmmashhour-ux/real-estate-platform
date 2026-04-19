/**
 * Compares a target city’s logged metrics to a reference template — gap list + severity.
 */

import type { FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";
import type { CityPlaybookTemplate } from "@/modules/growth/city-playbook-adaptation.types";

export type PlaybookGapKind = "capture" | "playbook" | "progression" | "completion_time" | "thin_data";

export type CityPlaybookGap = {
  kind: PlaybookGapKind;
  label: string;
  severity: "low" | "medium" | "high";
};

const RATE_HIGH = 0.18;
const RATE_MED = 0.1;

function rateSeverity(shortfall: number): "low" | "medium" | "high" {
  if (shortfall > RATE_HIGH) return "high";
  if (shortfall > RATE_MED) return "medium";
  return "low";
}

/**
 * Shortfall = max(0, baseline − target) for rates (higher baseline = better for “strong” reference).
 * For completion time, target worse when target hours > baseline hours.
 */
export function compareCityToTemplate(
  target: FastDealCityRankEntry,
  template: CityPlaybookTemplate,
): { gaps: CityPlaybookGap[]; comparableChannels: number } {
  const gaps: CityPlaybookGap[] = [];
  let comparableChannels = 0;
  const b = template.baselineRates;
  const d = target.derived;
  const e = target.execution;

  if (target.meta.sampleSize < 12) {
    gaps.push({
      kind: "thin_data",
      label: "Very small sample for this city — comparisons to a reference city are unreliable.",
      severity: "high",
    });
  }

  if (b.captureRate != null && d.captureRate != null) {
    comparableChannels += 1;
    const shortfall = Math.max(0, b.captureRate - d.captureRate);
    if (shortfall > 0.02) {
      gaps.push({
        kind: "capture",
        label: `Capture ratio lower than reference city (${(d.captureRate * 100).toFixed(0)}% vs ref ${(b.captureRate * 100).toFixed(0)}%).`,
        severity: rateSeverity(shortfall),
      });
    }
  } else if (b.captureRate != null && d.captureRate == null) {
    gaps.push({
      kind: "capture",
      label: "Capture ratio unavailable — cannot verify alignment with reference capture profile.",
      severity: "medium",
    });
  }

  if (b.playbookCompletionRate != null && d.playbookCompletionRate != null) {
    comparableChannels += 1;
    const shortfall = Math.max(0, b.playbookCompletionRate - d.playbookCompletionRate);
    if (shortfall > 0.03) {
      gaps.push({
        kind: "playbook",
        label: `Playbook completion lower than reference (${(d.playbookCompletionRate * 100).toFixed(0)}% vs ref ${(b.playbookCompletionRate * 100).toFixed(0)}%).`,
        severity: rateSeverity(shortfall),
      });
    }
  } else if (b.playbookCompletionRate != null && d.playbookCompletionRate == null) {
    gaps.push({
      kind: "playbook",
      label: "Playbook completion unavailable — missing start/complete counts for comparison.",
      severity: "medium",
    });
  }

  if (b.progressionRate != null && d.progressionRate != null) {
    comparableChannels += 1;
    const shortfall = Math.max(0, b.progressionRate - d.progressionRate);
    if (shortfall > 0.03) {
      gaps.push({
        kind: "progression",
        label: `Progression ratio lower than reference (${(d.progressionRate * 100).toFixed(0)}% vs ref ${(b.progressionRate * 100).toFixed(0)}%).`,
        severity: rateSeverity(shortfall),
      });
    }
  } else if (b.progressionRate != null && d.progressionRate == null) {
    gaps.push({
      kind: "progression",
      label: "Progression ratio unavailable — need progressed deals and captures in-window.",
      severity: "medium",
    });
  }

  if (b.avgCompletionTimeHours != null && e.avgCompletionTimeHours != null) {
    comparableChannels += 1;
    const ratio = e.avgCompletionTimeHours / b.avgCompletionTimeHours;
    if (ratio > 1.35) {
      gaps.push({
        kind: "completion_time",
        label: `Playbook completion slower on average (${e.avgCompletionTimeHours.toFixed(1)}h vs ref ${b.avgCompletionTimeHours.toFixed(1)}h).`,
        severity: ratio > 1.7 ? "high" : "medium",
      });
    }
  }

  return { gaps, comparableChannels };
}
