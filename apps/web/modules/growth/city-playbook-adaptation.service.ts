/**
 * Assembles reference city + per-target guided suggestions from a Fast Deal city comparison.
 */

import { engineFlags } from "@/config/feature-flags";
import type { FastDealCityComparison, FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";
import type {
  CityPlaybookAdaptation,
  CityPlaybookAdaptationBundle,
} from "@/modules/growth/city-playbook-adaptation.types";
import { applyAdaptationRules } from "@/modules/growth/city-playbook-adaptation-rules.service";
import { generateAdaptationBundleInsights } from "@/modules/growth/city-playbook-adaptation-insights.service";
import { monitorAdaptationBundle } from "@/modules/growth/city-playbook-adaptation-monitoring.service";
import { compareCityToTemplate } from "@/modules/growth/city-playbook-gap.service";
import { buildCityPlaybookSignal, extractCityPlaybookTemplate } from "@/modules/growth/city-playbook-patterns.service";
import { selectTopPerformingCity } from "@/modules/growth/city-playbook-selector.service";

const MAX_RECOMMENDATIONS = 4;
const MIN_TARGET_SAMPLE = 8;

function adaptationConfidence(
  target: FastDealCityRankEntry,
  templateConf: "low" | "medium" | "high",
  gapList: { severity: string }[],
  comparableChannels: number,
): "low" | "medium" | "high" {
  if (target.confidence === "low" || templateConf === "low") return "low";
  if (target.meta.sampleSize < 12) return "low";
  if (gapList.some((g) => g.severity === "high") && comparableChannels < 2) return "low";
  if (comparableChannels >= 3 && target.confidence === "high" && templateConf === "high" && !gapList.some((g) => g.severity === "high")) {
    return "high";
  }
  return "medium";
}

function buildRationale(
  targetCity: string,
  sourceCity: string,
  gapCount: number,
): string {
  if (gapCount === 0) {
    return `Logged channels for ${targetCity} are close to ${sourceCity} in this window — no large gap list; still not proof of equal future performance.`;
  }
  return `Internal comparison: ${targetCity} shows ${gapCount} logged gap(s) vs the ${sourceCity} reference template in this date range.`;
}

/**
 * Core bundle builder (no feature flag). Use in tests; use `buildCityPlaybookAdaptations` in production.
 */
export function buildCityPlaybookAdaptationBundleCore(
  cityComparison: FastDealCityComparison | null | undefined,
): CityPlaybookAdaptationBundle {
  if (!cityComparison?.rankedCities?.length) {
    return {
      topCity: null,
      targetCities: [],
      adaptations: [],
      insights: generateAdaptationBundleInsights({ sourceCity: null, adaptations: [], skippedTargets: [] }),
      skippedTargets: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const picked = selectTopPerformingCity(cityComparison);
  if (!picked.top) {
    monitorAdaptationBundle({
      adaptationsGenerated: 0,
      lowConfidenceAdaptations: 0,
      skippedThinData: cityComparison.rankedCities.length,
    });
    return {
      topCity: null,
      targetCities: [],
      adaptations: [],
      insights: generateAdaptationBundleInsights({
        sourceCity: null,
        adaptations: [],
        skippedTargets: cityComparison.rankedCities.map((c) => ({
          city: c.city,
          reason: picked.warning ?? "No reference city.",
        })),
      }),
      skippedTargets: cityComparison.rankedCities.map((c) => ({
        city: c.city,
        reason: picked.warning ?? "No reference city.",
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  const top = picked.top;
  const template = extractCityPlaybookTemplate(top);
  const signal = buildCityPlaybookSignal(top);

  const adaptations: CityPlaybookAdaptation[] = [];
  const skippedTargets: { city: string; reason: string }[] = [];

  for (const row of cityComparison.rankedCities) {
    if (row.city === top.city) continue;

    if (row.meta.sampleSize < MIN_TARGET_SAMPLE) {
      skippedTargets.push({
        city: row.city,
        reason: `Sample size (${row.meta.sampleSize}) below minimum (${MIN_TARGET_SAMPLE}) for adaptation rows.`,
      });
      continue;
    }

    const { gaps, comparableChannels } = compareCityToTemplate(row, template);
    const rules = applyAdaptationRules(gaps);

    let suggestions = rules.suggestions.slice(0, MAX_RECOMMENDATIONS);
    if (suggestions.length === 0 && comparableChannels > 0 && gaps.filter((g) => g.kind !== "thin_data").length === 0) {
      suggestions = [
        "No large logged gaps vs reference in comparable channels — continue monitoring and keep city metadata consistent.",
      ];
    }

    const conf = adaptationConfidence(row, template.confidence, gaps, comparableChannels);

    const warnings: string[] = [
      `Do not treat ${top.city} as a recipe to copy — reference-only; causality not established.`,
      ...row.meta.warnings,
      ...row.scoringWarnings,
    ];

    if (row.meta.sampleSize < 25) {
      warnings.push("Small sample — treat adjustments as exploratory.");
    }
    if (comparableChannels === 0) {
      warnings.push("Insufficient overlapping metrics vs reference — collect more comparable events.");
      suggestions = [
        "Collect more attributed sourcing, playbook, and outcome events before adapting strategy from this comparison.",
      ].slice(0, MAX_RECOMMENDATIONS);
    }

    adaptations.push({
      targetCity: row.city,
      sourceCity: top.city,
      recommendedAdjustments: suggestions,
      rationale: buildRationale(row.city, top.city, gaps.length),
      confidence: conf,
      constraints: rules.constraints,
      warnings: dedupeStrings(warnings),
    });
  }

  const lowConf = adaptations.filter((a) => a.confidence === "low").length;

  monitorAdaptationBundle({
    adaptationsGenerated: adaptations.length,
    lowConfidenceAdaptations: lowConf,
    skippedThinData: skippedTargets.length,
  });

  const insights = generateAdaptationBundleInsights({
    sourceCity: top.city,
    adaptations,
    skippedTargets,
  });

  return {
    topCity: {
      city: top.city,
      signal,
      template,
    },
    targetCities: adaptations.map((a) => a.targetCity),
    adaptations,
    insights,
    skippedTargets,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Returns `null` when the city playbook adaptation feature is disabled.
 */
export function buildCityPlaybookAdaptations(
  cityComparison: FastDealCityComparison | null | undefined,
): CityPlaybookAdaptationBundle | null {
  if (!engineFlags.cityPlaybookAdaptationV1) return null;
  return buildCityPlaybookAdaptationBundleCore(cityComparison);
}

function dedupeStrings(xs: string[]): string[] {
  const s = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!x || s.has(x)) continue;
    s.add(x);
    out.push(x);
  }
  return out;
}
