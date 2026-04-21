import { canonicalStageFromLead, type LifecycleStage } from "@/modules/deal-lifecycle/lifecycle.stages";
import {
  aiSuggestedActionsForStage,
  integrationHintsForStage,
  nextActionForStage,
  notificationSuggestionsForStage,
  recommendedStepsForStage,
} from "@/modules/deal-lifecycle/lifecycle.actions";
import { logInfo } from "@/lib/logger";

const TAG_L = "[lifecycle]";
const TAG_D = "[deal]";
const TAG_C = "[conversion]";

export type DealLifecycleSnapshot = {
  stage: LifecycleStage;
  nextAction: string;
  recommendedSteps: string[];
  /** Heuristic delay hint */
  delayWarning?: string | null;
  aiSuggestedActions: string[];
  integrationHints: string[];
  notificationSuggestions: string[];
};

export type LeadLifecycleInput = {
  lecipmCrmStage: string | null;
  pipelineStage: string;
  pipelineStatus: string;
  wonAt?: Date | null;
  lostAt?: Date | null;
  nextFollowUpAt?: Date | null;
  lastContactAt?: Date | null;
  updatedAt?: Date;
  listingId?: string | null;
};

export function computeDealLifecycleSnapshot(lead: LeadLifecycleInput): DealLifecycleSnapshot {
  const stage = canonicalStageFromLead(lead);
  const nextAction = nextActionForStage(stage);
  const recommendedSteps = recommendedStepsForStage(stage);
  const aiSuggestedActions = aiSuggestedActionsForStage(stage);
  const integrationHints = integrationHintsForStage(stage, {
    hasListingId: Boolean(lead.listingId),
  });
  const notificationSuggestions = notificationSuggestionsForStage(stage);

  let delayWarning: string | null = null;
  const now = Date.now();
  if (lead.nextFollowUpAt && lead.nextFollowUpAt.getTime() < now) {
    delayWarning = "Follow-up date passed — re-engage today.";
  } else if (lead.lastContactAt) {
    const days = (now - lead.lastContactAt.getTime()) / 86_400_000;
    if (stage === "NEW_LEAD" && days > 1) delayWarning = "New lead idle >24h — outreach recommended.";
    if (stage === "CONTACTED" && days > 3) delayWarning = "No touch in several days — schedule check-in.";
  }

  return {
    stage,
    nextAction,
    recommendedSteps,
    delayWarning,
    aiSuggestedActions,
    integrationHints,
    notificationSuggestions,
  };
}

export type PipelineMetrics = {
  total: number;
  byStage: Partial<Record<LifecycleStage, number>>;
  /** Share of leads currently in CLOSED column (CRM-derived). */
  approxConversionPct: number | null;
  /** won / (won + lost) among leads with terminal outcome in this cohort. */
  conversionRatePct: number | null;
  /** won / (won + lost), “deal success” as win rate. */
  dealSuccessRatePct: number | null;
  wonCount: number;
  lostCount: number;
  /** Mean calendar days from `createdAt` → `wonAt` for won leads (null if none). */
  avgDaysToClose: number | null;
};

type MetricLead = {
  stage: LifecycleStage;
  pipelineStatus?: string;
  createdAt?: Date;
  wonAt?: Date | null;
  lostAt?: Date | null;
};

export function aggregatePipelineMetrics(leads: MetricLead[]): PipelineMetrics {
  const byStage: Partial<Record<LifecycleStage, number>> = {};
  let wonCount = 0;
  let lostCount = 0;
  const daysToCloseSamples: number[] = [];

  for (const l of leads) {
    byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
    const ps = (l.pipelineStatus ?? "").toLowerCase();
    if (l.wonAt || ps === "won") {
      wonCount += 1;
      if (l.wonAt && l.createdAt) {
        const ms = l.wonAt.getTime() - l.createdAt.getTime();
        if (ms > 0) daysToCloseSamples.push(ms / 86_400_000);
      }
    } else if (l.lostAt || ps === "lost") {
      lostCount += 1;
    }
  }

  const total = leads.length;
  let closedCol = 0;
  for (const l of leads) {
    if (l.stage === "CLOSED") closedCol += 1;
  }
  const approxConversionPct = total > 0 ? Math.round((closedCol / total) * 100) : null;

  const terminal = wonCount + lostCount;
  const conversionRatePct =
    terminal > 0 ? Math.round((wonCount / terminal) * 1000) / 10 : null;
  const dealSuccessRatePct = conversionRatePct;

  const avgDaysToClose =
    daysToCloseSamples.length > 0
      ? Math.round(
          (daysToCloseSamples.reduce((a, b) => a + b, 0) / daysToCloseSamples.length) * 10
        ) / 10
      : null;

  logInfo(`${TAG_L} aggregate`, { total, closedColumnSharePct: approxConversionPct });
  logInfo(`${TAG_D} outcomes`, { wonCount, lostCount });
  logInfo(`${TAG_C} funnel`, { conversionRatePct, avgDaysToClose });

  return {
    total,
    byStage,
    approxConversionPct,
    conversionRatePct,
    dealSuccessRatePct,
    wonCount,
    lostCount,
    avgDaysToClose,
  };
}
