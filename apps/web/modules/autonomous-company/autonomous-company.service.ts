/**
 * Autonomous AI Company Mode — top-level cycle orchestration (advisory; gated by flags + mode tier).
 * Does not bypass Stripe, bookings, legal flows, or subsystem financial truth.
 */
import { autonomousCompanyFlags, getAutonomousCompanyModeTier, isAutonomousCompanyKillSwitch } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { suggestBoundedAdaptation } from "./adaptation-engine.service";
import { opportunitiesToFusionStyleDecisions } from "./autonomous-company-fusion-decisions.service";
import { runCompanyExecutionPhase } from "./autonomous-company-execution.service";
import type { AutonomousCompanyCycleResult } from "./autonomous-company.types";
import { buildContentGrowthDrafts } from "./content-growth.service";
import { aggregateLearningSnapshot } from "./learning-aggregator.service";
import { buildMarketIntelligenceSummary } from "./market-intelligence.service";
import { rankOpportunitiesFromStrategy } from "./opportunity-engine.service";
import { buildStrategyEngineOutput } from "./strategy-engine.service";

const NS = "[ai:company]";

let cyclesSession = 0;

/** Test hook */
export function resetAutonomousCompanySessionForTests(): void {
  cyclesSession = 0;
}

async function loadFusionSignals(): Promise<{
  agreement: number | null;
  conflicts: number | null;
  coverage: string | null;
}> {
  try {
    const { buildFusionPrimarySurface } = await import("@/modules/fusion/fusion-system.primary-surface");
    const surface = await buildFusionPrimarySurface();
    const snap = surface.snapshot;
    if (!snap) return { agreement: null, conflicts: null, coverage: null };
    return {
      agreement: snap.scores.agreementScore,
      conflicts: snap.conflicts.length,
      coverage: surface.observability?.sourceCoverageSummary ?? null,
    };
  } catch {
    return { agreement: null, conflicts: null, coverage: null };
  }
}

async function loadCroHealth(): Promise<number | null> {
  try {
    const { runCroV8OptimizationBundle } = await import("@/services/growth/cro-v8-optimization-bridge");
    const b = await runCroV8OptimizationBundle({ rangeDays: 14 });
    return b?.healthScore ?? null;
  } catch {
    return null;
  }
}

/**
 * Single orchestrated cycle: strategy → opportunities → Fusion-style decisions → (optional) Operator plan → learning → adaptation → content → market.
 * Scheduling: invoke from cron/admin/CI — no implicit timer here.
 */
export async function runAutonomousCompanyCycle(opts?: {
  environment?: "development" | "staging" | "production";
}): Promise<AutonomousCompanyCycleResult | null> {
  if (!autonomousCompanyFlags.autonomousCompanyModeV1) {
    logInfo(NS, { event: "cycle_skipped", reason: "FEATURE_AUTONOMOUS_COMPANY_MODE_V1_off" });
    return null;
  }

  const env = opts?.environment ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const mode = getAutonomousCompanyModeTier();
  const notes: string[] = [];
  const warnings: string[] = [];

  if (isAutonomousCompanyKillSwitch()) {
    warnings.push("Kill switch engaged — cycle returns observational shell only.");
    cyclesSession += 1;
    const shell: AutonomousCompanyCycleResult = {
      cycleId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mode: "off",
      strategy: null,
      opportunities: { ranked: [], notes: ["Kill switch — strategy/opportunity phases skipped."] },
      decisions: null,
      execution: { mode: "off", plan: null, notes: ["Kill switch."] },
      learning: null,
      adaptation: null,
      content: null,
      market: null,
      observability: {
        cyclesSession,
        opportunitiesDetected: 0,
        decisionsCount: 0,
        actionsPlanned: 0,
      },
      notes,
      warnings,
    };
    logInfo(NS, { event: "cycle_kill_switch", cyclesSession });
    return shell;
  }

  const fusion = await loadFusionSignals();
  const croHealth = await loadCroHealth();
  const market = await buildMarketIntelligenceSummary();

  let strategy = null;
  if (autonomousCompanyFlags.autonomousStrategyV1 && !isAutonomousCompanyKillSwitch()) {
    strategy = buildStrategyEngineOutput({
      fusionAgreement: fusion.agreement,
      fusionConflictCount: fusion.conflicts,
      fusionSubsystemCoverage: fusion.coverage,
      croHealthScore: croHealth,
      marketplaceHint: market.locationNotes[0] ?? market.trends[0] ?? null,
    });
  } else if (!autonomousCompanyFlags.autonomousStrategyV1) {
    notes.push("FEATURE_AUTONOMOUS_STRATEGY_V1 is off — strategy layer skipped.");
  }

  const opportunities = rankOpportunitiesFromStrategy(strategy);
  const decisions =
    opportunities.ranked.length > 0 ? opportunitiesToFusionStyleDecisions(opportunities.ranked) : null;

  const execution = await runCompanyExecutionPhase({ environment: env });

  const planned = execution?.plan?.ordered.length ?? 0;
  const learning = aggregateLearningSnapshot({
    decisionsCount: decisions?.decisions.length ?? 0,
    opportunitiesCount: opportunities.ranked.length,
    plannedActions: planned,
  });

  const adaptation = suggestBoundedAdaptation(learning);
  const content = buildContentGrowthDrafts(strategy);
  cyclesSession += 1;

  const result: AutonomousCompanyCycleResult = {
    cycleId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    mode,
    strategy,
    opportunities,
    decisions,
    execution,
    learning,
    adaptation,
    content,
    market,
    observability: {
      cyclesSession,
      opportunitiesDetected: opportunities.ranked.length,
      decisionsCount: decisions?.decisions.length ?? 0,
      actionsPlanned: planned,
    },
    notes,
    warnings,
  };

  if (fusion.conflicts !== null && fusion.conflicts > 8) {
    warnings.push("Elevated Fusion conflict count — prefer shadow/assist tiers.");
  }
  if (opportunities.ranked.length === 0) {
    warnings.push("No ranked opportunities — check strategy inputs and flags.");
  }

  logInfo(NS, {
    event: "cycle_complete",
    mode,
    cyclesSession,
    opportunities: result.observability.opportunitiesDetected,
    decisions: result.observability.decisionsCount,
    actionsPlanned: result.observability.actionsPlanned,
    killSwitch: isAutonomousCompanyKillSwitch(),
    strategyFlag: autonomousCompanyFlags.autonomousStrategyV1,
    executionFlag: autonomousCompanyFlags.autonomousExecutionV1,
    contentFlag: autonomousCompanyFlags.autonomousContentV1,
  });

  return result;
}
