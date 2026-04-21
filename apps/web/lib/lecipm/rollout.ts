import { logInfo } from "@/lib/logger";
import type { PipelineSummaryPayload } from "@/modules/deals/deal-monitoring.service";
import { lecipmRolloutFlags } from "@/config/feature-flags";

const TAG = "[lecipm-rollout]";

export type LecipmPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LecipmRolloutMeta = {
  phase: LecipmPhase;
  enabled: false;
  flag: string;
  message: string;
};

const PHASE_ENV: Record<LecipmPhase, string> = {
  1: "FEATURE_ESG_V1",
  2: "FEATURE_INVESTOR_V1",
  3: "FEATURE_DEALS_V1",
  4: "FEATURE_CAPITAL_V1",
  5: "FEATURE_CLOSING_V1",
  6: "FEATURE_PORTFOLIO_V1",
  7: "FEATURE_EXECUTIVE_V1",
};

export function isLecipmPhaseEnabled(phase: LecipmPhase): boolean {
  switch (phase) {
    case 1:
      return lecipmRolloutFlags.esgV1;
    case 2:
      return lecipmRolloutFlags.investorV1;
    case 3:
      return lecipmRolloutFlags.dealsV1;
    case 4:
      return lecipmRolloutFlags.capitalV1;
    case 5:
      return lecipmRolloutFlags.closingV1;
    case 6:
      return lecipmRolloutFlags.portfolioV1;
    case 7:
      return lecipmRolloutFlags.executiveV1;
    default:
      return false;
  }
}

export function lecipmRolloutDisabledMeta(phase: LecipmPhase): LecipmRolloutMeta {
  return {
    phase,
    enabled: false,
    flag: PHASE_ENV[phase],
    message:
      `LECIPM phase ${phase} is disabled. Set ${PHASE_ENV[phase]}=true after prior phases are validated.`,
  };
}

export function logRolloutGate(phase: LecipmPhase, route: string, extra?: Record<string, unknown>): void {
  logInfo(`${TAG}`, { phase, route, rollout: "disabled", ...extra });
}

/** Merge disabled meta into a JSON-safe payload — call after auth / validation succeeds. */
export function withRolloutDisabledBody<T extends Record<string, unknown>>(
  phase: LecipmPhase,
  payload: T
): T & { rollout: LecipmRolloutMeta } {
  return { ...payload, rollout: lecipmRolloutDisabledMeta(phase) };
}

export function pipelineSummaryWhenRolloutDisabled(): PipelineSummaryPayload & {
  rollout: LecipmRolloutMeta;
} {
  return withRolloutDisabledBody(3, {
    totalDeals: 0,
    byStage: {},
    byDecisionStatus: {},
    criticalConditionsOpen: 0,
    blockedDiligenceCount: 0,
    upcomingCommitteeCount: 0,
    dealsNeedingAttention: [],
    recentlyApproved: [],
    recentlyDeclined: [],
  });
}

export function capitalSummaryWhenRolloutDisabled() {
  return withRolloutDisabledBody(4, {
    dealsTracked: 0,
    needingLenderAction: 0,
    offerActivity: 0,
    blockedBeforeClosing: 0,
    covenantRiskSignals: 0,
    deals: [],
  });
}

export function closingSummaryWhenRolloutDisabled() {
  return withRolloutDisabledBody(5, {
    totalClosingDeals: 0,
    readyToClose: 0,
    blockedClosings: 0,
    missingDocumentsCount: 0,
    pendingSignaturesCount: 0,
    checklistCompletionRate: 0,
    dealsAtRisk: [],
  });
}

export function portfolioIntelligenceWhenRolloutDisabled() {
  const emptyAllocation = {
    allocationSummary: [] as Array<{
      assetId: string;
      assetName?: string;
      budgetBand: "LOW_BUDGET" | "MEDIUM_BUDGET" | "HIGH_BUDGET" | "OPPORTUNISTIC";
      percentOfNotionalPortfolio: number;
      purpose: string[];
    }>,
    reservedForUrgentFixes: [] as Array<{ assetId: string; rationale: string }>,
    quickWinPool: [] as Array<{ assetId: string; rationale: string }>,
    strategicCapexPool: [] as Array<{ assetId: string; rationale: string }>,
    rationale: [] as string[],
    disclosure:
      "Portfolio intelligence phase is disabled (FEATURE_PORTFOLIO_V1). No capital guidance is computed.",
  };
  return withRolloutDisabledBody(6, {
    phaseDisabled: true as const,
    overview: {
      totalAssets: 0,
      averageHealthBand: "UNKNOWN" as const,
      criticalCount: 0,
      watchlistCount: 0,
      quickWinsCount: 0,
      capitalNeedSummary: "",
      policyMode: "OFF" as const,
    },
    priorities: [],
    capitalAllocation: emptyAllocation,
    watchlist: [],
    commonThemes: [],
  });
}

export function executiveOrchestrationWhenRolloutDisabled() {
  return withRolloutDisabledBody(7, {
    agentsRun: [],
    tasksCreated: [],
    conflicts: [],
    executiveSummary: "Executive layer disabled — enable FEATURE_EXECUTIVE_V1 after portfolio intelligence.",
    orchestratorVersion: null,
    agentOutputs: [],
  });
}
