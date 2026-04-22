/**
 * Synchronous score-threshold policy replay (legal/fraud weights + combined gates).
 * No unified-governance calls — see `policy-simulation.service.ts` for full sandbox replay.
 */
import type {
  PolicySimulationCase,
  PolicySimulationConfig,
  PolicySimulationResult,
} from "./policy-simulation.types";

function applyConfigToScores(
  base: { legal: number; fraud: number },
  config: PolicySimulationConfig,
): number {
  const legalWeight = config.thresholds?.legalWeight ?? 0.5;
  const fraudWeight = config.thresholds?.fraudWeight ?? 0.5;
  const combined = base.legal * legalWeight + base.fraud * fraudWeight;
  return Math.min(100, Math.round(combined));
}

function classifySimulatedDecision(
  score: number,
  config: PolicySimulationConfig,
): "REQUIRE_APPROVAL" | "DRY_RUN" | "ALLOW" {
  const medium = config.thresholds?.combinedRiskMedium ?? 25;
  const high = config.thresholds?.combinedRiskHigh ?? 50;
  if (score >= high) return "REQUIRE_APPROVAL";
  if (score >= medium) return "DRY_RUN";
  return "ALLOW";
}

function computeTruthOutcome(truthEvents: PolicySimulationCase["truthEvents"]) {
  const harmful = truthEvents.some((e) => ["chargeback", "refund", "fraud_confirmed"].includes(e.type));
  const revenue = truthEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  return { harmful, revenue };
}

export function runPolicySimulation(
  cases: PolicySimulationCase[],
  config: PolicySimulationConfig,
  baseline?: PolicySimulationResult,
): PolicySimulationResult {
  let falsePositive = 0;
  let falseNegative = 0;
  let protectedRevenue = 0;
  let leakedRevenue = 0;

  for (const c of cases) {
    const combinedScore = applyConfigToScores(
      {
        legal: c.originalPrediction.legalRiskScore,
        fraud: c.originalPrediction.fraudRiskScore,
      },
      config,
    );

    const decision = classifySimulatedDecision(combinedScore, config);
    const truth = computeTruthOutcome(c.truthEvents);

    if (decision === "REQUIRE_APPROVAL") {
      if (truth.harmful) {
        protectedRevenue += truth.revenue;
      } else {
        falsePositive += 1;
      }
    }

    if (decision === "ALLOW") {
      if (truth.harmful) {
        falseNegative += 1;
        leakedRevenue += truth.revenue;
      }
    }
  }

  const total = cases.length || 1;

  const result: PolicySimulationResult = {
    configId: config.id,
    totalCases: cases.length,
    falsePositiveRate: falsePositive / total,
    falseNegativeRate: falseNegative / total,
    protectedRevenue,
    leakedRevenue,
    delta: {
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      protectedRevenue: 0,
      leakedRevenue: 0,
    },
    narrative: "",
  };

  if (baseline) {
    result.delta = {
      falsePositiveRate: result.falsePositiveRate - baseline.falsePositiveRate,
      falseNegativeRate: result.falseNegativeRate - baseline.falseNegativeRate,
      protectedRevenue: result.protectedRevenue - baseline.protectedRevenue,
      leakedRevenue: result.leakedRevenue - baseline.leakedRevenue,
    };
  }

  result.narrative = `Scenario ${config.name} resulted in ${result.falseNegativeRate.toFixed(2)} FN rate and protected $${result.protectedRevenue}.`;

  return result;
}
