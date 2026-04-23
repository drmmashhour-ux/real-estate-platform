import { STAGE_STALL_RISK } from "./revenue-predictor.config";
import type {
  OpportunityLossEstimate,
  PipelineStage,
  RiskDownsideForecast,
  SalespersonPredictorInput,
} from "./revenue-predictor.types";
import { computeWeightedCloseProbability } from "./revenue-predictor-forecast.service";

const OPEN: PipelineStage[] = ["NEW_LEAD", "CONTACTED", "DEMO_SCHEDULED", "QUALIFIED", "OFFER"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Heuristic leakage model — transparent levers, not ML fit.
 */
export function estimateOpportunityLoss(input: SalespersonPredictorInput): OpportunityLossEstimate {
  const basePipe = input.pipelineValueCents;
  if (basePipe <= 0) {
    return {
      estimatedLostRevenueCents: 0,
      topLossDrivers: [],
      leakingStages: [],
      notes: ["No pipeline dollars on file — loss estimate is zero until CRM values land."],
    };
  }

  const winProb = computeWeightedCloseProbability(input);
  const theoreticalMax = basePipe;
  const gapToPerfect = theoreticalMax * (1 - winProb);

  const weakClose = input.averageClosingScore < 60 ? 0.12 : input.averageClosingScore < 68 ? 0.06 : 0.02;
  const weakObj = input.objectionSuccessRate < 0.55 ? 0.1 : input.objectionSuccessRate < 0.65 ? 0.05 : 0.02;
  const weakControl = input.averageControlScore < 58 ? 0.08 : 0.03;
  const followUpDrag = input.improvementTrend === "down" ? 0.06 : 0.02;

  const lost = Math.round(basePipe * clamp(weakClose + weakObj + weakControl + followUpDrag, 0.05, 0.45));

  const drivers: { label: string; impactCents: number }[] = [
    { label: "Closing mechanics drag", impactCents: Math.round(basePipe * weakClose) },
    { label: "Objection handling leakage", impactCents: Math.round(basePipe * weakObj) },
    { label: "Control / frame loss", impactCents: Math.round(basePipe * weakControl) },
    { label: "Momentum / follow-up risk", impactCents: Math.round(basePipe * followUpDrag) },
  ].sort((a, b) => b.impactCents - a.impactCents);

  const leakingStages: { stage: PipelineStage; lostCents: number }[] = [];
  let stageTotal = 0;
  for (const st of OPEN) {
    stageTotal += input.conversionByStage[st] ?? 0;
  }
  if (stageTotal > 0) {
    for (const st of OPEN) {
      const c = input.conversionByStage[st] ?? 0;
      if (c <= 0) continue;
      const share = c / stageTotal;
      leakingStages.push({
        stage: st,
        lostCents: Math.round(basePipe * share * STAGE_STALL_RISK[st] * 0.35),
      });
    }
    leakingStages.sort((a, b) => b.lostCents - a.lostCents);
  }

  const notes = [
    `Gap vs theoretical upper bound ~${Math.round(gapToPerfect)}¢ given blended win probability (~${(winProb * 100).toFixed(1)}%).`,
    "Figures are directional — tighten CRM stage values for sharper loss attribution.",
  ];

  return {
    estimatedLostRevenueCents: Math.max(lost, Math.round(gapToPerfect * 0.25)),
    topLossDrivers: drivers.slice(0, 4),
    leakingStages: leakingStages.slice(0, 5),
    notes,
  };
}

export function estimateRiskDownside(input: SalespersonPredictorInput, baseForecastCents: number): RiskDownsideForecast {
  const loss = estimateOpportunityLoss(input);
  const downside = Math.round(baseForecastCents * 0.35 + loss.estimatedLostRevenueCents * 0.25);
  const drivers = loss.topLossDrivers.slice(0, 3).map((d) => d.label);
  return {
    downsideCents: downside,
    drivers,
    narrative:
      "Downside blends conservative execution scenarios with leakage heuristics — use with LOW/MEDIUM confidence when samples are thin.",
  };
}
