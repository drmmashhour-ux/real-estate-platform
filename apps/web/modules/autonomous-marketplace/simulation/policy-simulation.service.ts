/**
 * Deterministic policy simulation — replays stored governance inputs with alternate thresholds.
 * Never touches production rules; delegates to `evaluateUnifiedGovernance` with sandbox metadata only.
 */
import { evaluateUnifiedGovernance } from "../governance/unified-governance.service";
import type {
  UnifiedGovernanceDisposition,
  UnifiedGovernanceInput,
  UnifiedGovernanceMode,
} from "../governance/unified-governance.types";
import type {
  PolicySimulationCase,
  PolicySimulationComparisonReport,
  PolicySimulationConfig,
  PolicySimulationResult,
} from "./policy-simulation.types";

const ADVERSE_TRUTH_TYPES = new Set([
  "chargeback",
  "fraud_confirmed",
  "refund_abuse",
  "dispute_lost",
  "payout_loss",
]);

function summarizeTruth(events: PolicySimulationCase["truthEvents"]): { adverse: boolean; amount: number } {
  let adverse = false;
  let amount = 0;
  for (const e of events ?? []) {
    if (ADVERSE_TRUTH_TYPES.has(e.type)) {
      adverse = true;
      if (typeof e.amount === "number" && Number.isFinite(e.amount)) {
        amount += Math.max(0, e.amount);
      }
    }
  }
  return { adverse, amount };
}

/** Preview: only ALLOW_PREVIEW is permissive. Execution: AUTO_EXECUTE and RECOMMEND_ONLY are permissive. */
export function isRestrictiveDisposition(
  d: UnifiedGovernanceDisposition,
  mode: UnifiedGovernanceMode,
): boolean {
  if (mode === "preview") return d !== "ALLOW_PREVIEW";
  return d !== "AUTO_EXECUTE" && d !== "RECOMMEND_ONLY";
}

export function caseKey(c: PolicySimulationCase, index: number): string {
  return c.caseId ?? c.replayInput?.listingId ?? `case-${index}`;
}

export function buildPolicySimulationInput(
  base: UnifiedGovernanceInput,
  config: PolicySimulationConfig,
): UnifiedGovernanceInput {
  return {
    ...base,
    metadata: {
      ...(base.metadata ?? {}),
      policySimulationSandbox: true,
      simulationConfigId: config.id,
      simulationConfigName: config.name,
    },
    policySimulation: {
      thresholds: config.thresholds,
      overrides: config.overrides,
    },
  };
}

type CaseMetrics = {
  falsePositives: number;
  falseNegatives: number;
  leakedRevenue: number;
  /** Revenue that baseline failed to protect (baseline FN with adverse amount). */
  baselineMissedAdverseAmount: number;
  /** Scenario caught adverse when baseline did not (restrictive flip). */
  protectedDeltaAmount: number;
  evaluated: number;
};

async function evaluateConfigAgainstCases(
  cases: PolicySimulationCase[],
  config: PolicySimulationConfig,
  baselineRestrictive?: Map<string, boolean>,
): Promise<CaseMetrics> {
  let falsePositives = 0;
  let falseNegatives = 0;
  let leakedRevenue = 0;
  let baselineMissedAdverseAmount = 0;
  let protectedDeltaAmount = 0;
  let evaluated = 0;

  for (let index = 0; index < cases.length; index++) {
    const c = cases[index];
    if (!c.replayInput) continue;
    evaluated += 1;
    const mode = c.replayInput.mode ?? "execution";
    const truth = summarizeTruth(c.truthEvents);

    let result;
    try {
      result = await evaluateUnifiedGovernance(buildPolicySimulationInput(c.replayInput, config));
    } catch {
      continue;
    }

    const restrictive = isRestrictiveDisposition(result.disposition, mode);

    if (restrictive && !truth.adverse) {
      falsePositives += 1;
    }
    if (!restrictive && truth.adverse) {
      falseNegatives += 1;
      leakedRevenue += truth.amount;
    }

    const key = caseKey(c, index);
    if (baselineRestrictive && truth.adverse) {
      const baseR = baselineRestrictive.get(key) === true;
      if (!baseR) {
        baselineMissedAdverseAmount += truth.amount;
        if (restrictive) {
          protectedDeltaAmount += truth.amount;
        }
      }
    }
  }

  return {
    falsePositives,
    falseNegatives,
    leakedRevenue,
    baselineMissedAdverseAmount,
    protectedDeltaAmount,
    evaluated,
  };
}

function zeroDelta(): PolicySimulationResult["delta"] {
  return {
    falsePositiveRate: 0,
    falseNegativeRate: 0,
    protectedRevenue: 0,
    leakedRevenue: 0,
  };
}

