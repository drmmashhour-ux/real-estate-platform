import { listSalesProfiles } from "@/modules/ai-sales-manager/ai-sales-profile.service";

import { buildSalespersonPredictorInput } from "./revenue-predictor-inputs.service";
import {
  buildCoachingUpliftForecast,
  computeBaseExpectedRevenueCents,
  computeWeightedCloseProbability,
} from "./revenue-predictor-forecast.service";
import type { RevenuePredictorAlert } from "./revenue-predictor.types";
import { loadRevenuePredictorStore, uid } from "./revenue-predictor-storage";
import { buildTeamRevenueForecast } from "./revenue-predictor-team.service";
import { listTeams } from "@/modules/team-training/team.service";

const THRESHOLD_REP_CENTS = 120_000;
const SHIFT_WOW = 0.18;

export function evaluateRevenuePredictorAlerts(): RevenuePredictorAlert[] {
  const store = loadRevenuePredictorStore();
  const out: RevenuePredictorAlert[] = [];

  for (const p of listSalesProfiles()) {
    const inp = buildSalespersonPredictorInput(p.userId);
    const prob = computeWeightedCloseProbability(inp);
    const base = computeBaseExpectedRevenueCents(inp, prob);
    const prev = store.lastRepForecastCents[p.userId];
    if (prev !== undefined && prev > 0 && base < prev * (1 - SHIFT_WOW)) {
      out.push({
        id: uid(),
        kind: "forecast_drop",
        severity: "warn",
        title: `Forecast down materially for ${p.displayName ?? p.userId.slice(0, 8)}`,
        body: `Base forecast moved vs prior snapshot — review pipeline quality and coaching signals.`,
        targets: { userId: p.userId },
        createdAtIso: new Date().toISOString(),
      });
    }

    if (base < THRESHOLD_REP_CENTS && inp.pipelineValueCents > 500_000 && inp.averageClosingScore < 58) {
      out.push({
        id: uid(),
        kind: "rep_below_threshold",
        severity: "info",
        title: "Low expected revenue vs pipeline mass",
        body: "Pipeline dollars exist but blended conversion expectation is weak — prioritize coaching.",
        targets: { userId: p.userId },
        createdAtIso: new Date().toISOString(),
      });
    }

    const uplift = buildCoachingUpliftForecast(inp, base);
    if (uplift.potentialUpliftCents > base * 0.22 && uplift.confidenceLabel !== "LOW") {
      out.push({
        id: uid(),
        kind: "high_coaching_upside",
        severity: "info",
        title: "High coaching ROI signal",
        body: uplift.narrative.slice(0, 200),
        targets: { userId: p.userId },
        createdAtIso: new Date().toISOString(),
      });
    }

    const stages = inp.conversionByStage;
    let total = 0;
    for (const v of Object.values(stages)) total += v ?? 0;
    if (total > 3) {
      for (const [st, c] of Object.entries(stages)) {
        if ((c ?? 0) / total >= 0.6 && st === "NEW_LEAD") {
          out.push({
            id: uid(),
            kind: "pipeline_concentration",
            severity: "warn",
            title: "Pipeline concentrated in early stage",
            body: "Consider progression plays — forecast sensitive to top-of-funnel volatility.",
            targets: { userId: p.userId },
            createdAtIso: new Date().toISOString(),
          });
          break;
        }
      }
    }
  }

  for (const t of listTeams()) {
    const prev = store.lastTeamForecastCents[t.teamId];
    const tf = buildTeamRevenueForecast(t.teamId);
    if (tf && prev !== undefined && prev > 0) {
      const delta = Math.abs(tf.ranges.baseCents - prev) / prev;
      if (delta >= 0.12) {
        out.push({
          id: uid(),
          kind: "team_forecast_shift",
          severity: delta >= 0.22 ? "warn" : "info",
          title: `Team forecast moved for ${t.name}`,
          body: "Week-over-week material change vs stored snapshot — validate CRM pipeline overlap.",
          targets: { teamId: t.teamId },
          createdAtIso: new Date().toISOString(),
        });
      }
    }
  }

  return out.slice(0, 40);
}
