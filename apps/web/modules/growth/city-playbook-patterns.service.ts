/**
 * Extracts repeatable labels from logged metrics — patterns, not causal mechanisms.
 */

import { TOP_CITY_MIN_SAMPLE_SIZE } from "@/modules/growth/city-playbook-selector.service";
import type { FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";
import type { CityPlaybookSignal, CityPlaybookTemplate } from "@/modules/growth/city-playbook-adaptation.types";

/** Absolute floors — conservative; pattern only emitted when metric exists and clears floor. */
const CAPTURE_STRONG = 0.18;
const PLAYBOOK_STRONG = 0.45;
const PROGRESSION_STRONG = 0.08;
const COMPLETION_FAST_HOURS = 48;

function patternConfidence(
  entry: FastDealCityRankEntry,
): "low" | "medium" | "high" {
  if (entry.meta.sampleSize >= 40 && entry.meta.dataCompleteness === "high") return "high";
  if (entry.meta.sampleSize >= 28 && entry.meta.dataCompleteness !== "low") return "medium";
  return "low";
}

export function extractCityPlaybookTemplate(entry: FastDealCityRankEntry): CityPlaybookTemplate {
  const d = entry.derived;
  const e = entry.execution;
  const keyPatterns: string[] = [];
  const baselineRates: CityPlaybookTemplate["baselineRates"] = {};

  if (d.captureRate != null) {
    baselineRates.captureRate = d.captureRate;
    if (d.captureRate >= CAPTURE_STRONG) {
      keyPatterns.push(`Capture ratio at or above internal strong threshold (${CAPTURE_STRONG}) — logged captures vs sourcing sessions.`);
    }
  }

  if (d.playbookCompletionRate != null) {
    baselineRates.playbookCompletionRate = d.playbookCompletionRate;
    if (d.playbookCompletionRate >= PLAYBOOK_STRONG) {
      keyPatterns.push(`Playbook completion ratio at or above internal threshold (${PLAYBOOK_STRONG}) — completions vs starts.`);
    }
  }

  if (d.progressionRate != null) {
    baselineRates.progressionRate = d.progressionRate;
    if (d.progressionRate >= PROGRESSION_STRONG) {
      keyPatterns.push(`Progression ratio at or above internal threshold (${PROGRESSION_STRONG}) — progressed deals vs captures.`);
    }
  }

  if (e.avgCompletionTimeHours != null) {
    baselineRates.avgCompletionTimeHours = e.avgCompletionTimeHours;
    if (e.avgCompletionTimeHours <= COMPLETION_FAST_HOURS) {
      keyPatterns.push(`Average playbook completion time ≤ ${COMPLETION_FAST_HOURS}h where timestamps support it.`);
    }
  }

  const pc = patternConfidence(entry);
  const templateConfidence =
    pc === "high" && entry.confidence === "high"
      ? "high"
      : pc === "low" || entry.confidence === "low"
        ? "low"
        : "medium";

  return {
    sourceCity: entry.city,
    keyPatterns,
    baselineRates,
    confidence: templateConfidence,
    sampleSize: entry.meta.sampleSize,
  };
}

export function buildCityPlaybookSignal(entry: FastDealCityRankEntry): CityPlaybookSignal {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const d = entry.derived;

  if (d.captureRate != null && d.captureRate >= CAPTURE_STRONG) strengths.push("High capture rate (logged)");
  else if (d.captureRate != null && d.captureRate < CAPTURE_STRONG * 0.6) weaknesses.push("Capture rate below strong benchmark");

  if (d.playbookCompletionRate != null && d.playbookCompletionRate >= PLAYBOOK_STRONG) strengths.push("Strong playbook completion");
  else if (d.playbookCompletionRate != null && d.playbookCompletionRate < PLAYBOOK_STRONG * 0.5) weaknesses.push("Playbook completion below strong benchmark");

  if (d.progressionRate != null && d.progressionRate >= PROGRESSION_STRONG) strengths.push("Solid progression ratio");
  else if (d.progressionRate != null && d.progressionRate < PROGRESSION_STRONG * 0.5) weaknesses.push("Progression ratio below strong benchmark");

  if (entry.execution.avgCompletionTimeHours != null) {
    if (entry.execution.avgCompletionTimeHours <= COMPLETION_FAST_HOURS) strengths.push("Fast playbook completion time");
    else weaknesses.push("Slower playbook completion vs internal fast benchmark");
  }

  let confidence: CityPlaybookSignal["confidence"] = "low";
  if (entry.meta.sampleSize >= 40 && entry.confidence === "high") confidence = "high";
  else if (entry.meta.sampleSize >= TOP_CITY_MIN_SAMPLE_SIZE && entry.confidence !== "low") confidence = "medium";

  return {
    city: entry.city,
    strengths,
    weaknesses,
    confidence,
  };
}