function buildResult(
  config: PolicySimulationConfig,
  m: CaseMetrics,
  delta: PolicySimulationResult["delta"],
): PolicySimulationResult {
  const total = m.evaluated;
  const fpRate = total > 0 ? m.falsePositives / total : 0;
  const fnRate = total > 0 ? m.falseNegatives / total : 0;
  return {
    configId: config.id,
    totalCases: total,
    falsePositiveRate: fpRate,
    falseNegativeRate: fnRate,
    protectedRevenue: m.protectedDeltaAmount,
    leakedRevenue: m.leakedRevenue,
    delta,
    narrative: buildNarrative(config.name, total, fpRate, fnRate, m.protectedDeltaAmount, m.leakedRevenue),
  };
}

function buildNarrative(
  name: string,
  total: number,
  fp: number,
  fn: number,
  protectedRev: number,
  leakedRev: number,
): string {
  if (total === 0) {
    return `${name}: no cases with replayInput — add snapshots to evaluate.`;
  }
  return (
    `${name} — ${total} case(s): FP rate ${(fp * 100).toFixed(1)}%, FN rate ${(fn * 100).toFixed(1)}%. ` +
    `Protected revenue (vs baseline misses): ${protectedRev.toFixed(0)}; leaked revenue (FN exposure): ${leakedRev.toFixed(0)}. ` +
    `Sandbox results are advisory only and do not change production governance.`
  );
}

function safeFailureResult(configId: string): PolicySimulationResult {
  return {
    configId,
    totalCases: 0,
    falsePositiveRate: 0,
    falseNegativeRate: 0,
    protectedRevenue: 0,
    leakedRevenue: 0,
    delta: zeroDelta(),
    narrative: "Policy simulation failed safely — review inputs and retry.",
  };
}

/**
 * Runs one configuration against historical cases. `delta` is zeroed; use `comparePolicySimulationScenarios` for baselines.
 */
export async function runPolicySimulationScenario(
  cases: PolicySimulationCase[],
  config: PolicySimulationConfig,
): Promise<PolicySimulationResult> {
  try {
    const m = await evaluateConfigAgainstCases(cases, config);
    return buildResult(config, m, zeroDelta());
  } catch {
    return safeFailureResult(config.id);
  }
}

/**
 * Baseline must use stable `id` (e.g. `baseline`). Scenario metrics include deltas vs baseline rates and revenue.
 */
export async function comparePolicySimulationScenarios(
  cases: PolicySimulationCase[],
  baselineConfig: PolicySimulationConfig,
  scenarios: PolicySimulationConfig[],
): Promise<PolicySimulationComparisonReport> {
  try {
    const baselineRestrictive = new Map<string, boolean>();

    for (let index = 0; index < cases.length; index++) {
      const c = cases[index];
      if (!c.replayInput) continue;
      const mode = c.replayInput.mode ?? "execution";
      const key = caseKey(c, index);
      try {
        const r = await evaluateUnifiedGovernance(buildPolicySimulationInput(c.replayInput, baselineConfig));
        baselineRestrictive.set(key, isRestrictiveDisposition(r.disposition, mode));
      } catch {
        baselineRestrictive.set(key, false);
      }
    }

    const baselineMetrics = await evaluateConfigAgainstCases(cases, baselineConfig, baselineRestrictive);
    const baseline = buildResult(baselineConfig, baselineMetrics, zeroDelta());

    const scenarioResults: PolicySimulationResult[] = [];

    for (const scenario of scenarios) {
      const m = await evaluateConfigAgainstCases(cases, scenario, baselineRestrictive);
      const delta = {
        falsePositiveRate:
          m.evaluated > 0 ?
            m.falsePositives / m.evaluated - baseline.falsePositiveRate
          : 0,
        falseNegativeRate:
          m.evaluated > 0 ?
            m.falseNegatives / m.evaluated - baseline.falseNegativeRate
          : 0,
        protectedRevenue: m.protectedDeltaAmount - baseline.protectedRevenue,
        leakedRevenue: m.leakedRevenue - baseline.leakedRevenue,
      };
      scenarioResults.push(buildResult(scenario, m, delta));
    }

    let bestScenarioId: string | undefined;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const s of scenarioResults) {
      const score = s.falseNegativeRate * 2 + s.falsePositiveRate;
      if (score < bestScore) {
        bestScore = score;
        bestScenarioId = s.configId;
      }
    }

    return { baseline, scenarios: scenarioResults, bestScenarioId };
  } catch {
    return {
      baseline: safeFailureResult(baselineConfig.id),
      scenarios: [],
      bestScenarioId: undefined,
    };
  }
}
